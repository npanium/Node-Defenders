"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Script from "next/script";
import GameUI from "@/components/GameUI";

export default function GamePage() {
  const params = useParams();
  const gameId = params.id as string;
  const [unityLoaded, setUnityLoaded] = useState(false);
  const [unityInstance, setUnityInstance] = useState(null);
  const unityContainerRef = useRef(null);

  // Unity loader configuration
  const unityConfig = {
    loaderUrl: "/unity/Build.loader.js",
    dataUrl: "/unity/Build.data",
    frameworkUrl: "/unity/Build.framework.js",
    codeUrl: "/unity/Build.wasm",
  };

  useEffect(() => {
    // This will run after UnityLoader script is loaded
    if (
      window.createUnityInstance &&
      unityContainerRef.current &&
      !unityInstance
    ) {
      window
        .createUnityInstance(unityContainerRef.current, unityConfig)
        .then((instance) => {
          setUnityInstance(instance);
          setUnityLoaded(true);
          console.log("Unity instance created successfully");
        })
        .catch((error) => {
          console.error("Failed to create Unity instance:", error);
        });
    }
  }, [unityContainerRef.current, window.createUnityInstance]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Unity loader script */}
      <Script
        src="/unity/Build.loader.js"
        onLoad={() => console.log("Unity loader script loaded")}
        strategy="beforeInteractive"
      />

      <main className="flex-1 p-4 md:p-6 flex flex-col items-center">
        <h1 className="text-2xl font-bold mb-6">Game: {gameId}</h1>

        <div className="w-full max-w-5xl mb-6 aspect-video bg-black relative">
          {/* Unity container */}
          <div
            ref={unityContainerRef}
            className="w-full h-full"
            style={{ visibility: unityLoaded ? "visible" : "hidden" }}
          ></div>

          {!unityLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-800 text-white">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin mb-4"></div>
                <p>Loading game...</p>
              </div>
            </div>
          )}
        </div>

        <GameUI gameId={gameId} />
      </main>
    </div>
  );
}

// Type definition for Unity
declare global {
  interface Window {
    createUnityInstance: (
      canvas: HTMLCanvasElement,
      config: any
    ) => Promise<any>;
  }
}
