@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

echo ============================================
echo   信笺项目 - 启动全部服务
echo   后端API:  http://localhost:3000
echo   管理后台: http://localhost:3000/admin
echo   前端 #1:  http://localhost:3005
echo   前端 #2:  http://localhost:3006
echo ============================================
echo.

REM 安装依赖（如果需要）
if not exist "node_modules\" (
    echo [INFO] 正在安装项目依赖...
    call npm install
    echo.
)

REM 使用 npm scripts 启动全部服务
echo [INFO] 正在启动全部服务 (3000 + 3005 + 3006)...
echo.

call npm run start:all

echo.
echo ============================================
echo   按任意键打开前端页面进行测试...
echo ============================================
pause > nul

start http://localhost:3005
start http://localhost:3006
start http://localhost:3000/admin
