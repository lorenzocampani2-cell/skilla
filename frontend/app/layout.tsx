// ============================================================
// SKILLA — Root Layout
// Punto d'ingresso dell'app Next.js. Definisce struttura HTML,
// tema, font, PWA manifest e provider globali.
// ============================================================

import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";

// --- Metadata SEO e PWA ---
export const metadata: Metadata = {
  title: {
    default: "SKILLA — Sport Communication",
    template: "%s | SKILLA",
  },
  description:
    "La piattaforma di comunicazione per atleti. Chat, voce, geolocalizzazione e tracciamento sessione per il tuo sport preferito.",
  keywords: [
    "sport",
    "chat",
    "sci",
    "snowboard",
    "atleti",
    "comunicazione",
    "geolocalizzazione",
    "walkie-talkie",
  ],
  authors: [{ name: "SKILLA Team" }],
  creator: "SKILLA",
  publisher: "SKILLA",

  // PWA / App-like
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SKILLA",
    startupImage: [
      { url: "/splash/splash-750x1334.png", media: "(device-width: 375px)" },
    ],
  },

  // Open Graph (preview condivisione social)
  openGraph: {
    type: "website",
    siteName: "SKILLA",
    title: "SKILLA — Sport Communication",
    description: "Chat, voce e tracciamento per atleti. Gratis.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },

  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "SKILLA",
    description: "La piattaforma sport-first per atleti.",
    images: ["/og-image.png"],
  },

  // Icone
  icons: {
    icon: [
      { url: "/icons/icon-32.png", sizes: "32x32" },
      { url: "/icons/icon-192.png", sizes: "192x192" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

// Viewport PWA
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // prevenzione zoom accidentale durante lo sport
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#3B82F6" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0F1E" },
  ],
  viewportFit: "cover", // safe area per notch iOS
};

// --- Root Layout ---
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it" suppressHydrationWarning>
      <head>
        {/* Preconnect Google Fonts per velocità */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />

        {/* iOS meta per PWA */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
      </head>

      <body className="min-h-screen overflow-x-hidden">
        {/*
          Providers avvolge tutta l'app con:
          - ThemeProvider (dark/light/high-contrast/emergency)
          - AuthProvider (Supabase session)
          - SocketProvider (Socket.io connessione)
          - ToastProvider (notifiche toast)
        */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
