/** @type {import('next').NextConfig} */

//import bundleAnalyzer from '@next/bundle-analyzer';

//const withBundleAnalyzer = bundleAnalyzer({
//  enabled: process.env.ANALYZE === 'true'
//});

const isProd = process.env.NODE_ENV === "production";


const nextConfig = {
  reactStrictMode: false,
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  basePath: isProd ? "/NTTT" : "",
};

export default nextConfig;
