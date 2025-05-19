
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
    
    // Particle class for the fire effect
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
        this.radius = Math.random() * 3 + 2;
        this.color = `rgb(${Math.floor(Math.random() * 55) + 200}, ${Math.floor(Math.random() * 100)}, 10)`;
        this.velocity = {
          x: (Math.random() - 0.5) * 2,
          y: Math.random() * -3 - 1
        };
        this.life = Math.random() * 20 + 40;
        this.opacity = 1;
      }
      
      update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.life--;
        this.opacity = this.life / 60;
        
        if (this.radius > 0.2) {
          this.radius -= 0.05;
        }
      }
      
      draw() {
        if (!ctx) return;
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
      }
    }
    
    const particles: Particle[] = [];
    const particlesPerFrame = 5;
    
    // Animation loop
    function animate() {
      // Clear the canvas
      ctx.fillStyle = 'rgba(30, 30, 30, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Create new particles
      const originX = canvas.width / 2;
      const originY = canvas.height;
      
      for (let i = 0; i < particlesPerFrame; i++) {
        particles.push(new Particle(
          originX + Math.random() * 20 - 10,
          originY
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
