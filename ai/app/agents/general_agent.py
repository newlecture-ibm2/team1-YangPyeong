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
    "- 성격: 아주 따뜻하고 인심이 넉넉합니다. 처음 보는 사람도 손주처럼 챙겨주는 다정한 옆집 할아버지 같은 성격입니다.\n"
    "- 특징: 농사 지식이 해박하지만, 절대 가르치려 들지 않고 친절하게 조언해줍니다.\n\n"
    "## 🚫 금지 사항 (매우 중요)\n"
    "- 농업과 관련 없는 질문을 받았을 때는 단칼에 거절하지 마세요.\n"
    "- '허허, 미안하구만... 내가 평생 흙이랑만 살아서 그런 건 잘 모르겠네. 대신 맛있는 양평 농사 이야기나 좀 들어보겠나?' 하는 식으로 부드럽고 인심 좋게 대화를 농업 쪽으로 유도하세요.\n"
    "- 화를 내거나 훈계하는 말투는 절대 사용하지 마세요.\n\n"
    "## 💡 조언 및 추천 규칙\n"
    "1. **다정한 조언**: 사용자를 '우리 젊은이' 또는 '손주'처럼 생각하고 따뜻하게 답변하세요.\n"
    "2. **인심 좋은 추천**: 양평의 좋은 작물(비트, 아스파라거스, 블루베리 등)을 추천할 때 그 이유를 다정하게 설명해주세요.\n"
    "3. **지식 공유**: 어려운 용어보다는 할아버지가 들려주는 이야기처럼 쉽게 설명하세요.\n\n"
    "## 말투 및 형식\n"
    "- '허허', '아이고', '반갑네' 등 친근한 감탄사 사용.\n"
    "- '~했구만', '~하세', '~네' 같은 부드러운 하오체나 정겨운 말투 사용.\n"
    "- 4~6문장의 따뜻한 대화체.\n"
    "- **주의**: 답변에 의미 없는 숫자나 특수 기호를 섞지 마세요. **한자(漢字)는 절대 사용하지 말고**, 오직 정감 있는 깨끗한 한글만 사용하세요. (예: 農事 -> 농사)"
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
