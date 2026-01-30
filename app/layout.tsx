import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import FloatingCommunityButton from "./components/FloatingCommunityButton";
import AnalyticsProvider from "./components/AnalyticsProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MakerHUB by Dofer | Herramientas para Makers",
  description: "Herramientas gratuitas y prácticas para makers: calculadoras de costos, solución de problemas, y más. Únete a nuestra comunidad.",
  keywords: ["makers", "impresión 3D", "herramientas", "calculadoras", "DIY", "comunidad maker"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gray-50`}
      >
        <AnalyticsProvider>
          {children}
          <FloatingCommunityButton />
        </AnalyticsProvider>
      </body>
    </html>
  );
}
