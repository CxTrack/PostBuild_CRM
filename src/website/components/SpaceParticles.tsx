"use client";

import { useEffect, useRef } from "react";

interface Particle {
    x: number;
    y: number;
    size: number;
    speedX: number;
    speedY: number;
    opacity: number;
    twinkleSpeed: number;
    twinklePhase: number;
    color: string;
    isStar?: boolean;
}

export default function SpaceParticles() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const rafRef = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Set canvas size
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = document.documentElement.scrollHeight;
        };
        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        // Initialize particles
        const initParticles = () => {
            const particles: Particle[] = [];
            const particleCount = 250; // Increased density

            // Color palette: mostly white, some gold and blue
            const colors = [
                "rgba(255, 255, 255, 0.8)", // White (60%)
                "rgba(255, 255, 255, 0.8)",
                "rgba(255, 255, 255, 0.8)",
                "rgba(255, 215, 0, 0.6)",   // Electric Gold (20%)
                "rgba(255, 215, 0, 0.6)",
                "rgba(30, 144, 255, 0.5)",  // Sapphire Blue (20%)
                "rgba(30, 144, 255, 0.5)",
            ];

            const heroHeight = window.innerHeight;

            for (let i = 0; i < particleCount; i++) {
                let size = Math.random() * 2 + 0.5; // Default: 0.5 - 2.5px
                let opacity = Math.random() * 0.5 + 0.3; // Default: 0.3 - 0.8

                const y = Math.random() * canvas.height;

                // Enhance particles in hero viewport
                if (y < heroHeight && Math.random() < 0.4) {
                    size = Math.random() * 2 + 2; // 2px - 4px
                    opacity = Math.random() * 0.5 + 0.5; // 0.5 - 1.0
                }

                particles.push({
                    x: Math.random() * canvas.width,
                    y: y,
                    size: size,
                    speedX: (Math.random() - 0.5) * 0.2, // Slow drift
                    speedY: (Math.random() - 0.5) * 0.2,
                    opacity: opacity,
                    twinkleSpeed: Math.random() * 0.02 + 0.01,
                    twinklePhase: Math.random() * Math.PI * 2,
                    color: colors[Math.floor(Math.random() * colors.length)]
                });
            }

            // Add extra 5-8 "star" particles in the hero area with a glow effect
            const starCount = Math.floor(Math.random() * 4) + 5; // 5-8
            for (let i = 0; i < starCount; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * heroHeight,
                    size: Math.random() * 2 + 3, // 3-5px
                    speedX: (Math.random() - 0.5) * 0.1, // Even slower
                    speedY: (Math.random() - 0.5) * 0.1,
                    opacity: Math.random() * 0.3 + 0.7, // 0.7 - 1.0
                    twinkleSpeed: Math.random() * 0.01 + 0.005,
                    twinklePhase: Math.random() * Math.PI * 2,
                    color: "rgba(255, 255, 255, 0.9)",
                    isStar: true
                });
            }

            particlesRef.current = particles;
        };

        initParticles();

        // Animation loop
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particlesRef.current.forEach((particle) => {
                // Update position
                particle.x += particle.speedX;
                particle.y += particle.speedY;

                // Wrap around edges
                if (particle.x < 0) particle.x = canvas.width;
                if (particle.x > canvas.width) particle.x = 0;
                if (particle.y < 0) particle.y = canvas.height;
                if (particle.y > canvas.height) particle.y = 0;

                // Twinkle effect
                particle.twinklePhase += particle.twinkleSpeed;
                const twinkle = Math.sin(particle.twinklePhase) * 0.3 + 0.7; // 0.4 - 1.0

                // Draw bloom/glow for stars
                if (particle.isStar) {
                    ctx.beginPath();
                    ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity * twinkle * 0.2})`;
                    ctx.fill();
                }

                // Draw particle
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fillStyle = particle.color.replace(/[\d.]+\)$/, `${particle.opacity * twinkle})`);
                ctx.fill();
            });

            rafRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener("resize", resizeCanvas);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none"
            style={{ background: "#000000", zIndex: -1 }}
        />
    );
}
