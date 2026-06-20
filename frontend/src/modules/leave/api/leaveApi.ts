import api from "../../../config/api";
import { type PageResponse } from "../../users/api/userApi";

export interface LeaveBalanceResponse {
  id: number;
  employeeId: number;
  employeeName: string;
  leaveTypeId: number;
  leaveTypeCode: string;
  leaveTypeName: string;
  year: number;
  totalDays: number;
  usedDays: number;
  pendingDays: number;
  remainingDays: number;
}

export interface LeaveRequestResponse {
  id: number;
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  leaveTypeId: number;
  leaveTypeCode: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: string; // PENDING|APPROVED|REJECTED|CANCELLED
  managerId: number | null;
  managerName: string | null;
  managerNote: string | null;
  reviewedAt: string | null;
  attachmentUrl: string | null;
  createdAt: string;
}

export interface LeaveRequestDto {
  leaveTypeCode: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
}

export interface LeaveApprovalDto {
  status: string; // APPROVED|REJECTED
  managerNote?: string;
}

export const leaveApi = {
  getLeaveBalances: async (employeeId?: number | null, year?: number): Promise<LeaveBalanceResponse[]> => {
    const params: any = {};
    if (employeeId) params.employeeId = employeeId;
    if (year) params.year = year;
    const response = (await api.get("/leaves/balances", { params })) as any;
    return response.data;
  },

  createLeaveRequest: async (requestData: LeaveRequestDto, file?: File): Promise<LeaveRequestResponse> => {
    const formData = new FormData();
    formData.append(
      "request",
      new Blob([JSON.stringify(requestData)], { type: "application/json" })
    );
    if (file) {
      formData.append("file", file);
    }

    const response = (await api.post("/leaves/requests", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })) as any;
    return response.data;
  },

  approveLeaveRequest: async (id: number, data: LeaveApprovalDto): Promise<LeaveRequestResponse> => {
    const response = (await api.put(`/leaves/requests/${id}/approve`, data)) as any;
    return response.data;
  },

  hrOverrideLeaveRequest: async (id: number, data: LeaveApprovalDto): Promise<LeaveRequestResponse> => {
    const response = (await api.put(`/leaves/requests/${id}/override`, data)) as any;
    return response.data;
  },

  getLeaveRequests: async (params: {
    employeeId?: number | null;
    status?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    departmentId?: number | null;
    page?: number;
    size?: number;
  }): Promise<PageResponse<LeaveRequestResponse>> => {
    const response = (await api.get("/leaves/requests", { params })) as any;
    return response.data;
  }
};
