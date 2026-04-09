import api from './index';

export interface CartItemPayload {
  id: number | string;
  quantity: number;
}

export const createCart = async (token: string, items: CartItemPayload[]) => {
  try {
    const response = await api.post('/cart/add', { items }, { headers: { Authorization: `Bearer ${token}` } });
    return response.data; // expected to contain cart id and items
  } catch (error: any) {
    if (error.response) throw error.response.data;
    if (error.request) throw new Error('No response from server');
    throw new Error(error.message);
  }
};

export const updateCart = async (token: string, cartId: string | number, items: CartItemPayload[]) => {
  try {
    const response = await api.put(`/cart/${cartId}`, { items }, { headers: { Authorization: `Bearer ${token}` } });
    return response.data;
  } catch (error: any) {
    if (error.response) throw error.response.data;
    if (error.request) throw new Error('No response from server');
    throw new Error(error.message);
  }
};

export interface AddToCartPayload {
  user_id?: number | string;
  items: CartItemPayload[];
}

export const addToCart = async (token: string, payload: AddToCartPayload) => {
  try {
    const response = await api.post('/order/cart/add', payload, { headers: { Authorization: `Bearer ${token}` } });
    return response.data;
  } catch (error: any) {
    if (error.response) throw error.response.data;
    if (error.request) throw new Error('No response from server');
    throw new Error(error.message);
  }
};

export const placeOrder = async (token: string, cartId: string | number) => {
  try {
    const response = await api.post('/order', { cart_id: cartId }, { headers: { Authorization: `Bearer ${token}` } });
    return response.data;
  } catch (error: any) {
    if (error.response) throw error.response.data;
    if (error.request) throw new Error('No response from server');
    throw new Error(error.message);
  }
};

export default createCart;
