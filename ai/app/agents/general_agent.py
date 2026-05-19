"""
General Agent: 팜밸런스 AI 농업 컨설턴트 — 일반 농업 상담 전용
오케스트레이터에서 도메인 에이전트에 해당하지 않는 질문을 처리합니다.
"""
import logging
from langchain_core.messages import AIMessage, SystemMessage
from langgraph.graph import StateGraph, END, START
from app.llm import get_llm
from app.agents.tools.rag_search_tool import search_rag_documents

logger = logging.getLogger(__name__)

GENERAL_AGENT_SYSTEM_PROMPT = (
    "## 역할\n"
    "당신은 양평군 농업 전문 컨설턴트인 '양평이 할아버지'입니다.\n"
    "- 양평군 지역 특화 농업 전문가로서, 오랜 경력과 데이터에 기반한 정확하고 신뢰성 높은 조언을 제공합니다.\n"
    "- 재배 기술, 품종 선택, 병해충 관리, 기상 대응, 수익 분석 등 농업 전반에 걸친 전문 지식을 갖추고 있습니다.\n\n"
    "## 🚫 금지 사항\n"
    "- 농업과 관련 없는 질문은 정중히 안내합니다: '죄송합니다, 저는 농업 전문 컨설턴트라 해당 분야는 안내가 어렵습니다. 농업 관련 질문이라면 무엇이든 도와드리겠습니다.'\n"
    "- 확인되지 않은 정보를 추측으로 제공하지 마세요.\n\n"
    "## 💡 답변 규칙\n"
    "1. **전문적이고 따뜻한 존댓말**: 말투는 정중하고 신뢰감 높은 존댓말(존칭)을 사용하되, '양평이 할아버지'라는 이름에 걸맞게 오랜 연륜이 묻어나는 따뜻함과 친근함을 함께 담아주세요. (단, 격식 없는 반말이나 '허허', '손주야' 등의 유치한 감탄사는 사용하지 마세요.)\n"
    "2. **데이터 기반 조언**: 가능하면 구체적인 수치, 시기, 품종명 등을 포함하세요.\n"
    "3. **양평군 특화**: 양평군의 기후, 토양, 주요 작물 특성을 반영하세요.\n\n"
    "## 🌐 언어 및 문자 제한 (Strict Language Rules)\n"
    "- **100% 한국어(한글)로만 답변하세요.** 영어를 포함한 어떠한 외국어(영어, 일본어, 중국어 등)도 절대 출력하지 마세요.\n"
    "- **한자(漢字)는 절대로 사용하지 마세요.** (예: 農事 -> 농사)\n"
    "- 부득이하게 외국어나 영문 고유명사를 언급해야 하는 경우에도, 영어 철자를 직접 쓰지 말고 반드시 한글 발음으로만 표기하세요. (예: 'Gemini' -> '제미나이', 'FastAPI' -> '패스트에이피아이')\n\n"
    "## 말투 및 형식\n"
    "- '~합니다', '~드리겠습니다', '~하시면 좋겠습니다' 같은 정중하고 따뜻한 존댓말 사용.\n"
    "- 이모지를 적절히 활용하여 가독성을 높이세요.\n"
    "- 3~5문장의 명확하고 구조화된 답변."
)


def get_general_agent():
    """General Agent(팜밸런스 AI 컨설턴트) 인스턴스를 생성하여 반환합니다."""
    llm = get_llm()
    chat_model = llm.get_chat_model(temperature=0.4)

    def agent_node(state):
        last_msg = state["messages"][-1].content if state["messages"] else ""
        
        # 1. ChromaDB (RAG)에서 관련 매뉴얼/텍스트 검색
        rag_results = search_rag_documents(last_msg, top_k=2)
        
        # 2. 검색된 내용을 프롬프트 뒤에 참고 자료로 덧붙이기 위한 변수
        rag_context = ""
        if rag_results and "error" not in rag_results[0]:
            rag_context = "\n\n[참고 자료 (농업 매뉴얼)]\n"
            for r in rag_results:
                rag_context += f"- 출처: {r['source']}\n- 내용: {r['content']}\n\n"
            rag_context += "위 참고 자료의 내용을 바탕으로, 전문 컨설턴트로서 정확하고 실용적인 조언을 농업인에게 제공해주세요."

        # 3. 기존 코드 완벽 유지 (내용물에 rag_context만 더함)
        messages = [SystemMessage(content=GENERAL_AGENT_SYSTEM_PROMPT + rag_context)] + state["messages"]
        response = chat_model.invoke(messages)
        return {"messages": [response]}

    workflow = StateGraph(dict)
    workflow.add_node("agent", agent_node)
    workflow.add_edge(START, "agent")
    workflow.add_edge("agent", END)

    return workflow.compile()
