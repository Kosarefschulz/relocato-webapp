import React, { useEffect, useState } from 'react';
import './AnimatedBackground.css';

const AnimatedBackground: React.FC = () => {
  const [particles, setParticles] = useState<Array<{ id: number; left: string; delay: string }>>([]);

  useEffect(() => {
    // Generate random particles
    const particleArray = [];
    for (let i = 0; i < 50; i++) {
      particleArray.push({
        id: i,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 15}s`
      });
    }
    setParticles(particleArray);
  }, []);

  return (
    <div className="animated-background">
      {/* Gradient Orbs */}
      <div className="gradient-orb orb-1" />
      <div className="gradient-orb orb-2" />
      <div className="gradient-orb orb-3" />
      <div className="gradient-orb orb-4" />
      
      {/* Mesh Gradient */}
      <div className="mesh-gradient" />
      
      {/* Particles */}
      <div className="particles">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="particle"
            style={{
              left: particle.left,
              animationDelay: particle.delay
            }}
          />
        ))}
      </div>
      
      {/* Light Streaks */}
      <div className="light-streak" />
      <div className="light-streak" />
      <div className="light-streak" />
      <div className="light-streak" />
      <div className="light-streak" />
    </div>
  );
};

export default AnimatedBackground;