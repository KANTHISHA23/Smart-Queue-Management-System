/**
 * Public token tracking API.
 * Anonymous and read-only.
 */
import api from '@/lib/api';

export type PublicTokenStatus = 'waiting' | 'serving' | 'completed' | 'missed';

export interface PublicTokenTrackingData {
  token_id: number;
  queue_id: number;
  token_number: string;
  status: PublicTokenStatus;
  queue_name: string;
  current_serving_token: string | null;
  position_in_queue: number;
  estimated_wait_time: number;
  prediction_source?: 'heuristic' | 'ml';
}

export const publicTokenService = {
  getStatus: (tokenId: string) => api.get<{ success: boolean; data: PublicTokenTrackingData }>(`/public/token/${encodeURIComponent(tokenId)}`),
};
