// services/api/products.ts
import api from './index';

export const getProductList = async (token?: string) => {
  try {
    console.log('Fetching Product List...');
    const options: any = {};
    if (token) {
      options.headers = { Authorization: `Bearer ${token}` };
    }

    const response = await api.get('/order/product/list', options);
    console.log('Product List Response:', response.data);

    // Normalize common wrappers: data, results, or direct array
    const payload = response.data;
    if (Array.isArray(payload)) return payload;
    if (payload?.data && Array.isArray(payload.data)) return payload.data;
    if (payload?.results && Array.isArray(payload.results)) return payload.results;

    // Fallback to returning payload as-is
    return payload;
  } catch (error: any) {
    console.error('Get Product List Error:', error.response?.data || error.message);
    throw error.response?.data || error.message;
  }
};
