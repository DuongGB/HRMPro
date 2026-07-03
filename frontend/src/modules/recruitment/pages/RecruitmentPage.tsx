import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { recruitmentApi, type JobPostingResponse, type ApplicationResponse, type InterviewResponse } from "../api/recruitmentApi";
import { organizationApi } from "../../organization/api/organizationApi";
import { employeeApi } from "../../employee/api/employeeApi";
import { usePermission } from "../../../hooks/usePermission";
import { useWebSocket } from "../../../hooks/useWebSocket";
import { toast } from "sonner";
import {
  Briefcase,
  Calendar,
  Plus,
  Search,
  Download,
  Loader2,
  ExternalLink,
  ClipboardList,
  AlertTriangle,
  Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const KANBAN_STAGES = [
  { key: "NEW", label: "Mới ứng tuyển", color: "border-t-blue-500 bg-blue-500/5" },
  { key: "SCREENING", label: "Sàng lọc CV", color: "border-t-amber-500 bg-amber-500/5" },
  { key: "INTERVIEW", label: "Phỏng vấn", color: "border-t-purple-500 bg-purple-500/5" },
  { key: "OFFER", label: "Đề nghị (Offer)", color: "border-t-teal-500 bg-teal-500/5" },
  { key: "HIRED", label: "Đã tiếp nhận", color: "border-t-emerald-500 bg-emerald-500/5" },
  { key: "REJECTED", label: "Từ chối", color: "border-t-rose-500 bg-rose-500/5" },
];

const JOB_STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  CLOSED: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  PAUSED: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  FILLED: "bg-blue-500/10 text-blue-500 border-blue-500/20",
};

const INTERVIEW_RESULT_COLORS: Record<string, string> = {
  PASSED: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  FAILED: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  NO_SHOW: "bg-muted text-muted-foreground border-border",
  RESCHEDULED: "bg-amber-500/10 text-amber-500 border-amber-500/20",
};

const INTERVIEW_RESULT_LABELS: Record<string, string> = {
  PASSED: "Đạt (Passed)",
  FAILED: "Không đạt (Failed)",
  NO_SHOW: "Không đến (No Show)",
  RESCHEDULED: "Hẹn lịch lại",
};

const RecruitmentPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = usePermission();
  const roles = user?.roles || [];

  const isRecruiter = roles.includes("RECRUITER");

  // Kanban Filter & Data
  const [selectedJobIdFilter, setSelectedJobIdFilter] = useState<string>("all");

  // Dialog State: Thêm tin tuyển dụng
  const [isCreateJobOpen, setIsCreateJobOpen] = useState(false);
  const [jobTitle, setJobTitle] = useState("");
  const [jobDeptId, setJobDeptId] = useState("");
  const [jobPosId, setJobPosId] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [jobReq, setJobReq] = useState("");
  const [jobSalary, setJobSalary] = useState("");
  const [jobHeadcount, setJobHeadcount] = useState(1);
  const [jobClosingDate, setJobClosingDate] = useState("");

  // Dialog State: Đổi Trạng Thái Ứng Viên / Từ Chối
  const [isChangeStageOpen, setIsChangeStageOpen] = useState(false);
  const [targetAppId, setTargetAppId] = useState<number | null>(null);
  const [targetStage, setTargetStage] = useState("");
  const [rejectedReason, setRejectedReason] = useState("");

  const { isConnected, stompClient } = useWebSocket();

  React.useEffect(() => {
    if (isConnected && stompClient) {
      const kanbanSubscription = stompClient.subscribe('/topic/recruitment/kanban', (message) => {
        if (message.body) {
          const payload = JSON.parse(message.body);
          if (selectedJobIdFilter === "all" || selectedJobIdFilter === payload.jobId.toString()) {
             queryClient.invalidateQueries({ queryKey: ["applications", selectedJobIdFilter === "all" ? undefined : Number(selectedJobIdFilter)] });
          }
        }
      });

      const approvalSubscription = stompClient.subscribe('/topic/recruitment/interview-approval', (message) => {
        if (message.body) {
          queryClient.invalidateQueries({ queryKey: ["interviews"] });
          queryClient.invalidateQueries({ queryKey: ["applications"] });
        }
      });

      return () => {
        kanbanSubscription.unsubscribe();
        approvalSubscription.unsubscribe();
      };
    }
  }, [isConnected, stompClient, queryClient, selectedJobIdFilter]);

  // Dialog State: Lên lịch phỏng vấn
  const [isScheduleInterviewOpen, setIsScheduleInterviewOpen] = useState(false);
  const [interviewAppId, setInterviewAppId] = useState<number | null>(null);
  const [interviewRound, setInterviewRound] = useState(1);
  const [interviewType, setInterviewType] = useState("ONLINE");
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewDuration, setInterviewDuration] = useState(60);
  const [interviewLocation, setInterviewLocation] = useState("");
  const [interviewUrl, setInterviewUrl] = useState("");
  const [selectedInterviewerIds, setSelectedInterviewerIds] = useState<string[]>([]);
  const [interviewerSearch, setInterviewerSearch] = useState("");
  const [isSelectInterviewersOpen, setIsSelectInterviewersOpen] = useState(false);

  // Drag and Drop State
  const [draggedAppId, setDraggedAppId] = useState<number | null>(null);
  const [draggedAppSourceStage, setDraggedAppSourceStage] = useState<string>("");
  const [activeDropStage, setActiveDropStage] = useState<string | null>(null);

  // Dialog State: Cập nhật kết quả phỏng vấn
  const [isInterviewResultOpen, setIsInterviewResultOpen] = useState(false);
  const [selectedInterviewId, setSelectedInterviewId] = useState<number | null>(null);
  const [interviewResult, setInterviewResult] = useState("PASSED");
  const [interviewFeedback, setInterviewFeedback] = useState("");

  // Dialog State: Phê duyệt lịch phỏng vấn
  const [isApproveScheduleOpen, setIsApproveScheduleOpen] = useState(false);
  const [targetScheduleId, setTargetScheduleId] = useState<number | null>(null);
  const [approvalStatusAction, setApprovalStatusAction] = useState("APPROVED");
  const [approvalFeedbackAction, setApprovalFeedbackAction] = useState("");

  // Dialog State: Xem chi tiết ứng viên
  const [isAppDetailOpen, setIsAppDetailOpen] = useState(false);
  const [viewingApp, setViewingApp] = useState<ApplicationResponse | null>(null);

  // Queries
  const { data: jobs = [], isLoading: isJobsLoading } = useQuery({
    queryKey: ["job-postings"],
    queryFn: recruitmentApi.getJobs,
  });

  const { data: applications = [], isLoading: isAppsLoading } = useQuery({
    queryKey: ["applications", selectedJobIdFilter],
    queryFn: () => recruitmentApi.getApplications(selectedJobIdFilter === "all" ? undefined : Number(selectedJobIdFilter)),
  });

  const { data: interviews = [], isLoading: isInterviewsLoading } = useQuery({
    queryKey: ["interviews"],
    queryFn: () => recruitmentApi.getInterviews(),
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments-recruitment"],
    queryFn: organizationApi.getDepartments,
    enabled: isCreateJobOpen,
  });

  const { data: positions = [] } = useQuery({
    queryKey: ["positions-recruitment", jobDeptId],
    queryFn: () => organizationApi.getPositionsByDept(Number(jobDeptId)),
    enabled: isCreateJobOpen && !!jobDeptId,
  });

  const { data: employeesPage } = useQuery({
    queryKey: ["employees-for-interviewers"],
    queryFn: () => employeeApi.getEmployees("", null, "ACTIVE", 0, 100),
    enabled: isScheduleInterviewOpen,
  });
  const employeeList = employeesPage?.content || [];

  const filteredInterviewers = employeeList.filter(emp => {
    const matchesSearch = emp.fullName.toLowerCase().includes(interviewerSearch.toLowerCase()) ||
                          emp.employeeCode.toLowerCase().includes(interviewerSearch.toLowerCase()) ||
                          (emp.positionName || "").toLowerCase().includes(interviewerSearch.toLowerCase());
    return matchesSearch;
  });

  // Mutations
  const createJobMutation = useMutation({
    mutationFn: recruitmentApi.createJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-postings"] });
      toast.success("Tạo tin tuyển dụng thành công!");
      setIsCreateJobOpen(false);
      resetJobForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Lỗi tạo tin tuyển dụng.");
    },
  });

  const updateJobStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<JobPostingResponse> }) =>
      recruitmentApi.updateJob(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-postings"] });
      toast.success("Cập nhật trạng thái tin tuyển dụng thành công!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Lỗi cập nhật trạng thái.");
    },
  });

  const updateStageMutation = useMutation({
    mutationFn: ({ id, stage, reason }: { id: number; stage: string; reason?: string }) =>
      recruitmentApi.updateApplicationStage(id, stage, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["interviews"] });
      toast.success("Cập nhật trạng thái ứng viên thành công!");
      setIsChangeStageOpen(false);
      setRejectedReason("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Lỗi cập nhật trạng thái ứng viên.");
    },
  });

  const scheduleInterviewMutation = useMutation({
    mutationFn: recruitmentApi.scheduleInterview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interviews"] });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast.success("Đặt lịch phỏng vấn và gửi email thành công!");
      setIsScheduleInterviewOpen(false);
      resetInterviewForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Lỗi lên lịch phỏng vấn.");
    },
  });

  const updateInterviewResultMutation = useMutation({
    mutationFn: ({ id, result, feedback }: { id: number; result: string; feedback?: string }) =>
      recruitmentApi.updateInterviewResult(id, result, feedback),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interviews"] });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast.success("Cập nhật kết quả phỏng vấn thành công!");
      setIsInterviewResultOpen(false);
      setInterviewFeedback("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Lỗi cập nhật kết quả phỏng vấn.");
    },
  });

  const approveScheduleMutation = useMutation({
    mutationFn: ({ id, status, feedback }: { id: number; status: string; feedback?: string }) =>
      recruitmentApi.approveInterviewSchedule(id, status, feedback),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interviews"] });
      toast.success("Cập nhật phê duyệt lịch phỏng vấn thành công!");
      setIsApproveScheduleOpen(false);
      setApprovalFeedbackAction("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Lỗi phê duyệt lịch phỏng vấn.");
    },
  });

  // Handlers
  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle || !jobDeptId || !jobClosingDate) {
      toast.error("Vui lòng điền tiêu đề, phòng ban và hạn nộp.");
      return;
    }
    createJobMutation.mutate({
      title: jobTitle,
      departmentId: Number(jobDeptId),
      positionId: jobPosId ? Number(jobPosId) : null,
      description: jobDesc,
      requirements: jobReq,
      salaryRange: jobSalary,
      headcount: Number(jobHeadcount),
      closingDate: jobClosingDate,
      status: "OPEN",
    });
  };

  const resetJobForm = () => {
    setJobTitle("");
    setJobDeptId("");
    setJobPosId("");
    setJobDesc("");
    setJobReq("");
    setJobSalary("");
    setJobHeadcount(1);
    setJobClosingDate("");
  };

  const handleStageChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetAppId === null) return;
    updateStageMutation.mutate({
      id: targetAppId,
      stage: targetStage,
      reason: targetStage === "REJECTED" ? rejectedReason : undefined,
    });
  };

  const handleScheduleInterviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (interviewAppId === null || !interviewDate) {
      toast.error("Vui lòng điền ngày giờ phỏng vấn.");
      return;
    }
    scheduleInterviewMutation.mutate({
      applicationId: interviewAppId,
      round: Number(interviewRound),
      interviewType,
      scheduledAt: interviewDate,
      durationMinutes: Number(interviewDuration),
      location: interviewLocation || null,
      meetingUrl: interviewUrl || null,
      interviewers: selectedInterviewerIds.join(","),
    });
  };

  const resetInterviewForm = () => {
    setInterviewAppId(null);
    setInterviewRound(1);
    setInterviewType("ONLINE");
    setInterviewDate("");
    setInterviewDuration(60);
    setInterviewLocation("");
    setInterviewUrl("");
    setSelectedInterviewerIds([]);
  };

  const handleInterviewResultSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedInterviewId === null) return;
    updateInterviewResultMutation.mutate({
      id: selectedInterviewId,
      result: interviewResult,
      feedback: interviewFeedback,
    });
  };

  const openChangeStageModal = (appId: number, _currentStage: string, nextStage: string) => {
    setTargetAppId(appId);
    setTargetStage(nextStage);
    setRejectedReason("");
    setIsChangeStageOpen(true);
  };

  const openScheduleInterviewModal = (appId: number) => {
    setInterviewAppId(appId);
    setInterviewRound(1);
    setInterviewDate("");
    setInterviewLocation("");
    setInterviewUrl("");
    setSelectedInterviewerIds([]);
    setInterviewerSearch("");
    setIsSelectInterviewersOpen(false);
    setIsScheduleInterviewOpen(true);
  };

  const openInterviewResultModal = (interview: InterviewResponse) => {
    setSelectedInterviewId(interview.id);
    setInterviewResult(interview.result || "PASSED");
    setInterviewFeedback(interview.feedback || "");
    setIsInterviewResultOpen(true);
  };

  const openAppDetailModal = async (appId: number) => {
    try {
      const app = await recruitmentApi.getApplication(appId);
      setViewingApp(app);
      setIsAppDetailOpen(true);
    } catch (e: any) {
      toast.error("Không thể tải thông tin ứng viên.");
    }
  };

  const handleInterviewerSelect = (empId: string) => {
    if (selectedInterviewerIds.includes(empId)) {
      setSelectedInterviewerIds(selectedInterviewerIds.filter(id => id !== empId));
    } else {
      setSelectedInterviewerIds([...selectedInterviewerIds, empId]);
    }
  };

  const handleDragStart = (e: React.DragEvent, appId: number, currentStage: string) => {
    if (!isRecruiter) return;
    setDraggedAppId(appId);
    setDraggedAppSourceStage(currentStage);
    e.dataTransfer.setData("text/plain", String(appId));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragEnter = (e: React.DragEvent, stageKey: string) => {
    e.preventDefault();
    if (!isRecruiter) return;
    setActiveDropStage(stageKey);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStageKey: string) => {
    e.preventDefault();
    setActiveDropStage(null);
    if (!isRecruiter) return;
    
    const appId = Number(e.dataTransfer.getData("text/plain")) || draggedAppId;
    const sourceStage = draggedAppSourceStage;
    
    if (appId && sourceStage && sourceStage !== targetStageKey) {
      openChangeStageModal(appId, sourceStage, targetStageKey);
    }
    
    setDraggedAppId(null);
    setDraggedAppSourceStage("");
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Briefcase className="h-8 w-8 text-primary" /> Quản lý Tuyển dụng
          </h1>
          <p className="text-muted-foreground mt-1">
            Quản lý chiến dịch tuyển dụng, theo dõi pipeline ứng viên kéo thả và đặt lịch phỏng vấn tự động.
          </p>
        </div>

        {isRecruiter && (
          <Button onClick={() => setIsCreateJobOpen(true)} className="bg-primary hover:bg-primary/90 text-white font-medium">
            <Plus className="h-5 w-5 mr-1" /> Đăng tin tuyển dụng
          </Button>
        )}
      </div>

      <Tabs defaultValue="kanban" className="space-y-6">
        <TabsList className="bg-muted border border-border p-1 rounded-lg">
          <TabsTrigger value="kanban">
            Pipeline Ứng Viên (Kanban)
          </TabsTrigger>
          <TabsTrigger value="jobs">
            Tin Tuyển Dụng
          </TabsTrigger>
          <TabsTrigger value="interviews">
            Lịch Phỏng Vấn
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Kanban Pipeline */}
        <TabsContent value="kanban" className="space-y-4">
          <div className="flex items-center gap-4 bg-card p-4 border border-border rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Search className="h-4 w-4" /> Lọc theo tin tuyển dụng:
            </div>
            <Select value={selectedJobIdFilter} onValueChange={setSelectedJobIdFilter}>
              <SelectTrigger className="w-[300px] bg-background text-foreground">
                <SelectValue placeholder="Tất cả chiến dịch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả tin tuyển dụng</SelectItem>
                {jobs.map(j => (
                  <SelectItem key={j.id} value={String(j.id)}>{j.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isAppsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4 items-start w-full">
              {KANBAN_STAGES.map(stage => {
                const stageApps = applications.filter(a => a.stage === stage.key);
                return (
                  <div
                    key={stage.key}
                    onDragOver={handleDragOver}
                    onDragEnter={(e) => handleDragEnter(e, stage.key)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, stage.key)}
                    className={`border-t-4 ${stage.color} border ${
                      activeDropStage === stage.key
                        ? "border-purple-500 bg-purple-500/10 ring-2 ring-purple-500/20"
                        : "border-border"
                    } rounded-lg p-3 w-[280px] shrink-0 space-y-4 transition-all duration-200`}
                  >
                    <div className="flex justify-between items-center border-b border-border pb-2">
                      <span className="font-semibold text-foreground text-sm">{stage.label}</span>
                      <Badge className="bg-muted text-muted-foreground font-bold">{stageApps.length}</Badge>
                    </div>

                    <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                      {stageApps.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground text-xs italic">Không có hồ sơ</div>
                      ) : (
                        stageApps.map(app => (
                          <Card
                            key={app.id}
                            draggable={isRecruiter}
                            onDragStart={(e) => handleDragStart(e, app.id, app.stage)}
                            onDragEnd={() => {
                              setActiveDropStage(null);
                              setDraggedAppId(null);
                            }}
                            className={`bg-card border-border hover:border-foreground/30 transition text-foreground cursor-grab active:cursor-grabbing ${
                              draggedAppId === app.id ? "opacity-40 border-purple-500 border-dashed" : ""
                            }`}
                          >
                            <CardContent className="p-3 space-y-2 text-xs">
                              <div className="font-bold text-sm text-foreground/90 hover:text-foreground cursor-pointer" onClick={() => openAppDetailModal(app.id)}>
                                {app.candidateName}
                              </div>
                              <div className="text-muted-foreground font-medium line-clamp-1">{app.jobPostingTitle}</div>
                              <div className="text-muted-foreground/90">Nguồn: <span className="text-foreground">{app.source}</span></div>

                              <div className="flex justify-between items-center pt-2 border-t border-border">
                                {app.cvUrl ? (
                                  <a href={app.cvUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-0.5">
                                    <Download className="h-3 w-3" /> CV File
                                  </a>
                                ) : (
                                  <span className="text-muted-foreground">Không có CV</span>
                                )}

                                {isRecruiter && (
                                  <Select onValueChange={(val) => openChangeStageModal(app.id, app.stage, val)}>
                                    <SelectTrigger className="h-6 w-fit bg-muted border-border text-[10px] py-0 px-2 text-foreground">
                                      <SelectValue placeholder="Đổi Cột" />
                                    </SelectTrigger>
                                    <SelectContent className="text-xs">
                                      {KANBAN_STAGES.map(s => (
                                        <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              </div>

                              {(stage.key === "SCREENING" || stage.key === "INTERVIEW") && isRecruiter && (
                                <Button size="sm" onClick={() => openScheduleInterviewModal(app.id)} className="w-full mt-2 h-7 bg-purple-600 hover:bg-purple-700 text-white text-[10px]">
                                  <Calendar className="h-3 w-3 mr-1" /> Lên lịch PV
                                </Button>
                              )}
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Job Postings */}
        <TabsContent value="jobs">
          <Card>
            <CardHeader>
              <CardTitle>Chiến dịch tuyển dụng</CardTitle>
              <CardDescription>
                Theo dõi trạng thái tuyển dụng và hạn đóng hồ sơ của các vị trí đang tuyển.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isJobsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-lg">
                  Chưa có chiến dịch tuyển dụng nào được tạo.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="text-muted-foreground font-medium">Vị trí tuyển dụng</TableHead>
                        <TableHead className="text-muted-foreground font-medium">Phòng ban</TableHead>
                        <TableHead className="text-muted-foreground font-medium">Chức vụ</TableHead>
                        <TableHead className="text-muted-foreground font-medium">Khoảng lương</TableHead>
                        <TableHead className="text-muted-foreground font-medium text-center">Số lượng</TableHead>
                        <TableHead className="text-muted-foreground font-medium">Hạn nộp</TableHead>
                        <TableHead className="text-muted-foreground font-medium">Trạng thái</TableHead>
                        {isRecruiter && <TableHead className="text-muted-foreground font-medium text-right">Thao tác</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobs.map((job) => (
                        <TableRow key={job.id} className="border-border hover:bg-muted/20">
                          <TableCell className="font-semibold text-foreground">{job.title}</TableCell>
                          <TableCell className="text-foreground/90">{job.departmentName}</TableCell>
                          <TableCell className="text-foreground/90">{job.positionName || "—"}</TableCell>
                          <TableCell className="text-foreground font-semibold text-primary">{job.salaryRange || "Thỏa thuận"}</TableCell>
                          <TableCell className="text-center font-bold">{job.headcount}</TableCell>
                          <TableCell className="text-muted-foreground">{job.closingDate ? new Date(job.closingDate).toLocaleDateString("vi-VN") : "—"}</TableCell>
                          <TableCell>
                            <Badge className={`${JOB_STATUS_COLORS[job.status]} border font-semibold`}>
                              {job.status}
                            </Badge>
                          </TableCell>
                          {isRecruiter && (
                            <TableCell className="text-right">
                              <Select onValueChange={(val) => updateJobStatusMutation.mutate({ id: job.id, data: { status: val } })}>
                                <SelectTrigger className="h-8 w-[110px] ml-auto bg-muted border-border text-xs">
                                  <SelectValue placeholder="Đổi trạng thái" />
                                </SelectTrigger>
                                <SelectContent className="text-xs">
                                  <SelectItem value="OPEN">Mở tuyển</SelectItem>
                                  <SelectItem value="PAUSED">Tạm dừng</SelectItem>
                                  <SelectItem value="CLOSED">Đóng tuyển</SelectItem>
                                  <SelectItem value="FILLED">Đã tuyển đủ</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Interviews */}
        <TabsContent value="interviews">
          <Card>
            <CardHeader>
              <CardTitle>Lịch trình phỏng vấn</CardTitle>
              <CardDescription>
                Theo dõi thời gian phỏng vấn, kiểm tra người phỏng vấn và ghi nhận kết quả đánh giá ứng viên.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isInterviewsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : interviews.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-lg">
                  Không có buổi phỏng vấn nào được đặt lịch.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="text-muted-foreground font-medium">Ứng viên</TableHead>
                        <TableHead className="text-muted-foreground font-medium">Vị trí tuyển</TableHead>
                        <TableHead className="text-muted-foreground font-medium text-center">Vòng</TableHead>
                        <TableHead className="text-muted-foreground font-medium">Hình thức</TableHead>
                        <TableHead className="text-muted-foreground font-medium">Thời gian</TableHead>
                        <TableHead className="text-muted-foreground font-medium">Người phỏng vấn</TableHead>
                        <TableHead className="text-muted-foreground font-medium">Trạng thái duyệt</TableHead>
                        <TableHead className="text-muted-foreground font-medium">Đánh giá/Kết quả</TableHead>
                        <TableHead className="text-muted-foreground font-medium text-right">Hành động</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {interviews.map((int) => (
                        <TableRow key={int.id} className="border-border hover:bg-muted/20">
                          <TableCell className="font-semibold text-foreground">{int.candidateName}</TableCell>
                          <TableCell className="text-foreground/90">{int.jobPostingTitle}</TableCell>
                          <TableCell className="text-center font-bold text-purple-400">Vòng {int.round}</TableCell>
                          <TableCell className="text-foreground/90">{int.interviewType}</TableCell>
                          <TableCell className="text-foreground/90">
                            {int.scheduledAt ? new Date(int.scheduledAt).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" }) : "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">{int.interviewerNames || "Chưa phân công"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`font-semibold ${
                              int.approvalStatus === "APPROVED" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                              int.approvalStatus === "REJECTED" ? "bg-rose-500/10 text-rose-500 border-rose-500/20" :
                              "bg-amber-500/10 text-amber-500 border-amber-500/20"
                            }`}>
                              {int.approvalStatus === "APPROVED" ? "Đã duyệt" :
                               int.approvalStatus === "REJECTED" ? "Từ chối" : "Chờ duyệt"}
                            </Badge>
                            {int.approvalStatus === "REJECTED" && int.approvalFeedback && (
                              <div className="text-[10px] text-rose-500 italic mt-0.5 max-w-[120px] truncate" title={int.approvalFeedback}>
                                Lý do: {int.approvalFeedback}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {int.result ? (
                              <Badge className={`${INTERVIEW_RESULT_COLORS[int.result]} border font-semibold`}>
                                {INTERVIEW_RESULT_LABELS[int.result]}
                              </Badge>
                            ) : (int.scheduledAt && new Date(int.scheduledAt).getTime() > new Date().getTime()) ? (
                              <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Chưa diễn ra</Badge>
                            ) : (
                              <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Chờ phỏng vấn</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right space-x-1">
                            {isRecruiter && int.approvalStatus === "APPROVED" && (
                              (() => {
                                const isFutureInterview = int.scheduledAt ? new Date(int.scheduledAt).getTime() > new Date().getTime() : false;
                                return (
                                  <Button 
                                    size="sm" 
                                    onClick={() => openInterviewResultModal(int)} 
                                    className="bg-muted hover:bg-muted/80 text-foreground text-xs h-8"
                                    disabled={isFutureInterview}
                                    title={isFutureInterview ? "Không thể nhận xét cuộc phỏng vấn chưa diễn ra" : ""}
                                  >
                                    <ClipboardList className="h-4 w-4 mr-1" /> Nhận xét
                                  </Button>
                                );
                              })()
                            )}
                            {(() => {
                              const isSystemAdmin = roles.some(r => ["SUPER_ADMIN", "HR_ADMIN"].includes(r));
                              const isInterviewerOfThis = int.interviewers ? 
                                int.interviewers.split(",")
                                  .map((s: string) => s.trim().replace("[", "").replace("]", "").replace(/"/g, "").replace(/'/g, ""))
                                  .filter((s: string) => s !== "")
                                  .includes(String(user?.employeeId)) : false;
                              
                              const canApproveThis = isSystemAdmin || isInterviewerOfThis;
                              
                              return canApproveThis && int.approvalStatus === "PENDING" && (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setTargetScheduleId(int.id);
                                    setApprovalStatusAction("APPROVED");
                                    setApprovalFeedbackAction("");
                                    setIsApproveScheduleOpen(true);
                                  }}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                                >
                                  Duyệt lịch
                                </Button>
                              );
                            })()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* DIALOG 1: ĐĂNG TIN TUYỂN DỤNG (HR) */}
      <Dialog open={isCreateJobOpen} onOpenChange={setIsCreateJobOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Đăng Tin Tuyển Dụng Mới</DialogTitle>
            <DialogDescription>
              Điền thông tin chi tiết công việc để bắt đầu chiến dịch thu hút nhân tài.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateJob} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="job-title">Tiêu đề tin tuyển dụng</Label>
              <Input
                id="job-title"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Ví dụ: Senior Java Engineer, UI/UX Designer..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="job-dept">Phòng ban</Label>
                <Select value={jobDeptId} onValueChange={setJobDeptId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn phòng ban" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(d => (
                      <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="job-pos">Chức vụ (Tùy chọn)</Label>
                <Select value={jobPosId} onValueChange={setJobPosId} disabled={!jobDeptId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn chức vụ" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map(p => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="job-salary">Mức lương</Label>
                <Input
                  id="job-salary"
                  value={jobSalary}
                  onChange={(e) => setJobSalary(e.target.value)}
                  placeholder="Ví dụ: 15-20 triệu, Thỏa thuận..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="job-hc">Số lượng tuyển</Label>
                <Input
                  id="job-hc"
                  type="number"
                  min="1"
                  value={jobHeadcount}
                  onChange={(e) => setJobHeadcount(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="job-closing">Hạn chót nộp hồ sơ</Label>
              <Input
                id="job-closing"
                type="date"
                value={jobClosingDate}
                onChange={(e) => setJobClosingDate(e.target.value)}
                className="[color-scheme:dark] dark:[color-scheme:dark]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job-desc">Mô tả công việc</Label>
              <Textarea
                id="job-desc"
                rows={3}
                value={jobDesc}
                onChange={(e) => setJobDesc(e.target.value)}
                placeholder="Nhiệm vụ chính, công việc hàng ngày..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job-req">Yêu cầu ứng viên</Label>
              <Textarea
                id="job-req"
                rows={3}
                value={jobReq}
                onChange={(e) => setJobReq(e.target.value)}
                placeholder="Kinh nghiệm, kỹ năng cần thiết..."
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateJobOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={createJobMutation.isPending} className="bg-primary text-white">
                {createJobMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Đăng tuyển
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: LÝ DO TỪ CHỐI ỨNG VIÊN */}
      <Dialog open={isChangeStageOpen} onOpenChange={setIsChangeStageOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Xác nhận chuyển trạng thái</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn chuyển ứng viên sang cột <strong>{targetStage}</strong>?
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleStageChangeSubmit} className="space-y-4">
            {targetStage === "REJECTED" && (
              <div className="space-y-2">
                <Label htmlFor="reject-reason">Lý do từ chối (Gửi phản hồi cho ứng viên)</Label>
                <Textarea
                  id="reject-reason"
                  required
                  value={rejectedReason}
                  onChange={(e) => setRejectedReason(e.target.value)}
                  placeholder="Ví dụ: Chưa đạt số năm kinh nghiệm, kỹ năng ngoại ngữ chưa đáp ứng..."
                />
              </div>
            )}
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsChangeStageOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={updateStageMutation.isPending} className={targetStage === "REJECTED" ? "bg-rose-600 hover:bg-rose-700 text-white" : "bg-primary text-white"}>
                {updateStageMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Đồng ý
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 3: LÊN LỊCH PHỎNG VẤN */}
      <Dialog open={isScheduleInterviewOpen} onOpenChange={setIsScheduleInterviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Lên Lịch Phỏng Vấn & Gửi Email</DialogTitle>
            <DialogDescription>
              Hệ thống sẽ tự động gửi thư mời phỏng vấn có chứa thời gian và link/địa điểm họp cho ứng viên và người phỏng vấn.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleScheduleInterviewSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="int-round">Vòng phỏng vấn</Label>
                <Input
                  id="int-round"
                  type="number"
                  min="1"
                  value={interviewRound}
                  onChange={(e) => setInterviewRound(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="int-type">Hình thức</Label>
                <Select value={interviewType} onValueChange={setInterviewType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn hình thức" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ONLINE">Phỏng vấn Online (Meet/Zoom)</SelectItem>
                    <SelectItem value="ONSITE">Phỏng vấn Trực tiếp (Onsite)</SelectItem>
                    <SelectItem value="PHONE">Phỏng vấn qua điện thoại</SelectItem>
                    <SelectItem value="TECHNICAL">Kiểm tra năng lực lập trình</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="int-date">Thời gian bắt đầu</Label>
                <Input
                  id="int-date"
                  type="datetime-local"
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  className="dark:[color-scheme:dark]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="int-dur">Thời lượng (Phút)</Label>
                <Input
                  id="int-dur"
                  type="number"
                  min="15"
                  value={interviewDuration}
                  onChange={(e) => setInterviewDuration(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="int-loc">Địa điểm (Nếu phỏng vấn trực tiếp)</Label>
              <Input
                id="int-loc"
                value={interviewLocation}
                onChange={(e) => setInterviewLocation(e.target.value)}
                placeholder="Ví dụ: Phòng họp 1, Tầng 3 Tòa nhà ABC..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="int-url">Link họp trực tuyến (Nếu phỏng vấn Online)</Label>
              <Input
                id="int-url"
                value={interviewUrl}
                onChange={(e) => setInterviewUrl(e.target.value)}
                placeholder="Google Meet, Zoom link..."
              />
            </div>

            {/* Phân công người phỏng vấn */}
            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-semibold text-foreground/80">Người phỏng vấn (Interviewers)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSelectInterviewersOpen(true)}
                  className="h-8 border-purple-500/30 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/20"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Chọn người phỏng vấn
                </Button>
              </div>

              {/* Danh sách người phỏng vấn đã chọn */}
              {selectedInterviewerIds.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 p-3 bg-purple-500/5 border border-dashed border-purple-500/20 rounded-lg max-h-[120px] overflow-y-auto">
                  {selectedInterviewerIds.map(idStr => {
                    const emp = employeeList.find(e => String(e.id) === idStr);
                    if (!emp) return null;
                    return (
                      <Badge key={idStr} variant="secondary" className="flex items-center gap-1 text-[10px] bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 pr-1 py-0.5">
                        {emp.fullName}
                        <button
                          type="button"
                          onClick={() => handleInterviewerSelect(idStr)}
                          className="hover:bg-purple-500/20 rounded-full p-0.5 ml-0.5 text-purple-600 dark:text-purple-400 font-bold"
                        >
                          ×
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4 border border-dashed border-border rounded-lg text-xs text-muted-foreground italic">
                  Chưa chọn người phỏng vấn nào. Vui lòng bấm nút chọn.
                </div>
              )}
              
              <p className="text-[10px] text-muted-foreground italic">
                * Tự động gửi email lịch phỏng vấn và hướng dẫn nhận xét cho người phỏng vấn đã được chọn.
              </p>
            </div>

            <DialogFooter className="pt-2 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setIsScheduleInterviewOpen(false)}>
                Đóng
              </Button>
              <Button type="submit" disabled={scheduleInterviewMutation.isPending} className="bg-primary text-white">
                {scheduleInterviewMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Lên lịch & Gửi Thư Mời
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 3.5: CHỌN NGƯỜI PHỎNG VẤN */}
      <Dialog open={isSelectInterviewersOpen} onOpenChange={setIsSelectInterviewersOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chọn Người Phỏng Vấn</DialogTitle>
            <DialogDescription>
              Tìm kiếm và chọn các Trưởng phòng, Giám đốc hoặc nhân viên khác tham gia phỏng vấn.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Thanh công cụ tìm kiếm */}
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tên, mã NV, chức vụ..."
                value={interviewerSearch}
                onChange={(e) => setInterviewerSearch(e.target.value)}
                className="pl-8 h-9 text-xs w-full"
              />
            </div>

            {/* Hiển thị số lượng đã chọn */}
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Tìm thấy {filteredInterviewers.length} nhân viên</span>
              <span className="font-semibold text-purple-600">Đã chọn: {selectedInterviewerIds.length} người</span>
            </div>

            {/* Danh sách checkbox kết quả lọc */}
            <div className="bg-muted/10 border border-border rounded-lg p-3 max-h-[250px] overflow-y-auto space-y-2">
              {filteredInterviewers.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground italic">
                  Không tìm thấy nhân viên phù hợp
                </div>
              ) : (
                filteredInterviewers.map(emp => {
                  const empIdStr = String(emp.id);
                  const isChecked = selectedInterviewerIds.includes(empIdStr);
                  return (
                    <div key={emp.id} className="flex items-center gap-2 py-1 hover:bg-muted/5 rounded px-1">
                      <input
                        type="checkbox"
                        id={`select-emp-${emp.id}`}
                        checked={isChecked}
                        onChange={() => handleInterviewerSelect(empIdStr)}
                        className="rounded border-border bg-background text-purple-600 focus:ring-purple-500 h-4 w-4"
                      />
                      <label htmlFor={`select-emp-${emp.id}`} className="text-xs text-foreground cursor-pointer flex-1 flex justify-between items-center">
                        <span className="font-medium text-foreground/90">{emp.fullName} ({emp.employeeCode})</span>
                        <span className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">
                          {emp.positionName || "Chưa gán vị trí"}
                        </span>
                      </label>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <DialogFooter className="pt-2 border-t border-border">
            <Button type="button" className="bg-primary text-white w-full" onClick={() => setIsSelectInterviewersOpen(false)}>
              Xác nhận ({selectedInterviewerIds.length} đã chọn)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 4: CẬP NHẬT KẾT QUẢ PHỎNG VẤN */}
      <Dialog open={isInterviewResultOpen} onOpenChange={setIsInterviewResultOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nhận Xét & Đánh Giá Phỏng Vấn</DialogTitle>
            <DialogDescription>
              Ghi nhận điểm số năng lực, điểm mạnh/yếu của ứng viên sau buổi phỏng vấn.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInterviewResultSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="int-res">Kết quả phỏng vấn</Label>
              <Select value={interviewResult} onValueChange={setInterviewResult}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn kết quả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PASSED">Đạt yêu cầu (Passed)</SelectItem>
                  <SelectItem value="FAILED">Không đạt yêu cầu (Failed)</SelectItem>
                  <SelectItem value="NO_SHOW">Ứng viên không đến (No Show)</SelectItem>
                  <SelectItem value="RESCHEDULED">Hẹn phỏng vấn lại</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="int-feed">Nhận xét chi tiết (Feedback)</Label>
              <Textarea
                id="int-feed"
                rows={4}
                required
                value={interviewFeedback}
                onChange={(e) => setInterviewFeedback(e.target.value)}
                placeholder="Đánh giá kỹ năng chuyên môn, kỹ năng mềm, định hướng lương..."
              />
            </div>
            <p className="text-[10px] text-amber-500 flex items-start gap-1">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              * Lưu ý: Khi chọn PASSED, ứng viên sẽ tự động được chuyển sang cột "OFFER". Khi chọn FAILED, ứng viên sẽ chuyển sang cột "Từ chối".
            </p>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsInterviewResultOpen(false)}>
                Đóng
              </Button>
              <Button type="submit" disabled={updateInterviewResultMutation.isPending} className="bg-primary text-white">
                {updateInterviewResultMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Lưu kết quả
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 5: CHI TIẾT ỨNG VIÊN */}
      <Dialog open={isAppDetailOpen} onOpenChange={setIsAppDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">Hồ Sơ Ứng Viên Chi Tiết</DialogTitle>
            <DialogDescription>
              Vị trí ứng tuyển: <strong>{viewingApp?.jobPostingTitle}</strong>
            </DialogDescription>
          </DialogHeader>

          {viewingApp && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4 bg-muted/40 border border-border p-4 rounded-lg text-sm">
                <div>
                  <span className="text-muted-foreground block text-xs">Họ và tên:</span>
                  <span className="font-semibold text-foreground">{viewingApp.candidateName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">Điện thoại:</span>
                  <span className="font-semibold text-foreground">{viewingApp.candidatePhone || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">Email liên hệ:</span>
                  <span className="font-semibold text-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3 text-primary" /> {viewingApp.candidateEmail}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">Thời gian ứng tuyển:</span>
                  <span className="font-semibold text-foreground">
                    {viewingApp.appliedAt ? new Date(viewingApp.appliedAt).toLocaleDateString("vi-VN") : "—"}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-semibold text-foreground/90">Thư giới thiệu (Cover Letter):</span>
                <div className="bg-muted/10 border border-border p-3 rounded-lg text-xs text-foreground/90 italic whitespace-pre-line">
                  {viewingApp.coverLetter || "Ứng viên không gửi kèm thư giới thiệu."}
                </div>
              </div>

              {viewingApp.stage === "REJECTED" && (
                <div className="space-y-2">
                  <span className="text-sm font-semibold text-rose-500">Lý do từ chối:</span>
                  <div className="bg-rose-500/5 border border-rose-500/20 text-rose-700 dark:text-rose-300 p-3 rounded-lg text-xs italic">
                    {viewingApp.rejectedReason || "Không có lý do chi tiết."}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center bg-muted/40 p-3 rounded-lg border border-border text-xs">
                <span>File hồ sơ đính kèm (CV):</span>
                {viewingApp.cvUrl ? (
                  <a href={viewingApp.cvUrl} target="_blank" rel="noopener noreferrer" className="bg-primary hover:bg-primary/90 text-white font-semibold py-1.5 px-3 rounded flex items-center gap-1">
                    <ExternalLink className="h-3.5 w-3.5" /> Xem CV Online
                  </a>
                ) : (
                  <span className="text-muted-foreground italic">Không tìm thấy tệp đính kèm</span>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setIsAppDetailOpen(false)} variant="outline">
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG 6: PHÊ DUYỆT LỊCH PHỎNG VẤN (MANAGER) */}
      <Dialog open={isApproveScheduleOpen} onOpenChange={setIsApproveScheduleOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Phê Duyệt Lịch Phỏng Vấn</DialogTitle>
            <DialogDescription>
              Vui lòng đồng ý hoặc từ chối lịch phỏng vấn do Recruiter đề xuất. Hệ thống sẽ chính thức gửi thư mời tới ứng viên nếu lịch được phê duyệt.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Quyết định phê duyệt</Label>
              <Select value={approvalStatusAction} onValueChange={setApprovalStatusAction}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="APPROVED">Đồng ý lịch phỏng vấn (Duyệt)</SelectItem>
                  <SelectItem value="REJECTED">Từ chối lịch phỏng vấn (Yêu cầu lên lịch lại)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="approval-feedback">Ý kiến phản hồi / Lý do từ chối (Nếu có)</Label>
              <Textarea
                id="approval-feedback"
                rows={3}
                value={approvalFeedbackAction}
                onChange={(e) => setApprovalFeedbackAction(e.target.value)}
                placeholder="Nhập lý do từ chối hoặc ý kiến đóng góp cho Recruiter..."
              />
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setIsApproveScheduleOpen(false)}>
              Hủy
            </Button>
            <Button
              type="button"
              disabled={approveScheduleMutation.isPending}
              onClick={() => {
                if (targetScheduleId !== null) {
                  approveScheduleMutation.mutate({
                    id: targetScheduleId,
                    status: approvalStatusAction,
                    feedback: approvalFeedbackAction,
                  });
                }
              }}
              className={approvalStatusAction === "APPROVED" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-rose-600 hover:bg-rose-700 text-white"}
            >
              {approveScheduleMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RecruitmentPage;
