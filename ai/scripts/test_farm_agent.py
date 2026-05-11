import asyncio
import os
import sys
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

# 프로젝트 루트 경로 추가 (app 모듈을 찾기 위함)
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.agents.farm_agent import get_farm_agent

async def test_agent():
    print("=== Farm Agent 도구 호출 테스트 시작 ===")
    
    agent = get_farm_agent()
    
    # 1. 농장 상태 질문 (get_farm_status 호출 기대)
    print("\n[테스트 1] 질문: '내 농장에 작물 더 심을 자리 있어? (농장 ID: 1)'")
    # LangGraph 에이전트는 마지막 메시지를 보고 판단합니다.
    input_message = {"messages": [("user", "내 농장 ID가 1인데, 지금 작물을 더 심을 자리가 남았는지 알려줘.")]}
    
    try:
        async for event in agent.astream(input_message, stream_mode="values"):
            message = event["messages"][-1]
            # 도구 호출(tool_calls)이 포함된 AI 메시지인지 확인
            if hasattr(message, "tool_calls") and message.tool_calls:
                for tool_call in message.tool_calls:
                    print(f"[TOOL] {tool_call['name']}({tool_call['args']})")
            # 최종 답변인 경우
            elif message.type == "ai" and not message.tool_calls:
                print(f"[AI] {message.content[:150]}...")
    except Exception as e:
        print(f"[ERROR] {e}")

    # 2. 날씨 질문 (get_farm_weather 호출 기대)
    print("\n[테스트 2] 질문: '오늘 비료 줘도 되는 날씨야? (농장 ID: 1)'")
    input_message = {"messages": [("user", "농장 ID 1번인데, 오늘 날씨 보고 비료 줘도 되는지 가이드 좀 해줘.")]}
    
    try:
        async for event in agent.astream(input_message, stream_mode="values"):
            message = event["messages"][-1]
            if hasattr(message, "tool_calls") and message.tool_calls:
                for tool_call in message.tool_calls:
                    print(f"[TOOL] {tool_call['name']}({tool_call['args']})")
            elif message.type == "ai" and not message.tool_calls:
                print(f"[AI] {message.content[:150]}...")
    except Exception as e:
        print(f"[ERROR] {e}")

if __name__ == "__main__":
    asyncio.run(test_agent())
