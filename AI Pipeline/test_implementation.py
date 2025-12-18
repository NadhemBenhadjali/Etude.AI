"""
Test script to validate code changes without requiring external services.
This tests imports, exception handling, and Pydantic models.
"""

# Test 1: Import all custom modules
print("Test 1: Testing imports...")
try:
    from app import exceptions, models
    from app.helpers import _clean_user_question, _clean_json_block, parse_quiz_json
    print("✅ All imports successful")
except Exception as e:
    print(f"❌ Import failed: {e}")
    exit(1)

# Test 2: Test exception hierarchy
print("\nTest 2: Testing exception hierarchy...")
try:
    # Test base exception
    exc = exceptions.EtudeAIException("Test error", {"detail": "test"})
    assert exc.message == "Test error"
    assert exc.details == {"detail": "test"}
    
    # Test derived exceptions
    neo_err = exceptions.Neo4jConnectionError("Neo4j down")
    assert isinstance(neo_err, exceptions.ServiceUnavailableError)
    assert isinstance(neo_err, exceptions.EtudeAIException)
    
    topic_err = exceptions.TopicNotFoundError("Topic missing", {"topic": "test"})
    assert topic_err.details["topic"] == "test"
    
    print("✅ Exception hierarchy working correctly")
except Exception as e:
    print(f"❌ Exception test failed: {e}")
    exit(1)

# Test 3: Test Pydantic models
print("\nTest 3: Testing Pydantic models...")
try:
    # Test SummaryRequest
    summary_req = models.SummaryRequest(module="التنفس")
    assert summary_req.module == "التنفس"
    
    # Test validation failure
    try:
        models.SummaryRequest(module="   ")
        print("❌ Should have failed validation for empty module")
        exit(1)
    except Exception:
        pass  # Expected
    
    # Test QARequest
    qa_req = models.QARequest(question="ما هو التنفس؟")
    assert len(qa_req.question) > 0
    
    # Test QuizRequest
    quiz_req = models.QuizRequest(module="أحياء", num_mc=10, num_tf=5)
    assert quiz_req.num_mc == 10
    assert quiz_req.num_tf == 5
    
    # Test validation ranges
    try:
        models.QuizRequest(module="test", num_mc=100)  # Should fail (max 20)
        print("❌ Should have failed validation for num_mc > 20")
        exit(1)
    except Exception:
        pass  # Expected
    
    # Test PlanRequest
    plan_req = models.PlanRequest(
        goal="أريد تعلم الأحياء",
        time_available="أسبوعين"
    )
    assert plan_req.goal == "أريد تعلم الأحياء"
    
    # Test FinishRequest
    finish_req = models.FinishRequest(quiz_score=85, student_feedback="جيد")
    assert finish_req.quiz_score == 85
    
    print("✅ Pydantic models working correctly")
except Exception as e:
    print(f"❌ Pydantic model test failed: {e}")
    import traceback
    traceback.print_exc()
    exit(1)

# Test 4: Test helper functions
print("\nTest 4: Testing helper functions...")
try:
    # Test _clean_user_question
    q1 = _clean_user_question("سؤال: ما هو الماء؟")
    assert q1 == "ما هو الماء؟"
    
    q2 = _clean_user_question("  ما هو التنفس؟  ")
    assert q2 == "ما هو التنفس؟"
    
    # Test _clean_json_block
    json_block = "```json\n{\"key\": \"value\"}\n```"
    cleaned = _clean_json_block(json_block)
    assert "```" not in cleaned
    assert "{" in cleaned
    
    # Test parse_quiz_json
    valid_json = '{"questions": [{"q": "test", "a": "answer"}]}'
    parsed = parse_quiz_json(valid_json)
    assert parsed["questions"][0]["q"] == "test"
    
    print("✅ Helper functions working correctly")
except Exception as e:
    print(f"❌ Helper function test failed: {e}")
    import traceback
    traceback.print_exc()
    exit(1)

# Test 5: Test sanitization
print("\nTest 5: Testing input sanitization...")
try:
    # Test control character removal
    dirty_input = "test\x00\x01\x02text"
    req = models.QARequest(question=dirty_input)
    assert "\x00" not in req.question
    
    # Test whitespace normalization
    multi_space = "test    multiple     spaces"
    req2 = models.QARequest(question=multi_space)
    assert "    " not in req2.question
    
    print("✅ Input sanitization working correctly")
except Exception as e:
    print(f"❌ Sanitization test failed: {e}")
    exit(1)

print("\n" + "="*60)
print("🎉 ALL TESTS PASSED!")
print("="*60)
print("\nCode changes validated successfully:")
print("✅ Custom exception hierarchy")
print("✅ Pydantic request validation models")
print("✅ Input sanitization")
print("✅ Helper function improvements")
print("\nThe implementation is ready for integration testing with live services.")

