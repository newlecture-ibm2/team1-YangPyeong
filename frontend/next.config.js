/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // 도커 환경에서 이미지 최적화를 위해 필요한 설정
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
