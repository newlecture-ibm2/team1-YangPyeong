"""
STT 파싱 라우터.
/api/parse/{domain}/text  — 텍스트 입력 → 구조화 파싱
/api/parse/{domain}/voice — 오디오 입력 → STT + 구조화 파싱 (Gemini 1-call)
"""
import logging
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app.services import domain_registry
from app.services.audio_validator import validate_audio, validate_audio_bytes
from app.services.internal_key_guard import verify_internal_key
from app.services.parse_dispatcher_service import get_parse_dispatcher

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/parse", tags=["parse"])


def _assert_domain(domain: str) -> None:
    if not domain_registry.is_registered(domain):
        raise HTTPException(status_code=400, detail=f"알 수 없는 도메인입니다: {domain}")


@router.post("/{domain}/text")
async def parse_text(
    domain: str,
    text: str = Form(...),
    record_date: str | None = Form(None),
    _: None = Depends(verify_internal_key),
):
    """텍스트(Web Speech 결과)를 구조화 파싱합니다."""
    _assert_domain(domain)

    if len(text) > 2000:
        raise HTTPException(status_code=413, detail="텍스트가 너무 깁니다. 최대 2000자까지 허용됩니다.")

    from datetime import date
    today_str = date.today().strftime("%Y/%m/%d")
    context = {"record_date": record_date or today_str}
    service = get_parse_dispatcher()

    try:
        result = await service.parse(domain, text=text, context=context)
        return result
    except KeyError:
        raise HTTPException(status_code=400, detail=f"알 수 없는 도메인입니다: {domain}")
    except ValueError as e:
        logger.error("parse_text 파싱 실패: %s", e)
        raise HTTPException(status_code=422, detail="음성 내용을 분석할 수 없습니다. 다시 시도해주세요.")
    except Exception as e:
        logger.error("parse_text 오류: %s", e)
        raise HTTPException(status_code=500, detail="서버 오류가 발생했습니다.")


@router.post("/{domain}/voice")
async def parse_voice(
    domain: str,
    record_date: str = Form(...),
    audio: UploadFile = File(...),
    _: None = Depends(verify_internal_key),
):
    """오디오 파일을 STT + 구조화 파싱합니다 (Gemini 1-call)."""
    _assert_domain(domain)

    # MIME 및 크기 1차 검증
    validate_audio(audio)

    data = await audio.read()

    # 매직 바이트 2차 검증 (Content-Type 스푸핑 방어)
    validate_audio_bytes(data, audio.content_type)

    context = {"record_date": record_date}
    service = get_parse_dispatcher()

    try:
        result = await service.parse(domain, audio=data, mime=audio.content_type, context=context)
        return result
    except KeyError:
        raise HTTPException(status_code=400, detail=f"알 수 없는 도메인입니다: {domain}")
    except ValueError as e:
        logger.error("parse_voice 파싱 실패: %s", e)
        raise HTTPException(status_code=422, detail="음성 내용을 분석할 수 없습니다. 다시 시도해주세요.")
    except Exception as e:
        logger.error("parse_voice 오류: %s", e)
        raise HTTPException(status_code=500, detail="서버 오류가 발생했습니다.")
