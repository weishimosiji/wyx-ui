import './index.scss';

interface MarqueeProps {
  children: React.ReactNode;
  direction?: 'left' | 'right';
  speed?: number; // duration in seconds
}

const Marquee: React.FC<MarqueeProps> = ({ children, direction = 'left', speed = 30 }) => {

  return (
    <div className="wyx-ui-marquee-container" style={{ '--marquee-speed': `${speed}s` } as React.CSSProperties}>
      <div className={`wyx-ui-marquee-content wyx-ui-scroll-${direction}`}>
        {children}
      </div>
      <div className={`wyx-ui-marquee-content wyx-ui-scroll-${direction}`}>
        {children}
      </div>
    </div>
  );
};

export default Marquee;