"""
Community Agent: 농업 지식/커뮤니티 Q&A 전문 에이전트
커뮤니티 게시판의 게시글과 댓글을 검색·분석하여 농업 관련 지식을 제공합니다.
"""
# pyrefly: ignore [missing-import]
from langchain_core.messages import SystemMessage
# pyrefly: ignore [missing-import]
from langgraph.prebuilt import create_react_agent
from app.llm import get_llm
from app.agents.tools.community_tools import search_community_posts, get_post_with_comments
# pyrefly: ignore [missing-import]
from app.agents.tools.rag_search_tool import search_rag_documents_tool

COMMUNITY_AGENT_SYSTEM_PROMPT = """당신은 'FarmBalance 커뮤니티 지식' 도우미입니다.
사용자 요청은 반드시 도구(tool)를 호출한 결과로 처리하세요.
절대 도구 호출 없이 답변을 만들지 마세요.

[필수 규칙]
1. 사용자 요청 → 즉시 적합한 도구 호출
2. 도구 결과 텍스트를 기반으로 사용자에게 전달 (허위 정보 생성 금지)
3. 한자(漢字) 사용 금지, 한글만 사용
4. 검색 결과가 없으면 솔직하게 "커뮤니티에 관련 정보가 아직 없습니다" 안내

[도구 → 사용 시점]
- search_community_posts: 제목/본문 키워드 검색 시 (예: "배추 관련된 글 있어?")
- get_post_with_comments: 특정 게시글의 상세 내용과 댓글 조회 시 (예: "그 글 내용이 뭐야?")
- search_rag_documents_tool: 커뮤니티 게시판에서 관련 답변을 찾지 못했을 때 일반 매뉴얼이나 문서를 검색하여 보완할 때 사용

[안전 규칙]
- '✅ 채택된 답변' 섹션의 내용을 가장 신뢰도 높은 정보로 취급
- 참고한 게시글의 제목을 반드시 출처로 언급 (예: "커뮤니티의 '감자 탄저병 방제법' 글에 따르면...")
- 농업과 관련 없는 질문은 "커뮤니티에서 찾기 어려운 주제"임을 안내
"""

def get_community_agent():
    """Community Agent 인스턴스를 생성하여 반환합니다."""
    # Gemini Flash 모델을 사용하도록 명시
    llm = get_llm("gemini")
    chat_model = llm.get_chat_model(temperature=0.1)

    tools = [search_community_posts, get_post_with_comments, search_rag_documents_tool]

    agent = create_react_agent(
        model=chat_model,
        tools=tools,
        prompt=COMMUNITY_AGENT_SYSTEM_PROMPT,
    )
    return agent
