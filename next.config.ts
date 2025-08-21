/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'images.unsplash.com',
      'via.placeholder.com',
      'picsum.photos',
    ],
  },
  experimental: {
    serverActions: {},
  },
};

module.exports = nextConfig;