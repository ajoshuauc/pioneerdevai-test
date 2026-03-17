import axios from 'axios';
import type { SearchResponse } from '../types/restaurant';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export async function executeSearch(message: string): Promise<SearchResponse> {
  const response = await axios.get<SearchResponse>(`${API_BASE_URL}/api/execute`, {
    params: {
      message,
      code: 'pioneerdevai',
    },
  });

  return response.data;
}
