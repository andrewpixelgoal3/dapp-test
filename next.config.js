/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    return config;
  },
  env: {
    WALLET_PRIVATE_KEY: process.env.WALLET_PRIVATE_KEY,
    FACTORY_ADDRESS: process.env.FACTORY_ADDRESS,
    SECRET: process.env.SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  },
};

module.exports = nextConfig;
