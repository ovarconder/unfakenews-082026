import type { Metadata } from "next";
import { Noto_Serif, Playfair_Display, Prompt, Noto_Sans_Thai } from "next/font/google";
import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/constants";
import "./globals.css";

// ============================================================
// Fonts
// Body: Noto Serif — readable, elegant serif
// Headings: Playfair Display — luxurious, refined serif
// Thai headings: Prompt — modern, clean Thai typeface
// Thai body: Noto Sans Thai — clean, readable Thai sans
// ============================================================

const notoSerif = Noto_Serif({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-noto-serif",
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-playfair",
  display: "swap",
});

const prompt = Prompt({
  subsets: ["thai", "latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-prompt",
  display: "swap",
});

const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai", "latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-noto-sans-thai",
  display: "swap",
});

export const metadata: Metadata = {
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  // NOTE: ไม่ hardcode favicon/icons ที่นี่
  // favicon เป็นค่า dynamic จาก site_settings (DB)
  // ใน app/[lang]/layout.tsx ใช้ <link rel="icon" href={settings.favicon}> จัดการให้แล้ว
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${notoSerif.variable} ${playfairDisplay.variable} ${prompt.variable} ${notoSansThai.variable} antialiased bg-[#0d1b2a] text-white`}>
          {children}
      </body>
    </html>
  );
}
