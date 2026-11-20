import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { AntiDevtools } from "@/components/AntiDevtools";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FizikaLab — Akademik Fizika Virtual Laboratoriyasi",
  description:
    "Mexanika, Elektromagnetizm, Optika va Metrologiya bo‘yicha 100% real hisoblash yadrosiga ega rasmiy ilmiy-o‘quv laboratoriya platformasi.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="uz"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-white text-slate-900">
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
        <Script
          id="telegram-webapp-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
                  window.Telegram.WebApp.ready();
                  window.Telegram.WebApp.expand();
                  if (window.Telegram.WebApp.setBackgroundColor) {
                    window.Telegram.WebApp.setBackgroundColor('#ffffff');
                  }
                  if (window.Telegram.WebApp.setHeaderColor) {
                    window.Telegram.WebApp.setHeaderColor('#ffffff');
                  }
                }
              } catch (e) {}
            `,
          }}
        />
        <AntiDevtools />
        {children}
      </body>
    </html>
  );
}
