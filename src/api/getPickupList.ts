// filepath: /Users/kantakaushikpalai/Desktop/wasty/src/services/api/getPickupList.ts
import api from './index';

export interface PickupItem {
  id: number;
  user: number;
  fulfilled: boolean;
  pickup_date: string;
  created_at: string;
}

export const getPickupList = async (userId: number | string, token: string): Promise<PickupItem[]> => {
  try {
    const response = await api.get(`/bag/pickup/list`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data as PickupItem[];
  } catch (err: any) {
    console.error('getPickupList error:', err.response?.data || err.message);
    throw err.response?.data || err.message;
  }
};