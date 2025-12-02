import os
import json
from typing import Dict, Any, Optional
import numpy as np
from openai import OpenAI
from sentence_transformers import SentenceTransformer, util

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

class EmbeddingModel:
    _instance = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def __init__(self):
        # multilingual-e5-small 모델 로드
        print("Loading embedding model (intfloat/multilingual-e5-small)...")
        try:
            self.model = SentenceTransformer('intfloat/multilingual-e5-small')
            print("Embedding model loaded successfully.")
        except Exception as e:
            print(f"Failed to load embedding model: {e}")
            self.model = None

    def check_similarity(self, user_answer: str, correct_answer: str) -> Dict[str, Any]:
        """
        multilingual-e5-small을 사용하여 의미적 유사도를 계산합니다.
        """
        if not self.model:
            return {
                "similarity_score": 0,
                "is_correct": False,
                "feedback": "AI 모델 로드 실패로 인해 판별할 수 없습니다."
            }

        # 임베딩 생성
        # e5 모델은 query: 와 passage: 접두사가 필요할 수 있으나, 
        # 대칭적인 문장 비교(STS)의 경우 접두사 없이 사용하거나 둘 다 query로 사용할 수 있습니다.
        # 여기서는 간단하게 접두사 없이 사용하거나, 필요시 문서를 참고하여 추가합니다.
        # e5-small은 "query: " 접두사를 추천하는 경우가 많습니다.
        embeddings = self.model.encode([f"query: {user_answer}", f"query: {correct_answer}"])
        
        # 코사인 유사도 계산
        score = util.cos_sim(embeddings[0], embeddings[1]).item()
        
        # 점수 스케일링 (0~1 -> 0~100)
        similarity_score = int(score * 100)
        
        # 정답 기준 설정 (예: 85점 이상)
        is_correct = similarity_score >= 85
        
        feedback = ""
        if is_correct:
            feedback = "정확합니다! 문맥을 완벽하게 파악하셨네요."
        elif similarity_score >= 60:
            feedback = "비슷하지만 조금 더 정확한 표현이 필요합니다."
        else:
            feedback = "의미가 다소 다릅니다. 다시 시도해보세요."

        return {
            "similarity_score": similarity_score,
            "is_correct": is_correct,
            "feedback": feedback
        }

# 싱글톤 인스턴스 생성
embedding_model = EmbeddingModel.get_instance()
ai_client = AIClient()

def generate_question(context: str, style: str) -> Dict[str, Any]:
    return ai_client.generate_question(context, style)

def check_similarity(user_answer: str, correct_answer: str) -> Dict[str, Any]:
    return embedding_model.check_similarity(user_answer, correct_answer)
