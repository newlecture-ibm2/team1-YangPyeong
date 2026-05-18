import os
import logging
from langchain_chroma import Chroma
from app.rag.embeddings import get_embeddings

logger = logging.getLogger(__name__)

# 영구 저장할 로컬 디렉토리 경로
CHROMA_PERSIST_DIR = os.path.join(os.path.dirname(__file__), "../../data/chroma")

def get_vectorstore() -> Chroma:
    """
    ChromaDB 벡터 스토어 인스턴스를 반환합니다.
    """
    logger.info("ChromaDB 로드 (경로: %s)", CHROMA_PERSIST_DIR)
    
    embeddings = get_embeddings()
    return Chroma(
        collection_name="farmbalance_rag",
        embedding_function=embeddings,
        persist_directory=CHROMA_PERSIST_DIR
    )
