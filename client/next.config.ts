/** @type {import('next').NextConfig} */
const nextConfig = {
  // Existing configuration...
  
  // Add experimental configuration
  experimental: {
    // Disable Font Optimization if you're using Turbopack
    fontLoaders: [
      { loader: '@next/font/google', options: { subsets: ['latin'] } }
    ]
  }
}

module.exports = nextConfig;
