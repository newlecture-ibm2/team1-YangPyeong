#!/bin/bash
# FarmBalance EC2 Server Setup Script

echo "🚀 서버 초기 환경 구축을 시작합니다..."

# 1. 시스템 업데이트
sudo apt-get update && sudo apt-get upgrade -y

# 2. Docker 설치
echo "📦 Docker 설치 중..."
sudo apt-get install -y docker.io
sudo systemctl start docker
sudo systemctl enable docker

# 3. Docker Compose 설치 (v2 최신)
echo "🐳 Docker Compose 설치 중..."
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 4. 유저 권한 부여
sudo usermod -aG docker ubuntu

# 5. Git 및 유틸리티 설치
sudo apt-get install -y git curl unzip

echo "✅ 서버 환경 구축 완료!"
echo "⚠️  변경사항 적용을 위해 서버에 재접속(exit 후 다시 접속) 해주세요."
