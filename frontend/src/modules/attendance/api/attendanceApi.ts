import api from "../../../config/api";
import { type PageResponse } from "../../users/api/userApi";

export interface AttendanceLogResponse {
  id: number;
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  workDate: string;
  checkIn: string | null;
  checkOut: string | null;
  checkInIp: string | null;
  checkInLocation: string | null;
  status: string; // ON_TIME|LATE|EARLY_LEAVE|ABSENT|PENDING_ADJUST|ADJUSTED
  note: string | null;
  approvedById: number | null;
  approvedByName: string | null;
}

export interface CheckInRequest {
  ipAddress?: string;
  location?: string;
  note?: string;
}

export interface AttendanceAdjustmentRequest {
  workDate: string;
  checkIn?: string | null;
  checkOut?: string | null;
  note: string;
}

export const attendanceApi = {
  checkIn: async (data: CheckInRequest): Promise<AttendanceLogResponse> => {
    const response = (await api.post("/attendance/check-in", data)) as any;
    return response.data;
  },

  checkOut: async (): Promise<AttendanceLogResponse> => {
    const response = (await api.post("/attendance/check-out", {})) as any;
    return response.data;
  },

  requestAdjustment: async (data: AttendanceAdjustmentRequest): Promise<AttendanceLogResponse> => {
    const response = (await api.post("/attendance/adjust", data)) as any;
    return response.data;
  },

  approveAdjustment: async (id: number, approve: boolean): Promise<AttendanceLogResponse> => {
    const response = (await api.put(`/attendance/logs/${id}/approve`, null, {
      params: { approve },
    })) as any;
    return response.data;
  },

  getAttendanceLogs: async (params: {
    employeeId?: number | null;
    startDate?: string | null;
    endDate?: string | null;
    status?: string | null;
    departmentId?: number | null;
    page?: number;
    size?: number;
  }): Promise<PageResponse<AttendanceLogResponse>> => {
    const response = (await api.get("/attendance/logs", { params })) as any;
    return response.data;
  },

  importAttendance: async (file: File): Promise<void> => {
    const formData = new FormData();
    formData.append("file", file);
    await api.post("/attendance/import", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  }
};
