"""
General Agent: 양평이 할아버지 페르소나 — 일반 농업 상담 전용
오케스트레이터에서 도메인 에이전트에 해당하지 않는 질문을 처리합니다.
"""
import logging
from langchain_core.messages import AIMessage, SystemMessage
from langgraph.graph import StateGraph, END, START
from app.llm import get_llm
from app.agents.tools.rag_search_tool import search_rag_documents

logger = logging.getLogger(__name__)

GENERAL_AGENT_SYSTEM_PROMPT = (
    "## 캐릭터\n"
    "당신은 '양평이 할아버지'입니다.\n"
    "- 나이: 68세, 양평군에서 40년째 농사 중인 베테랑 농사 전문가\n"
    "- 성격: 따뜻하고 인심 넉넉한 옆집 할아버지. 손주처럼 챙겨주되 말은 짧고 핵심만.\n\n"
    "## 🚫 절대 금지 (매우 중요)\n"
    "- **장터/상품/장바구니/구매/주문 관련 질문**이 오면 절대 직접 답하지 마세요.\n"
    "  반드시 이렇게만 말하세요: '허허, 그건 아래 장터 버튼을 눌러보세!'\n"
    "- 농업과 관련 없는 질문은 '허허, 내가 흙이랑만 살다보니 그건 잘 모르겠네.' 한 문장으로 마무리.\n"
    "- 화내거나 훈계하지 마세요.\n"
    "- **절대로 한자(漢字) 사용 금지.** 오직 한글만.\n\n"
    "## 💡 답변 규칙\n"
    "1. **질문에만 답하세요** — 묻지 않은 내용을 추가로 설명하지 마세요.\n"
    "2. **2~3문장 이내**로 간결하게 답하세요. 길게 늘어놓지 마세요.\n"
    "3. 사용자를 '우리 젊은이' 또는 '손주'처럼 대하세요.\n"
    "4. '허허', '아이고' 등 친근한 감탄사는 문장 시작에 한 번만 사용.\n"
    "5. '~했구만', '~하세', '~네' 같은 정겨운 말투 사용.\n"
)


def get_general_agent():
    """General Agent(양평이 할아버지) 인스턴스를 생성하여 반환합니다."""
    llm = get_llm("groq")
    chat_model = llm.get_chat_model(temperature=0.4)

    def agent_node(state):
        last_msg = state["messages"][-1].content if state["messages"] else ""
        
        # 1. ChromaDB (RAG)에서 관련 매뉴얼/텍스트 검색
        rag_results = search_rag_documents(last_msg, top_k=2)
        
        # 2. 검색된 내용을 할아버지 프롬프트 뒤에 살짝 덧붙이기 위한 변수
        rag_context = ""
        if rag_results and "error" not in rag_results[0]:
            rag_context = "\n\n[할아버지의 농사 수첩 (참고 자료)]\n"
            for r in rag_results:
                rag_context += f"- 출처: {r['source']}\n- 내용: {r['content']}\n\n"
            rag_context += "위 참고 자료의 내용을 바탕으로, 할아버지 본인의 오랜 지혜인 것처럼 자연스럽게 섞어서 농업인에게 조언해주세요."

        # 3. 기존 코드 완벽 유지 (내용물에 rag_context만 더함)
        messages = [SystemMessage(content=GENERAL_AGENT_SYSTEM_PROMPT + rag_context)] + state["messages"]
        response = chat_model.invoke(messages)
        return {"messages": [response]}

    workflow = StateGraph(dict)
    workflow.add_node("agent", agent_node)
    workflow.add_edge(START, "agent")
    workflow.add_edge("agent", END)

    return workflow.compile()
