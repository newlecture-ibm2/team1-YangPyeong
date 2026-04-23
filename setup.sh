#!/bin/bash
# ============================================
# FarmBalance 초기 환경 설정 스크립트
# 팀원은 clone 후 이 스크립트를 한 번만 실행하면 됩니다.
# 사용법: bash setup.sh
# ============================================

set -e

# 현재 스크립트 위치 기준으로 프로젝트 루트 경로 설정
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
WORKSPACE_DIR="$(dirname "$PROJECT_DIR")"

echo ""
echo "🌱 FarmBalance 환경 설정을 시작합니다..."
echo "📁 프로젝트 경로: $PROJECT_DIR"
echo "📁 워크스페이스 경로: $WORKSPACE_DIR"
echo ""

# ── 1. AI 에이전트 규칙 심링크 설정 ──
echo "🤖 [1/4] AI 에이전트 규칙 연동 중..."
mkdir -p "$WORKSPACE_DIR/.agents"
if [ -L "$WORKSPACE_DIR/.agents/rules" ]; then
    echo "   ✅ 심링크가 이미 존재합니다. 스킵합니다."
elif [ -d "$WORKSPACE_DIR/.agents/rules" ]; then
    echo "   ⚠️  이미 rules 폴더가 존재합니다. 심링크로 교체합니다."
    rm -rf "$WORKSPACE_DIR/.agents/rules"
    ln -sfn "$PROJECT_DIR/.agents/rules" "$WORKSPACE_DIR/.agents/rules"
    echo "   ✅ 심링크 교체 완료"
else
    ln -sfn "$PROJECT_DIR/.agents/rules" "$WORKSPACE_DIR/.agents/rules"
    echo "   ✅ 심링크 생성 완료"
fi

# ── 2. .env 환경 변수 파일 복사 ──
echo "📄 [2/4] 환경 변수(.env) 파일 설정 중..."
for domain in frontend backend ai; do
    if [ -f "$PROJECT_DIR/$domain/.env.example" ] && [ ! -f "$PROJECT_DIR/$domain/.env" ]; then
        cp "$PROJECT_DIR/$domain/.env.example" "$PROJECT_DIR/$domain/.env"
        echo "   ✅ $domain/.env 생성 완료"
    else
        echo "   ➖ $domain/.env.example 없음 또는 이미 존재하여 스킵"
    fi
done

# ── 3. 권한 설정 ──
echo "🔑 [3/4] 실행 권한 설정 중..."
if [ -f "$PROJECT_DIR/backend/gradlew" ]; then
    chmod +x "$PROJECT_DIR/backend/gradlew"
    echo "   ✅ backend/gradlew 실행 권한 부여"
else
    echo "   ➖ backend/gradlew 없음 (스킵)"
fi

# ── 4. 패키지 설치 ──
echo "📦 [4/4] 각 도메인별 패키지 설치 중..."

# Frontend
if [ -f "$PROJECT_DIR/frontend/package.json" ]; then
    echo "   ▶ Frontend npm 패키지 설치 중..."
    (cd "$PROJECT_DIR/frontend" && npm install)
    echo "   ✅ Frontend 패키지 설치 완료"
else
    echo "   ➖ Frontend package.json 없음 (스킵)"
fi

# AI
if [ -f "$PROJECT_DIR/ai/requirements.txt" ]; then
    echo "   ▶ AI Python 가상환경 생성 및 패키지 설치 중..."
    # 가상환경 없으면 생성
    if [ ! -d "$PROJECT_DIR/ai/.venv" ]; then
        python3 -m venv "$PROJECT_DIR/ai/.venv"
        echo "   ✅ 가상환경(.venv) 생성 완료"
    fi
    # 패키지 설치
    (cd "$PROJECT_DIR/ai" && source .venv/bin/activate && pip install -r requirements.txt)
    echo "   ✅ AI 패키지 설치 완료"
else
    echo "   ➖ AI requirements.txt 없음 (스킵)"
fi

# ── 5. 요약 ──
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 환경 설정 완료!"
echo ""
echo "📌 완료된 항목:"
echo "   • AI 에이전트 규칙: $WORKSPACE_DIR/.agents/rules 연동"
echo "   • .env 템플릿 복사"
echo "   • 패키지 설치 (Frontend, AI) 완료"
echo "   • 백엔드 권한 부여 완료"
echo ""
echo "📌 다음 단계:"
echo "   • Backend: cd backend && ./gradlew bootRun"
echo "   • Frontend: cd frontend && npm run dev"
echo "   • AI: cd ai && source .venv/bin/activate && uvicorn app.main:app --reload"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
