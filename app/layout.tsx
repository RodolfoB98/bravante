import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lista de Presença — Treinamentos",
  description: "Controle de presença e geração da lista oficial.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
