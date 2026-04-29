package com.farmbalance.chat.application.port.out;

public interface AgentRouterPort {
    /**
     * 파이썬 Agent 서버로 유저 메시지를 전달하고 응답을 받아옵니다.
     * @param message 유저 질문
     * @return 파이썬 Agent의 답변
     */
    String routeToAgent(String message);
}
