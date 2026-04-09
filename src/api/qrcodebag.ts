import api from './index';

export const addQRCodeToBag = async (token: string, qrCode: string) => {
  try {
    console.log('addQRCodeToBag token:', token, 'qrCode:', qrCode); // debug

    const response = await api.post(
      '/bag/assign',
      { qr_code: qrCode }, // request body
      {
        headers: {
          Authorization: `Bearer ${token}`, // no leading space
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('addQRCodeToBag response:', response.data);
    return response.data;
  } catch (error: any) {
    // console.error('addQRCodeToBag error:', error.response?.status, error.response?.data || error.message);
    throw error.response?.data || error.message;
  }
};

