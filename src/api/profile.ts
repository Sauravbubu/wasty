import api from './index';

export const getProfile = async (token: string) => {
  try {
    const response = await api.get('/user/profile', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log('Profile API Response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Profile API Error:', error.response?.data || error.message);
    throw error.response?.data || error.message;
  }
};
