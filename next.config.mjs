/** @type {import('next').NextConfig} */
const isGithubActions = process.env.GITHUB_ACTIONS === "true"

const nextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: isGithubActions ? "/lexcontrol" : "",
  assetPrefix: isGithubActions ? "/lexcontrol/" : "",
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
