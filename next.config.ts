import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    serverSourceMaps: true,
  },
  // Webpack configuration for banner injection
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      class BannerInjectorPlugin {
        apply(compiler: any) {
          compiler.hooks.emit.tapAsync('BannerInjectorPlugin', (compilation: any, callback: any) => {
            Object.keys(compilation.assets).forEach((filename) => {
              if (filename.endsWith('.js')) {
                const asset = compilation.assets[filename];
                const originalSource = asset.source();
                const banner = `/* PolarLearn is Open-Source: https://github.com/polarnl/polarlearn */\n/* Wat zit je hier te doen tho? */\n`;

                compilation.assets[filename] = {
                  source: () => banner + originalSource,
                  size: () => banner.length + originalSource.length
                };
              }
            });
            callback();
          });
        }
      }

      config.plugins.push(new BannerInjectorPlugin());
    }

    return config;
  },
};

// Only apply Sentry config in production
const config = process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, {
    // For all available options, see:
    // https://www.npmjs.com/package/@sentry/webpack-plugin#options

    org: "polarnl",
    project: "polarlearn",

    // Only print logs for uploading source maps in CI
    silent: !process.env.CI,

    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
    tunnelRoute: "/error-report",

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,

  })
  : nextConfig;

export default config;