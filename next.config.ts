import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Exclude test files from build
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
};

export default nextConfig;
