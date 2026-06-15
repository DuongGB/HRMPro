import api from "../../../config/api";

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const automationApi = {
  triggerBirthdayAnniversary: async (): Promise<ApiResponse<void>> => {
    return api.get("/automation/birthday-anniversary");
  },

  triggerCloseExpiredJobs: async (): Promise<ApiResponse<void>> => {
    return api.get("/automation/close-expired-jobs");
  },

  triggerContractWarning: async (): Promise<ApiResponse<void>> => {
    return api.get("/automation/contract-warning");
  },

  triggerLeaveInit: async (): Promise<ApiResponse<void>> => {
    return api.get("/automation/leave-init");
  },

  triggerLeaveSeniority: async (): Promise<ApiResponse<void>> => {
    return api.get("/automation/leave-seniority");
  },
};
