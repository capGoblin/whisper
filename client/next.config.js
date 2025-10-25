/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  webpack: (config, { isServer }) => {
    // Handle module resolution issues
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      util: false,
      url: false,
      assert: false,
      http: false,
      https: false,
      zlib: false,
      path: false,
    };

    // Handle ESM modules and missing files
    config.module.rules.push({
      test: /\.m?js$/,
      resolve: {
        fullySpecified: false,
      },
    });

    // Ignore missing modules
    config.ignoreWarnings = [
      /Module not found: Error: Can't resolve/,
      /Critical dependency: the request of a dependency is an expression/,
    ];

    return config;
  },
  experimental: {
    esmExternals: "loose",
  },
  transpilePackages: [
    "@hashgraphonline/hashinal-wc",
    "@hashgraph/sdk",
    "@scopelift/stealth-address-sdk",
  ],
};

module.exports = nextConfig;
