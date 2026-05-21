'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Badge from '@/components/common/Badge/Badge';
import Card from '@/components/common/Card/Card';
import Button from '@/components/common/Button/Button';
import { Info, MapPin } from 'lucide-react';
import { 
  fetchBalanceAnalysis, 
  BalanceAnalysisResponse, 
  fetchSupplyTrend, 
  SupplyTrendResult, 
  fetchBalanceAgentAnalysis, 
  fetchBalanceDashboard, 
  BalanceAgentAnalysisParams,
  BalanceDashboardData
} from '../_lib/balance.api';
import { apiFetch } from '@/lib/api-fetch';
import styles from './page.module.css';

// ==========================================
// 🏡 움직이는 저울 세계관 - 프리미엄 SVG 일러스트
// ==========================================

function BalancedIllustration() {
  return (
    <svg className={styles.svgIllustration} viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="glow-green-premium" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <linearGradient id="grad-leaf-premium" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="grad-tomato" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff6b6b" />
          <stop offset="100%" stopColor="#ee5253" />
        </linearGradient>
        <linearGradient id="grad-carrot" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ff9f43" />
          <stop offset="100%" stopColor="#ee5253" />
        </linearGradient>
      </defs>

      {/* 평화로운 균형 그리드 배경 텍스처 (Stable Grid) */}
      <g opacity="0.15">
        <line x1="20" y1="30" x2="220" y2="30" stroke="#059669" strokeWidth="1" strokeDasharray="2 4" />
        <line x1="20" y1="60" x2="220" y2="60" stroke="#059669" strokeWidth="1" strokeDasharray="2 4" />
        <line x1="20" y1="90" x2="220" y2="90" stroke="#059669" strokeWidth="1" strokeDasharray="2 4" />
        <line x1="20" y1="120" x2="220" y2="120" stroke="#059669" strokeWidth="1" strokeDasharray="2 4" />
        <line x1="60" y1="20" x2="60" y2="140" stroke="#059669" strokeWidth="1" strokeDasharray="2 4" />
        <line x1="120" y1="20" x2="120" y2="140" stroke="#059669" strokeWidth="1" strokeDasharray="2 4" />
        <line x1="180" y1="20" x2="180" y2="140" stroke="#059669" strokeWidth="1" strokeDasharray="2 4" />
      </g>

      <circle cx="120" cy="85" r="45" fill="#e6f4ea" opacity="0.7" filter="url(#glow-green-premium)" />

      {/* 자연의 밸런스 씬 */}
      <g className={styles.balancedScaleGroup}>
        {/* 중앙 저울대 기둥 및 받침 */}
        <path d="M120 45 L120 135" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
        <path d="M100 135 L140 135" stroke="#059669" strokeWidth="6" strokeLinecap="round" />
        <path d="M90 142 L150 142" stroke="#047857" strokeWidth="2" strokeLinecap="round" />
        <circle cx="120" cy="45" r="6" fill="#059669" />

        {/* 저울 수평 빔 */}
        <g className={styles.balancedScaleBeam}>
          <path d="M55 65 L185 65" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
          <circle cx="120" cy="65" r="4" fill="#ffffff" />

          {/* 왼쪽 바구니 (내 공급 - 평온한 과일들) */}
          <g className={styles.balancedLeftPlate}>
            <path d="M55 65 L55 95" stroke="#a7f3d0" strokeWidth="2" />
            <path d="M35 95 C35 110, 75 110, 75 95 Z" fill="#34d399" />
            <path d="M32 95 L78 95" stroke="#059669" strokeWidth="3" strokeLinecap="round" />
            
            {/* 왼쪽 접시 안의 싱싱한 토마토 */}
            <circle cx="50" cy="90" r="7" fill="url(#grad-tomato)" />
            <path d="M50 82 Q51 84 50 85" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="62" cy="88" r="6" fill="url(#grad-carrot)" />
          </g>

          {/* 오른쪽 바구니 (시장 수요 - 조화로운 과일들) */}
          <g className={styles.balancedRightPlate}>
            <path d="M185 65 L185 95" stroke="#a7f3d0" strokeWidth="2" />
            <path d="M165 95 C165 110, 205 110, 205 95 Z" fill="#34d399" />
            <path d="M162 95 L208 95" stroke="#059669" strokeWidth="3" strokeLinecap="round" />
            
            {/* 오른쪽 접시 안의 싱싱한 토마토 */}
            <circle cx="180" cy="90" r="7" fill="url(#grad-tomato)" />
            <path d="M180 82 Q181 84 180 85" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="192" cy="88" r="6" fill="url(#grad-carrot)" />
          </g>
        </g>
      </g>

      {/* 균형 잡힌 자연의 잎사귀 플로팅 */}
      <path className={styles.decoLeaf1} d="M25 45 Q38 32 40 50 Q28 55 25 45 Z" fill="url(#grad-leaf-premium)" />
      <path className={styles.decoLeaf2} d="M215 55 Q202 42 200 60 Q212 65 215 55 Z" fill="url(#grad-leaf-premium)" />
      <circle className={styles.floatElement1} cx="120" cy="20" r="3" fill="#34d399" opacity="0.6" />
      <circle className={styles.floatElement2} cx="45" cy="135" r="4" fill="#a7f3d0" opacity="0.5" />
      <circle className={styles.floatElement3} cx="195" cy="135" r="4" fill="#a7f3d0" opacity="0.5" />
    </svg>
  );
}

function ExcessIllustration() {
  return (
    <svg className={styles.svgIllustration} viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="glow-orange-premium" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <linearGradient id="grad-excess-box" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#c2410c" />
        </linearGradient>
        <linearGradient id="grad-tomato-excess" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff4d4d" />
          <stop offset="100%" stopColor="#cc0000" />
        </linearGradient>
      </defs>

      {/* 점점 쌓여 묵직한 적재 그리드 배경 텍스처 (Heavy Stack Pattern) */}
      <g opacity="0.12">
        <rect x="15" y="10" width="40" height="20" stroke="#ea580c" strokeWidth="1" strokeDasharray="2 2" />
        <rect x="55" y="10" width="40" height="20" stroke="#ea580c" strokeWidth="1" strokeDasharray="2 2" />
        <rect x="95" y="10" width="40" height="20" stroke="#ea580c" strokeWidth="1" strokeDasharray="2 2" />
        <rect x="135" y="10" width="40" height="20" stroke="#ea580c" strokeWidth="1" strokeDasharray="2 2" />
        <rect x="175" y="10" width="40" height="20" stroke="#ea580c" strokeWidth="1" strokeDasharray="2 2" />
        
        <rect x="35" y="30" width="40" height="20" stroke="#ea580c" strokeWidth="1" strokeDasharray="2 2" />
        <rect x="75" y="30" width="40" height="20" stroke="#ea580c" strokeWidth="1" strokeDasharray="2 2" />
        <rect x="115" y="30" width="40" height="20" stroke="#ea580c" strokeWidth="1" strokeDasharray="2 2" />
        <rect x="155" y="30" width="40" height="20" stroke="#ea580c" strokeWidth="1" strokeDasharray="2 2" />

        <rect x="15" y="50" width="40" height="20" stroke="#ea580c" strokeWidth="1" strokeDasharray="2 2" />
        <rect x="55" y="50" width="40" height="20" stroke="#ea580c" strokeWidth="1" strokeDasharray="2 2" />
        <rect x="95" y="50" width="40" height="20" stroke="#ea580c" strokeWidth="1" strokeDasharray="2 2" />
        <rect x="135" y="50" width="40" height="20" stroke="#ea580c" strokeWidth="1" strokeDasharray="2 2" />
        <rect x="175" y="50" width="40" height="20" stroke="#ea580c" strokeWidth="1" strokeDasharray="2 2" />
      </g>

      <circle cx="120" cy="85" r="45" fill="#fef3c7" opacity="0.6" filter="url(#glow-orange-premium)" />

      {/* 공급 과잉 씬 (왼쪽 쏠림) */}
      <g className={styles.excessScaleGroup}>
        {/* 저울 받침 */}
        <path d="M120 45 L120 135" stroke="#d97706" strokeWidth="4" />
        <path d="M100 135 L140 135" stroke="#d97706" strokeWidth="6" strokeLinecap="round" />
        <circle cx="120" cy="45" r="6" fill="#b45309" />

        {/* 저울 기울어진 빔 (왼쪽 쏠림) */}
        <g className={styles.excessScaleBeam}>
          <path d="M55 65 L185 65" stroke="#fb923c" strokeWidth="4" strokeLinecap="round" />

          {/* 왼쪽 바구니 (내 공급 - 과일들이 산더미처럼 흘러 넘침) */}
          <g className={styles.excessLeftPlate}>
            <path d="M55 65 L55 105" stroke="#fde68a" strokeWidth="2" />
            <path d="M35 105 C35 120, 75 120, 75 105 Z" fill="#f59e0b" />
            <path d="M32 105 L78 105" stroke="#d97706" strokeWidth="3" strokeLinecap="round" />

            {/* 과일 산더미 쌓인 씬 */}
            <circle cx="48" cy="98" r="8" fill="url(#grad-tomato-excess)" />
            <circle cx="62" cy="96" r="9" fill="url(#grad-tomato-excess)" />
            <circle cx="55" cy="88" r="8" fill="url(#grad-tomato-excess)" />
            <circle cx="42" cy="92" r="6" fill="#f59e0b" stroke="#d97706" strokeWidth="1" />
            <circle cx="68" cy="92" r="7" fill="#fb923c" />
            <circle cx="50" cy="81" r="5" fill="url(#grad-tomato-excess)" />
          </g>

          {/* 오른쪽 바구니 (시장 수요 - 과일이 겨우 1~2개 얹힌 빈약한 상태) */}
          <g className={styles.excessRightPlate}>
            <path d="M185 65 L185 85" stroke="#fde68a" strokeWidth="2" />
            <path d="M165 85 C165 100, 205 100, 205 85 Z" fill="#9ca3af" opacity="0.6" />
            <path d="M162 85 L208 85" stroke="#4b5563" strokeWidth="2.5" strokeLinecap="round" />

            {/* 단 하나의 외로운 토마토 */}
            <circle cx="185" cy="81" r="5" fill="url(#grad-tomato-excess)" opacity="0.6" />
          </g>
        </g>
      </g>

      {/* 저울 하단: 이미 가득 차 넘쳐서 쏟아질 듯 겹겹이 쌓인 나무 상자들과 굴러다니는 감자들 */}
      <g className={styles.accumulatedBoxes}>
        {/* 아래쪽 상자 1 */}
        <rect x="25" y="125" width="36" height="20" rx="2" fill="url(#grad-excess-box)" stroke="#9a3412" strokeWidth="1" />
        <line x1="29" y1="125" x2="29" y2="145" stroke="#9a3412" strokeWidth="1" />
        <line x1="57" y1="125" x2="57" y2="145" stroke="#9a3412" strokeWidth="1" />
        {/* 아래쪽 상자 2 (겹침) */}
        <rect className={styles.excessBox2} x="50" y="130" width="32" height="18" rx="2" fill="#b45309" stroke="#7c2d12" strokeWidth="1" />
        
        {/* 굴러다니는 채소들 (토마토, 감자) */}
        <circle cx="20" cy="142" r="5" fill="url(#grad-tomato-excess)" />
        <ellipse cx="88" cy="142" rx="7" ry="5" fill="#d97706" />
        <circle cx="94" cy="143" r="4" fill="#b45309" />
      </g>

      {/* 수확물이 쏟아져 바쁘게 오가는 농장 트랙터 */}
      <g className={styles.tractorGroup} transform="translate(10, 110)">
        <rect x="0" y="10" width="22" height="14" rx="2" fill="#dc2626" />
        <rect x="12" y="2" width="9" height="9" rx="1" fill="#93c5fd" opacity="0.8" />
        <circle cx="5" cy="24" r="6" fill="#111827" />
        <circle cx="17" cy="24" r="4" fill="#111827" />
        {/* 배기 가스 및 진동 도트 */}
        <circle className={styles.floatElement1} cx="-4" cy="12" r="3" fill="#d1d5db" opacity="0.6" />
        <circle className={styles.floatElement2} cx="-10" cy="8" r="2" fill="#e5e7eb" opacity="0.4" />
      </g>
    </svg>
  );
}

function ShortIllustration() {
  return (
    <svg className={styles.svgIllustration} viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="glow-red-premium" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <linearGradient id="grad-tomato-short" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff4d4d" />
          <stop offset="100%" stopColor="#cc0000" />
        </linearGradient>
        <linearGradient id="grad-withered-leaf" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#a8a29e" />
          <stop offset="100%" stopColor="#78716c" />
        </linearGradient>
      </defs>

      {/* 빈 공간이 텅 비어있는 공허 도트/라인 패턴 배경 텍스처 (Empty Dots Pattern) */}
      <g opacity="0.1">
        <circle cx="20" cy="20" r="1.5" fill="#ef4444" />
        <circle cx="60" cy="20" r="1.5" fill="#ef4444" />
        <circle cx="100" cy="20" r="1.5" fill="#ef4444" />
        <circle cx="140" cy="20" r="1.5" fill="#ef4444" />
        <circle cx="180" cy="20" r="1.5" fill="#ef4444" />
        <circle cx="220" cy="20" r="1.5" fill="#ef4444" />

        <circle cx="40" cy="50" r="1.5" fill="#ef4444" />
        <circle cx="80" cy="50" r="1.5" fill="#ef4444" />
        <circle cx="120" cy="50" r="1.5" fill="#ef4444" />
        <circle cx="160" cy="50" r="1.5" fill="#ef4444" />
        <circle cx="200" cy="50" r="1.5" fill="#ef4444" />

        <circle cx="20" cy="80" r="1.5" fill="#ef4444" />
        <circle cx="60" cy="80" r="1.5" fill="#ef4444" />
        <circle cx="100" cy="80" r="1.5" fill="#ef4444" />
        <circle cx="140" cy="80" r="1.5" fill="#ef4444" />
        <circle cx="180" cy="80" r="1.5" fill="#ef4444" />
        <circle cx="220" cy="80" r="1.5" fill="#ef4444" />
      </g>

      <circle cx="120" cy="85" r="45" fill="#fee2e2" opacity="0.6" filter="url(#glow-red-premium)" />

      {/* 공급 부족 씬 (오른쪽 쏠림 - 시장 수요가 더 무거움) */}
      <g className={styles.shortScaleGroup}>
        {/* 저울 받침 */}
        <path d="M120 45 L120 135" stroke="#dc2626" strokeWidth="4" />
        <path d="M100 135 L140 135" stroke="#dc2626" strokeWidth="6" strokeLinecap="round" />
        <circle cx="120" cy="45" r="6" fill="#b91c1c" />

        {/* 저울 빔 (오른쪽으로 심하게 쏠림) */}
        <g className={styles.shortScaleBeam}>
          <path d="M55 65 L185 65" stroke="#f87171" strokeWidth="4" strokeLinecap="round" />

          {/* 왼쪽 바구니 (내 공급 - 텅 비어 있고 마른 줄기만 애처롭게 얹힘) */}
          <g className={styles.shortLeftPlate}>
            <path d="M55 65 L55 75" stroke="#fca5a5" strokeWidth="2" />
            <path d="M35 75 C35 90, 75 90, 75 75 Z" fill="#fee2e2" stroke="#dc2626" strokeWidth="1.5" />
            <path d="M32 75 L78 75" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" />

            {/* 시든 갈색 마른 줄기 */}
            <path className={styles.witheredLeaf} d="M52 70 Q56 62 60 72" stroke="url(#grad-withered-leaf)" strokeWidth="2" fill="none" strokeLinecap="round" />
          </g>

          {/* 오른쪽 바구니 (시장 수요 - 풍성한 채소들이 가득 담겨 무거움) */}
          <g className={styles.shortRightPlate}>
            <path d="M185 65 L185 115" stroke="#fca5a5" strokeWidth="2" />
            <path d="M165 115 C165 130, 205 130, 205 115 Z" fill="#ef4444" />
            <path d="M162 115 L208 115" stroke="#b91c1c" strokeWidth="3" strokeLinecap="round" />

            {/* 탐스럽고 무거운 붉은 토마토들 */}
            <circle cx="178" cy="108" r="8" fill="url(#grad-tomato-short)" />
            <circle cx="192" cy="107" r="7" fill="url(#grad-tomato-short)" />
            <circle cx="185" cy="99" r="8" fill="url(#grad-tomato-short)" />
            <circle cx="172" cy="102" r="6" fill="#f87171" />
            <circle cx="197" cy="101" r="5" fill="#f87171" />
          </g>
        </g>
      </g>

      {/* 저울 하단: 텅 비어 쓰러진 나무 수확 상자가 뒹굴고 있음 */}
      <g className={styles.emptyContainer} transform="translate(25, 122)">
        {/* 쓰러진 나무 바구니 */}
        <path d="M0 18 L12 0 L32 0 L40 18 Z" fill="none" stroke="#dc2626" strokeWidth="1.5" strokeDasharray="3 2" transform="rotate(-15)" />
        <line x1="8" y1="2" x2="3" y2="15" stroke="#dc2626" strokeWidth="1" strokeDasharray="3 2" />
        <line x1="28" y1="2" x2="32" y2="15" stroke="#dc2626" strokeWidth="1" strokeDasharray="3 2" />
      </g>

      {/* 긴장감 유발하는 붉은 비상 레이저 경고등 펄스 비콘 */}
      <g className={styles.alertHud} transform="translate(195, 45)">
        <circle className={styles.blinkRing} cx="10" cy="10" r="14" stroke="#ef4444" strokeWidth="2" opacity="0.8" />
        <circle cx="10" cy="10" r="5" fill="#dc2626" />
        <path d="M10 2 L10 6" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M10 14 L10 18" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M2 10 L6 10" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M14 10 L18 10" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function WarningIllustration() {
  return (
    <svg className={styles.svgIllustration} viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="glow-purple-premium" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <linearGradient id="grad-hud-scan" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>
      </defs>

      {/* 복잡한 테크 데이터 예측 웨이브 배경 텍스처 (Tech Wave Lines) */}
      <g opacity="0.15">
        <path d="M10 20 Q40 50 80 20 T150 40 T220 20" stroke="#818cf8" strokeWidth="1" fill="none" />
        <path d="M10 50 Q40 80 80 50 T150 70 T220 50" stroke="#818cf8" strokeWidth="1" fill="none" />
        <path d="M10 80 Q40 110 80 80 T150 100 T220 80" stroke="#818cf8" strokeWidth="1" fill="none" />
        <path d="M10 110 Q40 140 80 110 T150 130 T220 110" stroke="#818cf8" strokeWidth="1" fill="none" />
      </g>

      <circle cx="120" cy="85" r="45" fill="#e0e7ff" opacity="0.6" filter="url(#glow-purple-premium)" />

      {/* 요동치는 네온 웨이브 라인 */}
      <path className={styles.dataWave} d="M20 135 C50 80, 80 155, 120 115 C160 75, 190 145, 220 135" stroke="url(#grad-hud-scan)" strokeWidth="2.5" strokeDasharray="5 3" fill="none" />

      {/* 미친 듯 흔들리는 경고 저울 (Wobble) */}
      <g className={styles.warningScaleGroup}>
        {/* 저울 기둥 */}
        <path d="M120 45 L120 135" stroke="#4f46e5" strokeWidth="4" />
        <path d="M100 135 L140 135" stroke="#4f46e5" strokeWidth="6" strokeLinecap="round" />
        <circle cx="120" cy="45" r="6" fill="#4338ca" />

        {/* 심한 Wobble 빔 */}
        <g className={styles.warningScaleBeam}>
          <path d="M55 65 L185 65" stroke="#6366f1" strokeWidth="4" strokeLinecap="round" />

          {/* 왼쪽 바구니 */}
          <g className={styles.warningLeftPlate}>
            <path d="M55 65 L55 95" stroke="#c7d2fe" strokeWidth="2" />
            <path d="M35 95 C35 110, 75 110, 75 95 Z" fill="none" stroke="#4f46e5" strokeWidth="1.5" />
            <path d="M32 95 L78 95" stroke="#4f46e5" strokeWidth="3" strokeLinecap="round" />
            {/* 홀로그램 입자 야채 */}
            <circle cx="55" cy="87" r="6" fill="#818cf8" opacity="0.7" stroke="#6366f1" strokeDasharray="2 1" />
          </g>

          {/* 오른쪽 바구니 */}
          <g className={styles.warningRightPlate}>
            <path d="M185 65 L185 95" stroke="#c7d2fe" strokeWidth="2" />
            <path d="M165 95 C165 110, 205 110, 205 95 Z" fill="none" stroke="#4f46e5" strokeWidth="1.5" />
            <path d="M162 95 L208 95" stroke="#4f46e5" strokeWidth="3" strokeLinecap="round" />
            {/* 홀로그램 입자 야채 */}
            <circle cx="185" cy="87" r="6" fill="#c084fc" opacity="0.7" stroke="#6366f1" strokeDasharray="2 1" />
          </g>
        </g>
      </g>

      {/* AI HUD 오버레이 */}
      <g className={styles.radarGroup}>
        <circle className={styles.radarCircle1} cx="120" cy="85" r="70" stroke="#818cf8" strokeWidth="1" strokeDasharray="3 6" opacity="0.4" />
        <circle className={styles.radarCircle2} cx="120" cy="85" r="50" stroke="#c084fc" strokeWidth="1" strokeDasharray="2 4" opacity="0.5" />
        <line className={styles.radarLine} x1="120" y1="85" x2="190" y2="85" stroke="#6366f1" strokeWidth="1.5" opacity="0.7" />
      </g>
    </svg>
  );
}

function formatWeightWithUnit(kg: number | undefined | null): string {
  if (kg === undefined || kg === null) return '0 kg';
  if (kg >= 1000) {
    const tons = kg / 1000;
    const tonStr = Number.isInteger(tons) 
      ? tons.toLocaleString() 
      : tons.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    return `${tonStr} 톤`;
  }
  return `${kg.toLocaleString()} kg`;
}

interface PageProps {

  params: Promise<{ cropName: string }>;
}

export default function BalanceDetailPage({ params }: PageProps) {
  const { cropName } = use(params);
  const router = useRouter();
  const [data, setData] = useState<BalanceAnalysisResponse | null>(null);
  const [trendData, setTrendData] = useState<SupplyTrendResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<BalanceDashboardData | null>(null);
  const [farmName, setFarmName] = useState<string | null>(null);

  const handleAiDeepAnalysis = async () => {
    setIsAiLoading(true);
    setAiError(null);
    try {
      const decodedName = decodeURIComponent(cropName);
      
      // 유저의 읍면동 정보를 가져오기 위해 대시보드 API 호출 (에러는 무시하고 양평군 전체로 분석)
      let townName: string | undefined = undefined;
      let townRatio: number | undefined = undefined;
      let townStatus: string | undefined = undefined;
      
      try {
        if (dashboardData && dashboardData.selectedTownName) {
          townName = dashboardData.selectedTownName;
          const townCropInfo = dashboardData.townSummary.crops.find(c => c.cropName === decodedName);
          if (townCropInfo) {
            townRatio = townCropInfo.supplyRatio;
            townStatus = townCropInfo.statusLabel;
          }
        }
      } catch (dashErr) {
        console.warn('읍면동 정보를 분석에 추가하는 데 실패했습니다.', dashErr);
      }
      
      const req: BalanceAgentAnalysisParams = {
        cropName: decodedName,
        townName,
        townRatio,
        townStatus
      };
      
      const res = await fetchBalanceAgentAnalysis(req);
      setAiReport(res.reply);
    } catch (err: any) {
      setAiError(err.message || 'AI 심층 분석 리포트를 생성하는 데 실패했습니다.');
    } finally {
      setIsAiLoading(false);
    }
  };
  useEffect(() => {
    const loadData = async () => {
      try {
        const decodedName = decodeURIComponent(cropName);
        const [result, trend, dash, farmRes] = await Promise.all([
          fetchBalanceAnalysis(decodedName),
          fetchSupplyTrend(decodedName),
          fetchBalanceDashboard().catch(() => null),
          apiFetch<any[]>('/api/farm').catch(() => null)
        ]);
        setData(result);
        setTrendData(trend);
        setDashboardData(dash);
        
        if (farmRes && farmRes.success && Array.isArray(farmRes.data) && farmRes.data.length > 0) {
          setFarmName(farmRes.data[0].name);
        }
      } catch (err: any) {
        setError(err.message || '데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [cropName]);


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SHORT_WARN': return '#3b82f6';
      case 'SHORT_CAUTION': return '#10b981';
      case 'BALANCED': return '#10b981';
      case 'EXCESS_CAUTION': return '#f59e0b';
      case 'EXCESS_WARN': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getNeedleRotation = (ratio: number) => {
    // 100%가 수직 위(0deg, 12시 방향)를 향하도록 보정합니다.
    // 0% -> -90deg (왼쪽), 100% -> 0deg (위쪽), 200% -> 90deg (오른쪽)
    let degrees = (ratio - 100) * 0.9;
    if (degrees > 90) degrees = 90;
    if (degrees < -90) degrees = -90;
    return degrees;
  };

  const renderMarkdown = (markdown: string) => {
    if (!markdown) return null;

    const lines = markdown.split('\n');
    let insideList = false;
    const listItems: string[] = [];
    const elements: React.ReactNode[] = [];

    const parseInlineBold = (text: string) => {
      const parts = text.split(/\*\*([^*]+)\*\*/g);
      return parts.map((part, i) => {
        if (i % 2 === 1) {
          return <strong key={i}>{part}</strong>;
        }
        return part;
      });
    };

    const flushList = (key: number) => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`ul-${key}`} style={{ marginBottom: '16px', paddingLeft: '20px' }}>
            {listItems.map((item, index) => (
              <li key={index} className={styles.reportLi}>
                {parseInlineBold(item)}
              </li>
            ))}
          </ul>
        );
        listItems.length = 0;
      }
      insideList = false;
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        insideList = true;
        listItems.push(trimmed.substring(2));
        return;
      }

      if (insideList && trimmed === '') {
        return;
      }
      if (insideList && !trimmed.startsWith('- ') && !trimmed.startsWith('* ')) {
        flushList(index);
      }

      if (trimmed.startsWith('#### ')) {
        elements.push(<h4 key={index} className={styles.reportH4}>{parseInlineBold(trimmed.substring(5))}</h4>);
      } else if (trimmed.startsWith('### ')) {
        elements.push(<h3 key={index} className={styles.reportH3}>{parseInlineBold(trimmed.substring(4))}</h3>);
      } else if (trimmed.startsWith('## ')) {
        elements.push(<h2 key={index} className={styles.reportH2}>{parseInlineBold(trimmed.substring(3))}</h2>);
      } else if (trimmed.startsWith('# ')) {
        elements.push(<h2 key={index} className={styles.reportH2}>{parseInlineBold(trimmed.substring(2))}</h2>);
      } else if (trimmed.startsWith('> ')) {
        elements.push(
          <div key={index} className={styles.reportAlertBox}>
            {parseInlineBold(trimmed.substring(2))}
          </div>
        );
      } else if (trimmed !== '') {
        elements.push(<p key={index} className={styles.reportP}>{parseInlineBold(trimmed)}</p>);
      }
    });

    if (insideList) {
      flushList(lines.length);
    }

    return elements;
  };

  if (isLoading) return <div className={styles.loading}>분석 데이터를 불러오는 중...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!data) return <div className={styles.error}>데이터를 찾을 수 없습니다.</div>;

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <p className={styles.breadcrumb}>
          홈 / 밸런스 / <strong>{data.cropName} 상세</strong>
        </p>
        <h1 className={styles.pageTitle}>{data.cropName} — 밸런스 상세</h1>
      </div>

      {/* KPI ROW */}
      <div className={styles.kpiRow}>
        <Card className={styles.kpiCard}>
          <p className={styles.kpiLabel}>수급 비율</p>
          <p className={styles.kpiValue} style={{ color: getStatusColor(data.status) }}>
            {data.status === 'UNKNOWN' ? '집계중' : `${data.supplyRatio}%`}
          </p>
        </Card>
        <Card className={styles.kpiCard}>
          <p className={styles.kpiLabel}>수급 상태</p>
          <div className={styles.kpiValue}>
            <Badge variant={data.status === 'UNKNOWN' ? 'orange' : data.status.toLowerCase().includes('excess') ? 'orange' : data.status.toLowerCase().includes('short') ? 'blue' : 'green'}>
              {data.statusLabel}
            </Badge>
          </div>
        </Card>
        <Card className={styles.kpiCard}>
          <p className={styles.kpiLabel}>기준 연도</p>
          <p className={styles.kpiValue}>{data.baseYear}년</p>
        </Card>
        <Card className={styles.kpiCard}>
          <p className={styles.kpiLabel}>현재 공급량</p>
          <p className={styles.kpiValue} style={{ color: 'var(--color-primary)' }}>
            {formatWeightWithUnit(data.currentSupplyKg)}
          </p>
        </Card>
        <Card className={styles.kpiCard}>
          <p className={styles.kpiLabel}>시장 수요량 (기준치)</p>
          <p className={styles.kpiValue} style={{ color: 'var(--color-text-secondary)' }}>
            {data.status === 'UNKNOWN' ? '집계중' : formatWeightWithUnit(data.standardYieldKg)}
          </p>
        </Card>
      </div>

      <div className={styles.grid2}>
        {/* GAUGE CHART CARD */}
        <Card className={styles.chartCard}>
          <h2 className={styles.cardTitle}>수급 밸런스 미터</h2>
          <div className={styles.gaugeContainer}>
            <div className={styles.gaugeArcWrapper}>
              <div className={styles.gaugeBackground}></div>
              <div className={styles.gaugeInner}></div>
            </div>
            <div
              className={styles.gaugeNeedle}
              style={{ transform: `rotate(${getNeedleRotation(data.status === 'UNKNOWN' ? 100 : data.supplyRatio)}deg)` }}
            ></div>
            <div className={styles.gaugeNeedleCenter}></div>
          </div>
          <p className={styles.gaugeStatus}>{data.statusLabel}</p>
        </Card>

        {/* AI INSIGHT CARD */}
        <Card className={styles.chartCard}>
          <h2 className={styles.cardTitle}>AI 분석 리포트</h2>
          {(() => {
            const isShort = data.status.includes('SHORT');
            const isExcess = data.status.includes('EXCESS');
            const isBalanced = data.status === 'BALANCED';

            let themeClass = styles.themeBalanced;
            let icon = '⚖️';
            let actionMessage = '수급이 안정적입니다. 시장 상황에 맞춰 재배를 유지하시거나 새로운 고수익 작물을 탐색해 보세요.';
            let buttonText = 'AI 맞춤 작물 추천받기';
            let actionRoute = '/farm/recommend';
            let buttonVariant: 'primary' | 'outline' | 'ghost' | 'dark' = 'outline';

            if (isShort) {
              themeClass = styles.themeShort;
              icon = '📈';
              actionMessage = `현재 양평군 내 공급이 매우 부족하여 높은 수익이 기대됩니다. ${data.cropName} 재배를 적극 권장합니다!`;
              buttonText = '내 농장에 이 작물 파종하기';
              actionRoute = `/farm/cultivation-register?cropName=${encodeURIComponent(data.cropName)}`;
              buttonVariant = 'primary';
            } else if (isExcess) {
              themeClass = styles.themeExcess;
              icon = '📉';
              actionMessage = `현재 지역 내 공급 과잉 상태입니다. 가격 하락 위험이 있으니 다른 대체 작물 재배를 고려해 보세요.`;
              buttonText = 'AI 대체 작물 추천받기';
              actionRoute = '/farm/recommend';
              buttonVariant = 'dark';
            }

            return (
              <div className={`${styles.insightBox} ${themeClass}`}>
                <div className={styles.insightHeader}>
                  <span className={styles.insightIcon}>{icon}</span>
                  <p className={styles.insightText}>{data.message}</p>
                </div>
                <div className={styles.insightActionArea}>
                  <p className={styles.actionMessage}>{actionMessage}</p>
                  <div className={styles.buttonGroup}>
                    <Button variant={buttonVariant} onClick={() => router.push(actionRoute)}>
                      {buttonText}
                    </Button>
                    <Button variant="outline" onClick={handleAiDeepAnalysis} disabled={isAiLoading}>
                      {isAiLoading ? '🕵️ AI 분석관 진단 중...' : '⚖️ AI 분석관 실시간 심층 진단'}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })()}
        </Card>
      </div>

      {/* AI REPORT COMPONENT */}
      {(isAiLoading || aiReport || aiError) && (
        <Card className={styles.aiReportCard}>
          <div className={styles.aiReportHeader}>
            <span className={styles.reportBadge}>AI ANALYSIS INSIGHT</span>
            <span className={styles.reportDate}>
              {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })} 실시간 분석
            </span>
          </div>
          {isAiLoading && (
            <div className={styles.aiReportLoading}>
              <div className={styles.spinner}></div>
              <p className={styles.loadingMessage}>
                양평군 수급 분석 에이전트가 가동되었습니다.<br />
                실시간 읍면동 생산 데이터, KOSIS 과거 연도 통계, 시장 수요 예측치를 종합하고 있습니다.<br />
                AI 분석관의 심층 처방전 작성을 위해 약 5~10초의 시간이 소요됩니다...
              </p>
            </div>
          )}
          {aiError && (
            <div className={styles.aiReportError}>
              ⚠️ {aiError}
            </div>
          )}
          {!isAiLoading && aiReport && (
            <div className={styles.aiReportBody}>
              <h2 className={styles.aiReportTitle}>⚖️ {data.cropName} 경제 수급 정밀 진단 리포트</h2>
              <div className={styles.reportContent}>
                {renderMarkdown(aiReport)}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* REAL TREND CHART */}
      <div className={styles.grid2}>
        <Card className={styles.card}>
          <h2 className={styles.cardTitle}>연도별 수급 추이</h2>
          <div className={styles.trendChartContainer}>
            {trendData.map((item, index) => {
              const maxVal = Math.max(...trendData.map(t => Math.max(t.supply, t.demand)));
              const supplyHeight = (item.supply / maxVal) * 100;
              const demandHeight = (item.demand / maxVal) * 100;

              const formatValue = (val: number) => {
                if (val === 0) return '';
                return val >= 10000 ? `${(val / 10000).toFixed(1).replace('.0', '')}만` : val.toLocaleString();
              };

              return (
                <div key={item.year} className={styles.trendCol}>
                  <div className={styles.barGroup}>
                    <div
                      className={styles.barSupply}
                      style={{ height: `${supplyHeight}%` }}
                      title={`공급: ${formatWeightWithUnit(item.supply)}`}
                    >
                      {supplyHeight > 5 && <span className={styles.barValue}>{formatValue(item.supply)}</span>}
                    </div>
                    <div
                      className={styles.barDemand}
                      style={{ height: `${demandHeight}%` }}
                      title={`수요: ${formatWeightWithUnit(item.demand)}`}
                    >
                      {demandHeight > 5 && <span className={styles.barValueDemand}>{formatValue(item.demand)}</span>}
                    </div>
                  </div>
                  <p className={styles.yearLabel}>{item.year}</p>
                </div>
              );
            })}
          </div>
          <div className={styles.legend}>
            <span className={styles.legendItem}><span className={styles.dotSupply}></span> 공급(통계/실시간)</span>
            <span className={styles.legendItem}><span className={styles.dotDemand}></span> 수요(기준치)</span>
          </div>
        </Card>
        {(() => {
          if (dashboardData && dashboardData.selectedTownName && dashboardData.selectedTownName !== '선택된 지역') {
            const townName = dashboardData.selectedTownName;
            const townCropInfo = dashboardData.townSummary.crops.find(c => c.cropName === data?.cropName);

            // 상태 매핑
            let stateClass = styles.briefingCardBalanced;
            let Illustration = BalancedIllustration;
            let currentStatusLabel = '수급 적정';
            let currentRatio = 100;
            let detailMessage = '';
            
            if (townCropInfo) {
              currentRatio = Math.round(townCropInfo.supplyRatio);
              const statusStr = townCropInfo.status;
              
              if (statusStr === 'UNKNOWN') {
                stateClass = styles.briefingCardWarning;
                Illustration = WarningIllustration;
                currentStatusLabel = '농가 자체 집계';
                detailMessage = `현재 통계청 공식 5대 작물 외에 관내 농가들이 참여하여 실시간 재배량을 집계 중인 작물입니다. AI 분석관의 실시간 유통 시황 심층 리포트를 통해 시장 트렌드를 함께 점검해 보세요.`;
              } else if (statusStr.includes('EXCESS_WARN')) {
                stateClass = styles.briefingCardWarning;
                Illustration = WarningIllustration;
                currentStatusLabel = '공급 경고 (AI)';
                detailMessage = `AI가 향후 심각한 공급 과잉 변동성 리스크를 감지했습니다. 선제적 작물 전환 조치를 고려해 주세요.`;
              } else if (statusStr.includes('SHORT_WARN')) {
                stateClass = styles.briefingCardWarning;
                Illustration = WarningIllustration;
                currentStatusLabel = '공급 부족 경고 (AI)';
                detailMessage = `AI가 급격한 공급 부족 및 시장 가격 변동 가능성을 경고하고 있습니다. 파종 계획을 점검해 보세요.`;
              } else if (statusStr.includes('EXCESS_CAUTION')) {
                stateClass = styles.briefingCardExcess;
                Illustration = ExcessIllustration;
                currentStatusLabel = '공급 과잉 주의';
                detailMessage = `현재 지역 내 생산량이 수요량 대비 과도하게 높은 상황입니다. 재고 압박 및 유통 가격 하락 위험이 예상됩니다.`;
              } else if (statusStr.includes('SHORT_CAUTION')) {
                stateClass = styles.briefingCardShort;
                Illustration = ShortIllustration;
                currentStatusLabel = '공급 부족';
                detailMessage = `현재 시장 수요 대비 재고 및 공급량이 현저히 부족하여 긴장감이 감돌고 있습니다. 빠른 수급 대응 조치가 요구됩니다.`;
              } else {
                stateClass = styles.briefingCardBalanced;
                Illustration = BalancedIllustration;
                currentStatusLabel = '수급 적정';
                detailMessage = `현재 가장 안정적이고 건강한 시장 밸런스를 유지하고 있습니다. 적정 재배 수준을 꾸준히 이어나가세요.`;
              }
            }

            return (
              <div className={`${styles.briefingCard} ${stateClass}`}>
                {/* 1. 상태 장면(Scene) - 최상단 배치로 1초 인지 확보 */}
                <div className={styles.briefingIllustrationArea}>
                  <Illustration />
                </div>

                {/* 2. 강한 상태 메시지 및 상태 배지, 거대한 실시간 수치 */}
                <div className={styles.briefingHeaderArea}>
                  <div className={styles.briefingTitleRow}>
                    <h2 className={styles.briefingTitle}>
                      🏡 {farmName || '내 농장'} 밸런스 브리핑
                    </h2>
                    <span className={`${styles.glowBadge} ${
                      townCropInfo?.status === 'UNKNOWN'
                        ? styles.glowBadgeWarning
                        : townCropInfo?.status.includes('EXCESS') 
                          ? styles.glowBadgeExcess 
                          : townCropInfo?.status.includes('SHORT') 
                            ? styles.glowBadgeShort 
                            : townCropInfo?.status.includes('WARN') 
                              ? styles.glowBadgeWarning 
                              : styles.glowBadgeBalanced
                    }`}>
                      {currentStatusLabel}
                    </span>
                  </div>

                  <div className={styles.briefingMainState}>
                    <div className={styles.briefingMainText}>
                      {townCropInfo?.status === 'UNKNOWN' ? (
                        <>우리 동네 재배량이 <strong className={styles.accentText}>실시간 집계 중</strong>인 작물입니다.</>
                      ) : townCropInfo?.status.includes('EXCESS') ? (
                        <>공급량이 시장 수요보다 <strong className={styles.warningText}>대폭 과잉</strong>되었습니다!</>
                      ) : townCropInfo?.status.includes('SHORT') ? (
                        <>시장에 공급이 <strong className={styles.dangerText}>현저히 부족</strong>하여 위험합니다!</>
                      ) : townCropInfo?.status.includes('WARN') ? (
                        <>수급 변동성이 극도로 높은 <strong className={styles.accentText}>경고 상황</strong>입니다!</>
                      ) : (
                        <>수급 균형이 아주 <strong className={styles.successText}>안정적이고 적정</strong>하게 유지 중입니다.</>
                      )}
                    </div>
                    <div className={styles.briefingMainRatio} style={{ 
                      color: townCropInfo?.status === 'UNKNOWN'
                        ? '#4f46e5'
                        : townCropInfo?.status.includes('EXCESS') 
                          ? '#ea580c' 
                          : townCropInfo?.status.includes('SHORT') 
                            ? '#ef4444' 
                            : townCropInfo?.status.includes('WARN') 
                              ? '#4f46e5' 
                              : '#10b981' 
                    }}>
                      {townCropInfo ? (townCropInfo.status === 'UNKNOWN' ? '집계중' : `${currentRatio}%`) : '데이터 없음'}
                    </div>
                  </div>
                </div>

                {/* 3. AI 상세 처방 및 디테일 수치 */}
                <div className={styles.briefingFooter}>
                  <div className={styles.briefingStatusRow}>
                    <span className={styles.briefingStatusLabel}>{townName} {data?.cropName} 실시간 분석 분포</span>
                  </div>
                  
                  {townCropInfo ? (
                    <>
                      <div className={styles.briefingDetailBox}>
                        <Info size={16} style={{ marginRight: '8px', marginTop: '2px', flexShrink: 0, color: 'var(--color-primary)' }} />
                        <p className={styles.briefingDetailText}>
                          {detailMessage}
                        </p>
                      </div>
                      <div className={styles.briefingDetailBox} style={{ marginTop: '4px' }}>
                        <MapPin size={16} style={{ marginRight: '8px', marginTop: '2px', flexShrink: 0, color: 'var(--color-text-tertiary)' }} />
                        <p className={styles.briefingDetailText}>
                          우리 동네에서 현재 <strong>{formatWeightWithUnit(townCropInfo.currentSupplyKg)}</strong>이 재배(예정) 중이며, 이는 AI 분석관의 실시간 심층 의사결정에 적극 반영됩니다.
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className={styles.briefingDetailBox}>
                      <MapPin size={16} style={{ marginRight: '8px', marginTop: '2px', flexShrink: 0, color: '#fb923c' }} />
                      <p className={styles.briefingDetailText}>
                        {farmName || '내 농장'}이 위치한 <strong>{townName}</strong>에는 아직 이 작물을 재배하는 참여 농가가 없습니다. 가장 먼저 파종하여 블루오션을 선점해 보세요!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          }

          // fallback 1: 내 농장이 아직 등록되지 않았거나, 대시보드 데이터를 불러오지 못했을 때
          return (
            <div className={`${styles.briefingCard} ${styles.briefingCardBalanced}`}>
              <div className={styles.briefingIllustrationArea}>
                <BalancedIllustration />
              </div>
              <div className={styles.briefingHeaderArea}>
                <div className={styles.briefingTitleRow}>
                  <h2 className={styles.briefingTitle}>🏡 내 농장 밸런스 브리핑</h2>
                  <span className={`${styles.glowBadge} ${styles.glowBadgeBalanced}`}>연동 대기 중</span>
                </div>
                <div className={styles.briefingMainState}>
                  <div className={styles.briefingMainText}>
                    내 농장을 등록하여 실시간 분석을 가동하세요.
                  </div>
                  <div className={styles.briefingMainRatio} style={{ color: '#10b981' }}>
                    100%
                  </div>
                </div>
              </div>
              <div className={styles.briefingFooter}>
                <div className={styles.briefingStatusRow}>
                  <span className={styles.briefingStatusLabel}>양평군 전체 데이터 기준 분석</span>
                </div>
                <div className={styles.briefingDetailBox}>
                  <Info size={16} style={{ marginRight: '8px', marginTop: '2px', flexShrink: 0, color: 'var(--color-text-tertiary)' }} />
                  <p className={styles.briefingDetailText}>
                    내 농장을 등록하면 우리 동네(읍면동)만의 구체적인 실시간 수급 분포와 AI 밸런싱 모니터링을 이곳에서 바로 연동할 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      <div className={styles.actions}>
        <Button variant="outline" onClick={() => router.back()}>← 목록으로</Button>
      </div>
    </div>
  );
}
