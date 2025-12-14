
import sqlite3
import os

DB_PATH = 'backend/context_hunter_new.db'

print(f"Checking database ...")

if not os.path.exists(DB_PATH):
    print("❌ Database file NOT FOUND!")
else:
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check notes table
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='wrong_answer_notes'")
        if cursor.fetchone():
            print("✅ 'wrong_answer_notes' table exists.")
            
            # Check columns
            cursor.execute("PRAGMA table_info(wrong_answer_notes)")
            columns = [info[1] for info in cursor.fetchall()]
            print(f"   Columns: {columns}")
            
            # Check content
            cursor.execute("SELECT COUNT(*) FROM wrong_answer_notes")
            count = cursor.fetchone()[0]
            print(f"   Note count: {count}")

        else:
            print("❌ 'wrong_answer_notes' table MISSING!")

        conn.close()
    except Exception as e:
        print(f"❌ Error inspecting DB: {e}")
