import logging
from app.rag.vectorstore import get_vectorstore
# pyrefly: ignore [missing-import]
from langchain_core.tools import tool

logger = logging.getLogger(__name__)

def search_rag_documents(query: str, top_k: int = 3) -> dict:
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
        return {"query": query, "results": results}
        
    except Exception as e:
        logger.error(f"[RAG Tool] 검색 중 오류 발생: {e}")
        return {"error": str(e)}

@tool
async def search_rag_documents_tool(query: str, top_k: int = 3) -> dict:
    """
    농업 매뉴얼, 정책, 일반 지식 등 기타 참고 자료를 RAG 데이터베이스(ChromaDB)에서 검색합니다.
    자신의 실시간 DB나 API 도구(예: search_policies, search_crops 등)를 먼저 조회해보고, 
    원하는 데이터를 찾지 못했을 때 이 도구를 마지막으로 사용하세요.
    """
    # Langchain 환경에서 async-to-sync wrapping이 필요할 수 있으므로, 내부 함수는 동기로 두고 래퍼만 비동기로 선언할 수도 있지만
    # AI_RULES에 따라 도구는 구조화된 dict 반환 및 async def 형식을 갖춥니다.
    return search_rag_documents(query, top_k)
