import { Alert } from 'react-native';
import api from './index';

export interface SchedulePickupPayload {
  fulfilled: boolean;
  pickup_date: string;
  user_id: string | number;
  bag_id: number;
}

export const schedulePickup = async (token: string, payload: SchedulePickupPayload) => {
  try {
    Alert.alert('Scheduling pickup with payload:', JSON.stringify(payload));

    const response = await api.post('/bag/pickup', payload, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('Schedule Pickup Response:', response.data);

    return response.data;
  } catch (error: any) {
    if (error.response) {
      console.error('Schedule Pickup Error - Response:', error.response.status, error.response.data);
      throw error.response.data;
    } else if (error.request) {
      console.error('Schedule Pickup Error - No response');
      throw new Error('Network Error: Unable to reach server. Check your internet connection.');
    } else {
      console.error('Schedule Pickup Error:', error.message);
      throw new Error(error.message);
    }
  }
};
