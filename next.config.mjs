/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@distube/ytdl-core"],
  },
};

export default nextConfig;
