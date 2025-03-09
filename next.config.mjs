/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    images: {
        remotePatterns: [
            {
              protocol: 'http',
              hostname: 'localhost',
              port: '3000',
            },
          ],
    },
    experimental: {
        serverActions: {
            bodySizeLimit: '2000mb',
        },
    },
};

export default nextConfig;
