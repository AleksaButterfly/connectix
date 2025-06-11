import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve 'ssh2' on the client-side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        ssh2: false,
        crypto: false,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
      };
    } else {
      // For server-side, externalize ssh2 to prevent bundling native modules
      config.externals = [...(config.externals || []), 'ssh2'];
    }
    
    // Ignore native .node files
    config.module.rules.push({
      test: /\.node$/,
      use: 'node-loader',
    });
    
    return config;
  },
  serverExternalPackages: ['ssh2'],
  turbopack: {
    rules: {
      '*.node': {
        loaders: ['node-loader'],
      },
    },
  },
};

export default nextConfig;
