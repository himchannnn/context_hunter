# AI Logic Implementation Guide

이 문서는 **Context Hunter** 서비스의 핵심 AI 기능인 **문제 생성(Dataset 1, 2 -> 3)**과 **유사도 판별** 로직을 구현하고 수정하는 방법을 설명합니다.

## 1. AI 로직 위치 (Location)

현재 `backend/crud.py`에 있는 기본 로직을 대체하기 위해, AI 관련 코드는 별도의 모듈로 분리하여 관리하는 것을 권장합니다.

*   **권장 파일 경로**: `backend/ai.py`
*   **역할**: OpenAI API 또는 Gemini API와 통신하여 텍스트를 생성하고 분석하는 전담 모듈

## 2. 문제 생성 AI (Dataset 1, 2 -> 3)

데이터셋 1(예: 원문)과 데이터셋 2(예: 변환 스타일/조건)를 입력받아 새로운 문제(Dataset 3)를 생성하는 로직입니다.

### 구현 위치
`backend/ai.py` 내 `generate_question` 함수 (예시)

### 프롬프트 엔지니어링 (Prompt Engineering)
이 프롬프트를 수정하여 생성되는 문제의 스타일이나 난이도를 조절할 수 있습니다.

```python
def generate_question_prompt(dataset1_text, dataset2_style):
    prompt = f"""
    당신은 언어 교육 전문가이자 창의적인 작가입니다.
    
    [입력 데이터]
    1. 원문 텍스트: "{dataset1_text}"
    2. 변환 스타일/조건: "{dataset2_style}"
    
    [지시사항]
    위 원문 텍스트를 바탕으로, 변환 스타일에 맞춰 새로운 문장을 작성해주세요.
    이 문장은 사용자가 문맥을 파악하여 원문의 의미를 유추해야 하는 '암호화된 문장'이어야 합니다.
    
    [출력 형식]
    JSON 형식으로 출력해주세요:
    {{
        "encoded_sentence": "변환된 문장",
        "original_meaning": "원문 텍스트의 핵심 의미",
        "difficulty_level": 1~3 (1:쉬움, 2:보통, 3:어려움)
    }}
    """
    return prompt
```

### 수정 방법
*   **역할 부여 (Persona)**: "언어 교육 전문가" 대신 "유머러스한 작가" 등으로 변경하면 문체나 분위기가 달라집니다.
*   **지시사항 (Instruction)**: "암호화된 문장"의 정의를 구체화하거나, 특정 단어 사용 금지 등의 제약을 추가할 수 있습니다.
*   **Few-shot Learning**: 프롬프트 내에 `[예시]` 섹션을 추가하여 원하는 결과물의 샘플을 2~3개 보여주면 성능이 비약적으로 향상됩니다.

---

## 3. 유사도 판별 AI (Similarity Check)

사용자의 답안과 정답 사이의 의미적 유사성을 판단하는 로직입니다. 단순 문자열 비교(`difflib`)보다 훨씬 정확한 문맥 파악이 가능합니다.

### 구현 위치
`backend/ai.py` 내 `check_similarity` 함수 (예시)

### 프롬프트 엔지니어링 (Prompt Engineering)
이 프롬프트를 수정하여 채점 기준을 엄격하게 하거나 관대하게 할 수 있습니다.

```python
def check_similarity_prompt(user_answer, correct_answer):
    prompt = f"""
    당신은 공정한 채점관입니다. 두 문장의 의미가 얼마나 유사한지 판단해주세요.
    
    [문장 1 (정답)]: "{correct_answer}"
    [문장 2 (사용자 답안)]: "{user_answer}"
    
    [채점 기준]
    - 문장의 구조가 달라도 핵심 의미가 통하면 높은 점수를 주세요.
    - 오타는 문맥을 해치지 않는 선에서 허용합니다.
    - 완전히 반대되는 의미라면 0점을 주세요.
    
    [출력 형식]
    JSON 형식으로 출력해주세요:
    {{
        "similarity_score": 0~100 사이의 정수,
        "is_correct": true/false (80점 이상일 때 true),
        "feedback": "사용자에게 줄 짧은 피드백 (예: '의미는 맞지만 조금 더 자연스러운 표현이 좋아요.')"
    }}
    """
    return prompt
```

### 수정 방법
*   **채점 기준 (Criteria)**: "핵심 키워드 포함 여부"를 필수로 넣거나, "감정선 일치 여부" 등을 추가하여 평가 항목을 세분화할 수 있습니다.
*   **피드백 스타일**: 피드백을 더 구체적으로 주거나, 격려하는 톤으로 바꾸도록 지시할 수 있습니다.

---

## 4. 통합 방법 (Integration)

`backend/crud.py`에서 위 로직을 호출하도록 수정합니다.

**기존 코드 (`backend/crud.py`):**
```python
def calculate_similarity(str1: str, str2: str) -> float:
    # Basic similarity check using SequenceMatcher
    return difflib.SequenceMatcher(None, str1, str2).ratio() * 100
```

**수정 후 코드 (`backend/crud.py`):**
```python
from .ai import check_similarity  # ai.py에서 함수 임포트

def verify_answer(db: Session, question_id: str, user_answer: str):
    # ... (기존 로직)
    
    # AI를 이용한 유사도 판별 호출
    ai_result = check_similarity(user_answer, question.correct_meaning)
    
    similarity = ai_result['similarity_score']
    is_correct = ai_result['is_correct']
    feedback = ai_result['feedback']
    
    # ... (이후 로직은 동일)
```

이 가이드를 따라 `backend/ai.py`를 생성하고 프롬프트를 조정하면, 원하는 대로 AI 성능과 동작을 제어할 수 있습니다.
