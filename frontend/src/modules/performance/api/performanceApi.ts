import api from "../../../config/api";

export interface ReviewCycleResponse {
  id: number;
  name: string;
  cycleType: string; // MONTHLY|QUARTERLY|YEARLY
  startDate: string;
  endDate: string;
  status: string; // DRAFT|ACTIVE|COMPLETED
}

export interface KpiRecordResponse {
  id?: number;
  kpiName: string;
  weight: number;
  target: string;
  actual: string;
  score: number;
}

export interface PerformanceReviewResponse {
  id: number;
  cycleId: number;
  cycleName: string;
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  departmentName: string;
  reviewerId: number;
  reviewerName: string;
  selfScore: number | null;
  reviewerScore: number | null;
  finalScore: number | null;
  rating: string | null; // EXCELLENT|GOOD|MEETS|BELOW|POOR
  strengths: string | null;
  improvements: string | null;
  goalsNext: string | null;
  status: string; // PENDING_SELF|PENDING_REVIEWER|COMPLETED
  completedAt: string | null;
  kpis: KpiRecordResponse[];
}

export const performanceApi = {
  // Review Cycles
  getCycles: async (): Promise<ReviewCycleResponse[]> => {
    const response = (await api.get("/performance/cycles")) as any;
    return response.data;
  },
  getCycle: async (id: number): Promise<ReviewCycleResponse> => {
    const response = (await api.get(`/performance/cycles/${id}`)) as any;
    return response.data;
  },
  createCycle: async (data: Partial<ReviewCycleResponse>): Promise<ReviewCycleResponse> => {
    const response = (await api.post("/performance/cycles", data)) as any;
    return response.data;
  },
  updateCycleStatus: async (id: number, status: string): Promise<ReviewCycleResponse> => {
    const response = (await api.put(`/performance/cycles/${id}/status`, null, { params: { status } })) as any;
    return response.data;
  },

  // Performance Reviews
  getReview: async (id: number): Promise<PerformanceReviewResponse> => {
    const response = (await api.get(`/performance/reviews/${id}`)) as any;
    return response.data;
  },
  getMyReviews: async (): Promise<PerformanceReviewResponse[]> => {
    const response = (await api.get("/performance/reviews/my")) as any;
    return response.data;
  },
  getReviewsToEvaluate: async (): Promise<PerformanceReviewResponse[]> => {
    const response = (await api.get("/performance/reviews/reviewer")) as any;
    return response.data;
  },
  getReviewsByCycle: async (cycleId: number): Promise<PerformanceReviewResponse[]> => {
    const response = (await api.get(`/performance/reviews/cycle/${cycleId}`)) as any;
    return response.data;
  },
  selfEvaluate: async (
    id: number,
    data: {
      selfScore: number;
      strengths: string;
      improvements: string;
      goalsNext: string;
    }
  ): Promise<PerformanceReviewResponse> => {
    const response = (await api.post(`/performance/reviews/${id}/self`, data)) as any;
    return response.data;
  },
  managerEvaluate: async (
    id: number,
    data: {
      reviewerScore: number;
      kpis: KpiRecordResponse[];
    }
  ): Promise<PerformanceReviewResponse> => {
    const response = (await api.post(`/performance/reviews/${id}/evaluate`, data)) as any;
    return response.data;
  },
};
