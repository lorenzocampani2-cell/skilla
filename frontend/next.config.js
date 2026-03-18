/** @type {import('next').NextConfig} */
const nextConfig = {
  // PWA e ottimizzazioni
  reactStrictMode: true,

  // Permette immagini da domini esterni (avatar Supabase, Google, ecc.)
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "api.dicebear.com" }, // avatar generati
    ],
  },

  // Headers per sicurezza e PWA
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Permetti geolocalizzazione e microfono
          {
            key: "Permissions-Policy",
            value: "geolocation=(*), microphone=(*), camera=()",
          },
        ],
      },
    ];
  },

  // Redirect homepage → /app se già loggati (gestito lato client)
  async redirects() {
    return [];
  },

  // Variabili d'ambiente esposte al frontend
  env: {
    NEXT_PUBLIC_APP_NAME: "SKILLA",
    NEXT_PUBLIC_APP_VERSION: "1.0.0",
    NEXT_PUBLIC_BACKEND_URL:
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001",
  },

  webpack(config) {
    // Supporto per file SVG come componenti React
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
};

module.exports = nextConfig;
