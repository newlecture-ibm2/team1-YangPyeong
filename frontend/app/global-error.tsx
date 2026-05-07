/* ════════════════════════════════════════════════════════
   Global Error (HTML Layout 수준) — Next.js App Router
   app/global-error.tsx — layout.tsx 자체에서 에러 발생 시
   globals.css를 직접 import해야 디자인 토큰이 적용됩니다.
   ════════════════════════════════════════════════════════ */

'use client';

import './globals.css';
import ErrorPage from '@/components/common/ErrorPage/ErrorPage';

export default function GlobalLayoutError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ko">
      <body>
        <ErrorPage
          statusCode={500}
          title="앗, 예상치 못한 오류가 발생했어요"
          showRetry
          onRetry={reset}
          showBack={false}
          showHome
        />
      </body>
    </html>
  );
}
