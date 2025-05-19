
import React, { useEffect, useRef } from 'react';

const FireAnimation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    
    // Particle class for the blue fire effect
    class Particle {
      x: number;
      y: number;
      radius: number;
      color: string;
      velocity: { x: number; y: number };
      life: number;
      opacity: number;
      
      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.radius = Math.random() * 4 + 2;
        
        // More realistic blue fire colors with variation
        const blueBase = Math.floor(Math.random() * 55) + 200; // High blue value
        const greenValue = Math.floor(Math.random() * 100) + 100; // Medium green for light blue tint
        const redValue = Math.floor(Math.random() * 30) + 10; // Low red for deeper blue
        
        this.color = `rgb(${redValue}, ${greenValue}, ${blueBase})`;
        
        // More natural flame movement
        this.velocity = {
          x: (Math.random() - 0.5) * 1.5,
          y: Math.random() * -4 - 1.5
        };
        this.life = Math.random() * 40 + 60; // Longer life for more visible flames
        this.opacity = 1;
      }
      
      update() {
        // More natural flame movement with oscillation
        this.x += this.velocity.x + (Math.random() - 0.5) * 0.3;
        this.y += this.velocity.y;
        
        // More gradual fade
        this.life -= 0.8;
        this.opacity = Math.min(1, this.life / 60);
        
        // Particles get smaller as they rise
        if (this.radius > 0.3) {
          this.radius -= 0.03 + Math.random() * 0.03;
        }
      }
      
      draw() {
        if (!ctx) return;
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        
        // Add glow effect for more realistic fire
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(30, 144, 255, 0.5)';
        
        ctx.fill();
        ctx.restore();
      }
    }
    
    const particles: Particle[] = [];
    const particlesPerFrame = 8; // More particles for denser flame
    
    // Animation loop
    function animate() {
      // Clear the canvas with slight persistence for trail effect
      ctx.fillStyle = 'rgba(10, 10, 30, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Create new particles with variation in origin for wider flame base
      const originX = canvas.width / 2;
      const originY = canvas.height;
      
      for (let i = 0; i < particlesPerFrame; i++) {
        particles.push(new Particle(
          originX + Math.random() * 30 - 15, // Wider base
          originY + Math.random() * 5
        ));
      }
      
      // Update and draw particles
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
        
        // Remove dead particles
        if (particles[i].life <= 0) {
          particles.splice(i, 1);
          i--;
        }
      }
      
      requestAnimationFrame(animate);
    }
    
    animate();
    
    // Handle resize
    const handleResize = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
  );
};

export default FireAnimation;
