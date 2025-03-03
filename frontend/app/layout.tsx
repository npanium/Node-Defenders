import type { Metadata } from "next";
import { poppins } from "../lib/fonts";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Node Defenders",
  description: "GameFi and DeFi",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`dark ${poppins.className}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
