import './index.scss';
// --- Component: Progress ---

type ProgressType = "line" | "circle";
type ProgressSize = "sm" | "md" | "lg" | "xl";
type ProgressColor = "primary" | "success" | "warning" | "danger" | "info" | "purple" | "gradient-blue" | "gradient-sunset";

interface ProgressProps {
  value: number; // 0 - 100
  max?: number;
  type?: ProgressType;
  size?: ProgressSize;
  color?: ProgressColor;
  showLabel?: boolean;
  labelPosition?: "inside" | "outside" | "center"; // center is for circle
  striped?: boolean;
  animated?: boolean;
  className?: string;
  customLabel?: string;
  bgColor?: string;
  stripeColor?: string;
}

const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  type = "line",
  size = "md",
  color = "primary",
  showLabel = false,
  labelPosition = "outside",
  striped = false,
  animated = false,
  className = "",
  customLabel,
  bgColor,
  stripeColor
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  // --- Styles & Config ---

  const sizeClasses = {
    line: {
      sm: "wyx-ui_progress-line-sm",
      md: "wyx-ui_progress-line-md",
      lg: "wyx-ui_progress-line-lg",
      xl: "wyx-ui_progress-line-xl",
    },
    circle: {
      sm: 40,
      md: 60,
      lg: 90,
      xl: 120,
    },
    stroke: {
      sm: 4,
      md: 6,
      lg: 8,
      xl: 10,
    },
  };

  const colorClasses: Record<ProgressColor, string> = {
    primary: "wyx-ui_progress-bg-primary",
    success: "wyx-ui_progress-bg-success",
    warning: "wyx-ui_progress-bg-warning",
    danger: "wyx-ui_progress-bg-danger",
    info: "wyx-ui_progress-bg-info",
    purple: "wyx-ui_progress-bg-purple",
    "gradient-blue": "wyx-ui_progress-bg-gradient-blue",
    "gradient-sunset": "wyx-ui_progress-bg-gradient-sunset",
  };

  const circleColorClasses: Record<ProgressColor, string> = {
    primary: "wyx-ui_progress-text-primary",
    success: "wyx-ui_progress-text-success",
    warning: "wyx-ui_progress-text-warning",
    danger: "wyx-ui_progress-text-danger",
    info: "wyx-ui_progress-text-info",
    purple: "wyx-ui_progress-text-purple",
    "gradient-blue": "wyx-ui_progress-text-gradient-blue",
    "gradient-sunset": "wyx-ui_progress-text-gradient-sunset",
  };

  const rootStyle: React.CSSProperties = {};
  if (bgColor) {
    (rootStyle as any)["--wyx-progress-track-bg"] = bgColor;
    (rootStyle as any)["--wyx-progress-circular-bg"] = bgColor;
  }
  if (stripeColor) {
    (rootStyle as any)["--wyx-progress-stripe-color"] = stripeColor;
  }

  // --- Render Linear ---
  if (type === "line") {
    return (
      <div className={`wyx-ui_progress-root ${className}`} style={rootStyle}>
        {/* Label Top/Outside */}
        {showLabel && labelPosition === "outside" && (
          <div className="wyx-ui_progress-header">
            <span className="wyx-ui_progress-label-text">
              {customLabel || "Progress"}
            </span>
            <span className="wyx-ui_progress-label-text">
              {Math.round(percentage)}%
            </span>
          </div>
        )}

        {/* Bar Container */}
        <div className={`wyx-ui_progress-track ${sizeClasses.line[size]}`}>
          {/* Fill */}
          <div
            className={`
              wyx-ui_progress-fill
              ${colorClasses[color]} 
              ${striped ? "wyx-ui_progress-striped" : ""}
              ${animated && striped ? "wyx-ui_progress-animated" : ""}
            `}
            style={{ width: `${percentage}%` }}
          >
            {/* Label Inside */}
            {showLabel && labelPosition === "inside" && percentage > 10 && (
              <span className="wyx-ui_progress-label-inside">
                {customLabel || `${Math.round(percentage)}%`}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- Render Circular ---
  const sqSize = sizeClasses.circle[size];
  const strokeWidth = sizeClasses.stroke[size];
  const radius = (sqSize - strokeWidth) / 2;
  const viewBox = `0 0 ${sqSize} ${sqSize}`;
  const dashArray = radius * Math.PI * 2;
  const dashOffset = dashArray - (dashArray * percentage) / 100;

  return (
    <div className={`wyx-ui_progress-circular-root ${className}`} style={rootStyle}>
      <svg width={sqSize} height={sqSize} viewBox={viewBox}>
        {/* Background Circle */}
        <circle
          className="wyx-ui_progress-circular-bg"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={sqSize / 2}
          cy={sqSize / 2}
        />
        {/* Progress Circle */}
        <circle
          className={`wyx-ui_progress-circular-track ${circleColorClasses[color]}`}
          strokeWidth={strokeWidth}
          strokeDasharray={dashArray}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={sqSize / 2}
          cy={sqSize / 2}
        />
      </svg>
      {/* Centered Label */}
      {showLabel && (
        <div className="wyx-ui_progress-circular-label-container">
          <span className={`wyx-ui_progress-circular-label-text ${size === 'sm' ? 'wyx-ui_progress-text-small' : size === 'lg' ? 'wyx-ui_progress-text-large' : ''}`}>
            {customLabel || `${Math.round(percentage)}%`}
          </span>
        </div>
      )}
    </div>
  );
};

export default Progress;