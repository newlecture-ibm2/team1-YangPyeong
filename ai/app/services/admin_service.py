import json
import logging
from app.llm import get_llm
from app.models.admin import (
    ShopAuditBatchRequest, ShopAuditBatchResponse, ShopAuditResult,
    ModerationBatchRequest, ModerationBatchResponse, ModerationResult
)

logger = logging.getLogger(__name__)

class AdminService:
    def __init__(self):
        self.llm = get_llm("gemini")

    async def audit_shop_batch(self, request: ShopAuditBatchRequest) -> ShopAuditBatchResponse:
        system_instruction = """
        당신은 농산물 거래 플랫폼의 관리자 AI입니다. 
        사용자가 등록한 상품 목록을 보고, 농산물이나 관련 가공품이 맞는지 판단하여 일괄 심사하세요.
        
        [심사 기준]
        - 정상 (is_valid=true): 농산물, 채소, 과일, 종자, 비료, 농기구, 농산물 가공품 등.
        - 비정상 (is_valid=false): 중고차, 전자기기, 게임 계정 등 농업과 무관한 상품. 스팸, 도박 홍보, 심한 욕설. 명백히 장난으로 올린 비정상적인 가격(예: 10억 원짜리 배추 1포기).
        
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
        
        items_json = request.model_dump_json()
        prompt = f"다음 상품 목록을 심사해주세요:\n{items_json}"
        
        logger.info(f"Shop audit requested for {len(request.items)} items.")
        
        try:
            response_text = await self.llm.generate_json(
                prompt=prompt,
                system_instruction=system_instruction,
                temperature=0.1
            )
            
            # Remove markdown backticks if present
            if response_text.startswith("```json"):
                response_text = response_text[7:-3]
            elif response_text.startswith("```"):
                response_text = response_text[3:-3]
                
            data = json.loads(response_text)
            
            # Validate output matches Pydantic model
            if "results" not in data:
                # If LLM returned a direct list
                if isinstance(data, list):
                    data = {"results": data}
                else:
                    raise ValueError("Invalid LLM response format: missing 'results' key")
                    
            return ShopAuditBatchResponse(**data)
            
        except Exception as e:
            logger.error(f"Error during shop audit: {e}")
            # Fallback: return everything as valid if AI fails, or everything as pending (is_valid=False). 
            # We return False to leave it in admin queue to be safe.
            results = [
                ShopAuditResult(product_id=item.product_id, is_valid=False, reason="AI 심사 오류로 인한 보류") 
                for item in request.items
            ]
            return ShopAuditBatchResponse(results=results)

    async def moderate_post_batch(self, request: ModerationBatchRequest) -> ModerationBatchResponse:
        system_instruction = """
        당신은 농업인 커뮤니티의 자동 모더레이터 AI입니다.
        사용자가 작성한 게시글/댓글 목록을 보고 스팸이나 악성 글을 필터링하세요.
        
        [심사 기준]
        - 정상 (is_clean=true): 일반적인 농업 정보 공유, 질문, 일상 대화. 약간의 비속어가 있더라도 문맥상 분노 표출이 아니라면 허용.
        - 비정상 (is_clean=false): 불법 도박(카지노, 토토) 홍보, 성인물 유도 링크, 타인에 대한 심각한 비방 및 모욕, 의미 없는 문자열 반복(도배).
        
        응답은 반드시 아래 JSON 배열 형식으로만 반환하세요:
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
            
            if response_text.startswith("```json"):
                response_text = response_text[7:-3]
            elif response_text.startswith("```"):
                response_text = response_text[3:-3]
                
            data = json.loads(response_text)
            
            if "results" not in data:
                if isinstance(data, list):
                    data = {"results": data}
                else:
                    raise ValueError("Invalid LLM response format: missing 'results' key")
                    
            return ModerationBatchResponse(**data)
            
        except Exception as e:
            logger.error(f"Error during moderation: {e}")
            results = [
                ModerationResult(post_id=item.post_id, is_clean=True, reason="AI 심사 오류로 인한 통과") 
                for item in request.items
            ]
            return ModerationBatchResponse(results=results)
