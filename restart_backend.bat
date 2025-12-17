@echo off
echo ========================================
echo Context Hunter - Backend Restart Script
echo ========================================
echo.
echo This script will:
echo 1. Delete all database files
echo 2. Restart the backend server
echo 3. Seed the database with questions
echo 4. Create admin account
echo.
echo IMPORTANT: Make sure to stop the current backend server (Ctrl+C) first!
echo.
pause

cd backend
echo.
echo [1/4] Deleting old database files...
del /F /Q *.db 2>nul
echo Done!

echo.
echo [2/4] Starting backend server...
echo Please run in a separate terminal: uvicorn main:app --reload
echo.
pause

echo.
echo [3/4] Seeding database...
python seed_db.py
echo.

echo [4/4] Creating admin account...
python create_admin.py
echo.

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Test accounts:
echo - Admin: admin / admin1234
echo - New signup: any username/password
echo.
echo Press any key to exit...
pause >nul
