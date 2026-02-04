import axios from 'axios';

// Auto-detect API URL based on environment
const getApiUrl = () => {
  // If VITE_API_URL is explicitly set, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Auto-detect based on current hostname
  const hostname = window.location.hostname;
  
  // Production: kenels.app -> api.kenels.app
  if (hostname === 'kenels.app' || hostname === 'www.kenels.app') {
    return 'https://api.kenels.app/api/v1';
  }
  
  // Local development
  return 'http://localhost:3000/api/v1';
};

const API_URL = getApiUrl();

export const portalApi = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

portalApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('portalAccessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

portalApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest: any = error.config;

    const requestUrl = (originalRequest?.url as string | undefined) || '';
    const isPortalAuthEndpoint = requestUrl.includes('/portal/auth/login')
      || requestUrl.includes('/portal/auth/refresh')
      || requestUrl.includes('/portal/auth/register')
      || requestUrl.includes('/portal/auth/logout')
      || requestUrl.includes('/portal/auth/change-password');

    if (error.response?.status === 401 && !originalRequest._portalRetry && !isPortalAuthEndpoint) {
      originalRequest._portalRetry = true;

      try {
        const res = await axios.post(
          `${API_URL}/portal/auth/refresh`,
          {},
          { withCredentials: true },
        );

        const { accessToken } = res.data as { accessToken: string };
        localStorage.setItem('portalAccessToken', accessToken);

        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        return portalApi(originalRequest);
      } catch (refreshError) {
        // Clear tokens and redirect to login
        localStorage.removeItem('portalAccessToken');
        localStorage.removeItem('portal-auth-storage');
        
        // Redirect to login page if not already there
        if (!window.location.pathname.includes('/portal/login')) {
          window.location.href = '/portal/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default portalApi;
