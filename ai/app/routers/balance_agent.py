import logging
from fastapi import APIRouter, HTTPException
from app.models.balance_agent import BalanceAgentAnalysisRequest, BalanceAgentAnalysisResponse
from app.agents.balance_agent import get_balance_agent

router = APIRouter(prefix="/api/balance-agent", tags=["balance-agent"])
logger = logging.getLogger(__name__)

@router.post("/analyze", response_model=BalanceAgentAnalysisResponse)
async def balance_agent_analyze(request: BalanceAgentAnalysisRequest) -> BalanceAgentAnalysisResponse:
    """
    수급 분석 전문가 에이전트를 직접 호출하여 특정 작물의 심층 분석 보고서를 받아옵니다.
    """
    logger.info("Balance Agent 요청 수신 [cropName=%s, year=%s]", request.cropName, request.year)
    
    try:
        agent = get_balance_agent()
        
        # 에이전트 입력 구성
        prompt = (
            f"양평군의 '{request.cropName}' 작물 수급 현황에 대해 진단해 줘. "
            f"실시간 공급량과 시장 수요량, 과거 추이를 종합적으로 조회하고, "
            f"누구나 직관적으로 이해할 수 있으면서도 구체적인 데이터(수량 등)를 근거로 논리적인 진단 리포트를 작성해 줘. "
            f"[현재 상황] - [데이터 근거] - [행동 가이드] 구조로 깔끔하게 정리해 줘."
        )
        if request.year:
            prompt += f" 기준 분석 연도는 {request.year}년이야."
            
        if request.townName:
            prompt += f"\n\n[추가 고려사항] 질문을 한 농업인은 양평군 '{request.townName}'에서 농사를 짓고 있습니다."
            if request.townRatio is not None and request.townStatus is not None:
                prompt += f" 현재 {request.townName} 자체의 '{request.cropName}' 수급 비율은 {request.townRatio}%이고, 상태는 '{request.townStatus}'입니다. "
            prompt += f"이 {request.townName}의 국소적 상황과 양평군 전체의 거시적 상황을 반드시 함께 비교해 주세요. (예: 우리 동네는 적정이지만 군 전체는 부족하므로 추가 재배 시 판로 확보가 용이함 등) 이를 통해 농업인에게 더욱 구체적이고 실질적인 조언을 제공해 주세요."
            
        input_message = {
            "messages": [
                ("user", prompt)
            ]
        }
        
        # 에이전트 실행 (최종 결과까지 대기)
        result = await agent.ainvoke(input_message)
        
        # 메시지 히스토리에서 마지막 AI 답변 추출
        messages = result.get("messages", [])
        if not messages:
            raise HTTPException(status_code=500, detail="에이전트로부터 응답을 받지 못했습니다.")
            
        last_message = messages[-1]
        
        # content가 리스트(예: [{'type': 'text', 'text': '...'}]) 형태로 반환될 수 있으므로 문자열로 파싱
        content = last_message.content
        if isinstance(content, list):
            text_parts = []
            for item in content:
                if isinstance(item, dict) and "text" in item:
                    text_parts.append(item["text"])
                elif isinstance(item, str):
                    text_parts.append(item)
            reply_text = "".join(text_parts)
        else:
            reply_text = str(content)
        
        return BalanceAgentAnalysisResponse(
            reply=reply_text,
            status="success"
        )
        
    except Exception as e:
        logger.error("Balance Agent 실행 중 오류 발생: %s", e)
        raise HTTPException(
            status_code=500, 
            detail={"code": "E-AI-BALANCE-001", "message": f"에이전트 실행 오류: {str(e)}"}
        )
