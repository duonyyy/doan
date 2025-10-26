@echo off
echo 🚀 QLKH Backend - Starting Project...
echo.

echo 📋 Checking requirements...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found. Please install Node.js first.
    pause
    exit /b 1
)
echo ✅ Node.js found

npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm not found.
    pause
    exit /b 1
)
echo ✅ npm found

echo.
echo 📦 Checking dependencies...
if not exist "node_modules" (
    echo 📥 Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed successfully
) else (
    echo ✅ Dependencies already installed
)

echo.
echo 🔧 Checking configuration...
if not exist ".env" (
    echo 📝 Creating .env file from template...
    copy "env.example" ".env" >nul
    echo ✅ .env file created
    echo ⚠️  Please configure your database settings in .env file
) else (
    echo ✅ .env file exists
)

echo.
echo 🛑 Stopping existing Node.js processes...
taskkill /f /im node.exe >nul 2>&1
echo ✅ Stopped existing processes

echo.
echo 🚀 Starting QLKH Backend Server...
echo.
echo 📚 Available endpoints:
echo    • Health Check: http://localhost:8080/api/health
echo    • API Docs: http://localhost:8080/api/docs
echo    • Login: POST http://localhost:8080/api/auth/login
echo    • Warehouses: GET http://localhost:8080/api/auth/warehouses
echo    • Dashboard: http://localhost:8080/dashboard
echo.
echo 🔌 Socket.IO ready for real-time connections
echo.
echo Press Ctrl+C to stop the server
echo.

npm run dev
