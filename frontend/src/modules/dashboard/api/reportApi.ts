import api from "../../../config/api";

export interface DeptHeadcount {
  departmentName: string;
  headcount: number;
}

export interface MonthlyPayroll {
  monthYear: string;
  totalCost: number;
}

export interface DeptAttendanceStats {
  employeeName: string;
  lateCount: number;
  absentCount: number;
}

export interface RecruitmentFunnel {
  stage: string;
  stageLabel: string;
  count: number;
}

export interface RecruitmentSource {
  source: string;
  count: number;
}

export interface DashboardReportResponse {
  deptHeadcounts: DeptHeadcount[] | null;
  monthlyPayrolls: MonthlyPayroll[] | null;
  deptAttendanceStats: DeptAttendanceStats[] | null;
  recruitmentFunnels: RecruitmentFunnel[] | null;
  recruitmentSources: RecruitmentSource[] | null;
  totalEmployees: number;
  activeJobs: number;
  totalApplications: number;
  currentMonthPayrollCost: number;
  turnoverRate: number;
}

export const reportApi = {
  getDashboardReport: async (): Promise<DashboardReportResponse> => {
    const response = (await api.get("/dashboard/reports")) as any;
    return response.data;
  },
};
