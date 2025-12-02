# AI Architecture & Implementation Guide

이 문서는 **Context Hunter** 서비스에 구현된 AI 기능(**문제 생성** 및 **유사도 판별**)의 아키텍처와 사용법을 설명합니다.

## 1. 개요 (Overview)

현재 시스템은 두 가지 AI 모델을 사용합니다:
1.  **문제 생성 (Generation)**: **Llama 3.1 8b** (OpenAI 호환 API 사용)
2.  **유사도 판별 (Similarity)**: **multilingual-e5-small** (로컬 실행)

관련 코드는 `backend/ai.py`에 위치하며, `backend/crud.py`에서 이를 호출하여 사용합니다.

## 2. 구성 요소 (Components)

### 2.1 AIClient (문제 생성)
*   **위치**: `backend/ai.py` -> `AIClient` 클래스
*   **역할**: 외부 API(Groq, Ollama 등)를 통해 Llama 3.1 8b 모델에 문제 생성을 요청합니다.
*   **설정 (Environment Variables)**:
    *   `AI_API_KEY`: API 키 (필수)
    *   `AI_BASE_URL`: API 엔드포인트 URL (예: `https://api.groq.com/openai/v1`)
    *   `AI_MODEL_NAME`: 사용할 모델명 (기본값: `llama-3.1-8b-instant`)

### 2.2 EmbeddingModel (유사도 판별)
*   **위치**: `backend/ai.py` -> `EmbeddingModel` 클래스
*   **역할**: `sentence-transformers` 라이브러리를 사용하여 `intfloat/multilingual-e5-small` 모델을 로컬 메모리에 로드하고, 두 문장 간의 의미적 유사도를 계산합니다.
*   **특징**:
    *   **Singleton Pattern**: 모델 로딩 시간을 절약하고 메모리 사용을 최적화하기 위해 싱글톤으로 구현되었습니다.
    *   **Local Execution**: 외부 API 호출 없이 로컬 CPU/GPU를 사용합니다. (최초 실행 시 모델 다운로드 필요)
    *   **Threshold**: 유사도 점수 85점 이상을 정답으로 간주합니다.

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
# result: { "similarity_score": 85, "is_correct": True, "feedback": "..." }
```

## 4. 테스트 및 검증 (Testing)

`backend/test_ai.py` 스크립트를 통해 AI 기능을 독립적으로 테스트할 수 있습니다.

```bash
# 테스트 실행
python backend/test_ai.py
```

### 테스트 항목
1.  **Embedding Model Loading**: 모델이 정상적으로 로드되는지 확인.
2.  **Similarity Check**: 유사한 문장과 다른 문장을 비교하여 점수가 적절한지 확인.
3.  **Question Generation (Mock)**: API 응답 처리가 정상적인지 확인.

## 5. 주의 사항 (Notes)
*   **메모리 요구사항**: `multilingual-e5-small` 모델 실행을 위해 최소 1GB 이상의 여유 메모리가 권장됩니다.
*   **API 비용**: Llama 3.1 API 사용 시 공급자에 따라 비용이 발생할 수 있습니다.
