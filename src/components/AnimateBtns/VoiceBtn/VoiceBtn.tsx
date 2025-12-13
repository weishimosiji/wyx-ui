import './index.scss';

interface VoiceBtnProps {
  width?: number;
  height?: number;
  color?: string;
  status?: 'play' | 'pause';
  speed?: number;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export default function VoiceBtn({ width = 40, height = 40, color = 'var(--primary-text)', status = 'play', speed = 0.5, ...props }: VoiceBtnProps) {
  return (
    <button
      className={`wyx-ui_btns wyx-btn_voice voice-${status}`}
      style={{ '--voice-speed': `${speed}s`, width: `${width}px`, height: `${height}px`, color } as React.CSSProperties}
      onClick={props.onClick}
      {...props}>
      <svg viewBox="0 0 150 150">
        <path id="voice-path1" />
        <path id="voice-path2" />
        <path id="voice-path3" />
        <path id="voice-path4" />
        <path id="voice-path5" />
      </svg>
    </button>
  );
}