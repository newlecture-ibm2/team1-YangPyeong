import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. 요청 값 검증 로직 추가 (보안 강화)
    if (!body.message || typeof body.message !== "string") {
      return NextResponse.json({ error: "유효하지 않은 메시지 형식입니다." }, { status: 400 });
    }
    if (body.message.length > 1000) {
      return NextResponse.json({ error: "메시지 길이가 1000자를 초과할 수 없습니다." }, { status: 400 });
    }

    const aiApiUrl = process.env.AI_API_URL || "http://localhost:8000";
    if (!process.env.AI_API_URL) {
      console.warn("AI_API_URL is not defined in environment variables. Falling back to http://localhost:8000");
    }
    
    // 2. 서버에서 user_role 명시적 주입 (클라이언트 바디값 무시)
    const { getGovAuth } = await import("../_lib/govAuth");
    const { token } = await getGovAuth();
    
    let userRole = "GOV"; // 기본값
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const decoded = JSON.parse(jsonPayload);
        if (decoded.role) {
          userRole = decoded.role;
        }
      } catch (e) {
        console.error("JWT decoding failed:", e);
      }
    }

    // TODO: 향후 프론트에서 dashboard_context를 보내면, 이를 AI 서버로 전달하는 로직 확장
    // const dashboardContext = body.dashboard_context || null;

    const payload = {
      message: body.message,
      user_role: userRole
      // dashboard_context: dashboardContext
    };

    const response = await fetch(`${aiApiUrl}/api/local-gov/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorMsg = `AI 에러: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMsg = errorData.error || errorMsg;
      } catch (e) {
        // 응답이 JSON이 아닐 경우
      }
      return NextResponse.json({ error: errorMsg }, { status: response.status });
    }
    
    return NextResponse.json(await response.json());
  } catch (error) {
    console.error("AI API Proxy Error:", error);
    return NextResponse.json({ error: "AI 서버 연결에 실패했습니다." }, { status: 500 });
  }
}
