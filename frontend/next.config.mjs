/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow webpack to handle pdfjs and tesseract worker files
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
