import React from 'react';
import { useTheme } from '../../lib/ThemeContext';

interface PriceChangeProps {
  value: number;
  percentage?: boolean;
  showIcon?: boolean;
  className?: string;
}

export const PriceChange: React.FC<PriceChangeProps> = ({
  value,
  percentage = true,
  showIcon = true,
  className = '',
}) => {
  const { colors } = useTheme();
  
  const isPositive = value > 0;
  const isNeutral = value === 0;
  
  // Determine color based on value
  const textColor = isPositive 
    ? colors.positive 
    : isNeutral 
      ? colors.neutral 
      : colors.negative;
  
  // Format the value
  const formattedValue = percentage
    ? `${value > 0 ? '+' : ''}${value.toFixed(2)}%`
    : `${value > 0 ? '+' : ''}${value.toFixed(2)}`;
    
  return (
    <span
      className={`inline-flex items-center ${className}`}
      style={{ color: textColor }}
    >
      {showIcon && (
        <>
          {isPositive && (
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="mr-1"
            >
              <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
          )}
          {isNeutral && (
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="mr-1"
            >
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          )}
          {!isPositive && !isNeutral && (
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="mr-1"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          )}
        </>
      )}
      {formattedValue}
    </span>
  );
};

export default PriceChange;