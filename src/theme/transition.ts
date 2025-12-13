import { ThemeName } from "./themeManage";

function computeMaxRadius(x: number, y: number) {
  const maxX = Math.max(x, window.innerWidth - x);
  const maxY = Math.max(y, window.innerHeight - y);
  return Math.hypot(maxX, maxY); // √(maxX² + maxY²)
}

interface TransitionOptions {
  themeName: ThemeName;
  x: number;
  y: number;
  toggle: () => void;
  duration?: number;
}

export function themeTransition(
  options: TransitionOptions
) {
  const { themeName, x, y } = options;
  const maxRadius = computeMaxRadius(x, y);
  // const x = e.clientX
  // const y = e.clientY
  // Calculate the maximum radius from the mouse click position to the viewport
  // const endRadius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))

  // Set CSS variables
  document.documentElement.style.setProperty('--x', x + 'px')
  document.documentElement.style.setProperty('--y', y + 'px')
  document.documentElement.style.setProperty('--r', maxRadius + 'px')
  // const transitionDuration = 
  document.startViewTransition(async () => {
    // Logic for switching themes
    document.documentElement.classList.toggle("wyx-ui-dark", themeName === ThemeName.Light);
    options.toggle();  
    await new Promise(resolve => setTimeout(resolve, 0));
  });

  // Clicking the scheme to execute the animation causes a flickering issue in the last frame when switching from dark to light
  // transitionDuration.ready.then(() => {
  //   const clipPath = [
  //     `circle(0px at ${x}px ${y}px)`,
  //     `circle(${maxRadius}px at ${x}px ${y}px)`,
  //   ];

  //   document.documentElement.animate(
  //     { 
  //       clipPath: themeName === ThemeName.Dark ? [...clipPath].reverse() : clipPath,
  //     },
  //     {
  //       duration: options.duration || 500,
  //       easing: 'linear',
        
  //       pseudoElement: themeName === ThemeName.Dark
  //         ? '::view-transition-old(root)'
  //         : '::view-transition-new(root)',
  //     }
  //   );
  // });
}
