"use client";
import { useEffect, useRef } from "react";
import { Unity, useUnityContext } from "react-unity-webgl";
import { AspectRatio } from "./ui/aspect-ratio";
interface UnityGameComponentProps {
  gameDir?: string;
}

export const UnityGameComponent: React.FC<UnityGameComponentProps> = ({
  gameDir = "./unity-build/Build",
}) => {
  const {
    unityProvider,
    isLoaded,
    loadingProgression,
    sendMessage,
    addEventListener,
    removeEventListener,
  } = useUnityContext({
    loaderUrl: `build/build.loader.js`,
    dataUrl: `build/build.data`,
    frameworkUrl: `build/build.framework.js`,
    codeUrl: `build/build.wasm`,
  });

  // Example of receiving events from Unity
  // useEffect(() => {
  //   function handleUnityEvent(data: any) {
  //     console.log("Event from Unity:", data);
  //   }

  //   addEventListener("GameEvent", handleUnityEvent);
  //   return () => {
  //     removeEventListener("GameEvent", handleUnityEvent);
  //   };
  // }, [addEventListener, removeEventListener]);

  const handleInteraction = () => {
    if (isLoaded) {
      sendMessage("GameController", "HandleReactEvent", "Hello from React!");
    }
  };

  return (
    <AspectRatio ratio={9 / 16} className="h-full max-h-full mx-auto">
      {!isLoaded && (
        <div className="absolute z-10 p-4 bg-black/50 text-white rounded-xl left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          Loading: {Math.round(loadingProgression * 100)}%
        </div>
      )}
      <Unity
        unityProvider={unityProvider}
        className="rounded-xl w-full h-[80vh]"
        style={{ display: "block" }}
      />
    </AspectRatio>
  );
};

export default UnityGameComponent;
