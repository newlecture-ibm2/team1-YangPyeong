FROM python:3.12-slim
WORKDIR /app
# requirements.txt가 없을 경우를 대비해 빈 파일이라도 생성하여 COPY 에러 방지
COPY requirements.txt* .
RUN if [ -f requirements.txt ]; then pip install --no-cache-dir -r requirements.txt; fi
COPY . .
EXPOSE 8001
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
