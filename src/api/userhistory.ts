import api from './index';

export interface BagHistoryItem {
  id: number;
  bag_qr: string;
  user: number;
  assign_on: string;
  products: any[];
}

export const getUserBagHistory = async (userId: number | string, token: string): Promise<BagHistoryItem[]> => {
  try {
    console.log(userId)
    const response = await api.get(`/bag/user-history/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data as BagHistoryItem[];
  } catch (err: any) {
    console.error('getUserBagHistory error:', err.response?.data || err.message);
    throw err.response?.data || err.message;
  }
};