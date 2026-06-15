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

export interface EmployeeDashboardResponse {
  totalLeaveDays: number;
  usedLeaveDays: number;
  remainingLeaveDays: number;
  currentMonthWorkDays: number;
  currentMonthLateCount: number;
  currentMonthAbsentCount: number;
  standardWorkDays: number;
  latestPayslip: {
    id: number;
    year: number;
    month: number;
    netSalary: number;
    pdfUrl: string | null;
  } | null;
  pendingLeaveRequests: number;
  pendingAttendanceAdjustments: number;
}

export const reportApi = {
  getDashboardReport: async (): Promise<DashboardReportResponse> => {
    const response = (await api.get("/dashboard/reports")) as any;
    return response.data;
  },
  getEmployeeDashboard: async (): Promise<EmployeeDashboardResponse> => {
    const response = (await api.get("/dashboard/employee")) as any;
    return response.data;
  },
};
