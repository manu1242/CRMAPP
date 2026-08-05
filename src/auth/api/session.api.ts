import { apiClient } from '../../api/apiClient';
import { API_ENDPOINTS } from '../../api/endpoints';

export const sessionApi = {
  clearSessionOnClose: async (): Promise<void> => {
    return apiClient.post<void>('/account/clearsessiononclose');
  },
};
