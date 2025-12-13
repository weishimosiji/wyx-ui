import { useCallback, useEffect, useState } from "react";
import './index.scss';

interface LikeBtnProps {
  width?: number | string;
  height?: number | string;
  color?: string;
  liked?: boolean;
  onClick?: (liked: boolean, event: React.MouseEvent<HTMLButtonElement>) => void;
}

const ParticleSystem = ({ active }: { active: boolean }) => {
  // Generate a set of particles with random colors and angles
  const particleCount = 12;
  const colors = ['#ef4444', '#f472b6', '#fbbf24', '#a855f7']; // Red, Pink, Amber, Purple
  
  // Create fixed positions for a nice radial burst
  const particles = Array.from({ length: particleCount }).map((_, i) => {
    const angle = (i * 360) / particleCount;
    // Convert degrees to radians
    const radian = (angle * Math.PI) / 180;
    // Distance the particle travels
    const distance = 45; 
    
    return {
      id: i,
      tx: Math.cos(radian) * distance,
      ty: Math.sin(radian) * distance,
      color: colors[i % colors.length],
      // Add slight randomness to delay for organic feel
      delay: Math.random() * 0.1
    };
  });

  return (
    <div className={`particle-system ${active ? 'animating' : ''}`}>
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

export default function LikeBtn({ width = 40, height = 40, color = 'var(--primary-text)', liked: initialLiked, onClick }: LikeBtnProps) {
  const [liked, setLiked] = useState(initialLiked || false);
  const [animating, setAnimating] = useState(false);

  const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    if (liked) {
      setLiked(false);
    } else {
      setLiked(true);
      setAnimating(true);
    }
    onClick?.(liked, event);
  }, [liked, onClick]);

  // Reset animation state so it can be re-triggered
  useEffect(() => {
    if (animating) {
      const timer = setTimeout(() => setAnimating(false), 700);
      return () => clearTimeout(timer);
    }
  }, [animating]);

  return (
    <div className="wyx-ui_btns like-button-container" style={{ width, height, color }}>
      {/* Visual Particles */}
      <ParticleSystem active={animating} />

      {/* Main Button */}
      <button 
        className={`btn-reset heart-btn ${liked ? 'liked' : ''}`} 
        onClick={handleClick}
        aria-label={liked ? "Unlike" : "Like"}
      >
        <svg 
          viewBox="0 0 24 24" 
          width="28" 
          height="28" 
          fill={liked ? "currentColor" : "none"} 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </button>
    </div>
  );
};