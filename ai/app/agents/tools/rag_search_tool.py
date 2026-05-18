import logging
from app.rag.vectorstore import get_vectorstore

logger = logging.getLogger(__name__)

def search_rag_documents(query: str, top_k: int = 3) -> list[dict]:
    """
    사용자의 질문(query)과 유사한 농업 정책 및 매뉴얼 텍스트를 ChromaDB에서 검색합니다.
    """
    try:
        vectorstore = get_vectorstore()
        
        # similarity_search 수행
        docs = vectorstore.similarity_search(query, k=top_k)
        
        results = []
        for doc in docs:
            metadata = doc.metadata
            title = metadata.get("title", "제목 없음")
            category = metadata.get("category", "미분류")
            
            results.append({
                "source": f"[{category}] {title}",
                "content": doc.page_content
            })
            
        logger.info(f"[RAG Tool] '{query}' 검색 완료. {len(results)}건 찾음.")
        return results
        
    except Exception as e:
        logger.error(f"[RAG Tool] 검색 중 오류 발생: {e}")
        return [{"error": f"RAG 검색 실패: {str(e)}"}]
