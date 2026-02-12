import React from 'react';

export interface FlameProps {
  intensity?: number;
  size?: number | string;
  active?: boolean;
}

export const ClassicFlame: React.FC<FlameProps> = ({ intensity = 1, size = 28, active = true }) => {
  const duration = 0.8 / intensity;

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(50 0) scale(1.45 1) translate(-50 0)">
      <g>

        <path d="M50 90C30 90 20 70 50 10C80 70 70 90 50 90Z" fill="#FF4D00">
          {active && (
            <animate
              attributeName="d"
              dur={`${duration}s`}
              repeatCount="indefinite"
              values="M50 90C30 90 20 70 50 10C80 70 70 90 50 90Z;M50 90C35 85 25 65 50 5C75 65 65 85 50 90Z;M50 90C30 90 20 70 50 10C80 70 70 90 50 90Z"
              keyTimes="0;0.5;1"
              calcMode="spline"
              keySplines="0.42 0 0.58 1;0.42 0 0.58 1"
            />
          )}
        </path>

        <g>
          {active && (
            <animateTransform
              attributeName="transform"
              type="translate"
              dur={`${duration * 1.2}s`}
              repeatCount="indefinite"
              values="0 0; 0 -2; 0 0"
              keyTimes="0;0.5;1"
              calcMode="spline"
              keySplines="0.42 0 0.58 1;0.42 0 0.58 1"
            />
          )}
          <g transform="translate(50 70)">
            <g>
              {active && (
                <animateTransform
                  attributeName="transform"
                  type="scale"
                  dur={`${duration * 1.2}s`}
                  repeatCount="indefinite"
                  values="1 1; 1 1.1; 1 1"
                  keyTimes="0;0.5;1"
                  calcMode="spline"
                  keySplines="0.42 0 0.58 1;0.42 0 0.58 1"
                />
              )}
              <g transform="translate(-50 -70)">
                <path d="M50 85C35 85 30 70 50 30C70 70 65 85 50 85Z" fill="#FF9500" />
              </g>
            </g>
          </g>
        </g>

        <g transform="translate(50 65)">
          <g>
            {active && (
              <animateTransform
                attributeName="transform"
                type="scale"
                dur={`${duration * 0.8}s`}
                repeatCount="indefinite"
                values="1 1; 0.9 0.9; 1 1"
                keyTimes="0;0.5;1"
                calcMode="spline"
                keySplines="0.42 0 0.58 1;0.42 0 0.58 1"
              />
            )}
            <g transform="translate(-50 -65)">
              <path d="M50 80C40 80 38 70 50 50C62 70 60 80 50 80Z" fill="#FFD600">
                {active && (
                  <animate
                    attributeName="opacity"
                    dur={`${duration * 0.8}s`}
                    repeatCount="indefinite"
                    values="0.8;1;0.8"
                    keyTimes="0;0.5;1"
                    calcMode="spline"
                    keySplines="0.42 0 0.58 1;0.42 0 0.58 1"
                  />
                )}
              </path>
            </g>
          </g>
        </g>
      </g>
      </g>
    </svg>
  );
};
