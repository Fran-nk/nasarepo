import type { Metadata, Viewport } from "next";
import { Inter, Roboto_Condensed } from "next/font/google";
import { Armazon } from "@/app/frontcode/components/Armazon";
import { APP_NOMBRE } from "@/app/frontcode/lib/textos";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const robotoCondensed = Roboto_Condensed({
  variable: "--font-roboto-condensed",
  subsets: ["latin"],
  weight: ["500", "700"],
});

export const metadata: Metadata = {
  title: APP_NOMBRE,
  description: "Qué sembrar en tu cultivo, con datos de la NASA y en palabras sencillas.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#263b35",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-PE" className={`${inter.variable} ${robotoCondensed.variable} h-full antialiased`}>
      <body className="min-h-full bg-arena text-tinta">
        <Armazon>{children}</Armazon>
      </body>
    </html>
  );
}
