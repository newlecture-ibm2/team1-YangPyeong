'use client';

import Modal from '@/components/common/Modal/Modal';
import styles from './LegalModal.module.css';

type LegalType = 'terms' | 'privacy';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: LegalType;
}

const TERMS_CONTENT = {
  title: '이용약관',
  sections: [
    {
      heading: '제1조 (목적)',
      body: '본 약관은 FarmBalance(이하 "서비스")가 제공하는 농업 정보 및 농산물 거래 플랫폼 서비스의 이용 조건 및 절차, 회원과 서비스 간의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.',
    },
    {
      heading: '제2조 (서비스 대상 및 지역)',
      body: '본 서비스는 경기도 양평군 소재 농업인 및 일반 소비자를 주 대상으로 하며, 농장 관리·작물 추천·농산물 직거래·지역 커뮤니티 기능을 제공합니다.',
    },
    {
      heading: '제3조 (회원 가입 및 자격)',
      body: '회원은 일반 회원(USER)과 농업인 회원(FARMER), 지자체 담당자(GOV)로 구분됩니다. 농업인 회원은 농지 정보를 제출하여 관리자 승인을 받은 후 농장 관리 및 판매 기능을 이용할 수 있습니다.',
    },
    {
      heading: '제4조 (서비스 이용)',
      body: '회원은 ① 내 농장 관리(재배 이력, 수확 기록), ② AI 기반 작물 추천, ③ 농산물 장터 구매·판매, ④ 수다방(커뮤니티) 참여, ⑤ 농업 정책 정보 열람 서비스를 이용할 수 있습니다.',
    },
    {
      heading: '제5조 (농산물 거래)',
      body: '농산물 장터에서의 거래는 농업인 회원과 소비자 간에 이루어지며, 서비스는 거래 중개 플랫폼만을 제공합니다. 상품의 품질·안전성에 대한 책임은 판매자에게 있으며, 결제는 서비스 내 결제 시스템을 통해 처리됩니다.',
    },
    {
      heading: '제6조 (금지 행위)',
      body: '회원은 ① 타인의 계정 도용, ② 허위 농지 정보 등록, ③ 불량·부패 농산물 판매, ④ 서비스 운영을 방해하는 행위, ⑤ 커뮤니티 내 허위 정보 유포, ⑥ 개인정보 무단 수집 행위를 해서는 안 됩니다.',
    },
    {
      heading: '제7조 (서비스 중단 및 변경)',
      body: '서비스는 시스템 점검, 설비 장애, 천재지변 등 불가피한 사유로 서비스를 일시 중단할 수 있으며, 사전 공지 후 서비스 내용을 변경할 수 있습니다.',
    },
    {
      heading: '제8조 (분쟁 해결)',
      body: '서비스 이용과 관련하여 발생하는 분쟁은 대한민국 법률에 따라 처리하며, 관할 법원은 서울중앙지방법원으로 합니다.',
    },
  ],
};

const PRIVACY_CONTENT = {
  title: '개인정보처리방침',
  sections: [
    {
      heading: '1. 수집하는 개인정보 항목',
      body: '서비스는 다음 항목을 수집합니다.\n• 필수: 이메일, 비밀번호, 이름, 전화번호, 역할(농업인/일반)\n• 농업인 추가: 농장 위치(법정동 코드), 작물 정보, 농지 면적, 수확 기록\n• 자동 수집: 서비스 이용 기록, 접속 IP, 기기 정보\n• 소셜 로그인 시: 카카오·구글 계정 식별자',
    },
    {
      heading: '2. 개인정보 수집 및 이용 목적',
      body: '수집한 개인정보는 다음 목적에만 사용합니다.\n• 회원 식별 및 서비스 제공\n• 농장 관리·작물 추천·AI 분석 서비스 제공\n• 농산물 거래 및 배송 처리\n• 주문 완료, 거래 안내 등 이메일/FCM 알림 발송\n• 지역 기반 농업 정보(기상, 병해충, 수급) 맞춤 제공\n• 법령상 의무 이행 및 분쟁 해결',
    },
    {
      heading: '3. 개인정보 보유 및 이용 기간',
      body: '• 회원 탈퇴 시: 즉시 파기 (단, 거래 관련 기록은 전자상거래법에 따라 5년 보존)\n• 분쟁 발생 시: 분쟁 해결 완료 후 파기\n• 법령에 특별한 규정이 있는 경우 해당 법령에 따름',
    },
    {
      heading: '4. 개인정보 제3자 제공',
      body: '서비스는 원칙적으로 회원의 개인정보를 외부에 제공하지 않습니다. 단, 다음의 경우 예외로 합니다.\n• 회원이 사전에 동의한 경우\n• 농산물 거래 시 배송을 위해 구매자의 배송지 정보를 판매 농업인에게 제공하는 경우\n• 법령에 따라 수사기관의 요청이 있는 경우',
    },
    {
      heading: '5. 개인정보 처리 위탁',
      body: '서비스는 원활한 서비스 제공을 위해 다음 업무를 위탁합니다.\n• 이메일 발송: SMTP 서비스 (주문 접수·완료 알림)\n• 푸시 알림: Google Firebase Cloud Messaging(FCM)\n• 소셜 로그인: 카카오, Google OAuth',
    },
    {
      heading: '6. 이용자 권리',
      body: '회원은 언제든지 다음 권리를 행사할 수 있습니다.\n• 개인정보 열람 요청\n• 오류 정정 요청\n• 삭제 요청 (회원 탈퇴)\n• 처리 정지 요청\n위 권리는 마이페이지 > 계정 설정에서 직접 행사하거나, 고객 문의를 통해 신청할 수 있습니다.',
    },
    {
      heading: '7. AI 서비스와 데이터 활용',
      body: '서비스는 농장 위치, 면적, 작물 정보, 기상 데이터, 토양 분석 결과를 AI 작물 추천 및 수익 예측 모델에 활용합니다. 이때 개인을 식별할 수 없는 형태로 익명화하여 분석에 사용합니다.',
    },
    {
      heading: '8. 쿠키 및 접속 기록',
      body: '서비스는 로그인 상태 유지를 위해 JWT 토큰을 사용하며, 이는 브라우저 쿠키에 저장됩니다. 브라우저 설정을 통해 쿠키 저장을 거부할 수 있으나, 이 경우 로그인이 필요한 서비스 이용이 제한될 수 있습니다.',
    },
    {
      heading: '9. 개인정보보호 책임자',
      body: '개인정보 처리에 관한 문의는 서비스 내 고객 문의 채널을 통해 접수할 수 있습니다.',
    },
    {
      heading: '10. 방침 변경 안내',
      body: '본 방침이 변경되는 경우 시행 7일 전부터 서비스 공지사항을 통해 안내합니다. 중요한 변경 사항은 이메일로 별도 통지합니다.\n\n시행일: 2026년 5월 15일',
    },
  ],
};

export default function LegalModal({ isOpen, onClose, type }: LegalModalProps) {
  const content = type === 'terms' ? TERMS_CONTENT : PRIVACY_CONTENT;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={content.title} size="lg">
      <div className={styles.container}>
        {content.sections.map((section) => (
          <div key={section.heading} className={styles.section}>
            <h3 className={styles.sectionHeading}>{section.heading}</h3>
            <p className={styles.sectionBody}>{section.body}</p>
          </div>
        ))}
      </div>
    </Modal>
  );
}
