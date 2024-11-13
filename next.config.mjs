/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        domains: ['localhost'],
    },
    experimental: {
        serverActions: {
            bodySizeLimit: '2000mb', // 2 ГБ
        },
    },
};

export default nextConfig;
