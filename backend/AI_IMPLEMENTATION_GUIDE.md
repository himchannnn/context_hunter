# AI Architecture & Implementation Guide

이 문서는 **Context Hunter** 서비스에 구현된 AI 기능(**문제 생성** 및 **유사도 판별**)의 아키텍처와 사용법을 설명합니다.

## 1. 개요 (Overview)

현재 시스템은 **Llama 3.1 8b** 모델을 통합적으로 사용합니다:
1.  **문제 생성 (Generation)**: Llama 3.1 8b (OpenAI 호환 API 사용)
2.  **유사도 판별 (Similarity)**: Llama 3.1 8b (OpenAI 호환 API 사용)

관련 코드는 `backend/ai.py`에 위치하며, `backend/crud.py`에서 이를 호출하여 사용합니다.

## 2. 구성 요소 (Components)

### 2.1 AIClient (통합 클라이언트)
*   **위치**: `backend/ai.py` -> `AIClient` 클래스
*   **역할**: 외부 API(Groq, Ollama 등)를 통해 Llama 3.1 8b 모델에 **문제 생성** 및 **정답 검증**을 요청합니다.
*   **설정 (Environment Variables)**:
    *   `AI_API_KEY`: API 키 (필수)
    *   `AI_BASE_URL`: API 엔드포인트 URL (예: `https://api.groq.com/openai/v1`)
    *   `AI_MODEL_NAME`: 사용할 모델명 (기본값: `llama-3.1-8b-instant`)

## 3. 사용 방법 (Usage)

### 3.1 문제 생성 (Generate Question)
```python
from backend.ai import generate_question

context = "..."
style = "..."
result = generate_question(context, style)
# result: { "encoded_sentence": "...", "original_meaning": "...", "difficulty_level": 1 }
```

### 3.2 유사도 판별 (Check Similarity)
```python
from backend.ai import check_similarity

user_answer = "..."
correct_answer = "..."
result = check_similarity(user_answer, correct_answer)
# result: { "similarity_score": 95, "is_correct": True, "feedback": "..." }
```

## 4. 테스트 및 검증 (Testing)

`backend/test_ai.py` 스크립트를 통해 AI 기능을 독립적으로 테스트할 수 있습니다.

```bash
# 테스트 실행
python backend/test_ai.py
```

### 테스트 항목
1.  **Similarity Check (Mock)**: 정답 검증 로직이 정상적으로 동작하는지 확인.
2.  **Question Generation (Mock)**: 문제 생성 로직이 정상적으로 동작하는지 확인.

## 5. 주의 사항 (Notes)
*   **API 비용**: Llama 3.1 API 사용 시 공급자에 따라 비용이 발생할 수 있습니다.
*   **Latency**: 외부 API 호출이므로 네트워크 상태에 따라 지연이 발생할 수 있습니다 (평균 0.3초 내외).

