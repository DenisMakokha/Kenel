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

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const response = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const { accessToken } = response.data;
        localStorage.setItem('accessToken', accessToken);

        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Helper to download/view files with authentication
export const openAuthenticatedFile = async (url: string) => {
  try {
    const response = await api.get(url, { responseType: 'blob' });
    const blob = new Blob([response.data], { type: response.headers['content-type'] });
    const blobUrl = window.URL.createObjectURL(blob);
    
    // Open in new tab for viewing
    window.open(blobUrl, '_blank');
    
    // Clean up after a delay
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60000);
  } catch (error) {
    console.error('Failed to open file:', error);
    throw error;
  }
};

export const downloadAuthenticatedFile = async (url: string, fileName?: string) => {
  const response = await api.get(url, { responseType: 'blob' });

  const contentType = response.headers['content-type'];
  const blob = new Blob([response.data], { type: contentType });
  const blobUrl = window.URL.createObjectURL(blob);

  let resolvedName = fileName;
  if (!resolvedName) {
    const disposition = response.headers['content-disposition'] as string | undefined;
    const match = disposition?.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
    const fromHeader = match?.[1] || match?.[2];
    resolvedName = fromHeader ? decodeURIComponent(fromHeader) : 'document';
  }

  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = resolvedName;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60000);
};

export default api;
