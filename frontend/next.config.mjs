/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel often fails to resolve `eslint-config-next` during `next build`; lint locally via `npm run lint`
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
  async redirects() {
    return [
      { source: "/favicon.ico", destination: "/favicon.svg", permanent: false },
    ];
  },
};

export default nextConfig;
