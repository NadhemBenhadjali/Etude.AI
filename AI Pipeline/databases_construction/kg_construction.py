"""
End-to-end pipeline for:
1. Writing a nested KG dict to Neo4j
2. Adding (:Image) nodes from a CSV
3. Computing & storing Arabic SBERT embeddings for every Lesson

All tasks run sequentially from the main block—no command-line
arguments required.
"""
# !pip install neo4j langchain-huggingface
from __future__ import annotations

import os
import re
from pathlib import Path
from typing import Dict, Tuple, Optional, List

import pandas as pd
from neo4j import GraphDatabase, Driver
from langchain_huggingface import HuggingFaceEmbeddings
from app.crew import config


# ──────────────── Configuration ────────────────
NEO4J_URI:      str = config.URI
NEO4J_USER:     str = config.USER
NEO4J_PASSWORD: str = config.PASSWORD
CSV_PATH:       Path = Path("../config_files")/ "captions_ar (1).csv"
MODEL_NAME:     str = "Omartificial-Intelligence-Space/GATE-AraBert-v1"
CLEAR_DB_FIRST: bool = True
# ────────────────────────────────────────────────


KG: Dict[str, Dict[str, Dict[str, Tuple[int, int]]]] = {
    "أحياء": {
        "الحواس": {
            "الحواس وأعضاء الحس": (6, 11),
            "وظائف الجلد ووقايته": (9, 12),
            "التأثيرات السلبية على حاستي السمع والإبصار": (12, 16),
            "حماية السمع والإبصار من المؤثرات المزعجة": (16, 19),
            "تأثير مرض الزكام على الجسم": (19, 22),
        },
        "التنقل": {
            "أنماط التنقل عند الحيوان": (26, 30),
            "تكيف العضو مع نمط التنقل": (30, 34),
        },
        "مصادر الأغذية": {
            "مسار الأغذية وتحولها داخل الأنيوب لحيوان عاشب": (36, 41),
            "أنواع الأسنان ووظائفها": (41, 44),
            "وقاية الأسنان": (44, 48),
        },
        "التكاثر": {"التكاثر دون بذور": (56, 60)},
        "التنفس": {
            "أعضاء التنفس لدى بعض الحيوانات": (62, 66),
            "الرئتان عند الخروف": (66, 69),
            "الغلاصم عند السمكة": (69, 74),
        },
    },
    "فيزياء": {
        "الزمن": {"الساعة": (78, 78), "الدقيقة": (81, 83), "الثانية": (84, 87)},
        "المادة": {
            "تعرف الهواء": (92, 95),
            "إثبات وجود الهواء": (95, 99),
            "خصائص الهواء": (99, 102),
            "تلوث الهواء (1)": (102, 105),
            "تلوث الهواء (2)": (105, 108),
            "قيس كتل بواسطة الميزان": (108, 112),
        },
        "الطاقة": {
            "قوة الهواء تحدث عملا": (118, 118),
            "الطاقة الحرارية وبعض مصادرها": (118, 123),
            "المحافظة على دفء/برودة (العزل الحراري)": (123, 132),
            "تأثير الطاقة الحرارية تمددًا وتقلصًا": (132, 137),
        },
    },
}


# ──────────────── Neo4j helpers ────────────────
def get_driver() -> Driver:
    if not NEO4J_PASSWORD:
        raise RuntimeError(
            "NEO4J_PASSWORD is empty. Set it as an environment variable before running."
        )
    return GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))


class KGWriter:
    """
    (Branch)-[:HAS_TOPIC]->(Topic)-[:HAS_LESSON]->(Lesson)
    """

    def __init__(self, driver: Driver) -> None:
        self.driver = driver

    def clear_database(self) -> None:
        with self.driver.session() as sess:
            sess.run("MATCH (n) DETACH DELETE n")
        print("✅ cleared database")

    def create_indexes_and_constraints(self) -> None:
        with self.driver.session() as sess:
            # Uniqueness constraints (better than plain indexes)
            sess.run("CREATE CONSTRAINT branch_name IF NOT EXISTS FOR (b:Branch) REQUIRE b.name IS UNIQUE")
            sess.run("CREATE CONSTRAINT topic_name IF NOT EXISTS FOR (t:Topic) REQUIRE t.name IS UNIQUE")
            sess.run("CREATE CONSTRAINT lesson_title IF NOT EXISTS FOR (l:Lesson) REQUIRE l.title IS UNIQUE")
            sess.run("CREATE CONSTRAINT image_name IF NOT EXISTS FOR (i:Image) REQUIRE i.name IS UNIQUE")

            # Extra indexes (optional)
            sess.run("CREATE INDEX lesson_pages IF NOT EXISTS FOR (l:Lesson) ON (l.start_page, l.end_page)")
            sess.run("CREATE INDEX image_page IF NOT EXISTS FOR (i:Image) ON (i.page)")
        print("✅ indexes/constraints created")

    def write(self, kg: dict) -> None:
        # Flatten KG to reduce round-trips
        branches = []
        topics = []
        lessons = []

        for branch, topic_map in kg.items():
            branches.append({"name": branch})
            for topic, lesson_map in topic_map.items():
                topics.append({"branch": branch, "topic": topic})
                for title, (start, end) in lesson_map.items():
                    lessons.append({"topic": topic, "title": title, "s": start, "e": end})

        with self.driver.session() as sess:
            sess.run(
                """
                UNWIND $branches AS b
                MERGE (:Branch {name: b.name})
                """,
                branches=branches,
            )

            sess.run(
                """
                UNWIND $topics AS x
                MERGE (t:Topic {name: x.topic})
                WITH t, x
                MATCH (b:Branch {name: x.branch})
                MERGE (b)-[:HAS_TOPIC]->(t)
                """,
                topics=topics,
            )

            sess.run(
                """
                UNWIND $lessons AS x
                MERGE (l:Lesson {title: x.title})
                SET l.start_page = x.s, l.end_page = x.e
                WITH l, x
                MATCH (t:Topic {name: x.topic})
                MERGE (t)-[:HAS_LESSON]->(l)
                """,
                lessons=lessons,
            )

        print("✅ KG written")


# ──────────────── Image loader ────────────────
_PAGE_RE = re.compile(r"page_(\d+)")


def _page_from_filename(fname: str) -> Optional[int]:
    m = _PAGE_RE.search(fname)
    return int(m.group(1)) if m else None


def add_images_from_csv(driver: Driver, csv_path: Path) -> None:
    csv_path = csv_path.expanduser().resolve()
    print("CSV:", csv_path)
    if not csv_path.exists():
        raise FileNotFoundError(f"CSV not found: {csv_path}")

    # Many Arabic CSV exports need utf-8-sig
    df = pd.read_csv(csv_path, encoding="utf-8-sig")

    required_cols = {"image", "caption_ar"}
    missing = required_cols - set(df.columns)
    if missing:
        raise ValueError(f"CSV is missing columns: {sorted(missing)}. Found: {list(df.columns)}")

    rows: List[dict] = []
    skipped = 0

    for _, row in df.iterrows():
        fname = str(row["image"])
        caption = str(row["caption_ar"])
        page = _page_from_filename(fname)
        if page is None:
            skipped += 1
            continue
        rows.append({"fname": fname, "caption": caption, "page": page})

    with driver.session() as sess:
        sess.run(
            """
            UNWIND $rows AS r
            MERGE (img:Image {name: r.fname})
            SET img.caption = r.caption, img.page = r.page
            WITH img, r
            MATCH (l:Lesson)
            WHERE l.start_page <= r.page AND r.page <= l.end_page
            MERGE (l)-[:HAS_IMAGE]->(img)
            """,
            rows=rows,
        )

    print(f"✅ images processed. linked={len(rows)}, skipped(no page)={skipped}")


# ──────────────── Embeddings ────────────────
def embed_lessons(driver: Driver, model_name: str) -> None:
    emb = HuggingFaceEmbeddings(model_name=model_name)

    with driver.session() as sess:
        lessons = list(sess.run("MATCH (l:Lesson) RETURN id(l) AS id, l.title AS title"))

    with driver.session() as sess:
        for rec in lessons:
            vec = emb.embed_query(rec["title"])
            sess.run(
                "MATCH (l) WHERE id(l) = $id SET l.vector_embedding = $vec",
                id=rec["id"],
                vec=vec,
            )

    print("✅ embeddings stored")


if __name__ == "__main__":
    driver = get_driver()
    try:
        kg_writer = KGWriter(driver)

        if CLEAR_DB_FIRST:
            kg_writer.clear_database()

        kg_writer.create_indexes_and_constraints()
        kg_writer.write(KG)
        add_images_from_csv(driver, CSV_PATH)
        embed_lessons(driver, MODEL_NAME)

        print("🎉 pipeline finished")
    finally:
        driver.close()
