import api from "../../../config/api";

export interface JobPostingResponse {
  id: number;
  title: string;
  departmentId: number | null;
  departmentName: string | null;
  positionId: number | null;
  positionName: string | null;
  description: string | null;
  requirements: string | null;
  salaryRange: string | null;
  headcount: number;
  postingDate: string;
  closingDate: string;
  status: string; // OPEN|CLOSED|PAUSED|FILLED
  createdById: number | null;
  createdByName: string | null;
}

export interface ApplicationResponse {
  id: number;
  jobPostingId: number;
  jobPostingTitle: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  cvUrl: string;
  coverLetter: string | null;
  source: string; // LINKEDIN|INDEED|REFERRAL|WEBSITE
  stage: string; // NEW|SCREENING|INTERVIEW|OFFER|HIRED|REJECTED
  rejectedReason: string | null;
  appliedAt: string;
  updatedAt: string;
}

export interface InterviewResponse {
  id: number;
  applicationId: number;
  candidateName: string;
  jobPostingTitle: string;
  round: number;
  interviewType: string; // PHONE|ONLINE|ONSITE|TECHNICAL
  scheduledAt: string;
  durationMinutes: number;
  location: string | null;
  meetingUrl: string | null;
  interviewers: string; // comma-separated employee IDs
  interviewerNames: string;
  result: string | null; // PASSED|FAILED|NO_SHOW|RESCHEDULED
  feedback: string | null;
  approvalStatus: string | null;
  approvalFeedback: string | null;
}

export const recruitmentApi = {
  // Job Postings
  getJobs: async (): Promise<JobPostingResponse[]> => {
    const response = (await api.get("/recruitment/jobs")) as any;
    return response.data;
  },
  getJob: async (id: number): Promise<JobPostingResponse> => {
    const response = (await api.get(`/recruitment/jobs/${id}`)) as any;
    return response.data;
  },
  createJob: async (data: Partial<JobPostingResponse>): Promise<JobPostingResponse> => {
    const response = (await api.post("/recruitment/jobs", data)) as any;
    return response.data;
  },
  updateJob: async (id: number, data: Partial<JobPostingResponse>): Promise<JobPostingResponse> => {
    const response = (await api.put(`/recruitment/jobs/${id}`, data)) as any;
    return response.data;
  },

  // Applications
  getApplications: async (jobId?: number): Promise<ApplicationResponse[]> => {
    const response = (await api.get("/recruitment/applications", { params: { jobId } })) as any;
    return response.data;
  },
  getApplication: async (id: number): Promise<ApplicationResponse> => {
    const response = (await api.get(`/recruitment/applications/${id}`)) as any;
    return response.data;
  },
  createApplication: async (data: Partial<ApplicationResponse>): Promise<ApplicationResponse> => {
    const response = (await api.post("/recruitment/applications", data)) as any;
    return response.data;
  },
  updateApplicationStage: async (
    id: number,
    stage: string,
    rejectedReason?: string
  ): Promise<ApplicationResponse> => {
    const response = (await api.put(`/recruitment/applications/${id}/stage`, null, {
      params: { stage, rejectedReason },
    })) as any;
    return response.data;
  },

  // Interviews
  getInterviews: async (applicationId?: number): Promise<InterviewResponse[]> => {
    const response = (await api.get("/recruitment/interviews", { params: { applicationId } })) as any;
    return response.data;
  },
  getInterview: async (id: number): Promise<InterviewResponse> => {
    const response = (await api.get(`/recruitment/interviews/${id}`)) as any;
    return response.data;
  },
  scheduleInterview: async (data: Partial<InterviewResponse>): Promise<InterviewResponse> => {
    const response = (await api.post("/recruitment/interviews", data)) as any;
    return response.data;
  },
  approveInterviewSchedule: async (
    id: number,
    status: string,
    feedback?: string
  ): Promise<InterviewResponse> => {
    const response = (await api.put(`/recruitment/interviews/${id}/approve`, null, {
      params: { status, feedback },
    })) as any;
    return response.data;
  },
  updateInterviewResult: async (
    id: number,
    result: string,
    feedback?: string
  ): Promise<InterviewResponse> => {
    const response = (await api.put(`/recruitment/interviews/${id}/result`, null, {
      params: { result, feedback },
    })) as any;
    return response.data;
  },
};
