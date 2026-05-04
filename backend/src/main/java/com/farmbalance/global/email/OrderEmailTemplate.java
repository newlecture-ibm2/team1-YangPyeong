package com.farmbalance.global.email;

/**
 * 주문 관련 이메일 HTML 템플릿 유틸.
 */
public final class OrderEmailTemplate {

    private OrderEmailTemplate() {}

    /**
     * 주문 접수 확인 이메일 HTML
     */
    public static String orderAccepted(String buyerName, String orderNumber, int totalAmount) {
        return """
                <div style="max-width:600px;margin:0 auto;font-family:'Apple SD Gothic Neo','Malgun Gothic',sans-serif;color:#333">
                  <div style="background:#488250;padding:24px 32px;border-radius:12px 12px 0 0">
                    <h1 style="margin:0;color:#fff;font-size:22px">🌿 FarmBalance</h1>
                  </div>
                  <div style="border:1px solid #e0e0e0;border-top:none;border-radius:0 0 12px 12px;padding:32px">
                    <h2 style="font-size:20px;color:#2d5e32;margin-top:0">주문이 접수되었습니다 ✅</h2>
                    <p style="font-size:15px;line-height:1.7">
                      안녕하세요, <strong>%s</strong>님!<br>
                      고객님의 주문이 판매자에 의해 <strong>접수 확인</strong>되었습니다.
                    </p>
                    <div style="background:#f8f9fa;border-radius:8px;padding:16px 20px;margin:20px 0">
                      <p style="margin:4px 0;font-size:14px"><strong>주문번호:</strong> %s</p>
                      <p style="margin:4px 0;font-size:14px"><strong>결제금액:</strong> ₩%,d</p>
                    </div>
                    <p style="font-size:14px;color:#666;line-height:1.6">
                      상품 준비가 완료되면 배송이 시작됩니다.<br>
                      주문 상세 내역은 <strong>마이페이지 → 주문내역</strong>에서 확인하실 수 있습니다.
                    </p>
                    <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
                    <p style="font-size:12px;color:#999;text-align:center">
                      본 메일은 FarmBalance에서 자동으로 발송된 메일입니다.
                    </p>
                  </div>
                </div>
                """.formatted(buyerName, orderNumber, totalAmount);
    }

    /**
     * 주문 거절(취소) 이메일 HTML
     */
    public static String orderCancelled(String buyerName, String orderNumber, int totalAmount) {
        return """
                <div style="max-width:600px;margin:0 auto;font-family:'Apple SD Gothic Neo','Malgun Gothic',sans-serif;color:#333">
                  <div style="background:#488250;padding:24px 32px;border-radius:12px 12px 0 0">
                    <h1 style="margin:0;color:#fff;font-size:22px">🌿 FarmBalance</h1>
                  </div>
                  <div style="border:1px solid #e0e0e0;border-top:none;border-radius:0 0 12px 12px;padding:32px">
                    <h2 style="font-size:20px;color:#e53e3e;margin-top:0">주문이 거절되었습니다 ❌</h2>
                    <p style="font-size:15px;line-height:1.7">
                      안녕하세요, <strong>%s</strong>님!<br>
                      죄송합니다. 판매자 사정으로 인해 주문이 <strong>거절</strong>되었습니다.
                    </p>
                    <div style="background:#fff5f5;border:1px solid #fed7d7;border-radius:8px;padding:16px 20px;margin:20px 0">
                      <p style="margin:4px 0;font-size:14px"><strong>주문번호:</strong> %s</p>
                      <p style="margin:4px 0;font-size:14px"><strong>결제금액:</strong> ₩%,d</p>
                    </div>
                    <p style="font-size:14px;color:#666;line-height:1.6">
                      결제 금액은 영업일 기준 1~3일 이내 환불 처리됩니다.<br>
                      문의사항은 고객센터를 통해 연락 부탁드립니다.
                    </p>
                    <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
                    <p style="font-size:12px;color:#999;text-align:center">
                      본 메일은 FarmBalance에서 자동으로 발송된 메일입니다.
                    </p>
                  </div>
                </div>
                """.formatted(buyerName, orderNumber, totalAmount);
    }

    /**
     * 배송 시작 이메일 HTML
     */
    public static String orderShipped(String buyerName, String orderNumber) {
        return """
                <div style="max-width:600px;margin:0 auto;font-family:'Apple SD Gothic Neo','Malgun Gothic',sans-serif;color:#333">
                  <div style="background:#488250;padding:24px 32px;border-radius:12px 12px 0 0">
                    <h1 style="margin:0;color:#fff;font-size:22px">🌿 FarmBalance</h1>
                  </div>
                  <div style="border:1px solid #e0e0e0;border-top:none;border-radius:0 0 12px 12px;padding:32px">
                    <h2 style="font-size:20px;color:#2d5e32;margin-top:0">배송이 시작되었습니다 🚚</h2>
                    <p style="font-size:15px;line-height:1.7">
                      안녕하세요, <strong>%s</strong>님!<br>
                      주문하신 상품의 <strong>배송이 시작</strong>되었습니다.
                    </p>
                    <div style="background:#f8f9fa;border-radius:8px;padding:16px 20px;margin:20px 0">
                      <p style="margin:4px 0;font-size:14px"><strong>주문번호:</strong> %s</p>
                    </div>
                    <p style="font-size:14px;color:#666;line-height:1.6">
                      배송 완료까지 1~3일 정도 소요될 수 있습니다.
                    </p>
                    <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
                    <p style="font-size:12px;color:#999;text-align:center">
                      본 메일은 FarmBalance에서 자동으로 발송된 메일입니다.
                    </p>
                  </div>
                </div>
                """.formatted(buyerName, orderNumber);
    }
}
