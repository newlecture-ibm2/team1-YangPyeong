from langchain_core.embeddings import Embeddings
from app.config import get_settings

def get_embeddings() -> Embeddings:
    """
    RAG에 사용할 임베딩 모델을 반환합니다.
    """
    settings = get_settings()
    
    # 기본적으로 Gemini 임베딩 사용
    from langchain_google_genai import GoogleGenerativeAIEmbeddings
    
    return GoogleGenerativeAIEmbeddings(
        model="models/embedding-001",
        google_api_key=settings.GEMINI_API_KEY
    )
