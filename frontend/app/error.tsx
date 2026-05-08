/* ════════════════════════════════════════════════════════
   Global Error Boundary — Next.js App Router
   app/error.tsx (500, 런타임 에러 등)
   ════════════════════════════════════════════════════════ */

'use client';

import ErrorPage from '@/components/common/ErrorPage/ErrorPage';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorPage
      statusCode={500}
      showRetry
      onRetry={reset}
      showBack
      showHome
    />
  );
}
