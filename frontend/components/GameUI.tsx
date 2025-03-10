// "use client";

// import React from "react";
// import useSocket from "@/lib/hooks/useSocket";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";

// interface GameUIProps {
//   gameId?: string;
// }

// export default function GameUI({ gameId = "player1" }: GameUIProps) {
//   const { isConnected, gameState, sendUIAction } = useSocket(gameId);

//   return (
//     <div className="w-full max-w-4xl mx-auto p-5 bg-slate-50 rounded-lg shadow-md">
//       <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-200">
//         <div className="text-sm text-slate-600 px-3 py-1.5 bg-slate-100 rounded">
//           Status: {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
//         </div>
//       </div>

//       <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
//         <Card className="border-l-4 border-l-blue-500">
//           <CardContent className="p-4 text-center">
//             <h3 className="text-sm font-medium text-slate-500 mb-2">
//               Currency
//             </h3>
//             <div className="text-2xl font-bold text-slate-800">
//               {gameState?.currency || 0}
//             </div>
//           </CardContent>
//         </Card>

//         <Card className="border-l-4 border-l-blue-500">
//           <CardContent className="p-4 text-center">
//             <h3 className="text-sm font-medium text-slate-500 mb-2">Score</h3>
//             <div className="text-2xl font-bold text-slate-800">
//               {gameState?.score || 0}
//             </div>
//           </CardContent>
//         </Card>

//         <Card className="border-l-4 border-l-blue-500">
//           <CardContent className="p-4 text-center">
//             <h3 className="text-sm font-medium text-slate-500 mb-2">
//               Enemies Defeated
//             </h3>
//             <div className="text-2xl font-bold text-slate-800">
//               {gameState?.enemiesKilled || 0}
//             </div>
//           </CardContent>
//         </Card>

//         <Card className="border-l-4 border-l-blue-500">
//           <CardContent className="p-4 text-center">
//             <h3 className="text-sm font-medium text-slate-500 mb-2">
//               Turrets Placed
//             </h3>
//             <div className="text-2xl font-bold text-slate-800">
//               {gameState?.turretsPlaced || 0}
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {gameState?.liquidityPools && gameState.liquidityPools.length > 0 && (
//         <div className="mb-6">
//           <Card>
//             <CardHeader className="pb-2">
//               <CardTitle className="text-lg text-slate-800">
//                 Liquidity Pools
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 {gameState.liquidityPools.map((pool) => (
//                   <Card key={pool.id} className="border-t-4 border-t-teal-500">
//                     <CardContent className="p-4">
//                       <div className="flex justify-between items-center mb-3">
//                         <h3 className="text-base font-medium text-slate-800">
//                           {pool.type} Pool
//                         </h3>
//                         <Badge
//                           variant="outline"
//                           className="bg-green-50 text-green-600 font-medium"
//                         >
//                           {pool.returns} APY
//                         </Badge>
//                       </div>
//                       <div className="text-sm text-slate-500 mb-3">
//                         Amount: {pool.amount}
//                       </div>
//                       <div className="flex gap-2">
//                         <Button
//                           size="sm"
//                           variant="default"
//                           onClick={() =>
//                             sendUIAction("add_liquidity", {
//                               poolId: pool.id,
//                               amount: 50,
//                             })
//                           }
//                         >
//                           Add Liquidity
//                         </Button>
//                         <Button
//                           size="sm"
//                           variant="outline"
//                           onClick={() =>
//                             sendUIAction("remove_liquidity", {
//                               poolId: pool.id,
//                             })
//                           }
//                         >
//                           Remove
//                         </Button>
//                       </div>
//                     </CardContent>
//                   </Card>
//                 ))}
//               </div>
//             </CardContent>
//           </Card>
//         </div>
//       )}

//       <div className="flex justify-center gap-3 mt-5">
//         <Button
//           variant="default"
//           onClick={() => sendUIAction("pause_game", {})}
//         >
//           Pause Game
//         </Button>
//         <Button
//           variant="secondary"
//           onClick={() => sendUIAction("speed_up", { factor: 2 })}
//         >
//           2x Speed
//         </Button>
//       </div>
//     </div>
//   );
// }
