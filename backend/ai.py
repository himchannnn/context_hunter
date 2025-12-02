import os
import json
from typing import Dict, Any, Optional
from typing import Dict, Any, Optional
from openai import OpenAI

# 환경 변수 로드 (main.py에서 load_dotenv가 호출되므로 여기서는 os.getenv 사용 가능)
# 하지만 안전을 위해 여기서도 호출하거나, main.py가 먼저 실행됨을 가정합니다.
# 독립적 테스트를 위해 load_dotenv를 여기서도 사용하는 것이 좋습니다.
from dotenv import load_dotenv
load_dotenv()

class AIClient:
    def __init__(self):
        self.api_key = os.getenv("AI_API_KEY")
        self.base_url = os.getenv("AI_BASE_URL")
        self.model_name = os.getenv("AI_MODEL_NAME", "llama-3.1-8b-instant") # 기본값 예시 (Groq 등)
        
        if not self.api_key:
            print("WARNING: AI_API_KEY not found in environment variables.")
            self.client = None
        else:
            self.client = OpenAI(
                api_key=self.api_key,
                base_url=self.base_url
            )

    def generate_question(self, context: str, style: str) -> Dict[str, Any]:
        """
        Llama 3.1 8b를 사용하여 문제를 생성합니다.
        """
        if not self.client:
            return {"error": "AI client not initialized"}

        prompt = f"""
        당신은 언어 교육 전문가이자 창의적인 작가입니다.
        
        [입력 데이터]
        1. 원문 텍스트: "{context}"
        2. 변환 스타일/조건: "{style}"
        
        [지시사항]
        위 원문 텍스트를 바탕으로, 변환 스타일에 맞춰 새로운 문장을 작성해주세요.
        이 문장은 사용자가 문맥을 파악하여 원문의 의미를 유추해야 하는 '암호화된 문장'이어야 합니다.
        
        [출력 형식]
        JSON 형식으로만 출력해주세요. 마크다운 코드 블록 없이 순수 JSON 문자열만 반환하세요:
        {{
            "encoded_sentence": "변환된 문장",
            "original_meaning": "원문 텍스트의 핵심 의미",
            "difficulty_level": 1
        }}
        """

        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that outputs JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                response_format={"type": "json_object"}
            )
            
            content = response.choices[0].message.content
            return json.loads(content)
        except Exception as e:
            print(f"Error generating question: {e}")
            return {"error": str(e)}

    def check_similarity(self, user_answer: str, correct_meaning: str) -> Dict[str, Any]:
        """
        Llama 3.1 8b를 사용하여 의미적 유사도를 판별합니다.
        """
        if not self.client:
            return {
                "similarity_score": 0,
                "is_correct": False,
                "feedback": "AI 클라이언트 초기화 실패"
            }

        prompt = f"""
        Compare the meaning of the two sentences below.
        
        1. Correct Meaning: "{correct_meaning}"
        2. User Answer: "{user_answer}"
        
        Are they semantically similar in the given context?
        Even if the words are different, if the core meaning is the same, it is Correct.
        If the meaning is opposite or irrelevant, it is Incorrect.
        
        Return JSON only:
        {{
            "is_correct": boolean,
            "similarity_score": integer (0-100),
            "feedback": "Short feedback in Korean (1 sentence)"
        }}
        """

        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": "You are a strict evaluator. Output JSON only."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                response_format={"type": "json_object"}
            )
            
            content = response.choices[0].message.content
            return json.loads(content)
        except Exception as e:
            print(f"Error checking similarity: {e}")
            return {
                "similarity_score": 0,
                "is_correct": False,
                "feedback": f"AI 판별 오류: {str(e)}"
            }

# 싱글톤 인스턴스 생성
ai_client = AIClient()

def generate_question(context: str, style: str) -> Dict[str, Any]:
    return ai_client.generate_question(context, style)

def check_similarity(user_answer: str, correct_answer: str) -> Dict[str, Any]:
    return ai_client.check_similarity(user_answer, correct_answer)

