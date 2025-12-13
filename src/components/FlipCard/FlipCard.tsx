import React from 'react';
import './index.scss';

interface FlipCardProps {
  width?: number | string;
  height?: number | string;
  trigger?: 'click' | 'hover';
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
}

// Child Components
const FlipCardFront = ({ children, className = '' }: React.PropsWithChildren<{ className?: string }>) => (
  <div className={`wyx-card_front ${className}`}>
    {children}
  </div>
);

const FlipCardBack = ({ children, className = '' }: React.PropsWithChildren<{ className?: string }>) => (
  <div className={`wyx-card_back ${className}`}>
    {children}
  </div>
);

FlipCard.Front = FlipCardFront;
FlipCard.Back = FlipCardBack;

export default function FlipCard({ children, ...props }: React.PropsWithChildren<FlipCardProps>) {
  const { trigger = 'hover' } = props

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (trigger === 'click') {
      event.currentTarget.classList.toggle('clicked');
      props.onClick?.(event);
    }
  }
  
  return (
    <div
      className={`wyx-card-container ${props.className || ''} wyx-card-${trigger}`}
      onClick={handleClick}
      style={{
        width: typeof props.width === 'number' ? `${props.width}px` : props.width || '100px',
        height: typeof props.height === 'number' ? `${props.height}px` : props.height || '150px',
      }}
    >
      <div className="wyx-card">
        {children}
      </div>
    </div>
  );
}