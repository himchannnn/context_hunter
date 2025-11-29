from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models

# 데이터베이스 테이블 생성 (혹시 없는 경우)
models.Base.metadata.create_all(bind=engine)

def clean_guestbook():
    db: Session = SessionLocal()
    
    try:
        print("Cleaning guestbook data...")
        
        # 모든 방명록(랭킹) 데이터 삭제
        db.query(models.Guestbook).delete()
        db.commit()
        
        print("Successfully deleted all guestbook entries!")
        
    except Exception as e:
        print(f"Error cleaning data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    clean_guestbook()
