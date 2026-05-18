import sys
import os
import logging
from pathlib import Path

# PYTHONPATH 설정 (ai 디렉토리를 포함)
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(ROOT_DIR))

from app.rag.ingestion import load_and_chunk_documents
from app.rag.vectorstore import get_vectorstore

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

def main():
    logger.info("=== RAG 데이터 인제스천 시작 ===")
    
    # 1. 문서 로드 및 청킹
    documents = load_and_chunk_documents()
    
    if not documents:
        logger.warning("DB에서 처리할 문서가 없습니다.")
        return

    logger.info(f"총 {len(documents)}개의 텍스트 청크를 ChromaDB에 적재합니다...")

    # 2. 벡터 DB 초기화 및 데이터 적재
    vectorstore = get_vectorstore()
    
    # 기존 데이터 덮어쓰기를 위해 현재는 단순히 add_documents를 호출합니다.
    # 운영 환경에서는 문서 ID 기반의 중복 제거 로직이 추가될 수 있습니다.
    vectorstore.add_documents(documents)
    
    logger.info("=== RAG 데이터 인제스천 완료 ===")

if __name__ == "__main__":
    main()
