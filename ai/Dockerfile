FROM python:3.12-slim
WORKDIR /app

# Python 런타임 옵션 — Docker 환경 표준 설정
# - PYTHONDONTWRITEBYTECODE: .pyc 캐시 생성 안 함 (호스트 바인드 마운트 시 root 소유 파일 생성 방지)
# - PYTHONUNBUFFERED: stdout/stderr 버퍼링 비활성화 (Docker 로그 즉시 출력)
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV TZ=Asia/Seoul

COPY requirements.txt .
RUN apt-get update && apt-get install -y tzdata && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
