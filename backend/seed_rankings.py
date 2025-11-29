from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
import random
from datetime import datetime, timedelta

# 데이터베이스 테이블 생성 (혹시 없는 경우)
models.Base.metadata.create_all(bind=engine)

def seed_rankings():
    db: Session = SessionLocal()
    
    try:
        print("Seeding ranking data...")
        
        # 닉네임 리스트
        nicknames = [
            "ContextHunter", "WordMaster", "KoreanLearner", "SeoulVibe", "KimchiLover",
            "HangulPro", "StudyHard", "DailyWorker", "ChallengeKing", "NoGiveUp",
            "Polyglot", "LanguageNerd", "BookWorm", "PoetWannabe", "WriterLife",
            "ReaderClub", "GrammarNazi", "VocaHero", "SentenceBuilder", "StoryTeller"
        ]
        
        entries = []
        for i, nickname in enumerate(nicknames):
            # 점수와 스트릭 랜덤 생성 (상위권일수록 높게)
            base_score = random.randint(5, 50)
            score = base_score + (20 - i) * 2  # 순서대로 좀 더 높은 점수 부여 경향
            max_streak = random.randint(2, score)
            
            # 난이도 랜덤 (1~3)
            difficulty = random.randint(1, 3)
            
            # 시간 랜덤 (최근 1주일)
            days_ago = random.randint(0, 7)
            timestamp = datetime.now() - timedelta(days=days_ago)
            
            entry = models.Guestbook(
                nickname=nickname,
                score=score,
                max_streak=max_streak,
                difficulty=difficulty,
                timestamp=timestamp
            )
            entries.append(entry)
            
        # 데이터베이스에 추가
        db.add_all(entries)
        db.commit()
        
        print(f"Successfully added {len(entries)} ranking entries!")
        
    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_rankings()
