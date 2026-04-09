import api from "./index";

export const createUserAddress = async (
  token: string,
  payload: {
    profile: number;
    address: string;
    adhar_number: string;
    ddn: string;
    upi_phone: string;
    upi_id: string;
    lane_number: string;
    house_number: string;
    pin_code: string;
  }
) => {
  try {
    console.log('Creating User Address...');
    const response = await api.post(
      '/wasty/v1/user/address',
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`, // ✅ attach token
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Create User Address Response:', response.data);
    return response.data; // ✅ return response
  } catch (error: any) {
    console.error(
      'Create User Address Error:',
      error.response?.data || error.message
    );
    throw error.response?.data || error.message;
  }
};
