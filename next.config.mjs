/** @type {import('next').NextConfig} */
const isLocalDev = process.env.NODE_ENV === "development"

const nextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: isLocalDev ? "" : "/lexcontrol",
  assetPrefix: isLocalDev ? "" : "/lexcontrol/",
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
