import React from 'react';
import { useTheme } from '@mui/material';

function Logo({ size = 40, animated = true }) {
  const theme = useTheme();
  const primaryColor = theme.palette.primary.main;
  const secondaryColor = theme.palette.secondary.main;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={animated ? {
        transition: 'transform 0.3s ease-in-out',
        '&:hover': {
          transform: 'scale(1.1) rotate(5deg)'
        }
      } : {}}
    >
      {/* Shield Base */}
      <path
        d="M50 5L15 20V45C15 67.5 30.5 87.5 50 95C69.5 87.5 85 67.5 85 45V20L50 5Z"
        fill={`url(#gradient)`}
        stroke={primaryColor}
        strokeWidth="2"
        style={animated ? {
          animation: 'pulse 2s infinite'
        } : {}}
      />

      {/* Inner Shield Pattern */}
      <path
        d="M50 15L25 25V42.5C25 60 35.5 75 50 80C64.5 75 75 60 75 42.5V25L50 15Z"
        fill="rgba(255,255,255,0.2)"
        style={animated ? {
          animation: 'float 3s ease-in-out infinite'
        } : {}}
      />

      {/* A Letter */}
      <path
        d="M40 35L50 65L60 35"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={animated ? {
          animation: 'draw 2s ease-in-out'
        } : {}}
      />
      <path
        d="M43 50L57 50"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        style={animated ? {
          animation: 'draw 2s ease-in-out'
        } : {}}
      />

      {/* Decorative Lines */}
      <path
        d="M30 30L70 30"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="2"
        strokeDasharray="4 4"
      />
      <path
        d="M35 70L65 70"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="2"
        strokeDasharray="4 4"
      />

      {/* Gradient Definition */}
      <defs>
        <linearGradient id="gradient" x1="15" y1="5" x2="85" y2="95" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={primaryColor} />
          <stop offset="100%" stopColor={secondaryColor} />
        </linearGradient>

        {/* Animations */}
        <style>
          {`
            @keyframes pulse {
              0% { transform: scale(1); }
              50% { transform: scale(1.02); }
              100% { transform: scale(1); }
            }
            @keyframes float {
              0% { transform: translateY(0); }
              50% { transform: translateY(2px); }
              100% { transform: translateY(0); }
            }
            @keyframes draw {
              0% { stroke-dasharray: 100; stroke-dashoffset: 100; }
              100% { stroke-dasharray: 100; stroke-dashoffset: 0; }
            }
          `}
        </style>
      </defs>
    </svg>
  );
}

export default Logo;
