/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Allow remote images if you later point Media `src` at a hosted URL.
    // Add your own domains here (e.g. your Supabase storage or a CDN).
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
