
import React from 'react';

interface GasCylinderIconProps {
  className?: string;
}

const GasCylinderIcon: React.FC<GasCylinderIconProps> = ({ className }) => {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      width="100" 
      height="100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        d="M7 2H17V4C17 4 16 5 16 6H8C8 5 7 4 7 4V2Z" 
        fill="#95A5A6"
        stroke="#7F8C8D" 
        strokeWidth="0.5" 
      />
      <path 
        d="M8 6H16V20C16 21.1046 15.1046 22 14 22H10C8.89543 22 8 21.1046 8 20V6Z" 
        fill="#3498DB" 
        stroke="#2980B9" 
        strokeWidth="0.5"
      />
      <circle cx="12" cy="10" r="1.5" fill="#ECF0F1" />
      <path 
        d="M10 16H14" 
        stroke="#ECF0F1" 
        strokeWidth="0.75" 
        strokeLinecap="round"
      />
      <path 
        d="M10 18H14" 
        stroke="#ECF0F1" 
        strokeWidth="0.75" 
        strokeLinecap="round"
      />
    </svg>
  );
};

export default GasCylinderIcon;
