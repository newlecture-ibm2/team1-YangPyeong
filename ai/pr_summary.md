# 🚀 Pull Request 정리 문서 (PR Summary)

> **작업 브랜치**: `dev-woohyuk2` ➔ `stage`
> **작업자**: woohyuk
> **최종 검증 상태**: AI 서버 리빌드 완료 & E2E API 검증 성공 (`100% PASS`)

---

## 📌 PR 제목 추천
```text
feat/refactor(ai): MAS 오케스트레이터 및 커뮤니티 에이전트 성능 최적화 및 가이드 표준 적용
```

---

## 📝 PR 본문 템플릿 (Copy & Paste 용)

### 1. 🌟 주요 변경 사항

#### **⚡ 오케스트레이터 라우팅 고도화 & 성능 최적화**
- **라우터 키워드 간소화**: `DOMAIN_FORCE_KEYWORDS`에 하드코딩되었던 shop_agent 키워드를 필수 UX 제어용 키워드로 간소화하고, `ROUTER_SYSTEM_PROMPT`에 의도 분석 상세 지침과 다중 도메인 판단 예시를 추가하여 LLM 기반의 동적 라우팅 정확도를 높였습니다.
- **Synthesizer 자동 우회(Bypass)**: 단일 에이전트만 호출되었을 경우(`len(routed) <= 1`) 또는 `skip_synthesis`가 활성화된 상황에서는 답변 합성(Synthesizer) 단계를 즉시 스킵하여 에이전트의 원본 응답을 반환하도록 개선하였습니다. 이로써 불필요한 LLM 호출로 인한 지연 시간(Latency)과 토큰 소모를 원천 차단했습니다.
- **LLM 프로바이더 명시**: 오케스트레이터 및 Synthesizer의 LLM 모델 조회를 `get_llm("gemini")`로 명시화하여, 기본 환경 변수에 구애받지 않고 일관된 동작을 확보했습니다.

#### **📝 커뮤니티 에이전트 가이드 표준 리팩터링**
- `docs/development/chatbot-add-domain-agent.md` 가이드에 정의된 프레임워크 표준에 따라 `COMMUNITY_AGENT_SYSTEM_PROMPT`를 `[필수 규칙]`, `[도구 → 사용 시점]`, `[안전 규칙]` 구조로 전면 재구성했습니다.
- 한자 사용 금지(한글 100% 사용) 및 검색 결과가 없을 때의 예외 처리 지침을 추가하여 안정성을 높였습니다.
- `DOMAIN_CONTEXT_INDICATORS`에 `community_agent` 관련 멀티턴 키워드들을 등록해 대화 컨텍스트 유지 능력을 부여했습니다.
- 모델 구동 시 `get_llm("gemini")`를 명시하도록 개선했습니다.

#### **🛡️ 공통 에러 핸들링 도입 및 페르소나 정리**
- **에러 핸들러 단일화**: 에이전트 호출이 예외 발생으로 실패했을 때 일관성 있는 피드백을 주도록 `_agent_error_response` 공통 함수를 구축하고, 각 에이전트 노드(`call_xxx_agent`)들의 예외 처리 구간에 일괄 적용하였습니다.
- **Synthesizer 구 페르소나 지침 제거**: 답변 합성 프롬프트(`SYNTHESIZER_SYSTEM_PROMPT`) 내에 남아 있던 옛 "양평이 할아버지" 말투 가이드(유치한 감탄사 차단, 친근한 연륜 강조 등)를 제거하고, 전문적이며 신뢰감 높은 객관적인 "농업 전문 컨설턴트" 모드로 톤을 통일하였습니다.

---

### 2. 📂 변경된 파일 요약

| 파일 경로 | 수정 목적 | 구체적인 변경 사항 |
| :--- | :--- | :--- |
| 📄 `ai/app/agents/orchestrator.py` | **오케스트레이터 최적화** | 라우터 프롬프트 보강, 키워드 정리, 단일 에이전트 시 Synthesizer 우회 로직 구현, 공통 에러 핸들링 도입, Synthesizer 프롬프트 구 페르소나 지침 제거 |
| 📄 `ai/app/agents/community_agent.py` | **도메인 에이전트 표준화** | 가이드에 정의된 템플릿 규격에 맞게 시스템 프롬프트 구조화 및 규칙 보강, `get_llm("gemini")`로 사용 모델 고정 |

---

### 3. 🧪 자체 검증 및 테스트 결과

#### **✅ 1. AI 서버 도커 재빌드 및 정상 구동 확인**
- `json_repair` 등 신규 종속성이 반영되지 않던 문제를 발견하여 `docker-compose build ai-server`를 통해 이미지 빌드를 정상 수립하고, 컨테이너 기동 오류가 없음을 검증 완료했습니다:
  ```text
  2026-05-19 07:08:17,903 [INFO] app.main: FarmBalance AI Server has started successfully.
  INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
  ```

#### **✅ 2. API 엔드투엔드(E2E) 호출 동작 검증**
- **시나리오 1: 단일 도메인 및 Synthesizer 우회 테스트 ("안녕하세요")**
  - **로그**: `[Router] LLM → ['general_chat']` & `[Synthesizer] 단일 에이전트(['general_chat']) → 우회`
  - **결과**: 답변 합성기 우회 후 정상 답변 수신 완료.
- **시나리오 2: 커뮤니티 에이전트 도구 정상 작동 테스트 ("다른 농가에서 감자 탄저병 어떻게 방제하는지 커뮤니티 글 찾아줘")**
  - **로그**: `[Router] LLM → ['community_agent']` & `GET http://backend:8080/api/community/posts` API 호출
  - **결과**: 새로 반영된 표준 예외 처리 지침에 따라 `"커뮤니티에 관련 정보가 아직 없습니다."` 정상 응답 수신 완료.
- **시나리오 3: 다중 도메인 의도 분석 및 Synthesizer 병합 테스트 ("감자 보조금이랑 요즘 가격 어때?")**
  - **로그**: `[Router] LLM → ['policy_agent', 'balance_agent']`
  - **결과**: 다중 에이전트 동시 구동 후 Synthesizer가 개편된 전문 컨설턴트 톤으로 깔끔하게 답변을 취합하여 응답함을 확인 완료.
