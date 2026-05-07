/* ════════════════════════════════════════════════════════
   503 Service Unavailable — 점검 중 안내 페이지
   app/maintenance/page.tsx
   ════════════════════════════════════════════════════════ */

import ErrorPage from '@/components/common/ErrorPage/ErrorPage';

export const metadata = {
  title: '점검 중 — FarmBalance',
};

export default function MaintenancePage() {
  return (
    <ErrorPage
      statusCode={503}
      showBack={false}
      showHome
    />
  );
}
