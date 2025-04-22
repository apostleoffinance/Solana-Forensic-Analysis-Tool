/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export', // Enables static export
    basePath: isProd ? '/Solana-Forensic-Analysis-Tool' : '', // Replace <repo-name> with your GitHub repository name
    assetPrefix: isProd ? '/Solana-Forensic-Analysis-Tool' : '', // Ensures assets are loaded correctly
    images: {
      unoptimized: true, // Disables Next.js image optimization (not supported in static export)
    },
    trailingSlash: true, // Adds trailing slashes to URLs (helps with GitHub Pages routing)
  };

export default nextConfig;
