# Node Defenders - Unity Project

This is the Unity component of the Node Defenders game, a blockchain-based tower defense game where players place and upgrade nodes to defend against waves of enemies.

## Requirements

-   Unity 2021.3 LTS or newer
-   WebGL Build Support module

## Required Packages

-   TextMeshPro
-   NativeWebSocket (WebGL compatible)
-   Unity UI
-   2D Sprite Package

## Project Overview

This tower defense game features:

-   Multiple node types with different abilities
-   Real-time WebSocket communication with the backend
-   Currency system for placing and upgrading nodes
-   Wave-based enemy spawning
-   Node upgrading mechanics

## Key Scripts

-   `WsClient.cs`: WebSocket client for communication with the backend
-   `Node.cs`: Base class for all node types with targeting and shooting logic
-   `Plot.cs`: Manages the placement locations for nodes
-   `Enemy.cs`: Enemy behavior and health system
-   `MainNodeHealth.cs`: Manages the health of the main node that must be defended
-   `BuildManager.cs`: Handles the tower building UI and selection

## WebSocket Integration

The game establishes a direct WebSocket connection with the Node.js backend server. Make sure the WebSocket URL in `WsClient.cs` matches your deployment environment:

```csharp
ws = new WebSocket("ws://localhost:4000");
```

Update this URL for different environments (development, staging, production).

## Building for WebGL

To build for integration with the Next.js frontend:

1. Open Build Settings (File > Build Settings)
2. Select WebGL platform
3. Configure Player Settings:
    - Set compression format to "Disabled" for faster loading
    - Enable "Data caching"
    - Disable "Development Build" for production
4. Configure output files to match the expected structure:
    ```
    /public/build/build.loader.js
    /public/build/build.data
    /public/build/build.framework.js
    /public/build/build.wasm
    ```
5. Click Build and select the `/public/build/` directory

## Integration Notes

-   The WebGL build communicates directly with the backend server using WebSockets
-   All node placements, upgrades, and game state changes are synchronized with the backend
-   Game events like wave countdown, enemy destruction, and health changes are sent to the backend
-   The React frontend embeds this Unity WebGL build but doesn't directly control it

## License

Apache License 2.0

```
Copyright 2025

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```
