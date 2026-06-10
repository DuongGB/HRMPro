import api from "../../../config/api";
import { type PageResponse } from "../../users/api/userApi";

export interface EmployeeResponse {
  id: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  personalEmail: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  idCardNumber: string | null;
  idCardIssuedDate: string | null;
  idCardIssuedPlace: string | null;
  permanentAddress: string | null;
  currentAddress: string | null;
  avatarUrl: string | null;
  hireDate: string;
  probationEndDate: string | null;
  terminationDate: string | null;
  status: string; // ACTIVE|PROBATION|ON_LEAVE|TERMINATED
  
  departmentId: number | null;
  departmentName: string | null;
  positionId: number | null;
  positionName: string | null;
  managerId: number | null;
  managerName: string | null;
  
  taxCode: string | null;
  bankAccountNumber: string | null;
  bankName: string | null;
  socialInsuranceId: string | null;
}

export interface EmployeeCreateRequest {
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  personalEmail?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  idCardNumber?: string;
  idCardIssuedDate?: string;
  idCardIssuedPlace?: string;
  permanentAddress?: string;
  currentAddress?: string;
  hireDate: string;
  probationEndDate?: string;
  departmentId?: number;
  positionId?: number;
  managerId?: number;
  taxCode?: string;
  bankAccountNumber?: string;
  bankName?: string;
  socialInsuranceId?: string;
}

export interface EmployeeUpdateRequest {
  firstName: string;
  lastName: string;
  email: string;
  personalEmail?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  idCardNumber?: string;
  idCardIssuedDate?: string;
  idCardIssuedPlace?: string;
  permanentAddress?: string;
  currentAddress?: string;
  probationEndDate?: string;
  departmentId?: number;
  positionId?: number;
  managerId?: number;
  taxCode?: string;
  bankAccountNumber?: string;
  bankName?: string;
  socialInsuranceId?: string;
}

export interface ContractResponse {
  id: number;
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  contractNumber: string;
  contractType: string;
  startDate: string;
  endDate: string | null;
  baseSalary: number;
  documentUrl: string | null;
  status: string;
  signedAt: string | null;
  notes: string | null;
}

export interface ContractRequest {
  contractNumber: string;
  contractType: string;
  startDate: string;
  endDate?: string | null;
  baseSalary: number;
  signedAt?: string | null;
  notes?: string;
}

export const employeeApi = {
  getEmployees: async (
    search = "",
    departmentId?: number | null,
    status = "",
    page = 0,
    size = 10
  ): Promise<PageResponse<EmployeeResponse>> => {
    const params: any = { page, size };
    if (search) params.search = search;
    if (departmentId) params.departmentId = departmentId;
    if (status) params.status = status;

    const response = (await api.get("/employees", { params })) as any;
    return response.data;
  },

  getEmployee: async (id: number): Promise<EmployeeResponse> => {
    const response = (await api.get(`/employees/${id}`)) as any;
    return response.data;
  },

  createEmployee: async (data: EmployeeCreateRequest): Promise<EmployeeResponse> => {
    const response = (await api.post("/employees", data)) as any;
    return response.data;
  },

  updateEmployee: async (id: number, data: EmployeeUpdateRequest): Promise<EmployeeResponse> => {
    const response = (await api.put(`/employees/${id}`, data)) as any;
    return response.data;
  },

  updateAvatar: async (id: number, file: File): Promise<EmployeeResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = (await api.post(`/employees/${id}/avatar`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })) as any;
    return response.data;
  },

  terminateEmployee: async (id: number, terminationDate: string): Promise<EmployeeResponse> => {
    const response = (await api.post(`/employees/${id}/terminate`, null, {
      params: { terminationDate },
    })) as any;
    return response.data;
  },

  getContracts: async (employeeId: number): Promise<ContractResponse[]> => {
    const response = (await api.get(`/employees/${employeeId}/contracts`)) as any;
    return response.data;
  },

  getContract: async (id: number): Promise<ContractResponse> => {
    const response = (await api.get(`/contracts/${id}`)) as any;
    return response.data;
  },

  createContract: async (
    employeeId: number,
    requestData: ContractRequest,
    file?: File
  ): Promise<ContractResponse> => {
    const formData = new FormData();
    // Wrap đối tượng JSON request thành Blob có kiểu application/json
    formData.append(
      "request",
      new Blob([JSON.stringify(requestData)], { type: "application/json" })
    );
    if (file) {
      formData.append("file", file);
    }

    const response = (await api.post(`/employees/${employeeId}/contracts`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })) as any;
    return response.data;
  },

  updateContract: async (
    contractId: number,
    requestData: ContractRequest,
    file?: File
  ): Promise<ContractResponse> => {
    const formData = new FormData();
    formData.append(
      "request",
      new Blob([JSON.stringify(requestData)], { type: "application/json" })
    );
    if (file) {
      formData.append("file", file);
    }

    const response = (await api.put(`/contracts/${contractId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })) as any;
    return response.data;
  },

  deleteContract: async (id: number): Promise<void> => {
    await api.delete(`/contracts/${id}`);
  }
};
