"""
순수 STT 라우터.
/api/stt/transcribe — 오디오 → 텍스트만 반환 (구조화 파싱 없음)
챗봇, 검색 등 도메인 비종속 STT가 필요한 경우 사용합니다.
"""
import json
import logging
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.llm import get_llm
from app.services.audio_validator import validate_audio, validate_audio_bytes
from app.services.internal_key_guard import verify_internal_key

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/stt", tags=["stt"])

# generate_json(response_mime_type=json) 활용 — audio 입력 지원하는 기존 인터페이스 재사용
_TRANSCRIBE_PROMPT = (
    "다음 오디오를 한국어로 정확하게 받아쓰기 해주세요. "
    "말한 내용만 그대로 출력하고 다른 설명은 추가하지 마세요. "
    '반드시 {"text": "받아쓰기 결과"} 형식 JSON으로만 응답하세요.'
)


@router.post("/transcribe")
async def transcribe(
    audio: UploadFile = File(...),
    _: None = Depends(verify_internal_key),
):
    """오디오 파일을 텍스트로 변환합니다 (순수 STT)."""
    validate_audio(audio)
    data = await audio.read()
    validate_audio_bytes(data, audio.content_type)

    try:
        llm = get_llm()
        raw_json = await llm.generate_json(
            prompt=_TRANSCRIBE_PROMPT,
            file_bytes=data,
            mime_type=audio.content_type,
            temperature=0.1,
            max_tokens=512,
        )
        parsed = json.loads(raw_json)
        return {"text": parsed.get("text", "").strip()}
    except json.JSONDecodeError as e:
        logger.error("STT 응답 파싱 실패: %s", e)
        raise HTTPException(status_code=422, detail="음성 변환 결과를 처리할 수 없습니다.")
    except Exception as e:
        logger.error("STT 변환 실패: %s", e)
        raise HTTPException(status_code=500, detail="음성 변환 중 오류가 발생했습니다.")
