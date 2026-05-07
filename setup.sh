#!/bin/bash
# ============================================================
# FarmBalance - Local Development Setup Script
# 용도: 팀원 로컬 개발 환경 초기 설정 (최초 1회)
# 실행: 프로젝트 루트에서  →  bash setup.sh
#
# 기술 스택 (project-spec.md §6 기준):
#   Backend  : Java 21 + Spring Boot 3.3.x + Gradle 8.10
#   Frontend : Next.js 15 + React 19 + TypeScript 5
#   AI       : Python 3.12 + FastAPI + Gemini
#   Infra    : Docker Compose v2, PostgreSQL 16, Redis
# ============================================================

set -e

# ── 색상 정의 ──
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_step()  { echo -e "\n${BLUE}📦 [$1/$TOTAL_STEPS]${NC} $2"; }
print_ok()    { echo -e "  ${GREEN}✅${NC} $1"; }
print_warn()  { echo -e "  ${YELLOW}⚠️${NC}  $1"; }
print_error() { echo -e "  ${RED}❌${NC} $1"; }

TOTAL_STEPS=6

echo ""
echo "============================================"
echo "  🌾 FarmBalance - 로컬 환경 설정"
echo "============================================"

# ── 1. 사전 요구사항 확인 ──
print_step 1 "사전 요구사항 확인..."

HAS_ERROR=false

# Java 21
if command -v java &> /dev/null; then
    JAVA_VER=$(java -version 2>&1 | head -1 | awk -F '"' '{print $2}' | cut -d. -f1)
    if [ "$JAVA_VER" -ge 21 ] 2>/dev/null; then
        print_ok "Java $(java -version 2>&1 | head -1)"
    else
        print_warn "Java $JAVA_VER 감지 → Java 21 이상 필요"
        HAS_ERROR=true
    fi
else
    print_error "Java 미설치 → Java 21 (Eclipse Temurin 권장) 설치 필요"
    HAS_ERROR=true
fi

# Node.js
if command -v node &> /dev/null; then
    NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
    if [ "$NODE_VER" -ge 22 ] 2>/dev/null; then
        print_ok "Node.js $(node -v)"
    else
        print_warn "Node.js v$NODE_VER 감지 → 22 LTS 이상 권장 (호환될 수 있음)"
    fi
else
    print_error "Node.js 미설치 → Node.js 22 LTS 설치 필요"
    HAS_ERROR=true
fi

# Python 3.12
PYTHON_CMD=""
if command -v python3.12 &> /dev/null; then
    PYTHON_CMD="python3.12"
elif command -v python3 &> /dev/null; then
    PY3_VER=$(python3 --version 2>&1 | awk '{print $2}' | cut -d. -f1-2)
    PYTHON_CMD="python3"
    print_warn "python3 ($PY3_VER) 감지 → Python 3.12 권장"
elif command -v python &> /dev/null; then
    PY_VER=$(python --version 2>&1 | awk '{print $2}' | cut -d. -f1-2)
    PYTHON_CMD="python"
    print_warn "python ($PY_VER) 감지 → Python 3.12 권장"
else
    print_error "Python 미설치 → Python 3.12 설치 필요"
    HAS_ERROR=true
fi

if [ "$PYTHON_CMD" != "" ]; then
    print_ok "Python: $($PYTHON_CMD --version 2>&1)"
fi

# Docker
if command -v docker &> /dev/null; then
    print_ok "Docker $(docker --version | awk '{print $3}' | sed 's/,//')"
else
    print_warn "Docker 미설치 → docker-compose 사용 시 필요"
fi

if [ "$HAS_ERROR" = true ]; then
    echo ""
    print_error "필수 도구가 누락되었습니다. 위 메시지를 확인하고 설치 후 다시 실행하세요."
    exit 1
fi

# ── 2. 환경 변수 설정 ──
print_step 2 "환경 변수 설정..."

if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        print_ok ".env.example → .env 복사 완료"
        print_warn ".env 파일을 열어 실제 값으로 수정하세요 (DB 비밀번호, API 키 등)"
    else
        print_warn ".env.example 없음 → .env 직접 생성 필요"
    fi
else
    print_ok ".env 파일 이미 존재"
fi

# ── 3. Backend 설정 (Gradle Wrapper) ──
print_step 3 "Backend 설정 (Gradle 8.10 Wrapper)..."

if [ -f backend/gradlew ]; then
    chmod +x backend/gradlew
    print_ok "backend/gradlew 실행 권한 부여"

    # Gradle wrapper 동작 확인
    GRADLE_VER=$(cd backend && ./gradlew --version 2>/dev/null | grep "Gradle " | awk '{print $2}')
    if [ -n "$GRADLE_VER" ]; then
        print_ok "Gradle Wrapper $GRADLE_VER 확인"
    else
        print_warn "Gradle Wrapper 다운로드 중... (최초 실행 시 시간 소요)"
        (cd backend && ./gradlew --version > /dev/null 2>&1)
        print_ok "Gradle Wrapper 다운로드 완료"
    fi
else
    print_warn "backend/gradlew 파일 없음 → Windows는 gradlew.bat 사용"
    if [ -f backend/gradlew.bat ]; then
        print_ok "backend/gradlew.bat 존재 확인"
    else
        print_error "Gradle Wrapper 파일 없음 → backend/ 디렉토리 확인 필요"
    fi
fi

# ── 4. Frontend 패키지 설치 (npm) ──
print_step 4 "Frontend 패키지 설치 (Next.js 15 + React 19)..."

if [ -f frontend/package.json ]; then
    (cd frontend && npm install)
    print_ok "frontend/node_modules 설치 완료"
else
    print_error "frontend/package.json 없음"
fi

# ── 5. AI 가상환경 및 패키지 설치 (Python 3.12) ──
print_step 5 "AI 서비스 가상환경 및 패키지 설치..."

if [ -f ai/requirements.txt ]; then
    if [ ! -d ai/.venv ]; then
        echo "  Python 가상환경 생성 중 ($PYTHON_CMD)..."
        (cd ai && $PYTHON_CMD -m venv .venv)
        print_ok "ai/.venv 가상환경 생성 완료"
    else
        print_ok "ai/.venv 가상환경 이미 존재"
    fi

    echo "  패키지 설치 중..."
    (cd ai && .venv/bin/pip install --upgrade pip -q && .venv/bin/pip install -r requirements.txt -q)
    print_ok "AI 패키지 설치 완료"
else
    print_error "ai/requirements.txt 없음"
fi

# ── 6. Agent 서비스 설정 ──
print_step 6 "Agent 서비스 패키지 설치..."

if [ -f agent/requirements.txt ]; then
    if [ ! -d agent/.venv ]; then
        (cd agent && $PYTHON_CMD -m venv .venv)
        print_ok "agent/.venv 가상환경 생성 완료"
    else
        print_ok "agent/.venv 가상환경 이미 존재"
    fi

    (cd agent && .venv/bin/pip install --upgrade pip -q && .venv/bin/pip install -r requirements.txt -q)
    print_ok "Agent 패키지 설치 완료"
else
    print_warn "agent/requirements.txt 없음 → 건너뜀"
fi

# ── 7. AI 에이전트 룰 동기화 (Cursor, Copilot 등) ──
print_step 7 "AI 에이전트 공통 룰 동기화..."

if [ -f .agents/rules/agentrules.md ]; then
    # Cursor IDE 지원
    ln -sf .agents/rules/agentrules.md .cursorrules
    print_ok "Cursor 룰 연동 (.cursorrules -> agentrules.md)"

    # GitHub Copilot 지원
    mkdir -p .github
    ln -sf ../.agents/rules/agentrules.md .github/copilot-instructions.md
    print_ok "Copilot 룰 연동 (.github/copilot-instructions.md)"
else
    print_warn ".agents/rules/agentrules.md 파일 없음"
fi


# ── 완료 ──
echo ""
echo "============================================"
echo -e "  ${GREEN}🌾 FarmBalance 로컬 환경 설정 완료!${NC}"
echo "============================================"
echo ""
echo "  다음 명령으로 개발을 시작하세요:"
echo ""
echo "  ▸ 전체 서비스 (Docker):   docker compose up -d"
echo "  ▸ Backend 단독:          cd backend && ./gradlew bootRun"
echo "  ▸ Frontend 단독:         cd frontend && npm run dev"
echo "  ▸ AI 서버 단독:          cd ai && .venv/bin/uvicorn app.main:app --reload"
echo ""
echo "  ⚠️  .env 파일의 API 키를 반드시 확인하세요!"
echo ""
