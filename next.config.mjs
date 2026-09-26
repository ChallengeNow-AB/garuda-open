/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Logos/covers come from Cloudinary; allow remote images without the optimizer.
    unoptimized: true,
  },
}

export default nextConfig
