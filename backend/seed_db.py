from sqlalchemy.orm import Session
import models, database
import uuid

# DB 세션 생성
db = database.SessionLocal()

# 50개의 샘플 데이터 (속담, 관용구 위주)
sample_questions = [
    # 기존 5개 유지
    {"encoded_text": "시간은 돈과 같다.", "original_text": "Time is money.", "correct_meaning": "시간은 매우 소중하다.", "difficulty": 1, "category": "proverb"},
    {"encoded_text": "발 없는 말이 천 리 간다.", "original_text": "Words have no wings but they fly a thousand miles.", "correct_meaning": "소문은 매우 빠르게 퍼진다.", "difficulty": 1, "category": "proverb"},
    {"encoded_text": "그 콩깍지가 씌었다.", "original_text": "Love is blind.", "correct_meaning": "사랑에 빠지면 단점이 보이지 않는다.", "difficulty": 1, "category": "idiom"},
    {"encoded_text": "모로 가도 서울만 가면 된다.", "original_text": "All roads lead to Rome.", "correct_meaning": "과정보다 결과가 중요하다.", "difficulty": 1, "category": "proverb"},
    {"encoded_text": "두 마리 토끼를 잡으려다 다 놓친다.", "original_text": "If you chase two rabbits, you will not catch either one.", "correct_meaning": "욕심을 부려 두 가지 일을 동시에 하려 하면 둘 다 실패한다.", "difficulty": 1, "category": "proverb"},

    # 추가 45개
    {"encoded_text": "가는 말이 고와야 오는 말이 곱다.", "original_text": "Nice words for nice words.", "correct_meaning": "내가 남에게 잘해야 남도 나에게 잘한다.", "difficulty": 1, "category": "proverb"},
    {"encoded_text": "등잔 밑이 어둡다.", "original_text": "It's darkest under the lamp.", "correct_meaning": "가까운 곳의 일을 오히려 잘 모른다.", "difficulty": 1, "category": "proverb"},
    {"encoded_text": "소 잃고 외양간 고친다.", "original_text": "Mending the barn after the horse is stolen.", "correct_meaning": "이미 일을 그르친 뒤에 뒤늦게 수습하려 해도 소용없다.", "difficulty": 1, "category": "proverb"},
    {"encoded_text": "누워서 떡 먹기.", "original_text": "Eating rice cake while lying down.", "correct_meaning": "매우 쉬운 일이다.", "difficulty": 1, "category": "idiom"},
    {"encoded_text": "천 리 길도 한 걸음부터.", "original_text": "A journey of a thousand miles begins with a single step.", "correct_meaning": "아무리 큰 일이라도 시작이 중요하다.", "difficulty": 1, "category": "proverb"},
    {"encoded_text": "티끌 모아 태산.", "original_text": "Gathering dust to make a mountain.", "correct_meaning": "작은 것도 모이면 큰 것이 된다.", "difficulty": 1, "category": "proverb"},
    {"encoded_text": "하늘이 무너져도 솟아날 구멍이 있다.", "original_text": "Even if the sky falls, there is a hole to soar out.", "correct_meaning": "아무리 어려운 상황이라도 해결책은 있다.", "difficulty": 1, "category": "proverb"},
    {"encoded_text": "호랑이도 제 말 하면 온다.", "original_text": "Speak of the tiger and he will appear.", "correct_meaning": "남에 대해 이야기할 때 그 사람이 공교롭게 나타나는 경우.", "difficulty": 1, "category": "proverb"},
    {"encoded_text": "개구리 올챙이 적 생각 못 한다.", "original_text": "The frog forgets he was a tadpole.", "correct_meaning": "형편이 나아진 뒤에 어려웠던 시절을 잊고 잘난 체한다.", "difficulty": 1, "category": "proverb"},
    {"encoded_text": "고래 싸움에 새우 등 터진다.", "original_text": "Shrimps' backs are broken in a whale fight.", "correct_meaning": "강한 자들끼리 싸우는 통에 약한 자가 피해를 입는다.", "difficulty": 1, "category": "proverb"},
    {"encoded_text": "It's a piece of cake.", "original_text": "It's a piece of cake.", "correct_meaning": "매우 쉬운 일이다.", "difficulty": 1, "category": "idiom"},
    {"encoded_text": "Break a leg.", "original_text": "Break a leg.", "correct_meaning": "행운을 빈다 (공연 전 등에 쓰임).", "difficulty": 1, "category": "idiom"},
    {"encoded_text": "Under the weather.", "original_text": "Under the weather.", "correct_meaning": "몸 컨디션이 좋지 않다.", "difficulty": 1, "category": "idiom"},
    {"encoded_text": "Spill the beans.", "original_text": "Spill the beans.", "correct_meaning": "비밀을 누설하다.", "difficulty": 1, "category": "idiom"},
    {"encoded_text": "Bite the bullet.", "original_text": "Bite the bullet.", "correct_meaning": "어렵거나 불쾌한 일을 참고 견디다.", "difficulty": 1, "category": "idiom"},
    {"encoded_text": "Hit the sack.", "original_text": "Hit the sack.", "correct_meaning": "잠자리에 들다.", "difficulty": 1, "category": "idiom"},
    {"encoded_text": "Cost an arm and a leg.", "original_text": "Cost an arm and a leg.", "correct_meaning": "매우 비싸다.", "difficulty": 1, "category": "idiom"},
    {"encoded_text": "Let the cat out of the bag.", "original_text": "Let the cat out of the bag.", "correct_meaning": "무심코 비밀을 말해버리다.", "difficulty": 1, "category": "idiom"},
    {"encoded_text": "Once in a blue moon.", "original_text": "Once in a blue moon.", "correct_meaning": "아주 드물게 일어나는 일.", "difficulty": 1, "category": "idiom"},
    {"encoded_text": "When pigs fly.", "original_text": "When pigs fly.", "correct_meaning": "결코 일어날 리 없는 일.", "difficulty": 1, "category": "idiom"},
    {"encoded_text": "금강산도 식후경.", "original_text": "Even Geumgangsan implies eating first.", "correct_meaning": "아무리 좋은 일도 배가 불러야 즐길 수 있다.", "difficulty": 1, "category": "proverb"},
    {"encoded_text": "낮말은 새가 듣고 밤말은 쥐가 듣는다.", "original_text": "Birds hear day words, rats hear night words.", "correct_meaning": "아무리 비밀스럽게 한 말이라도 남이 들을 수 있으니 조심해야 한다.", "difficulty": 1, "category": "proverb"},
    {"encoded_text": "되로 주고 말로 받는다.", "original_text": "Give a doe and receive a mal.", "correct_meaning": "남을 조금 건드렸다가 큰 갚음을 당한다.", "difficulty": 1, "category": "proverb"},
    {"encoded_text": "바늘 도둑이 소 도둑 된다.", "original_text": "A needle thief becomes a cow thief.", "correct_meaning": "작은 나쁜 짓도 버릇이 되면 큰 죄를 저지르게 된다.", "difficulty": 1, "category": "proverb"},
    {"encoded_text": "백지장도 맞들면 낫다.", "original_text": "Even a blank sheet of paper is lighter when held together.", "correct_meaning": "쉬운 일이라도 힘을 합치면 더 쉽다.", "difficulty": 1, "category": "proverb"},
    {"encoded_text": "사공이 많으면 배가 산으로 간다.", "original_text": "Too many boatmen send the boat up the mountain.", "correct_meaning": "주장하는 사람이 너무 많으면 일이 제대로 되기 힘들다.", "difficulty": 1, "category": "proverb"},
    {"encoded_text": "서당 개 삼 년이면 풍월을 읊는다.", "original_text": "Create poem after 3 years at school dog.", "correct_meaning": "해당 분야에 오래 있으면 무식한 사람도 지식을 얻게 된다.", "difficulty": 1, "category": "proverb"},
    {"encoded_text": "수박 겉 핥기.", "original_text": "Licking the outside of a watermelon.", "correct_meaning": "내용은 모르고 겉만 건드린다.", "difficulty": 1, "category": "idiom"},
    {"encoded_text": "아닌 땐 굴뚝에 연기 날까.", "original_text": "Does smoke rise from an unlit chimney?", "correct_meaning": "원인이 없으면 결과가 있을 수 없다 (소문에는 근거가 있다).", "difficulty": 1, "category": "proverb"},
    {"encoded_text": "약방에 감초.", "original_text": "Licorice in the pharmacy.", "correct_meaning": "어떤 일에나 빠짐없이 끼어드는 사람이나 물건.", "difficulty": 1, "category": "idiom"},
    {"encoded_text": "우물 안 개구리.", "original_text": "A frog in a well.", "correct_meaning": "세상 물정을 모르고 시야가 좁은 사람.", "difficulty": 1, "category": "proverb"},
    {"encoded_text": "쥐구멍에도 볕 들 날 있다.", "original_text": "Even a mouse hole has sunlight days.", "correct_meaning": "고생 끝에 낙이 온다.", "difficulty": 1, "category": "proverb"},
    {"encoded_text": "짚신도 짝이 있다.", "original_text": "Even straw shoes have pairs.", "correct_meaning": "누구나 제 짝이 있다.", "difficulty": 1, "category": "proverb"},
    {"encoded_text": "Don't judge a book by its cover.", "original_text": "Don't judge a book by its cover.", "correct_meaning": "겉모습만 보고 판단하지 마라.", "difficulty": 1, "category": "proverb"},
    {"encoded_text": "Kill two birds with one stone.", "original_text": "Kill two birds with one stone.", "correct_meaning": "일석이조, 한 가지 일로 두 가지 이득을 얻다.", "difficulty": 1, "category": "idiom"},
    {"encoded_text": "Actions speak louder than words.", "original_text": "Actions speak louder than words.", "correct_meaning": "말보다 행동이 중요하다.", "difficulty": 1, "category": "proverb"},
    {"encoded_text": "Add insult to injury.", "original_text": "Add insult to injury.", "correct_meaning": "엎친 데 덮친 격 (상황을 더 악화시키다).", "difficulty": 1, "category": "idiom"},
    {"encoded_text": "Better late than never.", "original_text": "Better late than never.", "correct_meaning": "아예 안 하는 것보다는 늦게라도 하는 게 낫다.", "difficulty": 1, "category": "proverb"},
    {"encoded_text": "No pain, no gain.", "original_text": "No pain, no gain.", "correct_meaning": "고통 없이는 얻는 것도 없다.", "difficulty": 1, "category": "proverb"},
    {"encoded_text": "The early bird catches the worm.", "original_text": "The early bird catches the worm.", "correct_meaning": "부지런한 사람이 이득을 본다.", "difficulty": 1, "category": "proverb"},
    {"encoded_text": "Curiosity killed the cat.", "original_text": "Curiosity killed the cat.", "correct_meaning": "지나친 호기심은 화를 부른다.", "difficulty": 1, "category": "proverb"},
    {"encoded_text": "Ignorance is bliss.", "original_text": "Ignorance is bliss.", "correct_meaning": "모르는 게 약이다.", "difficulty": 1, "category": "proverb"},
    {"encoded_text": "It takes two to tango.", "original_text": "It takes two to tango.", "correct_meaning": "손바닥도 마주쳐야 소리가 난다 (쌍방의 책임이다).", "difficulty": 1, "category": "idiom"},
    {"encoded_text": "Hit the nail on the head.", "original_text": "Hit the nail on the head.", "correct_meaning": "정곡을 찌르다 / 정확히 맞추다.", "difficulty": 1, "category": "idiom"},
    {"encoded_text": "A blessing in disguise.", "original_text": "A blessing in disguise.", "correct_meaning": "전화위복 (나쁜 일인 줄 알았으나 좋은 결과가 됨).", "difficulty": 1, "category": "idiom"},
    {"encoded_text": "Call it a day.", "original_text": "Call it a day.", "correct_meaning": "하루 일을 마치다.", "difficulty": 1, "category": "idiom"}
]

print(f"Preparing to insert {len(sample_questions)} questions...")

try:
    count = 0
    for q in sample_questions:
        # 중복 확인 (encoded_text 기준)
        exists = db.query(models.Question).filter(models.Question.encoded_text == q["encoded_text"]).first()
        if not exists:
            # ID 생성
            new_id = f"q_{uuid.uuid4().hex[:8]}"
            
            db_q = models.Question(
                id=new_id,
                encoded_text=q["encoded_text"],
                original_text=q["original_text"],
                correct_meaning=q["correct_meaning"],
                difficulty=q["difficulty"],
                category=q.get("category", "General") # Add category
            )
            db.add(db_q)
            count += 1
            # print(f"Added: {q['encoded_text']}")
    
    db.commit()
    print(f"Done! Successfully added {count} new questions.")
    print(f"Total entries processed: {len(sample_questions)}")
except Exception as e:
    db.rollback()
    print("Error:", e)
finally:
    db.close()
