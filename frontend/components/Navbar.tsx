import { chakra } from "@/lib/fonts";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Image from "next/image";
import { AspectRatio } from "./ui/aspect-ratio";
import CyberpunkConnectButton from "./cyberpunk/CyberpunkConnectButton";
import CyberWalletButton from "./cyberpunk/CyberWalletButton";

const Navbar = () => {
  return (
    <div className="bg-slate-900/80 shadow-xl shadow-violet-600/20">
      <div className="relative container mb-16 pt-4">
        <div className="py-3 px-4 backdrop-blur-sm  rounded-lg shadow-lg">
          <div className="container flex justify-between">
            <div className="flex items-center gap-4 pl-20">
              <h1
                className={`text-3xl font-bold bg-gradient-to-r from-indigo-500 from-10% via-cyan-400 via-30% to-emerald-400 to-90% text-transparent bg-clip-text ${chakra.className} `}
                style={{
                  boxShadow: "1px #ec003f",
                }}
              >
                Node Defenders
              </h1>
            </div>

            <CyberWalletButton
              variant="magenta"
              scanlineEffect={true}
              glitchOnHover={true}
              pulseEffect={true}
              cornerAccents={false}
              showBalanceInButton={true}
            />
          </div>
        </div>

        <div className="absolute left-16 -bottom-10 z-10">
          <div className="p-2 rounded-xl">
            <Image
              src="/icon.png"
              alt="Icon"
              width={60}
              height={40}
              className="object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
