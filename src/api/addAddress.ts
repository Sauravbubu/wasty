import api from './index';

export interface CreateAddressPayload {
  profile: number | string;
  address: string;
  adhar_number: string;
  ddn: string;
  upi_phone: string;
  upi_id: string;
  lane_number: string;
  house_number: string;
  pin_code: string;
}

export const createUserAddress = async (token: string, payload: CreateAddressPayload) => {
  console.log('Creating user address with payload:', payload, 'and token:', token);
  try {
    const response = await api.post('/user/address', payload, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
  } catch (error: any) {
    if (error.response) {
      console.error('createUserAddress error - response:', `Bearer ${token}`, error.response.status, error.response.data);
      throw error.response.data;
    }

    if (error.request) {
      console.error('createUserAddress error - no response, request made:', error.request);
      throw new Error('Network request made but no response received');
    }

    console.error('createUserAddress error - message:', error.message);
    throw new Error(error.message);
  }
};

export default createUserAddress;
