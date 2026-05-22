"""
오디오 파일 입력 검증 유틸리티.
MIME 타입, 파일 크기, 매직 바이트를 검증합니다.
"""
import logging
from fastapi import HTTPException, UploadFile

logger = logging.getLogger(__name__)

MAX_AUDIO_SIZE = 5 * 1024 * 1024  # 5MB

ALLOWED_MIME = {
    "audio/webm",
    "audio/ogg",
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/x-wav",
    "audio/mp4",
}

# 오디오 포맷별 매직 바이트 (Content-Type 스푸핑 방어)
_MAGIC_SIGNATURES = {
    b"\x1a\x45\xdf\xa3": "webm/matroska",    # WebM / MKV
    b"OggS": "ogg",                            # OGG
    b"RIFF": "wav",                            # WAV
    b"\xff\xfb": "mp3",                        # MP3 (frame sync)
    b"\xff\xf3": "mp3",
    b"\xff\xf2": "mp3",
    b"ID3": "mp3",                             # MP3 with ID3 tag
    b"ftyp": "mp4",                            # MP4 (offset 4)
}


def validate_audio(file: UploadFile) -> None:
    """MIME 타입과 파일 크기를 검증합니다. 위반 시 HTTPException."""
    if file.content_type not in ALLOWED_MIME:
        logger.warning("오디오 MIME 타입 거부: %s", file.content_type)
        raise HTTPException(
            status_code=415,
            detail=f"지원하지 않는 오디오 형식입니다: {file.content_type}",
        )

    if file.size and file.size > MAX_AUDIO_SIZE:
        logger.warning("오디오 파일 크기 초과: %d bytes", file.size)
        raise HTTPException(
            status_code=413,
            detail="오디오 파일이 너무 큽니다. 최대 5MB까지 허용됩니다.",
        )


def validate_audio_bytes(data: bytes, mime_type: str) -> None:
    """바이트 데이터의 매직 바이트를 검증합니다."""
    if len(data) < 4:
        raise HTTPException(status_code=400, detail="오디오 데이터가 너무 짧습니다.")

    header = data[:4]
    for magic, fmt in _MAGIC_SIGNATURES.items():
        if header.startswith(magic):
            return

    # MP4는 offset 4에 'ftyp' 있음
    if len(data) >= 8 and data[4:8] == b"ftyp":
        return

    logger.warning("매직 바이트 불일치: mime=%s, header=%s", mime_type, header.hex())
    raise HTTPException(
        status_code=415,
        detail="오디오 파일 형식이 올바르지 않습니다.",
    )
