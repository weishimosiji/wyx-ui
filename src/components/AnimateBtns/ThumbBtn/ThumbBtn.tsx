import React, { useCallback, useEffect, useState } from "react";
import './index.scss';

interface ThumbBtnProps {
  width?: number | string;
  height?: number | string;
  color?: string;
  good?: boolean;
  onClick?: (good: boolean, event: React.MouseEvent<HTMLButtonElement>) => void;
}

const ParticleSystem = ({ active }: { active: boolean }) => {
  // Generate a set of particles
  const particleCount = 10;
  const colors = ['#818cf8', '#22d3ee', '#c084fc', '#6366f1']; 
  
  const particles = React.useMemo(() => Array.from({ length: particleCount }).map((_, i) => {
    // Spread X: Wider spread
    const tx = (Math.random() - 0.5) * 90;
    // Spread Y: More upward force
    const ty = -60 - Math.random() * 60;
    
    return {
      id: i,
      tx,
      ty,
      color: colors[i % colors.length],
      delay: Math.random() * 0.1
    };
  }), []);

  return (
    <div className={`particle-system ${active ? 'active' : ''}`}>
      {particles.map((p) => (
        <span
          key={p.id}
          className="particle"
          style={{
            '--tx': `${p.tx}px`,
            '--ty': `${p.ty}px`,
            '--color': p.color,
            animationDelay: `${p.delay}s`
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
};
export default function ThumbBtn({ width, height, color, good: initialGood, onClick }: ThumbBtnProps) {
  const [liked, setLiked] = useState(initialGood || false);
  const [animating, setAnimating] = useState(false);

  const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    // If already liked, just toggle off without animation fanfare
    if (liked) {
      setLiked(false);
      return;
    }

    // Like logic
    setLiked(true);
    setAnimating(true);
    onClick?.(true, event);
  }, [liked, onClick]);

  // Reset animation class after it runs so hover effects can resume
  useEffect(() => {
    if (animating) {
      const timer = setTimeout(() => setAnimating(false), 600); // Matches CSS animation duration
      return () => clearTimeout(timer);
    }
  }, [animating]);

  return (
    <div className="wyx-ui_btns like-button-container">
      {/* Visual Particles */}
      <ParticleSystem active={animating} />

      {/* Main Button */}
      <button 
        className={`btn-reset thumb-btn ${liked ? 'liked' : ''} ${animating ? 'animating' : ''}`} 
        onClick={handleClick}
        aria-label={liked ? "Unlike" : "Like"}
      >
        {/* Shockwave visual */}
        <div className="shockwave"></div>

        <svg 
          viewBox="0 0 24 24" 
          width="26" 
          height="26" 
          fill={liked ? "currentColor" : "none"} 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          {/* Thumbs Up Path */}
          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
        </svg>
      </button>
    </div>
  );
};