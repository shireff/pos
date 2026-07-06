/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export required for Capacitor
  output: 'export',
  // Disable image optimization (not available in static export)
  images: {
    unoptimized: true,
  },
  // Trailing slashes for Capacitor file:// compatibility
  trailingSlash: true,
};

module.exports = nextConfig;
