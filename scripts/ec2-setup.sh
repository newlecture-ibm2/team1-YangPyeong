#!/bin/bash
# ============================================================
# FarmBalance - EC2 Server Setup Script
# 용도: AWS EC2 Ubuntu 인스턴스 초기 환경 구축 (최초 1회)
# 실행: ssh로 EC2 접속 후  →  bash scripts/ec2-setup.sh
# ============================================================

set -e

echo "🚀 EC2 서버 초기 환경 구축을 시작합니다..."

# ── 1. 시스템 업데이트 ──
echo ""
echo "📦 [1/4] 시스템 패키지 업데이트..."
sudo apt-get update && sudo apt-get upgrade -y

# ── 2. Docker 설치 ──
echo ""
echo "🐳 [2/4] Docker 설치..."
sudo apt-get install -y docker.io
sudo systemctl start docker
sudo systemctl enable docker

# ── 3. Docker Compose v2 설치 ──
echo ""
echo "🐳 [3/4] Docker Compose v2 설치..."
COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep tag_name | cut -d '"' -f 4)
sudo curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
echo "  Docker Compose $(docker-compose --version) 설치 완료"

# ── 4. 유저 권한 및 유틸리티 ──
echo ""
echo "🔧 [4/4] 유저 권한 및 유틸리티 설치..."
sudo usermod -aG docker ubuntu
sudo apt-get install -y git curl unzip

echo ""
echo "✅ EC2 서버 환경 구축 완료!"
echo "⚠️  docker 그룹 권한 적용을 위해 서버에 재접속(exit 후 다시 SSH)해주세요."
