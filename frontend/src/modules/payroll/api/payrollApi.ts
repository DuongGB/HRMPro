import api from "../../../config/api";

export interface SalaryConfigResponse {
  id: number;
  effectiveDate: string;
  minWage: number;
  socialInsuranceRate: number;
  healthInsuranceRate: number;
  unemploymentRate: number;
  personalDeduction: number;
  dependentDeduction: number;
  isActive: boolean;
}

export interface EmployeeAllowanceResponse {
  id: number;
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  allowanceType: string; // MEAL|TRANSPORT|PHONE|HOUSING|RESPONSIBILITY
  amount: number;
  isTaxable: boolean;
  effectiveDate: string;
  endDate: string | null;
}

export interface PayrollRunResponse {
  id: number;
  year: number;
  month: number;
  status: string; // DRAFT|PROCESSING|COMPLETED|PUBLISHED
  runById: number;
  runByName: string;
  runAt: string;
  publishedAt: string | null;
  notes: string | null;
}

export interface PayslipResponse {
  id: number;
  payrollRunId: number;
  year: number;
  month: number;
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  departmentName: string;
  positionName: string;
  baseSalary: number;
  totalAllowances: number;
  grossSalary: number;
  socialInsurance: number;
  healthInsurance: number;
  unemployment: number;
  taxableIncome: number;
  personalIncomeTax: number;
  otherDeductions: number;
  netSalary: number;
  actualWorkDays: number;
  standardWorkDays: number;
  pdfUrl: string | null;
}

export const payrollApi = {
  // Cấu hình lương gốc
  getConfigs: async (): Promise<SalaryConfigResponse[]> => {
    const response = (await api.get("/payroll/configs")) as any;
    return response.data;
  },
  getActiveConfig: async (): Promise<SalaryConfigResponse> => {
    const response = (await api.get("/payroll/configs/active")) as any;
    return response.data;
  },
  createConfig: async (data: Partial<SalaryConfigResponse>): Promise<SalaryConfigResponse> => {
    const response = (await api.post("/payroll/configs", data)) as any;
    return response.data;
  },
  updateConfig: async (id: number, data: Partial<SalaryConfigResponse>): Promise<SalaryConfigResponse> => {
    const response = (await api.put(`/payroll/configs/${id}`, data)) as any;
    return response.data;
  },

  // Phụ cấp nhân viên
  getAllowances: async (employeeId: number): Promise<EmployeeAllowanceResponse[]> => {
    const response = (await api.get("/payroll/allowances", { params: { employeeId } })) as any;
    return response.data;
  },
  createAllowance: async (data: Partial<EmployeeAllowanceResponse>): Promise<EmployeeAllowanceResponse> => {
    const response = (await api.post("/payroll/allowances", data)) as any;
    return response.data;
  },
  updateAllowance: async (id: number, data: Partial<EmployeeAllowanceResponse>): Promise<EmployeeAllowanceResponse> => {
    const response = (await api.put(`/payroll/allowances/${id}`, data)) as any;
    return response.data;
  },
  deleteAllowance: async (id: number): Promise<void> => {
    await api.delete(`/payroll/allowances/${id}`);
  },

  // Kỳ chạy lương
  getPayrollRuns: async (): Promise<PayrollRunResponse[]> => {
    const response = (await api.get("/payroll/runs")) as any;
    return response.data;
  },
  getPayrollRun: async (id: number): Promise<PayrollRunResponse> => {
    const response = (await api.get(`/payroll/runs/${id}`)) as any;
    return response.data;
  },
  createPayrollRun: async (data: { year: number; month: number; notes?: string }): Promise<PayrollRunResponse> => {
    const response = (await api.post("/payroll/runs", data)) as any;
    return response.data;
  },
  recalculateRun: async (id: number): Promise<void> => {
    await api.post(`/payroll/runs/${id}/calculate`);
  },
  updateRunStatus: async (id: number, status: string): Promise<PayrollRunResponse> => {
    const response = (await api.put(`/payroll/runs/${id}/status`, null, { params: { status } })) as any;
    return response.data;
  },
  getPayslips: async (id: number): Promise<PayslipResponse[]> => {
    const response = (await api.get(`/payroll/runs/${id}/payslips`)) as any;
    return response.data;
  },
  updatePayslipDeductions: async (id: number, amount: number): Promise<PayslipResponse> => {
    const response = (await api.put(`/payroll/payslips/${id}/deductions`, null, { params: { amount } })) as any;
    return response.data;
  },

  // Cá nhân
  getMyPayslips: async (): Promise<PayslipResponse[]> => {
    const response = (await api.get("/payroll/my-payslips")) as any;
    return response.data;
  },
  getPayslipPdfUrl: async (id: number): Promise<string> => {
    const response = (await api.get(`/payroll/payslips/${id}/pdf`)) as any;
    return response.data;
  },
};
