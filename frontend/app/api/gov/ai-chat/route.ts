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

    const aiApiUrl = process.env.AI_SERVER_URL || process.env.AI_API_URL || "http://localhost:8000";
    if (!process.env.AI_SERVER_URL && !process.env.AI_API_URL) {
      console.warn("AI_SERVER_URL is not defined in environment variables. Falling back to http://localhost:8000");
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

    // 3. 페이지 컨텍스트 처리 — 현재 화면 데이터를 메시지에 주입
    const pageContext = body.page_context || null;
    let enrichedMessage = body.message;

    if (pageContext) {
      const contextSummary = buildContextSummary(pageContext);
      if (contextSummary) {
        enrichedMessage = `[현재 화면 데이터]\n${contextSummary}\n\n[질문]\n${body.message}`;
      }
    }

    const payload = {
      message: enrichedMessage,
      user_role: userRole,
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

/* ════════════════════════════════════════════════════════
   페이지 컨텍스트 → 텍스트 요약 변환
   - 프론트에서 보내는 화면 데이터를 AI가 참고할 수 있는 텍스트로 변환
   - 페이지 타입별로 분기 처리
   ════════════════════════════════════════════════════════ */
interface PageContextBase {
  pageType: string;
  pageTitle?: string;
  year?: string | number;
  [key: string]: unknown;
}

interface CultivationItem {
  regionName: string;
  farmCount: number;
  cultivationArea: number;
  mainCrop: string;
}

function buildContextSummary(ctx: PageContextBase): string | null {
  if (!ctx || !ctx.pageType) return null;

  switch (ctx.pageType) {
    case 'cultivation': {
      const items = ctx.cultivationSummary as CultivationItem[] | undefined;
      if (!items || items.length === 0) return null;

      const year = ctx.year || '최근';
      const lines = [`${year}년 읍면별 재배 현황 (총 ${items.length}개 읍면):`];
      for (const item of items) {
        lines.push(
          `- ${item.regionName}: 농가 수 ${item.farmCount}곳, 재배 면적 ${item.cultivationArea.toLocaleString()}㎡, 주요 작물 ${item.mainCrop}`
        );
      }
      return lines.join('\n');
    }

    case 'compare': {
      const items = ctx.compareSummary as { crop: string; prevYearTon: number | null; currentYearTon: number | null; diffTon: number; diffRate: number | null }[] | undefined;
      if (!items || items.length === 0) return null;

      const lines = [`${ctx.baseYear}년 vs ${ctx.compareYear}년 작물별 생산량 비교 (총 ${items.length}개 작물):`];
      for (const item of items) {
        const prev = item.prevYearTon != null ? `${item.prevYearTon.toLocaleString()}kg` : '데이터 없음';
        const curr = item.currentYearTon != null ? `${item.currentYearTon.toLocaleString()}kg` : '데이터 없음';
        const diff = item.diffTon > 0 ? `+${item.diffTon.toLocaleString()}` : item.diffTon.toLocaleString();
        const rate = item.diffRate != null ? `${item.diffRate > 0 ? '+' : ''}${item.diffRate.toFixed(1)}%` : '신규';
        lines.push(`- ${item.crop}: ${ctx.baseYear}년 ${prev}, ${ctx.compareYear}년 ${curr}, 증감 ${diff}kg (${rate})`);
      }
      return lines.join('\n');
    }

    case 'sales': {
      const summary = ctx.salesSummary as { totalAmount: string; txCount: number; activeSellers: number; momRate: string } | undefined;
      const products = ctx.topProducts as { rank: number; productName: string; seller: string; salesVolume: number; revenue: string }[] | undefined;
      if (!summary) return null;

      const lines = [
        `판매 현황 요약:`,
        `- 이번달 총 거래액: ₩${Number(summary.totalAmount).toLocaleString()}`,
        `- 거래 건수: ${summary.txCount}건`,
        `- 활성 판매자: ${summary.activeSellers}명`,
        `- 전월 대비: ${summary.momRate}`,
      ];

      if (products && products.length > 0) {
        lines.push('', '인기 상품 TOP 5:');
        for (const p of products) {
          lines.push(`- ${p.rank}위: ${p.productName} (${p.seller}), 판매량 ${p.salesVolume}개, 매출 ₩${Number(p.revenue).toLocaleString()}`);
        }
      }
      return lines.join('\n');
    }

    case 'balance': {
      const items = ctx.balanceItems as { cropName: string; supplyRate: number; status: string; level: string; advice: string }[] | undefined;
      if (!items || items.length === 0) return null;

      const lines = [`작물별 수급 분석 현황 (총 ${items.length}개 작물):`];
      for (const item of items) {
        lines.push(`- ${item.cropName}: 공급률 ${item.supplyRate}%, 상태 ${item.status}, 등급 ${item.level}, 조언 "${item.advice}"`);
      }
      return lines.join('\n');
    }

    case 'dashboard': {
      const kpi = ctx.kpiSummary as { totalFarms: number; totalCrops: number; surplusCount: number; shortageCount: number } | undefined;
      const warnings = ctx.topWarnings as { cropName: string; supplyRate: number; status: string; level: string }[] | undefined;
      const regions = ctx.regionDistribution as { region: string; count: number }[] | undefined;
      if (!kpi) return null;

      const lines = [
        `대시보드 KPI 요약:`,
        `- 등록 농가: ${kpi.totalFarms}곳`,
        `- 관리 작물: ${kpi.totalCrops}종`,
        `- 과잉 품목: ${kpi.surplusCount}건`,
        `- 부족 품목: ${kpi.shortageCount}건`,
      ];

      if (warnings && warnings.length > 0) {
        lines.push('', '수급 경고 TOP 5:');
        for (const w of warnings) {
          lines.push(`- ${w.cropName}: 공급률 ${w.supplyRate}%, ${w.status} (${w.level})`);
        }
      }

      if (regions && regions.length > 0) {
        lines.push('', '지역별 농가 분포:');
        for (const r of regions) {
          lines.push(`- ${r.region}: ${r.count}곳`);
        }
      }
      return lines.join('\n');
    }

    default:
      return null;
  }
}
