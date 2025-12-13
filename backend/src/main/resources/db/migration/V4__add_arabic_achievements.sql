-- V4__add_arabic_achievements.sql
INSERT INTO achievement (id, name, description, icon, criteria_type, criteria_value) VALUES
-- جلسات المذاكرة
(gen_random_uuid(), 'الخطوة الأولى', 'أكمل أول جلسة مذاكرة لك', 'school', 'SESSION_COUNT', 1),
(gen_random_uuid(), 'طالب مجتهد', 'أكمل 10 جلسات مذاكرة', 'auto_stories', 'SESSION_COUNT', 10),
(gen_random_uuid(), 'بداية قوية', 'أكمل 3 جلسات مذاكرة', 'flag', 'SESSION_COUNT', 3),
(gen_random_uuid(), 'سباق المذاكرة', 'أكمل 25 جلسة مذاكرة', 'timer', 'SESSION_COUNT', 25),
(gen_random_uuid(), 'أسطورة المذاكرة', 'أكمل 50 جلسة مذاكرة', 'auto_stories', 'SESSION_COUNT', 50),

-- الاختبارات
(gen_random_uuid(), 'أول اختبار', 'أكمل أول اختبار', 'quiz', 'QUIZ_COUNT', 1),
(gen_random_uuid(), 'سيد الاختبارات', 'أكمل 5 اختبارات', 'quiz', 'QUIZ_COUNT', 5),
(gen_random_uuid(), 'خبير الاختبارات', 'أكمل 10 اختبارات', 'quiz', 'QUIZ_COUNT', 10),
(gen_random_uuid(), 'أسطورة الاختبارات', 'أكمل 25 اختباراً', 'quiz', 'QUIZ_COUNT', 25),

-- نقاط الترتيب (Elo)
(gen_random_uuid(), 'متسلق الترتيب', 'الوصول إلى 100 نقطة تصنيف', 'trending_up', 'SCORE_REACHED', 100),
(gen_random_uuid(), 'صائد النقاط', 'الوصول إلى 200 نقطة تصنيف', 'trending_up', 'SCORE_REACHED', 200),
(gen_random_uuid(), 'نجم الترتيب', 'الوصول إلى 300 نقطة تصنيف', 'star', 'SCORE_REACHED', 300),
(gen_random_uuid(), 'أسطورة الترتيب', 'الوصول إلى 500 نقطة تصنيف', 'military_tech', 'SCORE_REACHED', 500)
    ON CONFLICT (name) DO NOTHING;
