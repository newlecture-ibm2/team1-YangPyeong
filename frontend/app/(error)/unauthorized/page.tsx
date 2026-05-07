/* ════════════════════════════════════════════════════════
   401 Unauthorized — 로그인 필요 안내 페이지
   app/unauthorized/page.tsx
   ════════════════════════════════════════════════════════ */

import ErrorPage from '@/components/common/ErrorPage/ErrorPage';

export const metadata = {
  title: '401 — 로그인이 필요합니다 | FarmBalance',
};

export default function UnauthorizedPage() {
  return <ErrorPage statusCode={401} />;
}
