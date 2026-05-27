import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { BASE_PATH } from "./src/app/utils/basePath";
const withNextIntl = createNextIntlPlugin();

// This file is used to configure Static Next.js for the Tauri app.
const isProd = process.env.NODE_ENV === "production";
const internalHost = process.env.TAURI_DEV_HOST || "localhost";

const nextConfig: NextConfig = {
  basePath: BASE_PATH,
  // Production: 静态导出给 Tauri / Docker。Dev: 不开 export，否则 next-intl 的
  // middleware (proxy.ts) 报 "Middleware cannot be used with output: export"，
  // 进而 React hydrate 失败、整页失去事件 (即"无法点击")。
  // https://nextjs.org/docs/pages/building-your-application/deploying/static-exports
  ...(isProd ? { output: "export" as const } : {}),
  // Required for next/image in SSG mode.
  images: {
    unoptimized: true,
  },
  // Configure assetPrefix or else the server won't properly resolve your assets.
  assetPrefix: isProd ? `${BASE_PATH}/` : `http://${internalHost}:3000${BASE_PATH}/`,
  reactCompiler: true,
};

export default withNextIntl(nextConfig);
