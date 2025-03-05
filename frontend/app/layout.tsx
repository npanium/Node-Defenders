import type { Metadata } from "next";
import { poppins } from "../lib/fonts";
import "./styles/globals.css";
import "./styles/customWalletStyles.css";
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
        <div className="min-h-screen bg-gradient-to-b from-indigo-950 to-slate-950 text-white overflow-hidden relative">
          {/* Background glow effects */}
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-purple-600 rounded-full filter blur-[120px] opacity-20"></div>
          <div className="absolute top-1/3 -right-20 w-96 h-96 bg-blue-500 rounded-full filter blur-[120px] opacity-20"></div>
          <div className="absolute -bottom-20 left-1/3 w-96 h-96 bg-cyan-400 rounded-full filter blur-[100px] opacity-10"></div>
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}
