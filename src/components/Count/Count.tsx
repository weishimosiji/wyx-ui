import React from 'react';
import './indx.scss';

function easeOutCubic(t: number) { return 1 - Math.pow(1 - t, 3); }

function useAnimatedValue(target: number, duration = 520) {
  const [v, setV] = React.useState<number>(target);
  const rafRef = React.useRef<number | null>(null);
  const startRef = React.useRef<number>(0);
  const fromRef = React.useRef<number>(target);
  const toRef = React.useRef<number>(target);

  React.useEffect(() => {
    fromRef.current = v;
    toRef.current = target;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    startRef.current = performance.now();
    const loop = (now: number) => {
      const t = Math.min(1, (now - startRef.current) / duration);
      const eased = easeOutCubic(t);
      const next = fromRef.current + (toRef.current - fromRef.current) * eased;
      setV(next);
      if (t < 1) rafRef.current = requestAnimationFrame(loop);
      else rafRef.current = null;
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return v;
}

interface NumberProps {
  mv: number;
  number: number;
  height: number;
}

function Number({ mv, number, height }: NumberProps) {
  const placeValue = mv % 10;
  let offset = (10 + number - placeValue) % 10;
  let y = offset * height;
  if (offset > 5) y -= 10 * height;
  return (
    <span className="counter-number" style={{ transform: `translateY(${y}px)`, height, lineHeight: `${height}px` }}>
      {number}
    </span>
  );
}

interface DigitProps {
  place: number;
  value: number;
  height: number;
  digitStyle?: React.CSSProperties;
  duration?: number;
}

function Digit({ place, value, height, digitStyle, duration = 520 }: DigitProps) {
  const valueRoundedToPlace = Math.floor(value / place);
  const animatedValue = useAnimatedValue(valueRoundedToPlace, duration);
  return (
    <div className="counter-digit" style={{ height, ...digitStyle }}>
      {Array.from({ length: 10 }, (_, i) => (
        <Number key={i} mv={animatedValue} number={i} height={height} />
      ))}
    </div>
  );
}

interface CounterProps {
  value: number;
  fontSize?: number;
  padding?: number;
  places?: number[];
  gap?: number;
  borderRadius?: number;
  horizontalPadding?: number;
  textColor?: string;
  fontWeight?: React.CSSProperties['fontWeight'];
  containerStyle?: React.CSSProperties;
  counterStyle?: React.CSSProperties;
  digitStyle?: React.CSSProperties;
  gradientHeight?: number;
  gradientFrom?: string;
  gradientTo?: string;
  topGradientStyle?: React.CSSProperties;
  bottomGradientStyle?: React.CSSProperties;
}

export default function Counter({
  value,
  fontSize = 32,
  padding = 0,
  places = [100, 10, 1],
  gap = 2,
  borderRadius = 4,
  horizontalPadding = 8,
  textColor = 'white',
  fontWeight = 'bold',
  containerStyle,
  counterStyle,
  digitStyle,
  gradientHeight = 16,
  gradientFrom = 'transparent',
  gradientTo = 'transparent',
  topGradientStyle,
  bottomGradientStyle
}: CounterProps) {
  const height = fontSize + padding;
  const defaultCounterStyle: React.CSSProperties = {
    fontSize,
    gap: gap,
    borderRadius: borderRadius,
    paddingLeft: horizontalPadding,
    paddingRight: horizontalPadding,
    color: textColor,
    fontWeight: fontWeight
  };
  const defaultTopGradientStyle: React.CSSProperties = {
    height: gradientHeight,
    background: `linear-gradient(to bottom, ${gradientFrom}, ${gradientTo})`
  };
  const defaultBottomGradientStyle: React.CSSProperties = {
    height: gradientHeight,
    background: `linear-gradient(to top, ${gradientFrom}, ${gradientTo})`
  };
  return (
    <div className="wyx-ui-counter-container" style={containerStyle}>
      <div className="counter-counter" style={{ ...defaultCounterStyle, ...counterStyle }}>
        {places.map(place => (
          <Digit key={place} place={place} value={value} height={height} digitStyle={digitStyle} />
        ))}
      </div>
      <div className="gradient-container">
        <div className="top-gradient" style={topGradientStyle ? topGradientStyle : defaultTopGradientStyle}></div>
        <div
          className="bottom-gradient"
          style={bottomGradientStyle ? bottomGradientStyle : defaultBottomGradientStyle}
        ></div>
      </div>
    </div>
  );
}
