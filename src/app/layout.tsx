import type { Metadata, Viewport } from "next";
import { Fredoka, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { HeaderNav } from "@/components/HeaderNav";
import { CoinShopModal } from "@/components/CoinShopModal";
import { PixPaymentModal } from "@/components/PixPaymentModal";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Merda Se Fudeu! 💩 - Party Game",
  description: "Entre na bagunça. Responda merda. Não se foda. Um party game caótico e divertido.",
  keywords: ["party game", "jogo entre amigos", "perguntas e respostas", "humor", "merda se fudeu"],
  authors: [{ name: "Merda Se Fudeu!" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#07020d",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${fredoka.variable} ${plusJakarta.variable} dark`}>
      <body className="font-sans antialiased bg-[#07020d] text-slate-100 min-h-[100dvh] flex flex-col justify-between overflow-x-hidden selection:bg-fuchsia-500 selection:text-white">
        <AuthProvider>
          <HeaderNav />
          {children}
          <CoinShopModal />
          <PixPaymentModal />
        </AuthProvider>
      </body>
    </html>
  );
}
