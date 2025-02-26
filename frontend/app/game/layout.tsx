import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DeFi Tower Defense Game",
  description: "A tower defense game with DeFi mechanics",
};

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-800 text-white min-h-screen">
      <header className="bg-slate-950 p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">DeFi Defenders</h1>
          <nav>
            <ul className="flex space-x-4">
              <li>
                <a href="/" className="hover:text-blue-400 transition">
                  Home
                </a>
              </li>
              <li>
                <a
                  href="/leaderboard"
                  className="hover:text-blue-400 transition"
                >
                  Leaderboard
                </a>
              </li>
              <li>
                <a href="/profile" className="hover:text-blue-400 transition">
                  Profile
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {children}

      <footer className="bg-slate-950 p-4 text-center text-sm text-slate-400">
        <div className="container mx-auto">
          <p>© 2025 DeFi Defenders. Powered by Scroll.</p>
        </div>
      </footer>
    </div>
  );
}
