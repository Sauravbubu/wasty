import api from './index';

export interface WalletTransaction {
  id: number;
  amount: number;
  type?: string;
  created_on?: string;
  description?: string;
}

export interface WalletResponse {
  balance?: number;
  transactions?: WalletTransaction[];
}

export const getWallet = async (userId: string | number, token: string): Promise<WalletResponse> => {
  const url = `/order/wallet/${userId}`;
  try {
    const res = await api.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        // Accept: 'application/json',
      },
      validateStatus: () => true,
    });

    if (res.status >= 200 && res.status < 300) {
      return res.data as WalletResponse;
    }

    throw new Error(`HTTP ${res.status}: ${JSON.stringify(res.data)}`);
  } catch (err: any) {
    console.error('getWallet error:', err?.response?.status, err?.response?.data || err.message);
    throw err?.response?.data || err.message || err;
  }
};