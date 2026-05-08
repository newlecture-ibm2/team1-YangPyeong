/* ════════════════════════════════════════════════════════
   ErrorPage — 공통 에러 안내 컴포넌트
   각 에러 코드(401, 403, 404, 500, 503 등)에 맞는 프리셋을
   제공하며, 커스텀 사용도 가능합니다.
   ════════════════════════════════════════════════════════ */

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './ErrorPage.module.css';

/** 에러 프리셋 타입 */
interface ErrorPreset {
  icon: string;
  iconSub: string;
  title: string;
  description: string;
  tip: string;
  floatingEmojis: string[];
}

/** 에러 프리셋 데이터 */
const ERROR_PRESETS: Record<string, ErrorPreset> = {
  '401': {
    icon: '🔑',
    iconSub: '👤',
    title: '로그인이 필요합니다',
    description: '이 페이지를 이용하시려면 먼저 로그인해 주세요.',
    tip: '💡 계정이 없으시면 회원가입 후 이용해 주세요.',
    floatingEmojis: ['🔑', '🌾', '🌱', '🪴', '🦆'],
  },
  '403': {
    icon: '🚧',
    iconSub: '🔒',
    title: '접근 권한이 없습니다',
    description: '이 페이지에 접근할 수 있는 권한이 없습니다. 로그인 상태나 계정 권한을 확인해 주세요.',
    tip: '💡 로그인 후에도 접근이 불가하다면, 관리자에게 권한 요청을 해보세요.',
    floatingEmojis: ['🔐', '🛡️', '🌾', '🪴', '🌻'],
  },
  '404': {
    icon: '🌾',
    iconSub: '🔍',
    title: '페이지를 찾을 수 없습니다',
    description: '요청하신 페이지가 이동되었거나, 삭제되었거나, 주소가 잘못되었을 수 있습니다.',
    tip: '💡 URL을 다시 확인하시거나, 메뉴에서 원하는 페이지를 찾아보세요.',
    floatingEmojis: ['🌱', '🍃', '🦆', '🌿', '🪴'],
  },
  '500': {
    icon: '🌪️',
    iconSub: '⚙️',
    title: '서버에 문제가 발생했습니다',
    description: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요. 문제가 지속되면 관리자에게 문의해 주세요.',
    tip: '💡 잠시 후 새로고침하시면 대부분 해결됩니다.',
    floatingEmojis: ['⚡', '🔧', '🌧️', '🛠️', '🌾'],
  },
  '503': {
    icon: '🏗️',
    iconSub: '🕐',
    title: '서비스 점검 중입니다',
    description: '현재 서비스 개선을 위해 잠시 점검 중입니다. 곧 더 나은 모습으로 찾아뵙겠습니다.',
    tip: '💡 점검은 보통 30분 이내에 완료됩니다. 잠시만 기다려 주세요.',
    floatingEmojis: ['🌱', '🏗️', '🔨', '🌿', '✨'],
  },
  default: {
    icon: '😮',
    iconSub: '❓',
    title: '오류가 발생했습니다',
    description: '예상하지 못한 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
    tip: '💡 문제가 계속되면 관리자에게 문의해 주세요.',
    floatingEmojis: ['🌾', '🍃', '🌻', '🪴', '🌱'],
  },
};

export interface ErrorPageProps {
  /** 에러 코드 (401, 403, 404, 500, 503 등). 프리셋이 자동 적용됩니다. */
  statusCode?: number | string;
  /** 커스텀 제목 (프리셋 덮어쓰기) */
  title?: string;
  /** 커스텀 설명 (프리셋 덮어쓰기) */
  description?: string;
  /** "다시 시도" 버튼 표시 여부 (주로 500 에러용) */
  showRetry?: boolean;
  /** 다시 시도 콜백 */
  onRetry?: () => void;
  /** "이전 페이지" 버튼 표시 여부 */
  showBack?: boolean;
  /** "홈으로" 버튼 표시 여부 */
  showHome?: boolean;
  /** "로그인" 버튼 표시 여부 (401용) */
  showLogin?: boolean;
}

export default function ErrorPage({
  statusCode = 'default',
  title,
  description,
  showRetry = false,
  onRetry,
  showBack = true,
  showHome = true,
  showLogin = false,
}: ErrorPageProps) {
  const router = useRouter();
  const code = String(statusCode);
  const preset = ERROR_PRESETS[code] || ERROR_PRESETS.default;

  const displayTitle = title || preset.title;
  const displayDesc = description || preset.description;

  // 401일 때 자동으로 로그인 버튼 표시
  const shouldShowLogin = showLogin || code === '401';

  // 버튼이 하나도 없으면 홈 버튼을 강제 표시 (사용자가 갇히지 않도록)
  const hasAnyAction = showHome || showBack || showRetry || shouldShowLogin;

  return (
    <div className={styles.container}>
      {/* 배경 장식 */}
      <div className={styles.bgCircle1} />
      <div className={styles.bgCircle2} />
      <div className={styles.bgCircle3} />

      {/* 떠다니는 이모지 장식 */}
      {preset.floatingEmojis.map((emoji, i) => (
        <span
          key={i}
          className={`${styles.floatingEmoji} ${styles[`float${i + 1}`] || ''}`}
          aria-hidden="true"
        >
          {emoji}
        </span>
      ))}

      {/* 메인 카드 */}
      <div className={styles.card} role="alert">
        {/* 아이콘 */}
        <div className={styles.iconWrap}>
          <span className={styles.iconMain} aria-hidden="true">
            {preset.icon}
          </span>
          <span className={styles.iconSub} aria-hidden="true">
            {preset.iconSub}
          </span>
        </div>

        {/* 에러 코드 */}
        {code !== 'default' && (
          <div className={styles.errorCode} aria-label={`에러 코드 ${code}`}>
            {code}
          </div>
        )}

        {/* 제목 & 설명 */}
        <h1 className={styles.title}>{displayTitle}</h1>
        <p className={styles.description}>{displayDesc}</p>

        {/* 버튼 */}
        <div className={styles.actions}>
          {shouldShowLogin && (
            <Link href="/login" className={styles.btnPrimary}>
              🔑 로그인하기
            </Link>
          )}
          {showHome && (
            <Link href="/" className={shouldShowLogin ? styles.btnSecondary : styles.btnPrimary}>
              🏠 홈으로 돌아가기
            </Link>
          )}
          {showBack && (
            <button
              className={styles.btnSecondary}
              onClick={() => router.back()}
              type="button"
            >
              ← 이전 페이지
            </button>
          )}
          {showRetry && onRetry && (
            <button
              className={styles.btnSecondary}
              onClick={onRetry}
              type="button"
            >
              🔄 다시 시도
            </button>
          )}
          {/* 버튼이 하나도 없으면 안전장치: 홈 버튼 표시 */}
          {!hasAnyAction && (
            <Link href="/" className={styles.btnPrimary}>
              🏠 홈으로 돌아가기
            </Link>
          )}
        </div>

        {/* 팁 */}
        <div className={styles.tip}>
          {preset.tip}
        </div>
      </div>
    </div>
  );
}
