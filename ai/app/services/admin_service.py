import json
import logging
import re
from app.llm import get_llm
from app.models.admin import (
    ShopAuditBatchRequest, ShopAuditBatchResponse, ShopAuditResult,
    ModerationBatchRequest, ModerationBatchResponse, ModerationResult,
    CommentModerationBatchRequest, CommentModerationBatchResponse, CommentModerationResult
)

logger = logging.getLogger(__name__)

class AdminService:
    def __init__(self):
        self.llm = get_llm("gemini")

    async def audit_shop_batch(self, request: ShopAuditBatchRequest) -> ShopAuditBatchResponse:
        system_instruction = """
        당신은 농산물 거래 플랫폼의 관리자 AI입니다. 
        사용자가 등록한 상품 목록을 보고, 농산물이나 관련 가공품이 맞는지 매우 엄격하게 판단하여 일괄 심사하세요.
        
        [심사 기준]
        - 정상 (is_valid=true): 농산물, 채소, 과일, 종자, 비료, 농기구, 농산물 가공품 등 명확히 식별 가능한 농업 관련 상품.
        - 비정상 (is_valid=false): 
          1. 농업과 무관한 일반 공산품, 중고차, 전자기기, 게임 계정, 부동산 등.
          2. 스팸, 불법 도박 홍보, 심한 욕설이 포함된 경우.
          3. 장난성 등록 (예: 터무니없이 비싸거나 싼 가격, 의미없는 자음/모음 남발).
          4. 상품명이나 설명이 불충분하여 상품을 특정할 수 없는 경우 (예: "테스트", "아무거나", "팝니다").
        
        [주의사항 - 매우 중요]
        JSON 파싱 에러를 방지하기 위해 'reason' 필드 작성 시 내부에 절대로 쌍따옴표(")나 줄바꿈 기호를 사용하지 마세요. 강조가 필요하면 작은따옴표(')를 사용하세요.
        
        응답은 반드시 아래 JSON 배열 형식으로만 반환하세요:
        {
          "results": [
            {
              "product_id": 123,
              "is_valid": true,
              "reason": "정상적인 농산물입니다."
            }
          ]
        }
        """
        
        logger.info(f"Shop audit requested for {len(request.items)} items.")
        
        all_results = []
        chunk_size = 5
        
        for i in range(0, len(request.items), chunk_size):
            chunk_items = request.items[i:i + chunk_size]
            chunk_request = ShopAuditBatchRequest(items=chunk_items)
            items_json = chunk_request.model_dump_json()
            prompt = f"다음 상품 목록을 심사해주세요:\n{items_json}"
            
            max_retries = 2
            chunk_success = False
            
            for attempt in range(max_retries):
                try:
                    response_text = await self.llm.generate_json(
                        prompt=prompt,
                        system_instruction=system_instruction,
                        temperature=0.1
                    )
                    
                    first_brace = response_text.find('{')
                    first_bracket = response_text.find('[')
                    
                    if first_brace != -1 and (first_bracket == -1 or first_brace < first_bracket):
                        start_idx = first_brace
                        end_idx = response_text.rfind('}')
                    elif first_bracket != -1:
                        start_idx = first_bracket
                        end_idx = response_text.rfind(']')
                    else:
                        raise ValueError(f"Could not find JSON object/array in response: {response_text[:100]}...")
                        
                    json_str = response_text[start_idx:end_idx+1]
                    data = json.loads(json_str)
                    
                    if "results" not in data:
                        if isinstance(data, list):
                            data = {"results": data}
                        else:
                            raise ValueError("Invalid LLM response format: missing 'results' key")
                            
                    all_results.extend(data["results"])
                    chunk_success = True
                    break
                    
                except json.JSONDecodeError as e:
                    logger.error(f"JSON Decode Error on chunk {i//chunk_size + 1}, attempt {attempt+1}: {e}")
                    if attempt == max_retries - 1:
                        raise RuntimeError("E-AI-SHOP-001: AI 상품 심사 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.")
                except Exception as e:
                    logger.error(f"Error during shop audit chunk {i//chunk_size + 1}: {e}")
                    if attempt == max_retries - 1:
                        raise RuntimeError("E-AI-SHOP-001: AI 상품 심사 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.")
                        
            if not chunk_success:
                raise RuntimeError("E-AI-SHOP-001: AI 상품 심사 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.")
                
        return ShopAuditBatchResponse(results=all_results)

    async def moderate_post_batch(self, request: ModerationBatchRequest) -> ModerationBatchResponse:
        system_instruction = """
        당신은 농업인 커뮤니티의 자동 모더레이터 AI입니다.
        사용자가 작성한 게시글/댓글 목록을 보고 스팸이나 악성 글을 필터링하세요.
        
        [심사 기준]
        - 정상 (is_clean=true): 일반적인 농업 정보 공유, 질문, 일상 대화. 약간의 비속어가 있더라도 문맥상 분노 표출이 아니라면 허용.
        - 비정상 (is_clean=false): 불법 도박(카지노, 토토) 홍보, 성인물 유도 링크, 타인에 대한 심각한 비방 및 모욕, 의미 없는 문자열 반복(도배).
        
        응답은 반드시 아래 JSON 객체 형식으로만 반환하세요:
        {
          "results": [
            {
              "post_id": 456,
              "is_clean": false,
              "reason": "불법 도박 사이트 홍보"
            }
          ]
        }
        """
        
        items_json = request.model_dump_json()
        prompt = f"다음 커뮤니티 게시글 목록을 심사해주세요:\n{items_json}"
        
        logger.info(f"Community moderation requested for {len(request.items)} items.")
        
        try:
            response_text = await self.llm.generate_json(
                prompt=prompt,
                system_instruction=system_instruction,
                temperature=0.1
            )
            
            first_brace = response_text.find('{')
            first_bracket = response_text.find('[')
            
            if first_brace != -1 and (first_bracket == -1 or first_bracket < first_brace):
                start_idx = first_bracket
                end_idx = response_text.rfind(']')
            elif first_brace != -1:
                start_idx = first_brace
                end_idx = response_text.rfind('}')
            else:
                raise ValueError(f"Could not find JSON object/array in response: {response_text[:100]}...")
                
            json_str = response_text[start_idx:end_idx+1]
            data = json.loads(json_str)
            
            if "results" not in data:
                if isinstance(data, list):
                    data = {"results": data}
                else:
                    raise ValueError("Invalid LLM response format: missing 'results' key")
                    
            return ModerationBatchResponse(**data)
            
        except Exception as e:
            logger.error(f"Error during moderation: {e}")
            raise RuntimeError("E-AI-COMM-001: AI 게시글 심사 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.")

    async def moderate_comment_batch(self, request: CommentModerationBatchRequest) -> CommentModerationBatchResponse:
        system_instruction = """
        당신은 농업인 커뮤니티의 자동 모더레이터 AI입니다.
        사용자가 작성한 댓글 목록을 보고 스팸이나 악성 글을 필터링하세요.
        
        [심사 기준]
        - 정상 (is_clean=true): 일반적인 답변, 리액션, 농업 정보 공유.
        - 비정상 (is_clean=false): 불법 도박 홍보, 스팸 링크, 심한 모욕.
        
        응답은 반드시 아래 JSON 객체 형식으로만 반환하세요:
        {
          "results": [
            {
              "comment_id": 456,
              "is_clean": false,
              "reason": "불법 도박 사이트 홍보"
            }
          ]
        }
        """
        
        items_json = request.model_dump_json()
        prompt = f"다음 커뮤니티 댓글 목록을 심사해주세요:\n{items_json}"
        
        logger.info(f"Comment moderation requested for {len(request.items)} items.")
        
        try:
            response_text = await self.llm.generate_json(
                prompt=prompt,
                system_instruction=system_instruction,
                temperature=0.1
            )
            
            first_brace = response_text.find('{')
            first_bracket = response_text.find('[')
            
            if first_brace != -1 and (first_bracket == -1 or first_brace < first_bracket):
                start_idx = first_brace
                end_idx = response_text.rfind('}')
            elif first_bracket != -1:
                start_idx = first_bracket
                end_idx = response_text.rfind(']')
            else:
                raise ValueError(f"Could not find JSON object/array in response: {response_text[:100]}...")
                
            json_str = response_text[start_idx:end_idx+1]
            data = json.loads(json_str)
            
            if "results" not in data:
                if isinstance(data, list):
                    data = {"results": data}
                else:
                    raise ValueError("Invalid LLM response format: missing 'results' key")
                    
            return CommentModerationBatchResponse(**data)
            
        except Exception as e:
            logger.error(f"Error during comment moderation: {e}")
            raise RuntimeError("E-AI-COMM-002: AI 댓글 심사 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.")

    async def sync_rag_data(self) -> dict:
        try:
            from app.rag.ingestion import load_and_chunk_documents
            from app.rag.vectorstore import get_vectorstore

            logger.info("=== RAG 데이터 인제스천 시작 (API 요청) ===")
            documents = load_and_chunk_documents()
            
            if not documents:
                logger.warning("DB에서 처리할 문서가 없습니다.")
                return {"success": True, "message": "처리할 문서가 없습니다.", "chunk_count": 0}

            logger.info(f"총 {len(documents)}개의 텍스트 청크를 ChromaDB에 적재합니다...")
            vectorstore = get_vectorstore()
            vectorstore.add_documents(documents)
            
            logger.info("=== RAG 데이터 인제스천 완료 ===")
            return {"success": True, "message": "RAG 데이터 동기화 완료", "chunk_count": len(documents)}
        except Exception as e:
            logger.error(f"RAG 동기화 중 오류 발생: {e}")
            return {"success": False, "error": str(e)}
