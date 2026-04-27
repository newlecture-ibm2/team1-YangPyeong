#!/bin/bash
# ============================================================
# FarmBalance - AI 에이전트 룰 전용 동기화 스크립트
# 용도: 팀원들의 IDE(Cursor, Copilot 등)에 에이전트 룰 심볼릭 링크 생성
# 실행: 프로젝트 루트에서  →  bash scripts/sync-rules.sh
# ============================================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "\n${BLUE}🤖 AI 에이전트 공통 룰 동기화 시작...${NC}"

if [ -f .agents/rules/agentrules.md ]; then
    # Cursor IDE 지원
    ln -sf .agents/rules/agentrules.md .cursorrules
    echo -e "  ${GREEN}✅${NC} Cursor 룰 연동 완료 (.cursorrules -> agentrules.md)"

    # GitHub Copilot 지원
    mkdir -p .github
    ln -sf ../.agents/rules/agentrules.md .github/copilot-instructions.md
    echo -e "  ${GREEN}✅${NC} Copilot 룰 연동 완료 (.github/copilot-instructions.md)"
    
    echo -e "\n${GREEN}🎉 모든 룰 연동이 성공적으로 완료되었습니다!${NC}\n"
else
    echo -e "  ${YELLOW}⚠️${NC} .agents/rules/agentrules.md 파일을 찾을 수 없습니다."
    echo -e "  프로젝트 최상단 폴더에서 실행 중인지 확인해주세요.\n"
    exit 1
fi
