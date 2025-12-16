import os
import json
from typing import Dict, Any, Optional
from typing import Dict, Any, Optional
from openai import OpenAI
import random

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

# 사전에 정의된 고난이도 어휘 데이터베이스 (다양성 확보용)
    # 사전에 정의된 고난이도 어휘 데이터베이스 (다양성 확보용)
    WORD_DATABASE = {
        "Politics": [
            "재가", "반증", "쇄신", "파행", "교착", "경질", "추대", "입김", "야합", "독단", 
            "정쟁", "표결", "법안", "상정", "부결", "가결", "산회", "속개", "의결", "비준",
            "계류", "면책", "불체포", "탄핵", "국면", "전환", "타개", "병폐", "청산", "공천"
        ],
        "Economy": [
            "긴축", "부양", "변제", "탕감", "상계", "차익", "보합", "급락", "급등", "호가", 
            "공시", "상장", "부도", "채무", "융통", "교부", "조세", "징수", "체납", "포탈",
            "낙수효과", "펀더멘털", "유동성", "재정", "적자", "흑자", "수지", "금리", "환율", "물가"
        ],
        "IT": [
            "도래", "혁신", "사문화", "종속", "가속화", "태동", "과도기", "범용", "호환", "격차", 
            "편중", "난제", "알고리즘", "매커니즘", "인프라", "구축", "선점", "우위", "특이점", "가상",
            "보안", "취약점", "암호화", "복호화", "대역폭", "지연", "생태계", "플랫폼", "인터페이스", "직관적"
        ],
        "Society": [
            "심심한", "금일", "사흘", "낭설", "위화감", "족보", "식상하다", "작위적", "천편일률", "목도", 
            "도외시", "야기", "간과", "주지", "기인", "결부", "만연", "팽배", "조장", "방관",
            "경각심", "불감증", "양극화", "소외", "배제", "포용", "공존", "상생", "갈등", "봉합"
        ],
        "Culture": [
            "향유", "영위", "귀감", "반향", "조명", "각색", "오마주", "모티프", "정체성", "다양성",
            "보편성", "특수성", "심미적", "서사", "담론", "비평", "사조", "풍미", "전유", "향수"
        ],
        "History": [
            "격변", "사료", "고증", "왜곡", "기술", "편찬", "계승", "유추", "반면교사", "타산지석",
            "흥망성쇠", "기원", "발상지", "유래", "전철", "답습", "청산", "굴곡", "질곡", "태평성대"
        ],
        "General": [
            "고지식", "기락", "갈무리", "유명세", "일가견", "취지", "단초", "빌미", "여지", "개연성", 
            "타당성", "실효성", "가시화", "구체화", "형해화", "사문화", "유야무야", "지지부진", "전무후무", "미봉책",
            "임시방편", "궁여지책", "속수무책", "자포자기", "자가당착", "모순", "역설", "아이러니", "딜레마", "트리거"
        ]
    }

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

        # Select a target word from the database
        target_list = self.WORD_DATABASE.get(category, self.WORD_DATABASE["General"] + self.WORD_DATABASE["Society"])
        # If category words run out or valid key not found, fallback to combined list
        if not target_list:
             target_list = self.WORD_DATABASE["General"]
        
        selected_word = random.choice(target_list)

        prompt = f"""
        You are a generic puzzle generator for a game called "Context Hunter".
        
        [Goal]
        Create a **high-difficulty** Korean vocabulary puzzle where the context is obscure and the target word is sophisticated.
        
        [Task]
        1. **Target Word**: "{selected_word}"
           - You MUST use this exact word.
        
        2. **Context**: Category "{category}".
           - Use a **Metaphorical, Archaic, or Highly Abstract** tone (e.g., Editorial, Philosophy, Classicizing).
           - The sentence should feel "difficult" to a native speaker (JLPT N1 / GRE level).
           - Do NOT make it a simple description. Make it a thought-provoking statement.

        3. **Create Sentence**: 
           - Write a sentence where "{selected_word}" is the pivot of the meaning.
           - Example style: "작위적인 평온함은 겉으로는 고요하나, 실상은 위태로운 살얼음판과 같다." (Sophisticated).
           
        4. **Model Answer (CRITICAL)**: 
           - The `original_meaning` MUST be a **Natural Paraphrase**.
           - **CONSTRAINT**: You MAY use common verbs/adjectives from the encoded sentence if they are simple (e.g., "있다", "하다", "같다").
           - **FOCUS**: Paraphrase ONLY the difficult/abstract words (like "{selected_word}") into easier terms.
           - Do not over-simplify to the point of being childish. Keep the tone natural but clear.
           - Structure: Keep the sentence structure similar so it's easy to compare.
           - **NO EXPLANATION**: Do not say "This means...". Just the translated sentence.

        [Constraints]
        1. **DIFFICULTY**: The `encoded_sentence` must be challenging. Use metaphors (은유), idioms (관용구), or advanced grammar.
        2. **CLARITY**: `original_meaning` should clearly explain the difficult parts using everyday Korean.
        3. **NO OPPOSITE**: Ensure the meaning is exactly the same, not the opposite.
        4. **NO NONSENSE**: Standard Korean only. No scrambled text.

        [Output Format]
        Return JSON only:
        {{
            "original_sentence": "{selected_word}",
            "encoded_sentence": "...hard sentence with {selected_word}...",
            "original_meaning": "...same sentence in plain Korean...",
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

        # Check for meaningless input BEFORE calling AI to save resources and ensure strictness
        if self._is_nonsense_input(user_answer):
             return {
                "similarity_score": 0,
                "is_correct": False,
                "feedback": "의미 있는 답변을 입력해주세요."
            }

        prompt = f"""
        Compare the meaning of the two sentences below.
        
        1. Correct Meaning: "{correct_meaning}"
        2. User Answer: "{user_answer}"
        
        Evaluate the semantic similarity.
        
        [Instructions]
        - Focus on the **intent and core meaning**, not just literal word matching.
        - Paraphrasing, synonyms, and different sentence structures that convey the same message should receive high scores (80-100).
        - **Irony/Sarcasm**: If the user uses irony that effectively conveys the *correct meaning* in context, accept it.
        - **Personal Style/Tone**: Accept different tones (formal, informal, dialect, unique expressions) as long as the core meaning is preserved.
        - "배가 고프다" (hungry) and "식사를 하고 싶다" (want to eat) are contextually similar enough to be correct.
        - Only mark as 0-49 if the meaning is truly unrelated or opposite.
        - **IMPORTANT**: If the User Answer is just punctuation (e.g. ".", "?", "!") or a single meaningless character, score it as 0.
        
        [Scoring Guidelines]
        - 100: Perfect match or perfect paraphrase, including valid stylistic variations.
        - 80-99: Core meaning is the same, but slightly different tone or word choice.
        - 50-79: Partially correct, captures part of the meaning but misses nuance.
        - 0-49: Incorrect meaning, irrelevant, opposite, or meaningless punctuation like ".".
        
        [Decision Rule]
        - is_correct: true if similarity_score >= 50
        - is_correct: false if similarity_score < 50
        
        [Output Format]
        Return JSON only:
        {{
            "is_correct": boolean,
            "similarity_score": integer (0-100),
            "feedback": "Short feedback in Korean (1 sentence)"
        }}

        **IMPORTANT SCORING RULE**:
        - Do NOT round to the nearest 5 or 10. Use precise numbers like 87, 92, 73, 64.
        - If it is almost perfect but slightly off, use high 90s (e.g., 96, 98).
        - If it is clearly wrong but has one correct word, use low numbers (e.g., 12, 23).
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
            data = self._recursive_sanitize(data)
            
            # Force consistency: If score >= 50, is_correct MUST be True
            if "similarity_score" in data:
                score = int(data["similarity_score"])
                data["is_correct"] = score >= 50
                
            return data
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
        1. **Grammar & Sense**: Is `encoded_sentence` a PERFECT, logical Korean sentence? (If strictly nonsense, REWRITE it).
        2. **Difficulty Check**: Is `encoded_sentence` sophisticated enough? (If too simple, make it more formal/metaphorical).
        3. **Vocabulary Distinction**: Does `original_meaning` clearly explain the *difficult* words?
           - It is OK to share common words (like 조사, 어미, simple verbs).
           - *Check*: Did it paraphrase the KEY difficult word? (e.g. "교착" -> "꼼짝 못하는").
        4. **Opposite Check**: Does the meaning accidentally say the opposite? (e.g., "Good" vs "Not Good"). Fix it to match exactly.
        5. **No Chinese/Foreign Script**: Does `original_meaning` or `encoded_sentence` contain **Chinese characters (Hanja)**? 
           - **REMOVE** all Hanja (e.g., "亐", "下"). Use **ONLY Hangul**.
           - Even if the word is difficult, write it in Hangul.

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
            
    def _is_nonsense_input(self, text: str) -> bool:
        """
        Check if the input is trivial (too short or just punctuation/symbols).
        """
        import re
        if not text:
            return True
        # remove spaces
        text = text.strip()
        if len(text) < 2: # Single character answers are likely invalid for sentence similarity
            return True
        # Check if it contains only punctuation/symbols
        if re.match(r'^[\W_]+$', text):
             return True
        return False

# 싱글톤 인스턴스 생성
ai_client = AIClient()

def generate_question(category: str, difficulty: int = 1) -> Dict[str, Any]:
    return ai_client.generate_question(category, difficulty)

def check_similarity(user_answer: str, correct_answer: str) -> Dict[str, Any]:
    return ai_client.check_similarity(user_answer, correct_answer)

