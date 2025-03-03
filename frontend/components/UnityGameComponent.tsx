import { useEffect, useRef } from "react";

interface UnityGameComponentProps {
  unityContext?: any; // You can type this properly if you're using a Unity loader library
}

export const UnityGameComponent: React.FC<UnityGameComponentProps> = ({
  unityContext,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // This is a placeholder for actual Unity WebGL integration
    // In a real implementation, you would:
    // 1. Load the Unity WebGL build
    // 2. Mount it to the canvasRef div
    // 3. Set up communication between React and Unity

    // Simulate a Unity game with a canvas animation
    const canvas = document.createElement("canvas");
    canvas.width = canvasRef.current?.clientWidth || 800;
    canvas.height = canvasRef.current?.clientHeight || 600;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";

    canvasRef.current?.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Cyberpunk-themed animation
    let particles: {
      x: number;
      y: number;
      radius: number;
      color: string;
      speedX: number;
      speedY: number;
    }[] = [];
    const particleCount = 50;

    // Create particles
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 3 + 1,
        color: [
          "rgba(0, 255, 255, 0.7)", // Cyan
          "rgba(255, 0, 255, 0.7)", // Magenta
          "rgba(0, 255, 0, 0.7)", // Green
          "rgba(255, 215, 0, 0.7)", // Gold
        ][Math.floor(Math.random() * 4)],
        speedX: (Math.random() - 0.5) * 2,
        speedY: (Math.random() - 0.5) * 2,
      });
    }

    // Node elements
    const nodes = [
      {
        x: canvas.width * 0.3,
        y: canvas.height * 0.3,
        radius: 20,
        color: "rgba(0, 255, 255, 0.9)",
      },
      {
        x: canvas.width * 0.7,
        y: canvas.height * 0.3,
        radius: 20,
        color: "rgba(255, 0, 255, 0.9)",
      },
      {
        x: canvas.width * 0.5,
        y: canvas.height * 0.7,
        radius: 20,
        color: "rgba(0, 255, 0, 0.9)",
      },
      {
        x: canvas.width * 0.2,
        y: canvas.height * 0.6,
        radius: 20,
        color: "rgba(255, 215, 0, 0.9)",
      },
      {
        x: canvas.width * 0.8,
        y: canvas.height * 0.6,
        radius: 20,
        color: "rgba(0, 191, 255, 0.9)",
      },
    ];

    // Connection lines
    const connections = [
      [0, 1],
      [0, 2],
      [1, 2],
      [2, 3],
      [2, 4],
      [3, 4],
    ];

    // Animation function
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw a dark background with grid
      ctx.fillStyle = "rgba(10, 10, 40, 0.3)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw grid
      ctx.strokeStyle = "rgba(0, 100, 100, 0.2)";
      ctx.lineWidth = 1;
      const gridSize = 30;

      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw connections between nodes
      connections.forEach(([i, j]) => {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(100, 255, 255, 0.3)`;
        ctx.lineWidth = 2;
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[j].x, nodes[j].y);
        ctx.stroke();

        // Animated pulse on the lines
        const time = Date.now() / 1000;
        const pulseSize = 3 * Math.sin(time * 3 + i + j) + 4;

        // Draw moving pulses on lines
        const dx = nodes[j].x - nodes[i].x;
        const dy = nodes[j].y - nodes[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const pulsePosition = (time % 2) / 2;
        const pulseX = nodes[i].x + dx * pulsePosition;
        const pulseY = nodes[i].y + dy * pulsePosition;

        ctx.beginPath();
        ctx.fillStyle = "rgba(0, 255, 255, 0.8)";
        ctx.arc(pulseX, pulseY, pulseSize, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw nodes
      nodes.forEach((node, i) => {
        // Node glow
        const grd = ctx.createRadialGradient(
          node.x,
          node.y,
          node.radius * 0.5,
          node.x,
          node.y,
          node.radius * 2
        );
        grd.addColorStop(0, node.color);
        grd.addColorStop(1, "rgba(0, 0, 50, 0)");

        ctx.beginPath();
        ctx.fillStyle = grd;
        ctx.arc(node.x, node.y, node.radius * 2, 0, Math.PI * 2);
        ctx.fill();

        // Node body
        ctx.beginPath();
        ctx.fillStyle = node.color;
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();

        // Node inner highlight
        ctx.beginPath();
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.arc(
          node.x - node.radius * 0.3,
          node.y - node.radius * 0.3,
          node.radius * 0.2,
          0,
          Math.PI * 2
        );
        ctx.fill();

        // Pulsating effect
        const pulseRadius = node.radius + 5 * Math.sin(Date.now() / 500 + i);
        ctx.beginPath();
        ctx.strokeStyle = node.color;
        ctx.lineWidth = 2;
        ctx.arc(node.x, node.y, pulseRadius, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Update and draw particles
      particles.forEach((particle) => {
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        ctx.beginPath();
        ctx.fillStyle = particle.color;
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      // Cleanup on component unmount
      if (canvasRef.current && canvas) {
        canvasRef.current.removeChild(canvas);
      }
    };
  }, [unityContext]);

  return (
    <div
      ref={canvasRef}
      className="w-full h-full bg-slate-800 rounded-md overflow-hidden"
    />
  );
};

export default UnityGameComponent;
