"use client";

import React from "react";

const SciFiGrid = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <div
        className="grid-container"
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          backgroundSize: "40px 40px",
          backgroundImage:
            "linear-gradient(to right, rgba(30, 64, 175, 0.09) 1px, transparent 1px), linear-gradient(to bottom, rgba(30, 64, 175, 0.09) 1px, transparent 1px)",
          overflow: "hidden",
        }}
      >
        {/* Generate blinking squares */}
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="blinking-square"
            style={{
              position: "absolute",
              width: "8px",
              height: "8px",
              backgroundColor: "rgba(0, 195, 249, 0.4)",
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              boxShadow: "0 0 8px rgba(40, 140, 251, 0.6)",
              animation: `fade-${Math.floor(Math.random() * 3) + 1} ${
                Math.random() * 7 + 7
              }s infinite`,
              animationDelay: `${Math.random() * 1}s`,
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes fade-1 {
          0%,
          100% {
            opacity: 0.1;
          }
          20% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.8;
          }
          80% {
            opacity: 0.3;
          }
        }
        @keyframes fade-2 {
          0%,
          100% {
            opacity: 0.05;
          }
          25% {
            opacity: 0.25;
          }
          50% {
            opacity: 0.7;
          }
          75% {
            opacity: 0.25;
          }
        }
        @keyframes fade-3 {
          0%,
          100% {
            opacity: 0.1;
          }
          30% {
            opacity: 0.4;
          }
          50% {
            opacity: 0.9;
          }
          70% {
            opacity: 0.4;
          }
        }
      `}</style>
    </div>
  );
};

export default SciFiGrid;
