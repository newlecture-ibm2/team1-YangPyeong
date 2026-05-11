from app.models.gov import GraphContext

SYSTEM_PROMPT_TEMPLATE = """당신은 대한민국 농업수급 관리 전용 AI 비서 'FarmBalance AI'입니다.
오직 제공된 <CONTEXT_BLOCK>의 데이터에만 근거하여 답변하십시오.

[엄격한 규칙]
1. 없는 데이터를 추론하거나 지어내지 마십시오. (수치 임의 생성 절대 금지)
2. 정책을 직접 집행하거나 명령하는 어투를 피하십시오. ("지원금을 지급하세요" -> "지원금 지급을 검토/신청할 수 있습니다")
3. 응답은 반드시 "{finish_phrase}"라는 문구로 마무리하십시오.
4. 항상 3문단 이내로 핵심만 간결하게 답변하십시오.
5. <CONTEXT_BLOCK> 내의 sources 출처 정보를 답변에 자연스럽게 녹여내십시오.

[접속자 역할]
현재 대화 중인 사용자의 역할은 '{user_role}'입니다.
{role_specific_instruction}
"""

def build_final_prompt(user_message: str, context: GraphContext) -> str:
    # 향후 GraphAnalysisAgent 확장 시 권한별 어투/관점 분기 (확장 포인트)
    role_instructions = {
        "GOV": "지자체 공무원이 지역 농가를 지도하고 수급을 관리하는 데 필요한 객관적이고 행정적인 관점으로 요약하십시오.",
        "FARMER": "농업인이 본인 농장의 수익성을 높이고 위험을 피할 수 있도록 친절하고 실용적인 조언을 제공하십시오.",
        "ADMIN": "시스템 관리자/총괄이 전체 시스템의 데이터 품질과 거시적 수급 동향을 파악할 수 있는 분석적인 관점을 취하십시오."
    }
    role_specific_instruction = role_instructions.get(context.user_role, role_instructions["GOV"])
    
    finish_phrase = "본 분석은 농가 의사결정을 위한 참고용입니다." if context.user_role == "FARMER" else "본 분석은 농가 지도를 위한 참고용입니다."
    
    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(
        user_role=context.user_role,
        role_specific_instruction=role_specific_instruction,
        finish_phrase=finish_phrase
    )
    
    context_json = context.model_dump_json(exclude_none=True, indent=2)
    
    return f"""{system_prompt}

<CONTEXT_BLOCK>
{context_json}
</CONTEXT_BLOCK>

[USER PROMPT]
사용자 질문: "{user_message}"
위 데이터를 바탕으로 분석 결과를 제공해 주세요.
"""
