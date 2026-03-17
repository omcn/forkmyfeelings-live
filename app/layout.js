import "./globals.css";
import { Inter } from "next/font/google";
import SupabaseAuthWatcher from "./components/SupabaseAuthWatcher";
import ErrorBoundary from "./components/ErrorBoundary";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: {
    default: "Fork My Feels – Mood-Based Recipe Suggestions",
    template: "%s | Fork My Feels",
  },
  description:
    "Tell us how you feel and we'll suggest the perfect recipe for your mood. From tired to date-night, Fork My Feels feeds your vibe with Rascal, your emotional sous chef.",
  keywords: [
    "mood recipes",
    "food mood app",
    "what to cook tonight",
    "recipe suggestions",
    "cooking by mood",
    "fork my feels",
    "mood-based food",
    "cooking app",
    "recipe finder",
    "emotional cooking",
    "meal planner",
    "comfort food",
  ],
  authors: [{ name: "Fork My Feels" }],
  creator: "Fork My Feels",
  publisher: "Fork My Feels",
  applicationName: "Fork My Feels",
  metadataBase: new URL("https://forkmyfeelings.com"),
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "https://forkmyfeelings.com",
    siteName: "Fork My Feels",
    title: "Fork My Feels – Mood-Based Recipe Suggestions",
    description:
      "Tell us how you feel and we'll feed your vibe. Discover mood-matched recipes with Rascal, your emotional sous chef.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Fork My Feels – Feed your mood",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fork My Feels – Mood-Based Recipe Suggestions",
    description: "Tell us how you feel. We'll feed your vibe.",
    images: ["/og-image.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Fork My Feels",
    startupImage: ["/splash.png"],
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/icons/icon-192.png",
  },
  formatDetection: {
    telephone: false,
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
  },
  category: "food",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#fb7185" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Fork My Feels" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Fork My Feels",
              description:
                "A mood-based recipe suggestion app that matches food to how you're feeling.",
              url: "https://forkmyfeelings.com",
              applicationCategory: "FoodApplication",
              operatingSystem: "iOS, Android, Web",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "GBP",
              },
              author: {
                "@type": "Organization",
                name: "Fork My Feels",
              },
            }),
          }}
        />
      </head>
      <body className={`${inter.className} bg-rose-50 text-gray-900`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js'); }`,
          }}
        />
        <SupabaseAuthWatcher />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: { borderRadius: "12px", fontFamily: "inherit" },
            success: { style: { background: "#fdf2f8", color: "#9d174d", border: "1px solid #fbcfe8" } },
            error:   { style: { background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca" } },
          }}
        />
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <footer className="mt-16 text-sm text-gray-500 text-center pb-10">
          <p>
            © {new Date().getFullYear()} Fork My Feels •{" "}
            <a href="/privacy-policy" className="underline hover:text-gray-700">
              Privacy Policy
            </a>
          </p>
        </footer>
      </body>
    </html>
  );
}
