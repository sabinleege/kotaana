/** @type {import('next').NextConfig} */

// Only hosts we actually load images from. A wildcard here turns the Next.js
// image optimizer into an open proxy that will fetch any URL on request.
const remotePatterns = [
  // Google account avatars (Sign in with Google)
  { protocol: "https", hostname: "lh3.googleusercontent.com" },
  { protocol: "https", hostname: "*.googleusercontent.com" },
];

// Uploads served from an S3-compatible bucket, when one is configured.
if (process.env.S3_PUBLIC_URL) {
  try {
    remotePatterns.push({
      protocol: "https",
      hostname: new URL(process.env.S3_PUBLIC_URL).hostname,
    });
  } catch {
    // Malformed S3_PUBLIC_URL — skip rather than fail the build.
  }
}

const nextConfig = {
  reactStrictMode: true,
  // Each portal gets its own build directory. NEXT_PUBLIC_* values are inlined
  // at compile time, so three dev servers sharing one .next would all inherit
  // whichever portal compiled first.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  eslint: {
    // Migration in progress — don't block builds on lint yet.
    ignoreDuringBuilds: true,
  },
  images: { remotePatterns },
};

export default nextConfig;
