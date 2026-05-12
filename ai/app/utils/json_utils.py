import json
import re

def extract_json(text: str) -> dict:
    """LLM 응답에서 JSON 블록을 추출합니다."""
    # ```json ... ``` 블록 추출 시도
    match = re.search(r"```json\s*([\s\S]*?)```", text)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except json.JSONDecodeError:
            pass

    # 순수 JSON 시도
    try:
        return json.loads(text.strip())
    except json.JSONDecodeError:
        pass

    # { ... } 패턴 검색
    match = re.search(r"\{[\s\S]*\}", text)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass

    return {}
