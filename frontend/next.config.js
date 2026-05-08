/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: `${process.env.INTERNAL_BACKEND_URL || 'http://localhost:8080'}/uploads/:path*`,
      },
    ];
  },
}

module.exports = nextConfig