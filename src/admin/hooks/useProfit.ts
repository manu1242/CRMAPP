import { useQuery } from "@tanstack/react-query";
import * as service from "../services/ProfitService";

/**
 * Hook to retrieve profit analytics data including totals, expenses, and revenues list
 */
export const useProfitAnalytics = (fromDate?: string, toDate?: string) => {
  return useQuery({
    queryKey: ["profitAnalytics", fromDate, toDate],
    queryFn: () => service.getProfitAnalytics(fromDate, toDate),
  });
};
