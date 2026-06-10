import api from "../../../config/api";

export interface DepartmentResponse {
  id: number;
  code: string;
  name: string;
  parentId: number | null;
  parentName: string | null;
  managerId: number | null;
  managerCode: string | null;
  managerName: string | null;
  description: string | null;
  isActive: boolean;
  children?: DepartmentResponse[];
}

export interface DepartmentRequest {
  code: string;
  name: string;
  parentId?: number | null;
  managerId?: number | null;
  description?: string;
}

export interface PositionResponse {
  id: number;
  code: string;
  name: string;
  departmentId: number | null;
  departmentName: string | null;
  level: string;
  description: string | null;
  isActive: boolean;
}

export interface PositionRequest {
  code: string;
  name: string;
  departmentId: number;
  level: string;
  description?: string;
}

export const organizationApi = {
  getDepartmentTree: async (): Promise<DepartmentResponse[]> => {
    const response = (await api.get("/departments/tree")) as any;
    return response.data;
  },

  getDepartments: async (): Promise<DepartmentResponse[]> => {
    const response = (await api.get("/departments")) as any;
    return response.data;
  },

  createDepartment: async (data: DepartmentRequest): Promise<DepartmentResponse> => {
    const response = (await api.post("/departments", data)) as any;
    return response.data;
  },

  updateDepartment: async (id: number, data: DepartmentRequest): Promise<DepartmentResponse> => {
    const response = (await api.put(`/departments/${id}`, data)) as any;
    return response.data;
  },

  deleteDepartment: async (id: number): Promise<void> => {
    await api.delete(`/departments/${id}`);
  },

  getPositions: async (): Promise<PositionResponse[]> => {
    const response = (await api.get("/positions")) as any;
    return response.data;
  },

  getPositionsByDept: async (deptId: number): Promise<PositionResponse[]> => {
    const response = (await api.get(`/positions/department/${deptId}`)) as any;
    return response.data;
  },

  createPosition: async (data: PositionRequest): Promise<PositionResponse> => {
    const response = (await api.post("/positions", data)) as any;
    return response.data;
  },

  updatePosition: async (id: number, data: PositionRequest): Promise<PositionResponse> => {
    const response = (await api.put(`/positions/${id}`, data)) as any;
    return response.data;
  },

  deletePosition: async (id: number): Promise<void> => {
    await api.delete(`/positions/${id}`);
  }
};
