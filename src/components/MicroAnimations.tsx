import React from 'react';
import { keyframes, styled } from '@mui/material/styles';
import { Box, Paper, Button, Card, IconButton, Fab } from '@mui/material';

// Keyframe animations
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const fadeInLeft = keyframes`
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const fadeInRight = keyframes`
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const slideInDown = keyframes`
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const scaleIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

const pulse = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
`;

const bounce = keyframes`
  0%, 20%, 53%, 80%, 100% {
    transform: translate3d(0,0,0);
  }
  40%, 43% {
    transform: translate3d(0, -8px, 0);
  }
  70% {
    transform: translate3d(0, -4px, 0);
  }
  90% {
    transform: translate3d(0, -2px, 0);
  }
`;

const shake = keyframes`
  10%, 90% {
    transform: translate3d(-1px, 0, 0);
  }
  20%, 80% {
    transform: translate3d(2px, 0, 0);
  }
  30%, 50%, 70% {
    transform: translate3d(-4px, 0, 0);
  }
  40%, 60% {
    transform: translate3d(4px, 0, 0);
  }
`;

const glow = keyframes`
  0% {
    box-shadow: 0 0 5px rgba(66, 165, 245, 0.5);
  }
  50% {
    box-shadow: 0 0 20px rgba(66, 165, 245, 0.8), 0 0 30px rgba(66, 165, 245, 0.6);
  }
  100% {
    box-shadow: 0 0 5px rgba(66, 165, 245, 0.5);
  }
`;

const typing = keyframes`
  from { width: 0; }
  to { width: 100%; }
`;

const blink = keyframes`
  50% { border-color: transparent; }
`;

// Styled components with animations
export const AnimatedBox = styled(Box)<{ 
  animation?: 'fadeInUp' | 'fadeInLeft' | 'fadeInRight' | 'slideInDown' | 'scaleIn';
  delay?: number;
}>(({ theme, animation = 'fadeInUp', delay = 0 }) => ({
  animation: `${
    animation === 'fadeInUp' ? fadeInUp :
    animation === 'fadeInLeft' ? fadeInLeft :
    animation === 'fadeInRight' ? fadeInRight :
    animation === 'slideInDown' ? slideInDown :
    scaleIn
  } 0.6s ease-out forwards`,
  animationDelay: `${delay}ms`,
  opacity: 0,
}));

export const AnimatedCard = styled(Card)<{ delay?: number }>(({ theme, delay = 0 }) => ({
  animation: `${fadeInUp} 0.6s ease-out forwards`,
  animationDelay: `${delay}ms`,
  opacity: 0,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-8px) scale(1.02)',
    boxShadow: theme.shadows[12],
  },
}));

export const AnimatedPaper = styled(Paper)<{ delay?: number }>(({ theme, delay = 0 }) => ({
  animation: `${fadeInUp} 0.6s ease-out forwards`,
  animationDelay: `${delay}ms`,
  opacity: 0,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
}));

export const HoverButton = styled(Button)(({ theme }) => ({
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
    transition: 'left 0.5s',
  },
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[8],
    '&::before': {
      left: '100%',
    },
  },
  '&:active': {
    transform: 'translateY(0)',
  },
}));

export const PulseButton = styled(Button)(({ theme }) => ({
  animation: `${pulse} 2s infinite`,
  '&:hover': {
    animation: 'none',
    transform: 'scale(1.05)',
  },
}));

export const BounceIcon = styled(IconButton)(({ theme }) => ({
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    animation: `${bounce} 1s`,
  },
}));

export const ShakeOnError = styled(Box)<{ error?: boolean }>(({ theme, error }) => ({
  animation: error ? `${shake} 0.6s` : 'none',
}));

export const GlowOnFocus = styled(Box)(({ theme }) => ({
  transition: 'all 0.3s ease',
  '&:focus-within': {
    animation: `${glow} 2s infinite`,
  },
}));

export const LoadingDots = styled(Box)(({ theme }) => ({
  display: 'inline-block',
  position: 'relative',
  width: 64,
  height: 20,
  '& div': {
    position: 'absolute',
    top: 8,
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: theme.palette.primary.main,
    animationTimingFunction: 'cubic-bezier(0, 1, 1, 0)',
  },
  '& div:nth-of-type(1)': {
    left: 6,
    animation: `${keyframes`
      0% { transform: scale(0); }
      100% { transform: scale(1); }
    `} 0.6s infinite`,
  },
  '& div:nth-of-type(2)': {
    left: 6,
    animation: `${keyframes`
      0% { transform: translate(0, 0); }
      100% { transform: translate(19px, 0); }
    `} 0.6s infinite`,
  },
  '& div:nth-of-type(3)': {
    left: 26,
    animation: `${keyframes`
      0% { transform: translate(0, 0); }
      100% { transform: translate(19px, 0); }
    `} 0.6s infinite`,
  },
  '& div:nth-of-type(4)': {
    left: 45,
    animation: `${keyframes`
      0% { transform: scale(1); }
      100% { transform: scale(0); }
    `} 0.6s infinite`,
  },
}));

export const TypingText = styled(Box)<{ text: string; speed?: number }>(({ theme, text, speed = 50 }) => ({
  fontFamily: 'monospace',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  borderRight: '3px solid',
  width: '0',
  animation: `${typing} ${text.length * speed}ms steps(${text.length}, end), ${blink} 1s step-end infinite`,
  '&::after': {
    content: `"${text}"`,
  },
}));

export const FloatingActionButton = styled(Fab)(({ theme }) => ({
  position: 'fixed',
  bottom: theme.spacing(2),
  right: theme.spacing(2),
  zIndex: 1000,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  animation: `${fadeInUp} 0.6s ease-out`,
  '&:hover': {
    transform: 'scale(1.1) rotate(10deg)',
    boxShadow: theme.shadows[12],
  },
  '&:active': {
    transform: 'scale(0.95)',
  },
}));

export const SlideInContainer = styled(Box)<{ direction?: 'left' | 'right' | 'up' | 'down'; delay?: number }>(
  ({ theme, direction = 'up', delay = 0 }) => ({
    animation: `${
      direction === 'left' ? fadeInLeft :
      direction === 'right' ? fadeInRight :
      direction === 'down' ? slideInDown :
      fadeInUp
    } 0.6s ease-out forwards`,
    animationDelay: `${delay}ms`,
    opacity: 0,
  })
);

export const CountUpNumber = styled(Box)<{ from: number; to: number; duration?: number }>(
  ({ theme, from, to, duration = 2000 }) => {
    const steps = 60;
    const stepDuration = duration / steps;
    const increment = (to - from) / steps;
    
    return {
      '&::before': {
        content: `"${from}"`,
        animation: `${keyframes`
          ${Array.from({ length: steps + 1 }, (_, i) => `
            ${(i / steps) * 100}% {
              content: "${Math.round(from + increment * i)}";
            }
          `).join('')}
        `} ${duration}ms ease-out forwards`,
      },
    };
  }
);

// Progress Bar Animation
export const AnimatedProgressBar = styled(Box)<{ progress: number }>(({ theme, progress }) => ({
  width: '100%',
  height: 8,
  backgroundColor: theme.palette.grey[200],
  borderRadius: 4,
  overflow: 'hidden',
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: `${progress}%`,
    backgroundColor: theme.palette.primary.main,
    borderRadius: 4,
    transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
    background: `linear-gradient(90deg, 
      ${theme.palette.primary.main}, 
      ${theme.palette.primary.light}, 
      ${theme.palette.primary.main}
    )`,
    backgroundSize: '200% 100%',
    animation: `${keyframes`
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    `} 2s linear infinite`,
  },
}));

// Stagger children animation hook
export const useStaggeredAnimation = (itemCount: number, delay: number = 100) => {
  return Array.from({ length: itemCount }, (_, index) => ({
    animation: `${fadeInUp} 0.6s ease-out forwards`,
    animationDelay: `${index * delay}ms`,
    opacity: 0,
  }));
};

// Intersection Observer animation hook
export const useScrollAnimation = (threshold: number = 0.1) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
};

// Page transition container
export const PageTransition = styled(Box)(({ theme }) => ({
  animation: `${fadeInUp} 0.6s ease-out`,
  minHeight: '100vh',
}));

// Skeleton pulse animation
export const SkeletonPulse = styled(Box)(({ theme }) => ({
  background: `linear-gradient(90deg, 
    ${theme.palette.grey[200]} 25%, 
    ${theme.palette.grey[100]} 50%, 
    ${theme.palette.grey[200]} 75%
  )`,
  backgroundSize: '200% 100%',
  animation: `${keyframes`
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  `} 1.5s ease-in-out infinite`,
  borderRadius: 4,
}));

export default {
  AnimatedBox,
  AnimatedCard,
  AnimatedPaper,
  HoverButton,
  PulseButton,
  BounceIcon,
  ShakeOnError,
  GlowOnFocus,
  LoadingDots,
  TypingText,
  FloatingActionButton,
  SlideInContainer,
  CountUpNumber,
  AnimatedProgressBar,
  useStaggeredAnimation,
  useScrollAnimation,
  PageTransition,
  SkeletonPulse,
};