import React from 'react';
import { SvgIcon, SvgIconProps } from '@mui/material';

// Moving Company Logo Icon
export const RelocatoLogoIcon: React.FC<SvgIconProps> = (props) => (
  <SvgIcon {...props} viewBox="0 0 100 100">
    {/* Moving truck with modern design */}
    <g>
      {/* Truck body */}
      <rect x="10" y="35" width="45" height="25" rx="3" fill="currentColor" />
      
      {/* Truck cabin */}
      <rect x="55" y="25" width="20" height="35" rx="3" fill="currentColor" />
      
      {/* Wheels */}
      <circle cx="20" cy="68" r="8" fill="currentColor" />
      <circle cx="65" cy="68" r="8" fill="currentColor" />
      
      {/* Wheel centers */}
      <circle cx="20" cy="68" r="3" fill="white" />
      <circle cx="65" cy="68" r="3" fill="white" />
      
      {/* Truck details */}
      <rect x="57" y="30" width="4" height="6" rx="1" fill="white" opacity="0.8" />
      <rect x="63" y="30" width="4" height="6" rx="1" fill="white" opacity="0.8" />
      
      {/* Moving boxes in truck */}
      <rect x="15" y="40" width="8" height="8" rx="1" fill="white" opacity="0.6" />
      <rect x="25" y="40" width="8" height="8" rx="1" fill="white" opacity="0.6" />
      <rect x="35" y="40" width="8" height="8" rx="1" fill="white" opacity="0.6" />
      <rect x="20" y="48" width="8" height="8" rx="1" fill="white" opacity="0.6" />
      <rect x="30" y="48" width="8" height="8" rx="1" fill="white" opacity="0.6" />
      
      {/* Motion lines */}
      <path d="M5 20 L15 20 M5 25 L12 25 M5 30 L10 30" stroke="currentColor" strokeWidth="2" opacity="0.4" />
    </g>
  </SvgIcon>
);

// Simplified Logo for Small Spaces
export const RelocatoIconSimple: React.FC<SvgIconProps> = (props) => (
  <SvgIcon {...props} viewBox="0 0 40 40">
    <g>
      <rect x="5" y="15" width="20" height="12" rx="2" fill="currentColor" />
      <rect x="25" y="10" width="10" height="17" rx="2" fill="currentColor" />
      <circle cx="10" cy="32" r="4" fill="currentColor" />
      <circle cx="30" cy="32" r="4" fill="currentColor" />
      <circle cx="10" cy="32" r="1.5" fill="white" />
      <circle cx="30" cy="32" r="1.5" fill="white" />
    </g>
  </SvgIcon>
);

// Custom Service Icons
export const BoxPackingIcon: React.FC<SvgIconProps> = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <g>
      <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z" fill="currentColor" opacity="0.1" />
      <path d="M20 7v10c0 5.55-3.84 9.74-9 11-5.16-1.26-9-5.45-9-11V7l10-5 10 5z" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 2v20M2 7l10 5 10-5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="8" cy="10" r="1" fill="currentColor" />
      <circle cx="16" cy="10" r="1" fill="currentColor" />
      <rect x="9" y="14" width="6" height="4" rx="1" fill="none" stroke="currentColor" strokeWidth="1" />
    </g>
  </SvgIcon>
);

export const FurnitureIcon: React.FC<SvgIconProps> = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <g>
      {/* Sofa */}
      <path d="M3 12h18v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6z" fill="currentColor" opacity="0.2" />
      <path d="M3 12h18v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6z" fill="none" stroke="currentColor" strokeWidth="1.5" />
      
      {/* Armrests */}
      <path d="M2 10a2 2 0 012-2v8a2 2 0 01-2-2v-4zM22 10a2 2 0 00-2-2v8a2 2 0 002-2v-4z" fill="currentColor" />
      
      {/* Cushions */}
      <rect x="6" y="9" width="3" height="3" rx="1" fill="currentColor" opacity="0.6" />
      <rect x="10.5" y="9" width="3" height="3" rx="1" fill="currentColor" opacity="0.6" />
      <rect x="15" y="9" width="3" height="3" rx="1" fill="currentColor" opacity="0.6" />
      
      {/* Legs */}
      <line x1="6" y1="20" x2="6" y2="22" stroke="currentColor" strokeWidth="2" />
      <line x1="18" y1="20" x2="18" y2="22" stroke="currentColor" strokeWidth="2" />
    </g>
  </SvgIcon>
);

export const CleaningIcon: React.FC<SvgIconProps> = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <g>
      {/* Spray bottle */}
      <path d="M8 6h8v12a2 2 0 01-2 2h-4a2 2 0 01-2-2V6z" fill="currentColor" opacity="0.2" />
      <path d="M8 6h8v12a2 2 0 01-2 2h-4a2 2 0 01-2-2V6z" fill="none" stroke="currentColor" strokeWidth="1.5" />
      
      {/* Spray nozzle */}
      <rect x="10" y="3" width="4" height="3" rx="1" fill="currentColor" />
      <circle cx="12" cy="2" r="1" fill="currentColor" />
      
      {/* Spray particles */}
      <circle cx="18" cy="5" r="0.5" fill="currentColor" opacity="0.6" />
      <circle cx="19" cy="7" r="0.5" fill="currentColor" opacity="0.4" />
      <circle cx="20" cy="9" r="0.5" fill="currentColor" opacity="0.6" />
      <circle cx="21" cy="6" r="0.5" fill="currentColor" opacity="0.3" />
      
      {/* Liquid level */}
      <path d="M9 10h6v6h-6z" fill="currentColor" opacity="0.3" />
      
      {/* Handle */}
      <rect x="6" y="8" width="2" height="6" rx="1" fill="currentColor" opacity="0.8" />
    </g>
  </SvgIcon>
);

export const PianoIcon: React.FC<SvgIconProps> = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <g>
      {/* Piano body */}
      <rect x="2" y="8" width="20" height="12" rx="2" fill="currentColor" opacity="0.2" />
      <rect x="2" y="8" width="20" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      
      {/* Piano legs */}
      <rect x="4" y="20" width="2" height="3" fill="currentColor" />
      <rect x="18" y="20" width="2" height="3" fill="currentColor" />
      
      {/* White keys */}
      <rect x="3" y="12" width="2.5" height="7" fill="white" stroke="currentColor" strokeWidth="0.5" />
      <rect x="6" y="12" width="2.5" height="7" fill="white" stroke="currentColor" strokeWidth="0.5" />
      <rect x="9" y="12" width="2.5" height="7" fill="white" stroke="currentColor" strokeWidth="0.5" />
      <rect x="12" y="12" width="2.5" height="7" fill="white" stroke="currentColor" strokeWidth="0.5" />
      <rect x="15" y="12" width="2.5" height="7" fill="white" stroke="currentColor" strokeWidth="0.5" />
      <rect x="18" y="12" width="2.5" height="7" fill="white" stroke="currentColor" strokeWidth="0.5" />
      
      {/* Black keys */}
      <rect x="4.5" y="12" width="1.5" height="4" fill="currentColor" />
      <rect x="7.5" y="12" width="1.5" height="4" fill="currentColor" />
      <rect x="13.5" y="12" width="1.5" height="4" fill="currentColor" />
      <rect x="16.5" y="12" width="1.5" height="4" fill="currentColor" />
      
      {/* Piano top */}
      <path d="M4 8a2 2 0 012-2h10a2 2 0 012 2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      
      {/* Music notes */}
      <circle cx="19" cy="5" r="1" fill="currentColor" opacity="0.6" />
      <path d="M19 4v-2" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      <circle cx="21" cy="3" r="0.8" fill="currentColor" opacity="0.4" />
      <path d="M21 2.2v-1.5" stroke="currentColor" strokeWidth="1" opacity="0.4" />
    </g>
  </SvgIcon>
);

export const StorageIcon: React.FC<SvgIconProps> = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <g>
      {/* Storage warehouse */}
      <path d="M2 12l10-8 10 8v8a2 2 0 01-2 2H4a2 2 0 01-2-2v-8z" fill="currentColor" opacity="0.1" />
      <path d="M2 12l10-8 10 8v8a2 2 0 01-2 2H4a2 2 0 01-2-2v-8z" fill="none" stroke="currentColor" strokeWidth="1.5" />
      
      {/* Roof */}
      <path d="M1 12l11-9 11 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Door */}
      <rect x="10" y="16" width="4" height="6" fill="currentColor" opacity="0.3" />
      <circle cx="13" cy="19" r="0.5" fill="currentColor" />
      
      {/* Windows */}
      <rect x="5" y="14" width="2" height="2" fill="currentColor" opacity="0.4" />
      <rect x="17" y="14" width="2" height="2" fill="currentColor" opacity="0.4" />
      
      {/* Storage shelves inside */}
      <line x1="6" y1="18" x2="8" y2="18" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      <line x1="16" y1="18" x2="18" y2="18" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      <line x1="6" y1="20" x2="8" y2="20" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      <line x1="16" y1="20" x2="18" y2="20" stroke="currentColor" strokeWidth="1" opacity="0.5" />
    </g>
  </SvgIcon>
);

export const OfficeIcon: React.FC<SvgIconProps> = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <g>
      {/* Desk */}
      <rect x="2" y="12" width="20" height="2" rx="1" fill="currentColor" />
      <rect x="4" y="14" width="2" height="8" fill="currentColor" opacity="0.8" />
      <rect x="18" y="14" width="2" height="8" fill="currentColor" opacity="0.8" />
      
      {/* Computer monitor */}
      <rect x="7" y="6" width="10" height="6" rx="1" fill="currentColor" opacity="0.2" />
      <rect x="7" y="6" width="10" height="6" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="12" width="2" height="2" fill="currentColor" />
      
      {/* Keyboard */}
      <rect x="8" y="14" width="8" height="1.5" rx="0.5" fill="currentColor" opacity="0.6" />
      
      {/* Office chair */}
      <circle cx="20" cy="8" r="2" fill="currentColor" opacity="0.3" />
      <rect x="19.5" y="10" width="1" height="4" fill="currentColor" />
      <circle cx="20" cy="16" r="1.5" fill="currentColor" opacity="0.6" />
      
      {/* Boxes */}
      <rect x="2" y="7" width="3" height="3" rx="0.5" fill="currentColor" opacity="0.4" />
      <rect x="2" y="4" width="3" height="2.5" rx="0.5" fill="currentColor" opacity="0.6" />
    </g>
  </SvgIcon>
);

// Status Icons
export const QuoteStatusIcon: React.FC<SvgIconProps & { status: 'draft' | 'sent' | 'accepted' | 'rejected' }> = ({ status, ...props }) => {
  const getStatusPath = (status: string) => {
    switch (status) {
      case 'draft':
        return (
          <g>
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" fill="currentColor" opacity="0.1" />
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M14 2v6h6" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 12h8M8 16h4" stroke="currentColor" strokeWidth="1" opacity="0.6" />
          </g>
        );
      case 'sent':
        return (
          <g>
            <path d="M22 2L11 13l-3-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 12l7 7 13-13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
            <circle cx="5" cy="5" r="2" fill="currentColor" opacity="0.2" />
            <path d="M7 3l10 6-10 6V3z" fill="currentColor" opacity="0.6" />
          </g>
        );
      case 'accepted':
        return (
          <g>
            <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.1" />
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 12l2 2 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.3" />
          </g>
        );
      case 'rejected':
        return (
          <g>
            <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.1" />
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 8l8 8M16 8l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </g>
        );
      default:
        return null;
    }
  };

  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      {getStatusPath(status)}
    </SvgIcon>
  );
};

// Progress Icons
export const ProgressIcon: React.FC<SvgIconProps & { progress: number }> = ({ progress, ...props }) => {
  const circumference = 2 * Math.PI * 10;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <g>
        <circle
          cx="12"
          cy="12"
          r="10"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          opacity="0.2"
        />
        <circle
          cx="12"
          cy="12"
          r="10"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 12 12)"
        />
        <text
          x="12"
          y="16"
          textAnchor="middle"
          fontSize="8"
          fill="currentColor"
        >
          {progress}%
        </text>
      </g>
    </SvgIcon>
  );
};

// Rating Stars
export const StarRatingIcon: React.FC<SvgIconProps & { rating: number; maxRating?: number }> = ({ 
  rating, 
  maxRating = 5, 
  ...props 
}) => {
  const stars = [];
  
  for (let i = 1; i <= maxRating; i++) {
    const isFilled = i <= rating;
    const isHalfFilled = i - 0.5 <= rating && i > rating;
    
    stars.push(
      <g key={i}>
        {isFilled ? (
          <path
            d={`M${4 * (i - 1) + 2} 1l1 2h2l-1.5 1.5L${4 * (i - 1) + 3.5} 6l-1.5-1.5L${4 * (i - 1)} 6l1-2-1.5-1.5h2l1-2z`}
            fill="currentColor"
          />
        ) : isHalfFilled ? (
          <>
            <path
              d={`M${4 * (i - 1) + 2} 1l1 2h2l-1.5 1.5L${4 * (i - 1) + 3.5} 6l-1.5-1.5L${4 * (i - 1)} 6l1-2-1.5-1.5h2l1-2z`}
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
            />
            <path
              d={`M${4 * (i - 1) + 2} 1l1 2h1v-2z`}
              fill="currentColor"
            />
          </>
        ) : (
          <path
            d={`M${4 * (i - 1) + 2} 1l1 2h2l-1.5 1.5L${4 * (i - 1) + 3.5} 6l-1.5-1.5L${4 * (i - 1)} 6l1-2-1.5-1.5h2l1-2z`}
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            opacity="0.3"
          />
        )}
      </g>
    );
  }
  
  return (
    <SvgIcon {...props} viewBox={`0 0 ${maxRating * 4} 8`}>
      {stars}
    </SvgIcon>
  );
};

// Export all icons as a collection
export const CustomIcons = {
  // Logo
  RelocatoLogo: RelocatoLogoIcon,
  RelocatoSimple: RelocatoIconSimple,
  
  // Services
  BoxPacking: BoxPackingIcon,
  Furniture: FurnitureIcon,
  Cleaning: CleaningIcon,
  Piano: PianoIcon,
  Storage: StorageIcon,
  Office: OfficeIcon,
  
  // Status
  QuoteStatus: QuoteStatusIcon,
  Progress: ProgressIcon,
  StarRating: StarRatingIcon,
};

export default CustomIcons;