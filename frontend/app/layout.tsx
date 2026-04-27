import type { Metadata } from 'next'
import { ReactNode } from 'react'
import { ToastProvider } from '@/components/common/Toast'
import './globals.css'

export const metadata: Metadata = {
  title: 'FarmBalance — 양평군 스마트 파밍 플랫폼',
  description: '데이터 기반 작물 수급 예측과 AI 추천으로 농가 소득을 안정화하는 스마트 농업 플랫폼',
}

interface RootLayoutProps {
  children: ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ko">
      <body>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}
