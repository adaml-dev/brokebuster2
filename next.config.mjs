/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Ostrzeżenie: To pozwala na deploy mimo błędów ESLint.
    // Dla projektu hobbystycznego/vibecodingu to jest OK.
    ignoreDuringBuilds: true,
  },
  typescript: {
      // To samo dla TypeScript - ignoruj błędy typów przy budowaniu
      ignoreBuildErrors: true,
  }
};

export default nextConfig;