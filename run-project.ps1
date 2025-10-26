# Script để chạy dự án QLKH Backend
# Usage: .\run-project.ps1

Write-Host "🚀 QLKH Backend - Starting Project..." -ForegroundColor Green
Write-Host ""

# Kiểm tra Node.js
Write-Host "📋 Checking requirements..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Kiểm tra npm
try {
    $npmVersion = npm --version
    Write-Host "✅ npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Kiểm tra dependencies
Write-Host "📦 Checking dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "📥 Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
}

# Kiểm tra .env file
Write-Host ""
Write-Host "🔧 Checking configuration..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "✅ .env file exists" -ForegroundColor Green
} else {
    Write-Host "📝 Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item "env.example" ".env"
    Write-Host "✅ .env file created" -ForegroundColor Green
    Write-Host "⚠️  Please configure your database settings in .env file" -ForegroundColor Yellow
}

Write-Host ""

# Dừng các process Node.js cũ
Write-Host "🛑 Stopping existing Node.js processes..." -ForegroundColor Yellow
try {
    taskkill /f /im node.exe 2>$null
    Write-Host "✅ Stopped existing processes" -ForegroundColor Green
} catch {
    Write-Host "ℹ️  No existing processes to stop" -ForegroundColor Blue
}

Write-Host ""

# Chạy dự án
Write-Host "🚀 Starting QLKH Backend Server..." -ForegroundColor Green
Write-Host ""
Write-Host "📚 Available endpoints:" -ForegroundColor Cyan
Write-Host "   • Health Check: http://localhost:8080/api/health" -ForegroundColor White
Write-Host "   • API Docs: http://localhost:8080/api/docs" -ForegroundColor White
Write-Host "   • Login: POST http://localhost:8080/api/auth/login" -ForegroundColor White
Write-Host "   • Warehouses: GET http://localhost:8080/api/auth/warehouses" -ForegroundColor White
Write-Host "   • Dashboard: http://localhost:8080/dashboard" -ForegroundColor White
Write-Host ""
Write-Host "🔌 Socket.IO ready for real-time connections" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Chạy server
npm run dev
