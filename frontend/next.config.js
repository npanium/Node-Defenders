/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/gamepage",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
