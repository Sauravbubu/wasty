import api from './index';

export interface SignupPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number: string;
}

export const signup = async (payload: SignupPayload) => {
  try {
    const response = await api.post('/user/signup', payload);
    return response.data; // Return the response data
  } catch (error: any) {
    console.error('Signup API Error:', error.response?.data || error.message);
    throw error.response?.data || error.message; // Throw the error for handling
  }
};