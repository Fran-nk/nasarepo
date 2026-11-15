import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { BarraInferior } from "@/components/BarraInferior";
import { Encabezado } from "@/components/Encabezado";
import { SoloCliente } from "@/components/SoloCliente";
import { APP_NOMBRE } from "@/lib/textos";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: APP_NOMBRE,
  description: "Qué sembrar en tu chacra, con datos de la NASA y en palabras sencillas.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#15803d",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-PE" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full bg-stone-100 text-stone-900">
        <Encabezado />
        <main className="mx-auto max-w-md px-4 pt-4 pb-28">
          <SoloCliente>{children}</SoloCliente>
        </main>
        <BarraInferior />
      </body>
    </html>
  );
}
