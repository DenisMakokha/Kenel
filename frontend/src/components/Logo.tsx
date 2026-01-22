import logoWhite from '../assets/logos/kenels-white.svg';
import logoDark from '../assets/logos/kenel-dark.svg';

interface LogoProps {
  variant?: 'light' | 'dark';
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'h-8',
  md: 'h-10',
  lg: 'h-12',
  xl: 'h-16',
};

export default function Logo({ variant = 'light', className = '', size = 'md' }: LogoProps) {
  const logo = variant === 'light' ? logoWhite : logoDark;
  
  return (
    <img 
      src={logo} 
      alt="Kenels Bureau Logo" 
      className={`${sizeClasses[size]} w-auto ${className}`}
    />
  );
}
