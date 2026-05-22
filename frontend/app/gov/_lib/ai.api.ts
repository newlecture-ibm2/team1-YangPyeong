import { GovChatResponse } from "./ai.types";

/** 페이지 컨텍스트: 현재 화면에 표시 중인 데이터를 AI에 전달 */
export interface GovPageContext {
  pageType: string;
  pageTitle: string;
  [key: string]: unknown;
}

export async function askLocalGovAi(
  message: string,
  pageContext?: GovPageContext
): Promise<GovChatResponse> {
  const body: Record<string, unknown> = { message };
  if (pageContext) {
    body.page_context = pageContext;
  }

  const response = await fetch("/api/gov/ai-chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let errorMsg = "AI 분석 서버와 통신하는 데 실패했습니다.";
    try {
      const errorData = await response.json();
      if (errorData.error) errorMsg = errorData.error;
    } catch (e) {
      // JSON 파싱 실패 무시
    }
    throw new Error(errorMsg);
  }

  return response.json();
}
