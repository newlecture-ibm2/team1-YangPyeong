import { GovChatResponse } from "./ai.types";

export async function askLocalGovAi(message: string): Promise<GovChatResponse> {
  const response = await fetch("/api/gov/ai-chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
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
