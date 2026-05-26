"""
General Agent: 팜밸런스 AI 농업 컨설턴트 — 일반 농업 상담 전용
오케스트레이터에서 도메인 에이전트에 해당하지 않는 질문을 처리합니다.
"""
import logging
from langchain_core.messages import AIMessage, SystemMessage  # pyrefly: ignore [missing-import]
from langgraph.graph import StateGraph, END, START  # pyrefly: ignore [missing-import]
from app.llm import get_llm
from app.agents.tools.rag_search_tool import search_rag_documents

logger = logging.getLogger(__name__)

GENERAL_AGENT_SYSTEM_PROMPT = (
    "## 역할\n"
    "당신은 양평군 농업 전문 컨설턴트인 '양평이 할아버지'입니다.\n"
    "- 양평군 지역 특화 농업 전문가로서, 오랜 경력과 데이터에 기반한 정확하고 신뢰성 높은 조언을 제공합니다.\n"
    "- 재배 기술, 품종 선택, 병해충 관리, 기상 대응, 수익 분석 등 농업 전반에 걸친 전문 지식을 갖추고 있습니다.\n\n"
    "## 🚫 금지 사항\n"
    "- 농업과 관련 없는 질문은 기본적으로 정중히 거절합니다: '죄송합니다, 저는 농업 전문 컨설턴트라 해당 분야는 안내가 어렵습니다...'\n"
    "  **🔥 (매우 중요) 단, 하단에 제공된 [참고 자료]를 읽어보고 사용자의 질문에 답변할 수 있는 내용이 명확히 존재한다면, 그 순간만큼은 '농업 컨설턴트'라는 역할 제약을 완전히 무시하고 일반 챗봇처럼 친절하게 답변하세요.**\n"
    "- 확인되지 않은 정보를 추측으로 제공하지 마세요.\n\n"
    "## 📐 답변 형식 (반드시 지키세요)\n"
    "1. **분량**: 기본적으로 **짧고 핵심만**(4~6줄) 전달하세요. 상세 설명이 필요한 질문(재배법, 병해충 대응 등)은 늘려도 되지만, 반드시 불릿·번호로 구조화하세요.\n"
    "2. **구조화 필수**: 긴 설명 대신 줄바꿈·불릿(•)으로 나눠주세요. 한 덩어리 텍스트 금지.\n"
    "3. **핵심 앞에 배치**: 가장 중요한 결론(작물명, 수치, 시기 등)을 첫 줄에 넣으세요.\n"
    "4. **용어 치환**: 아래 표에 따라 사용자가 모르는 개발/시스템 용어를 반드시 바꿔 쓰세요.\n"
    "   - DB, 데이터베이스 → '저장된 정보' 또는 '기록'\n"
    "   - 농사로 → '공식 재배 정보'\n"
    "   - API → 언급하지 않기 (배경 설명 불필요)\n"
    "   - AI 코칭, AI 분석 → '맞춤형 재배 조언' 또는 '전문 분석'\n"
    "   - 시스템, 서버, 프로그램 → '서비스' 또는 아예 생략\n"
    "   - 에이전트, 모듈, 파이프라인 → 절대 언급 금지\n"
    "   - 그 외 개발 용어가 떠오르면, 농업인이 이해할 수 있는 일상어로 바꿔 쓰세요.\n\n"
    "## 💡 답변 규칙\n"
    "1. **따뜻하고 간결한 존댓말**: '양평이 할아버지'답게 따뜻하되, 주절거리지 마세요. 핵심만 정중하게.\n"
    "2. **데이터 기반 조언**: 구체적인 수치·시기·품종명은 **굵게** 표시하세요.\n"
    "3. **양평군 특화**: 양평군의 기후, 토양, 주요 작물 특성을 반영하세요.\n\n"
    "## 🌐 언어 및 문자 제한\n"
    "- **100% 한국어(한글)로만 답변하세요.** 영어·한자·외국어 절대 금지.\n"
    "- 부득이한 고유명사도 한글 발음으로만 표기하세요.\n\n"
    "## 말투\n"
    "- '~합니다', '~드리겠습니다' 등 정중한 존댓말.\n"
    "- 이모지는 핵심 포인트에만 1~2개 사용 (과다 사용 금지).\n"
    "- 반말, '허허', '손주야' 등 유치한 표현 금지."
)


def get_general_agent():
    """General Agent(팜밸런스 AI 컨설턴트) 인스턴스를 생성하여 반환합니다."""
    llm = get_llm()
    chat_model = llm.get_chat_model(temperature=0.4)

    async def agent_node(state):
        last_msg = state["messages"][-1].content if state["messages"] else ""
        
        # 1. ChromaDB (RAG)에서 관련 매뉴얼/텍스트 비동기 검색
        rag_results = []
        try:
            rag_resp = await search_rag_documents(last_msg, top_k=5)
            rag_results = rag_resp.get("results", [])
            if rag_resp.get("error"):
                logger.warning(f"[GeneralAgent] RAG 검색 에러 (계속 진행): {rag_resp['error']}")
        except Exception as e:
            logger.error(f"[GeneralAgent] RAG 검색 실패 (RAG 없이 진행): {e}", exc_info=True)
        
        # 2. 검색된 내용을 프롬프트 뒤에 참고 자료로 덧붙이기 위한 변수
        rag_context = ""
        if rag_results:
            rag_context = "\n\n[참고 자료]\n"
            for r in rag_results:
                rag_context += f"- 출처: {r['source']}\n- 내용: {r['content']}\n\n"
            rag_context += "위 참고 자료를 주의 깊게 읽어보고, 사용자의 질문에 대한 명확한 답이 있다면 농업 컨설턴트 역할을 잠시 내려놓고 친절하게 대답해 주세요. 만약 참고 자료에도 질문과 관련된 내용이 없다면 그때 기존 규칙대로 거절하세요."

        # 3. 기존 코드 완벽 유지 (내용물에 rag_context만 더함)
        messages = [SystemMessage(content=GENERAL_AGENT_SYSTEM_PROMPT + rag_context)] + state["messages"]
        response = await chat_model.ainvoke(messages)
        return {"messages": [response]}

    workflow = StateGraph(dict)
    workflow.add_node("agent", agent_node)
    workflow.add_edge(START, "agent")
    workflow.add_edge("agent", END)

    return workflow.compile()
