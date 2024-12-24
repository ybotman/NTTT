/** @type {import('next').NextConfig} */

const nextConfig = {
  basePath: "/NTTT", // <-- Add this
  output: "export", // IMPORTANT for a static export build
  trailingSlash: true, // often helpful for GH Pages
};

export default nextConfig;
