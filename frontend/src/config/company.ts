// Company configuration - centralized place for all company-specific values
// These can be overridden via environment variables in production

export const COMPANY_CONFIG = {
  // Company Information
  name: import.meta.env.VITE_COMPANY_NAME || 'Kenels Bureau',
  fullName: import.meta.env.VITE_COMPANY_FULL_NAME || 'Kenels Bureau Ltd',
  tagline: import.meta.env.VITE_COMPANY_TAGLINE || 'Your trusted financial partner',
  
  // Contact Information
  email: import.meta.env.VITE_COMPANY_EMAIL || 'support@kenelsbureau.co.ke',
  phone: import.meta.env.VITE_COMPANY_PHONE || '+254 759 599 124',
  phoneRaw: import.meta.env.VITE_COMPANY_PHONE_RAW || '+254759599124',
  
  // URLs
  website: import.meta.env.VITE_COMPANY_WEBSITE || 'https://kenels.app',
  
  // Branding
  poweredBy: {
    name: 'Nelium Systems',
    url: 'https://neliumsystems.com',
  },
  
  // Loan Configuration
  loans: {
    minAmount: 10000,
    maxAmount: 5000000,
    collateralFreeLimit: 100000,
    approvalTime: '24 hours',
  },
  
  // Social Media (optional)
  social: {
    facebook: import.meta.env.VITE_SOCIAL_FACEBOOK || '',
    twitter: import.meta.env.VITE_SOCIAL_TWITTER || '',
    linkedin: import.meta.env.VITE_SOCIAL_LINKEDIN || '',
    instagram: import.meta.env.VITE_SOCIAL_INSTAGRAM || '',
  },
  
  // Location
  location: {
    address: import.meta.env.VITE_COMPANY_ADDRESS || 'Eaton Place, 2nd Floor, United Nations Crescent, Nairobi-Kenya',
    city: 'Nairobi',
    country: 'Kenya',
  },
};

// Helper function to get current year for copyright
export const getCurrentYear = () => new Date().getFullYear();

// Format phone number for display
export const formatPhoneDisplay = (phone: string) => {
  return phone.replace(/(\+\d{3})(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4');
};

export default COMPANY_CONFIG;
