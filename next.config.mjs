/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // يتجاهل أخطاء TypeScript أثناء الـ Build في Vercel
    ignoreBuildErrors: true,
  },
  eslint: {
    // يتجاهل أخطاء التنسيق و ESLint أثناء الـ Build
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
