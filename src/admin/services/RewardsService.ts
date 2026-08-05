import { apiClient } from '../../api/apiClient';
import { API_ENDPOINTS } from '../../api/endpoints';

export interface Referral {
  id: number;
  amount: number;
  description: string;
  isUsed: boolean;
  joinedCompany: string;
  joinedOn: string;
}

export interface RewardsDetails {
  balance: number;
  referralCode: string;
  referrals: Referral[];
}

export interface GetRewardsResponse {
  success: boolean;
  message?: string;
  data: RewardsDetails;
}

export const rewardsService = {
  /**
   * Get Referral Wallet & Rewards Details
   */
  getRewardsDetails: async (): Promise<GetRewardsResponse> => {
    return await apiClient.get<GetRewardsResponse>(
      API_ENDPOINTS.REWARDS_API.GET_DETAILS
    );
  },
};
