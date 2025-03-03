import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { scrollSepolia } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "Node Defenders",
  projectId: "b04fc2e6d4700e43260648accd1f50ce",
  chains: [scrollSepolia],
  ssr: true,
});
