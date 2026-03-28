import { useEffect, useRef } from "react";

export default function Confetti() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];

    // Create confetti particles
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 3 + 2,
        size: Math.random() * 4 + 2,
        angle: Math.random() * Math.PI * 2,
        colors: ["#ff9f43", "#00d4ff", "#ff6b9d", "#a29bfe", "#ffd32a"],
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        p.angle += 0.05;
        p.vy += 0.1; // gravity

        if (p.y > canvas.height) {
          particles.splice(index, 1);
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.colors[Math.floor(Math.random() * p.colors.length)];
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });

      if (particles.length > 0) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        pointerEvents: "none",
        zIndex: 999,
      }}
    />
  );
}
