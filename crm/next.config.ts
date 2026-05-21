import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* 
     We remove output: 'export' because your app uses 
     Server Actions and Dynamic Routing which require a server.
  */
  images: {
    unoptimized: true, 
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;