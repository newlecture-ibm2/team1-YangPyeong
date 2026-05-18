import logging
from typing import Optional
import httpx
from langchain_core.tools import tool
from app.config import settings

logger = logging.getLogger(__name__)

BACKEND_URL = settings.BACKEND_INTERNAL_URL
AI_SECRET_KEY = settings.AI_INTERNAL_SECRET_KEY
HEADERS = {"X-AI-Internal-Key": AI_SECRET_KEY}

@tool
async def search_community_posts(keyword: str, category_id: Optional[int] = None) -> str:
    """
    커뮤니티 게시판에서 키워드로 게시글을 검색합니다.
    사용자가 농사 노하우, Q&A, 다른 농업인의 경험 등을 찾을 때 사용합니다.
    
    Args:
        keyword: 검색 키워드 (예: "감자 탄저병", "배추 재배")
        category_id: 카테고리 ID (선택사항. Q&A 카테고리만 검색할 때 사용)
    """
    try:
        params = {"keyword": keyword, "searchType": "all", "size": 5}
        if category_id:
            params["categoryId"] = category_id

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{BACKEND_URL}/api/community/posts",
                params=params,
                headers=HEADERS,
            )
            if response.status_code != 200:
                return f"커뮤니티 검색 실패 (HTTP {response.status_code})"

            data_raw = response.json().get("data", [])
            # ApiResponse 구조에 따라 data가 리스트일 수도, 객체 내에 있을 수도 있음
            # PostController를 보면 ApiResponse.ok(result.getContent(), ...) 이므로 리스트로 들어옴
            data = data_raw

            if not data:
                return f"'{keyword}' 관련 커뮤니티 게시글이 없습니다."

            # LLM이 잘 이해할 수 있도록 텍스트 포맷팅
            lines = []
            for post in data:
                accepted = "✅채택완료" if post.get("hasAcceptedComment") else ""
                lines.append(
                    f"- [게시글 ID:{post['id']}] {post['title']} "
                    f"(카테고리: {post.get('categoryName','')}, "
                    f"조회수: {post.get('viewCount',0)}, "
                    f"댓글: {post.get('commentCount',0)}개) {accepted}"
                )
            return f"'{keyword}' 검색 결과 ({len(data)}건):\n" + "\n".join(lines)

    except Exception as e:
        logger.error(f"search_community_posts 실패: {e}")
        return f"커뮤니티 검색 중 오류: {str(e)}"

@tool
async def get_post_with_comments(post_id: int) -> str:
    """
    특정 게시글의 본문과 댓글을 모두 조회합니다.
    search_community_posts로 찾은 게시글의 상세 내용이 필요할 때 사용합니다.
    채택된 답변이 있다면 해당 답변을 우선적으로 참고해야 합니다.
    
    Args:
        post_id: 조회할 게시글 ID
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # 게시글 본문 조회
            post_resp = await client.get(
                f"{BACKEND_URL}/api/community/posts/{post_id}",
                headers=HEADERS,
            )
            if post_resp.status_code != 200:
                return f"게시글 조회 실패 (HTTP {post_resp.status_code})"

            post = post_resp.json().get("data", {})

            # 댓글 목록 조회
            comment_resp = await client.get(
                f"{BACKEND_URL}/api/community/posts/{post_id}/comments",
                headers=HEADERS,
            )
            comments = comment_resp.json().get("data", []) if comment_resp.status_code == 200 else []

        # 게시글 포맷팅
        result = (
            f"## 📋 게시글: {post.get('title', '')}\n"
            f"- 작성자: {post.get('authorNickname', '알 수 없음')}\n"
            f"- 카테고리: {post.get('categoryName', '')}\n"
            f"- 조회수: {post.get('viewCount', 0)}\n"
            f"- 내용:\n{post.get('content', '(내용 없음)')}\n\n"
        )

        if not comments:
            result += "💬 댓글 없음"
            return result

        # 채택된 답변을 최상단에 배치
        accepted = [c for c in comments if c.get("accepted") and not c.get("isDeleted")]
        others = [c for c in comments if not c.get("accepted") and not c.get("isDeleted")]

        if accepted:
            result += "### ✅ 채택된 답변:\n"
            for c in accepted:
                result += f"- ({c.get('authorNickname', '')}): {c['content']}\n"

        if others:
            result += f"\n### 💬 기타 답변 ({len(others)}건):\n"
            for c in others[:5]:  # 상위 5개만
                result += f"- ({c.get('authorNickname', '')}): {c['content']}\n"

        return result

    except Exception as e:
        logger.error(f"get_post_with_comments 실패: {e}")
        return f"게시글 상세 조회 중 오류: {str(e)}"
