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
        self.model_name = os.getenv("AI_MODEL_NAME", "qwen2.5:7b") # Ollama standard model name
        
        if not self.api_key:
            print("WARNING: AI_API_KEY not found. Defaulting to 'ollama' for local usage.")
            self.api_key = "ollama"
            
        self.client = OpenAI(
            api_key=self.api_key,
            base_url=self.base_url
        )

    def generate_question(self, category: str, difficulty: int = 1) -> Dict[str, Any]:
        """
        Llama 3.1 8b를 사용하여 특정 주제의 문제를 생성합니다.
        context 없이 AI가 스스로 문장을 창작하고 암호화합니다.
        """
        if not self.client:
            return {"error": "AI client not initialized"}

        # 난이도에 따른 가이드
        difficulty_guide = ""
        if difficulty == 1:
            difficulty_guide = "Simple sentence, common vocabulary, easy to guess context."
        elif difficulty == 2:
            difficulty_guide = "Moderate sentence structure, some idioms."
        else:
            difficulty_guide = "Complex sentence, abstract concepts, advanced vocabulary."

        prompt = f"""
        You are a generic puzzle generator for a game called "Context Hunter".
        
        [Goal]
        Help users improve their literacy by learning difficult or often misunderstood Korean vocabulary through context.
        
        [Task]
        1. **Select a Target Word**: Choose a "Literacy-Challenging" Korean word.
           - Examples: "심심한"(profound), "금일"(today), "사흘"(3 days), "고지식"(stubborn), "낭설"(false rumor), "위화감", "기락", "족보", "식상하다", "반증", "재가", "피력", "갈무리", "유명세", "일가견".
           - **IMPORTANT**: Do NOT be limited to these examples. Choose ANY word that requires high literacy to understand correctly.
           - **CRITICAL**: Do NOT use the same word repeatedly. Be diverse.
        
        2. **Contextualize to Category**: The sentence MUST be about the category: "{category}".
           - If category is "Politics", use words like "재가", "반증" in a political context.
           - If category is "Economy", use words like "기락", "갈무리" in an economic context.
           - If category is "IT", use words like "일가견", "유명세" in a tech context.

        3. **Create Sentence**: Write a **News Headline, Formal Editorial, or Social Commentary** sentence containing the word.
           - The sentence should be sophisticated and "grown-up" (News style).
           
        4. **Model Answer**: The `original_meaning` MUST be a **Model Answer** (모범 답안).
           - Do NOT just define the word.
           - **Paraphrase** the entire sentence into easier, plain Korean.
           - Explain the "Contextual Intent" of the sentence.
           - Example: If sentence is "작위적인 해석은 반감을 산다", Model Answer should be "억지로 꾸며낸 듯한 해석은 사람들에게 거부감을 줄 수 있다는 뜻입니다."

        [Constraints]
        1. **LANGUAGE**: All content MUST be in **Standard Korean**.
        2. **NO ENGLISH/FOREIGN**: Do not use English, Cyrillic, Chinese, or any other non-Korean scripts.
        3. **NO SCRAMBLING**: Do NOT scramble words. Do NOT create "puzzles" by mixing syllables. Write **NORMAL** sentences.
        4. **NO NONSENSE**: Do NOT invent words. Use dictionary-defined words only.

        [Output Format]
        Return JSON only:
        {{
            "original_sentence": "작위적 (The Target Word Only)",
            "encoded_sentence": "작위적인 해석은 오히려 대중의 반감을 살 수 있다는 지적이 나온다. (Full Sentence)",
            "original_meaning": "억지로 꾸며낸 듯한 해석은 대중들에게 거부감을 줄 수 있다는 뜻입니다. (Model Answer)",
            "difficulty_level": {difficulty},
            "category": "{category}"
        }}
        """

        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": "You are a professional Korean writer and puzzle generator. You always verify that your Korean sentences are grammatically perfect and natural. Output JSON only."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7, # 안정성을 위해 0.8 -> 0.7로 하향
                response_format={"type": "json_object"}
            )
            
            content = response.choices[0].message.content
            content = response.choices[0].message.content
            content = self._sanitize_string(content)
            
            # Robustness: Remove Markdown code blocks if present
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()
            
            data = json.loads(content)
            return self._recursive_sanitize(data)
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
        
        Evaluate the semantic similarity.
        
        [Instructions]
        - Focus on the **intent and core meaning**, not just literal word matching.
        - Paraphrasing, synonyms, and different sentence structures that convey the same message should receive high scores (80-100).
        - "배가 고프다" (hungry) and "식사를 하고 싶다" (want to eat) are contextually similar enough to be correct.
        - Only mark as 0-49 if the meaning is truly unrelated or opposite.
        
        [Scoring Guidelines]
        - 100: Perfect match or perfect paraphrase.
        - 80-99: Core meaning is the same, but slightly different tone or word choice.
        - 50-79: Partially correct, captures part of the meaning but misses nuance.
        - 0-49: Incorrect meaning, irrelevant, or opposite.
        
        [Decision Rule]
        - is_correct: true if similarity_score >= 50
        - is_correct: false if similarity_score < 50
        
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
            # Pre-sanitize raw string
            content = self._sanitize_string(content)
            data = json.loads(content)
            # Post-sanitize parsed object
            return self._recursive_sanitize(data)
        except Exception as e:
            print(f"Error checking similarity: {e}")
            return {
                "similarity_score": 0,
                "is_correct": False,
                "feedback": f"AI Check Failed. Error Details: {str(e)}"
            }

    def _verify_and_fix_question(self, question_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generated question utilizes a self-correction loop to verify quality.
        """
        if not self.client:
            return question_data

        prompt = f"""
        You are a generic "Senior Editor" for a Korean educational game.
        Your job is to REVIEW and FIX the following generated content.

        [Input Data]
        {json.dumps(question_data, ensure_ascii=False)}

        [Checklist]
        1. **Grammar & Sense**: Is `encoded_sentence` a PERFECT Korean sentence? (If it looks scrambled like "어럹약", REWRITE it completely).
        2. **Script Check**: Does it contain any Cyrillic, English, or non-Korean characters? (If yes, REMOVE them).
        3. **Target Word**: Does `original_sentence` contain ONLY the target word?
        4. **Model Answer**: Is `original_meaning` a clear, helpful paraphrase?

        [Action]
        - If PERFECT: Return the input JSON exactly as is.
        - If FLAWED: Fix the errors (Rewrite the sentence if it is gibberish) and return the corrected JSON.

        Return JSON only.
        """

        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": "You are a strict editor. Output JSON only."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1, # Low temperature for strict verification
                response_format={"type": "json_object"}
            )
            
            content = response.choices[0].message.content
            content = response.choices[0].message.content
            content = self._sanitize_string(content)
             # Robustness: Remove Markdown code blocks if present
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()
            
            data = json.loads(content)
            return self._recursive_sanitize(data)
        except Exception as e:
            print(f"Verification failed: {e}")
            return question_data # Fallback to original if check fails

    def _sanitize_string(self, content: str) -> str:
        """
        Removes surrogate characters and other invalid unicode to prevent encoding errors.
        """
        try:
            return content.encode('utf-8', 'replace').decode('utf-8')
        except Exception:
            return ""

    def _recursive_sanitize(self, data: Any) -> Any:
        """
        Recursively sanitizes strings in a dictionary or list.
        """
        if isinstance(data, dict):
            return {k: self._recursive_sanitize(v) for k, v in data.items()}
        elif isinstance(data, list):
            return [self._recursive_sanitize(item) for item in data]
        elif isinstance(data, str):
            return self._sanitize_string(data)
        else:
            return data

# 싱글톤 인스턴스 생성
ai_client = AIClient()

def generate_question(category: str, difficulty: int = 1) -> Dict[str, Any]:
    return ai_client.generate_question(category, difficulty)

def check_similarity(user_answer: str, correct_answer: str) -> Dict[str, Any]:
    return ai_client.check_similarity(user_answer, correct_answer)

