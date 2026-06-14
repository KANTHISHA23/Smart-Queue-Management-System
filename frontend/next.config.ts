import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["10.128.228.199"],
  // Avoid picking a parent folder lockfile (e.g. C:\Users\<user>\package-lock.json) as the monorepo root
  turbopack: {
    root: path.join(__dirname),
  },
  async rewrites() {
    // Proxy browser -> backend through Next.js to avoid any CORS/network issues.
    // NEXT_PUBLIC_API_URL is expected to be something like:
    // - local:   http://localhost:5000/api
    // - prod:    https://<render-app>.onrender.com/api
    const envApi = process.env.NEXT_PUBLIC_API_URL;
    if (!envApi) {
      console.warn(
        "NEXT_PUBLIC_API_URL is not set, so /backend rewrites are disabled for this build."
      );
      return [];
    }
    const backendOrigin = envApi.replace(/\/api\/?$/i, "");

    return [
      {
        source: "/backend/:path*",
        destination: `${backendOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
