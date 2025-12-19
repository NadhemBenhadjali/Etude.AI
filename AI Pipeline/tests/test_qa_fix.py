#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Test the QA fix for extracting final answers from ReAct output."""

from app.helpers import _extract_final_answer

# Test cases
test_cases = [
    {
        "name": "ReAct with Final Answer",
        "input": """Thought: I need to search for information
Action: vector_search
Action Input: {"query": "what is photosynthesis"}
Observation: Photosynthesis is the process...
Thought: Now I can provide a complete answer
Final Answer: الفوطوسينتيز هي العملية اللي النباتات تستعمل فيها الضوء باش تصنع الماكلة متاعها. بالبساطة، الورقة تاخذ الضوء من الشمس والماء من الارض والهواء من الجو، وتحولهم لسكر باش النبتة تعيش وتكبر.""",
        "expected": "الفوطوسينتيز هي العملية اللي النباتات تستعمل فيها الضوء باش تصنع الماكلة متاعها. بالبساطة، الورقة تاخذ الضوء من الشمس والماء من الارض والهواء من الجو، وتحولهم لسكر باش النبتة تعيش وتكبر."
    },
    {
        "name": "Simple answer without ReAct",
        "input": "هذي إجابة بسيطة بدون ReAct framework",
        "expected": "هذي إجابة بسيطة بدون ReAct framework"
    },
    {
        "name": "Multiple thought cycles",
        "input": """Thought: First thought
Action: search
Observation: Some data
Thought: Second thought
Action: another_search
Observation: More data
Thought: Now I have enough
Final Answer: الإجابة النهائية هنا""",
        "expected": "الإجابة النهائية هنا"
    }
]

print("Testing _extract_final_answer function...")
print("=" * 60)

for test in test_cases:
    print(f"\nTest: {test['name']}")
    print("-" * 60)
    result = _extract_final_answer(test['input'])
    expected = test['expected']

    if result.strip() == expected.strip():
        print("✓ PASS")
    else:
        print("✗ FAIL")
        print(f"Expected: {expected}")
        print(f"Got: {result}")
    print()

print("=" * 60)
print("Testing complete!")

