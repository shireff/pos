const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep Node.js-only packages out of the browser bundle
  serverExternalPackages: [
    'mongodb',
    'mongodb-client-encryption',
    'kerberos',
    '@mongodb-js/zstd',
    '@aws-sdk/credential-providers',
    'gcp-metadata',
    'snappy',
    'socks',
    'aws4',
    'fs',
    'path',
    'crypto',
    'os',
  ],

  // CORS headers — allow the Desktop (Vite :5173) and Android dev server
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin',  value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,PATCH,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type,Authorization,X-Device-Id,X-License-Key,X-Request-Id,X-User-Permissions' },
          { key: 'Access-Control-Max-Age',       value: '86400' },
        ],
      },
    ];
  },

  // Keep the native MongoDB driver packages out of every webpack build.
  webpack(config, { isServer, webpack: wp }) {
    const mongoPackages = [
      'mongodb',
      'mongodb-client-encryption',
      'kerberos',
      '@mongodb-js/zstd',
      '@aws-sdk/credential-providers',
      'gcp-metadata',
      'snappy',
      'socks',
      'aws4',
    ];

    // Suppress the "Critical dependency: require function is used in a way in
    // which dependencies cannot be statically extracted" warning that comes from
    // encryption.ts using __non_webpack_require__ to load Node built-ins at
    // runtime without bundling them. This is intentional — the warning is a
    // false positive; the code only runs server-side where require() works fine.
    config.ignoreWarnings = [
      ...(config.ignoreWarnings ?? []),
      {
        module: /packages\/infrastructure\/mongodb\/src\/encryption\.ts/,
        message: /Critical dependency: require function is used in a way/,
      },
    ];

    if (isServer) {
      // Force these packages to stay external (a real `require()` at runtime in
      // Node) so their `.node` native binaries are never bundled into the
      // server / instrumentation build. `serverExternalPackages` covers the
      // common case, but pushing them here guarantees it even for layers
      // (e.g. instrumentation) where that option isn't always honoured.
      config.externals = Array.isArray(config.externals)
        ? config.externals
        : [config.externals].filter(Boolean);
      config.externals.push(...mongoPackages);
    } else {
      // Browser/client build: cloud-db is `server-only` and never executes in
      // the browser, but Next still compiles it for the client reference graph
      // and would try to bundle the native binaries. Replace the packages with
      // an empty stub so the client bundle compiles cleanly.
      const mongoStub = path.resolve(__dirname, 'mongo-client-stub.cjs');
      config.plugins.push(
        new wp.NormalModuleReplacementPlugin(
          new RegExp(
            `^(${mongoPackages
              .map((p) => p.replace(/[/\-@.]/g, '\\$&'))
              .join('|')})(\\/.+)?$`,
          ),
          mongoStub,
        ),
      );
    }
    return config;
  },
};

module.exports = nextConfig;
