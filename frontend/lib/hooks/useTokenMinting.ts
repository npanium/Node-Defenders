// lib/hooks/useTokenMinting.ts
import { useState } from "react";
import { useAccount } from "wagmi";
import { toast } from "sonner";

export function useTokenMinting() {
  const [isMinting, setIsMinting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [txHash, setTxHash] = useState<string | undefined>(undefined);
  const { address } = useAccount();

  // Mint tokens via backend (gasless experience for user)
  const mintTokens = async (soulAmount: number, godsAmount: number) => {
    if (!address) {
      toast("Cannot mint tokens", {
        description: "Please connect your wallet first.",
      });
      return;
    }

    try {
      setIsMinting(true);

      const response = await fetch("http://localhost:4000/api/mint-tokens", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address,
          soulAmount,
          godsAmount,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setTxHash(data.transactionHash);
        setIsSuccess(true);
        toast("Tokens minted successfully!", {
          description: `You received ${soulAmount} $SOUL and ${godsAmount} $GODS tokens.`,
        });
      } else {
        throw new Error(data.error || "Failed to mint tokens");
      }
    } catch (error) {
      console.error("Error minting tokens:", error);
      toast("Failed to mint tokens", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsMinting(false);
    }
  };

  // Reset state (e.g., after successful minting)
  const reset = () => {
    setIsSuccess(false);
    setTxHash(undefined);
  };

  return {
    isMinting,
    isSuccess,
    txHash,
    mintTokens,
    reset,
  };
}
