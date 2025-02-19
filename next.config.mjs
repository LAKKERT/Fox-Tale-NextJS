/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    images: {
        domains: ['localhost'],
    },
    experimental: {
        serverActions: {
            bodySizeLimit: '2000mb',
        },
    },
};

export default nextConfig;
