import logging
import json
from app.llm import get_llm
from app.models.ocr import DocumentOcrResponse

logger = logging.getLogger(__name__)

class OcrService:
    def __init__(self):
        self.llm = get_llm()
        
    async def extract_document_info(self, file_bytes: bytes, mime_type: str) -> DocumentOcrResponse:
        prompt = """당신은 농업 행정 문서(농업경영체 등록 확인서, 토지대장, 농지대장) 분석 전문가입니다.
첨부된 이미지 또는 PDF 문서를 분석하여 아래 JSON 포맷으로만 응답하세요. 다른 설명은 포함하지 마세요.

[중요 지침]
1. 만약 이미지가 위 3가지 공문서가 아니거나(예: 셀카, 음식 사진, 개인 임대차계약서 등), 글자가 너무 흐려서 식별할 수 없는 경우 `isValid`를 false로 설정하고 `errorMessage`에 사유를 적으세요.
2. 정상적인 공문서라면 `isValid`를 true로 설정하고 나머지 정보를 추출하세요.

{
  "isValid": true 또는 false,
  "errorMessage": "isValid가 false일 경우 사용자에게 보여줄 안내 메시지 (예: '화질이 흐립니다. 다시 찍어주세요' 또는 '허용되지 않는 문서입니다')",
  "documentType": "어떤 문서인지 기재 (예: 농업경영체 등록 확인서)",
  "farmOwnerName": "소유주 또는 임차인(경작자) 성명",
  "address": "농장 소재지 (지번/도로명 주소 전체)",
  "area": "전체 면적(숫자만, 단위 제외, ㎡ 기준 변환)",
  "documentIssueNumber": "문서 최상단 또는 하단의 '문서확인번호' 또는 '발급번호' (형식: xxxx-xxxx-xxxx)"
}"""
        
        try:
            # BaseLLM의 수정된 generate_json 호출 (file_bytes, mime_type 파라미터 전달)
            result_str = await self.llm.generate_json(
                prompt=prompt,
                file_bytes=file_bytes,
                mime_type=mime_type,
                temperature=0.1
            )
            
            # JSON 파싱
            data = json.loads(result_str)
            return DocumentOcrResponse(**data)
            
        except Exception as e:
            logger.error(f"OCR 추출 실패: {e}")
            return DocumentOcrResponse(
                isValid=False,
                errorMessage="서류 인식 중 시스템 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
            )
