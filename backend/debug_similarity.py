import sys
import os
from sentence_transformers import SentenceTransformer, util

# Load model
print("Loading model...")
model = SentenceTransformer('intfloat/multilingual-e5-small')

def check(text1, text2):
    # e5 models expect "query: " prefix for asymmetric tasks, but for symmetric STS, 
    # using "query: " for both or "passage: " for both is common. 
    # The current implementation uses "query: " for both.
    embeddings = model.encode([f"query: {text1}", f"query: {text2}"])
    score = util.cos_sim(embeddings[0], embeddings[1]).item() * 100
    print(f"Score: {score:.2f} | '{text1}' vs '{text2}'")
    return score

print("\n--- 1. Semantic Similarity (Different Text, Same Meaning) ---")
check("사과", "애플")
check("나는 학교에 간다", "등교하는 중이다")
check("배가 고프다", "식사를 하고 싶다")
check("날씨가 춥다", "기온이 매우 낮다")

print("\n--- 2. Textual Similarity (Similar Text, Different Meaning) ---")
check("나는 사과를 먹는다", "나는 사과를 버린다")
check("그는 학교에 갔다", "그는 학교에 가지 않았다")
check("아버지가 방에 들어가신다", "아버지 가방에 들어가신다")

print("\n--- 3. Contextual Nuance ---")
check("이 문제의 정답은 무엇인가요?", "답 좀 알려줘")
check("매우 화가 난다", "기분이 정말 좋다") # 반대 의미
