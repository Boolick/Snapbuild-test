import { apiClient } from '../../../shared/api/client';
import { Preset } from '../../../shared/types/api';

export const presetApi = {
  getAll: async (): Promise<Preset[]> => {
    const response = await apiClient.get<Preset[]>('/presets');
    return response.data;
  },

  getById: async (id: string): Promise<Preset> => {
    const response = await apiClient.get<Preset>(`/presets/${id}`);
    return response.data;
  },
};
