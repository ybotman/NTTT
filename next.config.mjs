/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === "production";

const nextConfig = {
  reactStrictMode: false,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  basePath: isProd ? "/NTTT" : "",
};

export default nextConfig;

/**  
 reactStrictMode: false,
  output: "export",
 */