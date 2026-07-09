/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile the shared workspace TypeScript packages
  transpilePackages: ['@packages/ui-components', '@packages/shared-kernel'],
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
