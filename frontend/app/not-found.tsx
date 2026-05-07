/* ════════════════════════════════════════════════════════
   404 Not Found — Next.js App Router
   app/not-found.tsx
   ════════════════════════════════════════════════════════ */

import ErrorPage from '@/components/common/ErrorPage/ErrorPage';

export const metadata = {
  title: '404 — 페이지를 찾을 수 없습니다 | FarmBalance',
};

export default function NotFoundPage() {
  return <ErrorPage statusCode={404} />;
}
