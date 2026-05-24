import type { Metadata, Viewport } from 'next'
import { Noto_Sans_KR, Playfair_Display } from 'next/font/google'
import { ReactNode } from 'react'
import { ToastProvider } from '@/components/common/Toast'
import SessionManager from './(auth)/_components/SessionManager'
import './globals.css'

const notoSansKr = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-noto-sans-kr',
  display: 'swap',
})

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'FarmBalance — 양평군 스마트 파밍 플랫폼',
  description: '데이터 기반 작물 수급 예측과 AI 추천으로 농가 소득을 안정화하는 스마트 농업 플랫폼',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
}

interface RootLayoutProps {
  children: ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ko" className={`${notoSansKr.variable} ${playfairDisplay.variable}`}>
      <body>
        <ToastProvider>
          <SessionManager />
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}
