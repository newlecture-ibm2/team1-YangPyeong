import logging
from sqlalchemy import text
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

from app.db import get_db_session

logger = logging.getLogger(__name__)

def load_and_chunk_documents() -> list[Document]:
    """
    PostgreSQL의 rag_documents 테이블에서 문서를 읽어와 청킹(Chunking) 후
    LangChain Document 객체 리스트로 반환합니다.
    """
    session = get_db_session()
    documents = []

    try:
        # 조인하여 카테고리 이름도 가져옴
        query = text("""
            SELECT 
                d.id, d.title, d.content_type, d.text_content, 
                d.file_url, d.file_name, c.name as category_name
            FROM rag_documents d
            LEFT JOIN rag_categories c ON d.category_id = c.id
            WHERE d.status = 'ACTIVE'
        """)
        
        result = session.execute(query).mappings().all()
        logger.info(f"DB에서 {len(result)}개의 ACTIVE 문서를 찾았습니다.")

        # 텍스트 분할기 설정 (1000자 단위, 오버랩 200자)
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )

        for row in result:
            doc_id = row['id']
            title = row['title']
            category = row['category_name'] or "미분류"
            content_type = row['content_type']
            
            raw_text = ""

            if content_type == 'TEXT':
                raw_text = row['text_content'] or ""
                logger.info(f"[{category}] 텍스트 로드: {title}")
            
            elif content_type == 'FILE':
                # TODO: S3 또는 로컬 스토리지에서 파일을 다운로드하여 파싱하는 로직 추가
                # 예: PyPDFLoader 등을 사용하여 file_url 기반으로 로드
                logger.warning(f"[{category}] 파일(PDF 등) 처리는 현재 준비 중입니다: {title} ({row['file_name']})")
                continue
            
            if not raw_text.strip():
                continue

            # 메타데이터 생성
            metadata = {
                "source_id": str(doc_id),
                "title": title,
                "category": category,
                "type": content_type
            }

            # LangChain Document 생성 및 청킹
            doc = Document(page_content=raw_text, metadata=metadata)
            chunks = text_splitter.split_documents([doc])
            
            documents.extend(chunks)
            logger.info(f" -> {len(chunks)}개의 청크로 분할됨")

        return documents

    except Exception as e:
        logger.error(f"문서 인제스천 중 오류 발생: {e}")
        return []
    finally:
        session.close()
