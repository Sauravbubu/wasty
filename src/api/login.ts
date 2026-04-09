import api from './index';

export interface LoginPayload {
  email: string;
  password: string;
}

export const login = async (payload: LoginPayload) => {
  try {
    console.log('Login API payload:', payload);

    const response = await api.post('/user/login', payload);
    console.log('Login API Response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Login API Error - Full:', error);
    
    if (error.response) {
      // Server responded with error status 
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      throw error.response.data;
    } else if (error.request) {
      // Request made but no response
      console.error('No response received - Network error');
      throw new Error('Network Error: Unable to reach server. Check your internet connection.');
    } else {
      // Error in request setup
      console.error('Request setup error:', error.message);
      throw new Error(error.message);
    }
  }
};
