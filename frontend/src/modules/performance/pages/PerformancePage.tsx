import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { performanceApi, type PerformanceReviewResponse, type KpiRecordResponse } from "../api/performanceApi";
import { usePermission } from "../../../hooks/usePermission";
import { toast } from "sonner";
import {
  Award,
  Star,
  CheckCircle2,
  Plus,
  TrendingUp,
  Settings,
  Loader2,
  Trash2,
  FileText
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

const RATING_LABELS: Record<string, string> = {
  EXCELLENT: "Xuất sắc (A)",
  GOOD: "Tốt (B)",
  MEETS: "Đạt yêu cầu (C)",
  BELOW: "Cần cải thiện (D)",
  POOR: "Kém (E)",
};

const RATING_COLORS: Record<string, string> = {
  EXCELLENT: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  GOOD: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  MEETS: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  BELOW: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  POOR: "bg-rose-500/10 text-rose-500 border-rose-500/20",
};

const CYCLE_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Bản nháp",
  ACTIVE: "Đang diễn ra",
  COMPLETED: "Đã hoàn thành",
};

const CYCLE_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground border-border",
  ACTIVE: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 animate-pulse",
  COMPLETED: "bg-blue-500/10 text-blue-500 border-blue-500/20",
};

const REVIEW_STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ nhân viên tự đánh giá",
  MANAGER_EVALUATING: "Chờ quản lý đánh giá",
  COMPLETED: "Đã hoàn thành",
};

const REVIEW_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  MANAGER_EVALUATING: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  COMPLETED: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
};

const PerformancePage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user, can } = usePermission();

  const isHR = can("performance:write");
  const isManager = user?.roles?.includes("MANAGER");

  // Form State tạo đợt đánh giá (Review Cycle)
  const [isCreateCycleOpen, setIsCreateCycleOpen] = useState(false);
  const [cycleName, setCycleName] = useState("");
  const [cycleType, setCycleType] = useState("YEARLY");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Form State Tự đánh giá
  const [isSelfEvalOpen, setIsSelfEvalOpen] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState<number | null>(null);
  const [selfScore, setSelfScore] = useState<number>(3);
  const [strengths, setStrengths] = useState("");
  const [improvements, setImprovements] = useState("");
  const [goalsNext, setGoalsNext] = useState("");

  // Form State Quản lý đánh giá
  const [isManagerEvalOpen, setIsManagerEvalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<PerformanceReviewResponse | null>(null);
  const [reviewerScore, setReviewerScore] = useState<number>(3);
  const [kpis, setKpis] = useState<KpiRecordResponse[]>([]);

  // Dialog Xem Chi Tiết
  const [isViewDetailOpen, setIsViewDetailOpen] = useState(false);
  const [viewingReview, setViewingReview] = useState<PerformanceReviewResponse | null>(null);

  // Queries
  const { data: cycles = [], isLoading: isCyclesLoading } = useQuery({
    queryKey: ["review-cycles"],
    queryFn: performanceApi.getCycles,
    enabled: isHR,
  });

  const { data: myReviews = [], isLoading: isMyReviewsLoading } = useQuery({
    queryKey: ["my-reviews"],
    queryFn: performanceApi.getMyReviews,
  });

  const { data: teamReviews = [], isLoading: isTeamReviewsLoading } = useQuery({
    queryKey: ["team-reviews"],
    queryFn: performanceApi.getReviewsToEvaluate,
    enabled: isManager || isHR,
  });

  // Mutations
  const createCycleMutation = useMutation({
    mutationFn: performanceApi.createCycle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review-cycles"] });
      toast.success("Tạo đợt đánh giá mới thành công!");
      setIsCreateCycleOpen(false);
      resetCreateCycleForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Không thể tạo đợt đánh giá.");
    },
  });

  const updateCycleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      performanceApi.updateCycleStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review-cycles"] });
      queryClient.invalidateQueries({ queryKey: ["team-reviews"] });
      toast.success("Cập nhật trạng thái đợt đánh giá thành công!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Không thể cập nhật trạng thái.");
    },
  });

  const selfEvalMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      performanceApi.selfEvaluate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-reviews"] });
      toast.success("Gửi tự đánh giá thành công!");
      setIsSelfEvalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Lỗi tự đánh giá.");
    },
  });

  const managerEvalMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      performanceApi.managerEvaluate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["review-cycles"] });
      toast.success("Lưu đánh giá nhân sự thành công!");
      setIsManagerEvalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Lỗi đánh giá.");
    },
  });

  // Actions
  const handleCreateCycle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cycleName || !startDate || !endDate) {
      toast.error("Vui lòng nhập đầy đủ thông tin.");
      return;
    }
    createCycleMutation.mutate({
      name: cycleName,
      cycleType,
      startDate,
      endDate,
      status: "DRAFT",
    });
  };

  const handleSelfEvalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedReviewId === null) return;
    selfEvalMutation.mutate({
      id: selectedReviewId,
      data: {
        selfScore,
        strengths,
        improvements,
        goalsNext,
      },
    });
  };

  const handleManagerEvalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReview) return;

    // Validate KPI weights sum to 100% if there are KPIs
    if (kpis.length > 0) {
      const sum = kpis.reduce((acc, kpi) => acc + Number(kpi.weight), 0);
      if (sum !== 100) {
        toast.error(`Tổng tỷ trọng các chỉ tiêu phải bằng 100%. Hiện tại: ${sum}%`);
        return;
      }
      // Check validation for each KPI
      for (const kpi of kpis) {
        if (!kpi.kpiName.trim()) {
          toast.error("Tên chỉ tiêu KPI không được để trống.");
          return;
        }
        if (kpi.score < 1 || kpi.score > 5) {
          toast.error("Điểm KPI phải nằm trong khoảng từ 1.0 đến 5.0");
          return;
        }
      }
    }

    managerEvalMutation.mutate({
      id: selectedReview.id,
      data: {
        reviewerScore,
        kpis,
      },
    });
  };

  const resetCreateCycleForm = () => {
    setCycleName("");
    setCycleType("YEARLY");
    setStartDate("");
    setEndDate("");
  };

  const openSelfEvalModal = (review: PerformanceReviewResponse) => {
    setSelectedReviewId(review.id);
    setSelfScore(Number(review.selfScore) || 3);
    setStrengths(review.strengths || "");
    setImprovements(review.improvements || "");
    setGoalsNext(review.goalsNext || "");
    setIsSelfEvalOpen(true);
  };

  const openManagerEvalModal = (review: PerformanceReviewResponse) => {
    setSelectedReview(review);
    setReviewerScore(Number(review.reviewerScore) || 3);
    // Load existing KPIs or start with a default layout
    if (review.kpis && review.kpis.length > 0) {
      setKpis(review.kpis);
    } else {
      setKpis([
        { kpiName: "Đạt tiến độ công việc (Chất lượng & Deadline)", weight: 40, target: "Hoàn thành 100% task được giao", actual: "", score: 3 },
        { kpiName: "Kỹ năng chuyên môn & Sáng kiến đóng góp", weight: 30, target: "Có tối thiểu 1 cải tiến quy trình", actual: "", score: 3 },
        { kpiName: "Ý thức kỷ luật & Làm việc nhóm", weight: 30, target: "Không đi muộn, tham gia đầy đủ hoạt động", actual: "", score: 3 },
      ]);
    }
    setIsManagerEvalOpen(true);
  };

  const openDetailModal = async (review: PerformanceReviewResponse) => {
    try {
      const detail = await performanceApi.getReview(review.id);
      setViewingReview(detail);
      setIsViewDetailOpen(true);
    } catch (e: any) {
      toast.error(e.message || "Không thể xem chi tiết.");
    }
  };

  const handleAddKpiRow = () => {
    setKpis([...kpis, { kpiName: "", weight: 10, target: "", actual: "", score: 3 }]);
  };

  const handleRemoveKpiRow = (index: number) => {
    const newKpis = [...kpis];
    newKpis.splice(index, 1);
    setKpis(newKpis);
  };

  const handleKpiChange = (index: number, field: keyof KpiRecordResponse, value: any) => {
    const newKpis = [...kpis];
    newKpis[index] = {
      ...newKpis[index],
      [field]: value,
    };
    setKpis(newKpis);
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Upper header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Award className="h-8 w-8 text-primary" /> Đánh giá hiệu suất
          </h1>
          <p className="text-muted-foreground mt-1">
            Quản lý các đợt đánh giá năng lực nhân sự, thiết lập KPI và ghi nhận kết quả.
          </p>
        </div>

        {isHR && (
          <Button onClick={() => setIsCreateCycleOpen(true)} className="bg-primary hover:bg-primary/90 text-white font-medium">
            <Plus className="h-5 w-5 mr-1" /> Thiết lập đợt đánh giá
          </Button>
        )}
      </div>

      <Tabs defaultValue="my-evaluation" className="space-y-6">
        <TabsList className="bg-muted border border-border p-1 rounded-lg">
          <TabsTrigger value="my-evaluation">
            Tự đánh giá của tôi
          </TabsTrigger>
          {(isManager || isHR) && (
            <TabsTrigger value="team-evaluation">
              Đánh giá đội ngũ
            </TabsTrigger>
          )}
          {isHR && (
            <TabsTrigger value="cycles">
              Cấu hình các đợt
            </TabsTrigger>
          )}
        </TabsList>

        {/* Tab 1: My evaluations */}
        <TabsContent value="my-evaluation">
          <Card>
            <CardHeader>
              <CardTitle>Danh sách phiếu đánh giá cá nhân</CardTitle>
              <CardDescription>
                Theo dõi kết quả đánh giá và điền phiếu tự đánh giá khi đến đợt.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isMyReviewsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : myReviews.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-lg">
                  Bạn chưa có phiếu đánh giá nào trong hệ thống.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="text-muted-foreground font-medium">Đợt đánh giá</TableHead>
                        <TableHead className="text-muted-foreground font-medium">Người đánh giá</TableHead>
                        <TableHead className="text-muted-foreground font-medium text-center">Tự chấm</TableHead>
                        <TableHead className="text-muted-foreground font-medium text-center">Kết quả cuối</TableHead>
                        <TableHead className="text-muted-foreground font-medium text-center">Xếp loại</TableHead>
                        <TableHead className="text-muted-foreground font-medium">Trạng thái</TableHead>
                        <TableHead className="text-muted-foreground font-medium text-right">Hành động</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {myReviews.map((review) => (
                        <TableRow key={review.id} className="border-border hover:bg-muted/20">
                          <TableCell className="font-semibold text-foreground">{review.cycleName}</TableCell>
                          <TableCell className="text-foreground/90">{review.reviewerName}</TableCell>
                          <TableCell className="text-center font-medium">{review.selfScore ? Number(review.selfScore).toFixed(1) : "—"}</TableCell>
                          <TableCell className="text-center font-bold text-primary">{review.finalScore ? Number(review.finalScore).toFixed(2) : "—"}</TableCell>
                          <TableCell className="text-center">
                            {review.rating ? (
                              <Badge className={`${RATING_COLORS[review.rating]} border font-semibold`}>
                                {RATING_LABELS[review.rating]}
                              </Badge>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={`${REVIEW_STATUS_COLORS[review.status]} border font-medium`}>
                              {REVIEW_STATUS_LABELS[review.status]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {review.status === "PENDING" && (
                                <Button size="sm" onClick={() => openSelfEvalModal(review)} className="bg-amber-500 text-slate-950 hover:bg-amber-400 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300 font-medium">
                                  Tự đánh giá
                                </Button>
                              )}
                              <Button size="sm" variant="outline" onClick={() => openDetailModal(review)} className="border-border text-foreground hover:bg-muted">
                                <FileText className="h-4 w-4 mr-1" /> Chi tiết
                              </Button>
                            </div>
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

        {/* Tab 2: Team evaluation */}
        {(isManager || isHR) && (
          <TabsContent value="team-evaluation">
            <Card>
              <CardHeader>
                <CardTitle>Đánh giá hiệu suất nhân viên cấp dưới</CardTitle>
                <CardDescription>
                  Thực hiện chấm điểm năng lực, thiết lập chỉ tiêu KPI chi tiết cho các thành viên trong team.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isTeamReviewsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : teamReviews.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-lg">
                    <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    Không có nhân viên nào cần bạn đánh giá tại thời điểm hiện tại.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow className="border-border hover:bg-transparent">
                          <TableHead className="text-muted-foreground font-medium">Mã NV</TableHead>
                          <TableHead className="text-muted-foreground font-medium">Họ tên</TableHead>
                          <TableHead className="text-muted-foreground font-medium">Phòng ban</TableHead>
                          <TableHead className="text-muted-foreground font-medium">Đợt đánh giá</TableHead>
                          <TableHead className="text-muted-foreground font-medium text-center">Tự chấm</TableHead>
                          <TableHead className="text-muted-foreground font-medium text-center">Kết quả cuối</TableHead>
                          <TableHead className="text-muted-foreground font-medium text-center">Xếp loại</TableHead>
                          <TableHead className="text-muted-foreground font-medium">Trạng thái</TableHead>
                          <TableHead className="text-muted-foreground font-medium text-right">Hành động</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {teamReviews.map((review) => (
                          <TableRow key={review.id} className="border-border hover:bg-muted/20">
                            <TableCell className="text-muted-foreground font-medium">{review.employeeCode}</TableCell>
                            <TableCell className="font-semibold text-foreground">{review.employeeName}</TableCell>
                            <TableCell className="text-muted-foreground">{review.departmentName}</TableCell>
                            <TableCell className="text-foreground/90">{review.cycleName}</TableCell>
                            <TableCell className="text-center">{review.selfScore ? Number(review.selfScore).toFixed(1) : "—"}</TableCell>
                            <TableCell className="text-center font-bold text-primary">{review.finalScore ? Number(review.finalScore).toFixed(2) : "—"}</TableCell>
                            <TableCell className="text-center">
                              {review.rating ? (
                                <Badge className={`${RATING_COLORS[review.rating]} border font-semibold`}>
                                  {RATING_LABELS[review.rating]}
                                </Badge>
                              ) : (
                                "—"
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge className={`${REVIEW_STATUS_COLORS[review.status]} border font-medium`}>
                                {REVIEW_STATUS_LABELS[review.status]}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {(review.status === "MANAGER_EVALUATING" || (isHR && review.status === "PENDING")) && (
                                  <Button size="sm" onClick={() => openManagerEvalModal(review)} className="bg-primary hover:bg-primary/90 text-white font-medium">
                                    Đánh giá
                                  </Button>
                                )}
                                <Button size="sm" variant="outline" onClick={() => openDetailModal(review)} className="border-border text-foreground hover:bg-muted">
                                  <FileText className="h-4 w-4 mr-1" /> Chi tiết
                                </Button>
                              </div>
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
        )}

        {/* Tab 3: Cycles config (HR only) */}
        {isHR && (
          <TabsContent value="cycles">
            <Card>
              <CardHeader>
                <CardTitle>Cấu hình các Đợt đánh giá năng lực</CardTitle>
                <CardDescription>
                  Bắt đầu đợt đánh giá mới sẽ tự động tạo bảng đánh giá cho toàn bộ nhân sự đang hoạt động.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isCyclesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : cycles.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-lg">
                    <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    Chưa thiết lập đợt đánh giá nào. Nhấn nút "Thiết lập đợt đánh giá" ở góc trên để bắt đầu.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow className="border-border hover:bg-transparent">
                          <TableHead className="text-muted-foreground font-medium">Tên đợt đánh giá</TableHead>
                          <TableHead className="text-muted-foreground font-medium">Loại chu kỳ</TableHead>
                          <TableHead className="text-muted-foreground font-medium">Ngày bắt đầu</TableHead>
                          <TableHead className="text-muted-foreground font-medium">Ngày kết thúc</TableHead>
                          <TableHead className="text-muted-foreground font-medium">Trạng thái</TableHead>
                          <TableHead className="text-muted-foreground font-medium text-right">Thao tác kích hoạt</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cycles.map((cycle) => (
                          <TableRow key={cycle.id} className="border-border hover:bg-muted/20">
                            <TableCell className="font-semibold text-foreground">{cycle.name}</TableCell>
                            <TableCell className="text-foreground/95">{cycle.cycleType}</TableCell>
                            <TableCell className="text-muted-foreground">{cycle.startDate}</TableCell>
                            <TableCell className="text-muted-foreground">{cycle.endDate}</TableCell>
                            <TableCell>
                              <Badge className={`${CYCLE_STATUS_COLORS[cycle.status]} border font-medium`}>
                                {CYCLE_STATUS_LABELS[cycle.status]}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {cycle.status === "DRAFT" && (
                                <Button size="sm" onClick={() => updateCycleStatusMutation.mutate({ id: cycle.id, status: "ACTIVE" })} className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium">
                                  Kích hoạt đợt
                                </Button>
                              )}
                              {cycle.status === "ACTIVE" && (
                                <Button size="sm" onClick={() => updateCycleStatusMutation.mutate({ id: cycle.id, status: "COMPLETED" })} className="bg-blue-600 hover:bg-blue-700 text-white font-medium">
                                  Đóng/Kết thúc đợt
                                </Button>
                              )}
                              {cycle.status === "COMPLETED" && (
                                <span className="text-muted-foreground text-sm">Đã lưu trữ hồ sơ</span>
                              )}
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
        )}
      </Tabs>

      {/* DIALOG 1: THIẾT LẬP ĐỢT ĐÁNH GIÁ (HR) */}
      <Dialog open={isCreateCycleOpen} onOpenChange={setIsCreateCycleOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tạo Đợt Đánh Giá Năng Lực</DialogTitle>
            <DialogDescription>
              Nhập thông tin đợt đánh giá. Hệ thống sẽ lưu ở bản nháp, sau khi kích hoạt sẽ phân bổ phiếu tự đánh giá cho toàn nhân viên công ty.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCycle} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cycle-name">Tên đợt đánh giá</Label>
              <Input
                id="cycle-name"
                value={cycleName}
                onChange={(e) => setCycleName(e.target.value)}
                placeholder="Ví dụ: Đánh giá hiệu suất cuối năm 2026"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cycle-type">Kỳ đánh giá</Label>
              <Select value={cycleType} onValueChange={setCycleType}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn kỳ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MONTHLY">Hàng tháng (Monthly)</SelectItem>
                  <SelectItem value="QUARTERLY">Hàng quý (Quarterly)</SelectItem>
                  <SelectItem value="YEARLY">Hàng năm (Yearly)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Ngày bắt đầu</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="[color-scheme:dark] dark:[color-scheme:dark]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">Ngày kết thúc</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="[color-scheme:dark] dark:[color-scheme:dark]"
                />
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreateCycleOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={createCycleMutation.isPending} className="bg-primary text-white">
                {createCycleMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Lưu bản nháp
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: TỰ ĐÁNH GIÁ (EMPLOYEE) */}
      <Dialog open={isSelfEvalOpen} onOpenChange={setIsSelfEvalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">Phiếu Tự Đánh Giá Nhân Viên</DialogTitle>
            <DialogDescription>
              Hãy đánh giá trung thực kết quả làm việc của bạn trong chu kỳ qua.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSelfEvalSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="self-score">Tự chấm điểm năng lực (Thang điểm từ 1.0 đến 5.0)</Label>
              <Input
                id="self-score"
                type="number"
                step="0.1"
                min="1.0"
                max="5.0"
                value={selfScore}
                onChange={(e) => setSelfScore(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="strengths">Điểm mạnh / Thành tựu đạt được</Label>
              <Textarea
                id="strengths"
                rows={3}
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
                placeholder="Nêu các công việc nổi bật hoặc chỉ tiêu bạn đã hoàn thành vượt mức..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="improvements">Điểm cần cải thiện / Khó khăn gặp phải</Label>
              <Textarea
                id="improvements"
                rows={3}
                value={improvements}
                onChange={(e) => setImprovements(e.target.value)}
                placeholder="Các kỹ năng cần rèn luyện thêm, các công việc bị chậm tiến độ..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goals-next">Mục tiêu phát triển trong kỳ tới</Label>
              <Textarea
                id="goals-next"
                rows={3}
                value={goalsNext}
                onChange={(e) => setGoalsNext(e.target.value)}
                placeholder="Dự kiến hoàn thành kỹ năng gì, cam kết doanh số hay target gì..."
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsSelfEvalOpen(false)}>
                Đóng
              </Button>
              <Button type="submit" disabled={selfEvalMutation.isPending} className="bg-primary text-white">
                {selfEvalMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Gửi Đánh Giá
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 3: MANAGER ĐÁNH GIÁ VÀ NHẬP KPI (MANAGER / HR) */}
      <Dialog open={isManagerEvalOpen} onOpenChange={setIsManagerEvalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Chấm Điểm & Thiết Lập Chỉ Tiêu KPI</DialogTitle>
            <DialogDescription>
              Đang thực hiện đánh giá cho nhân viên: <strong>{selectedReview?.employeeName}</strong>.
            </DialogDescription>
          </DialogHeader>

          {/* Phần xem nhanh kết quả tự chấm của nhân viên */}
          <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-2 text-sm">
            <h4 className="font-semibold text-primary">Ý kiến tự đánh giá của nhân viên:</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-muted-foreground block text-xs">Tự chấm điểm:</span>
                <span className="font-bold text-foreground text-base">{selectedReview?.selfScore ? Number(selectedReview.selfScore).toFixed(1) : "Chưa chấm"} / 5.0</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">Điểm mạnh:</span>
                <span className="text-foreground/90">{selectedReview?.strengths || "Chưa nhập"}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">Cần cải thiện:</span>
                <span className="text-foreground/90">{selectedReview?.improvements || "Chưa nhập"}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">Mục tiêu kỳ tới:</span>
                <span className="text-foreground/90">{selectedReview?.goalsNext || "Chưa nhập"}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleManagerEvalSubmit} className="space-y-6 pt-2">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-muted-foreground">Điểm đánh giá của Quản lý trực tiếp (Reviewer Score - Thang điểm 1-5)</Label>
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  step="0.1"
                  min="1.0"
                  max="5.0"
                  value={reviewerScore}
                  onChange={(e) => setReviewerScore(Number(e.target.value))}
                  className="max-w-[200px]"
                />
                <span className="text-muted-foreground text-xs italic">
                  * Điểm này sẽ là kết quả cuối cùng nếu không cấu hình bất kỳ chỉ tiêu KPI nào bên dưới.
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <Label className="text-base font-bold text-primary flex items-center gap-1">
                  <TrendingUp className="h-5 w-5" /> Danh sách chỉ tiêu KPI (Tính trung bình trọng số)
                </Label>
                <Button type="button" size="sm" onClick={handleAddKpiRow} variant="outline">
                  <Plus className="h-4 w-4 mr-1" /> Thêm chỉ tiêu
                </Button>
              </div>

              {kpis.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground border border-border border-dashed rounded-lg text-sm">
                  Chưa tạo KPI. Điểm tổng kết sẽ lấy theo điểm đánh giá của Quản lý phía trên.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground px-2">
                    <div className="col-span-4">Tên chỉ tiêu KPI</div>
                    <div className="col-span-1 text-center">Tỷ trọng %</div>
                    <div className="col-span-3">Mục tiêu đề ra</div>
                    <div className="col-span-2">Thực tế đạt được</div>
                    <div className="col-span-1 text-center">Điểm (1-5)</div>
                    <div className="col-span-1 text-center">Xóa</div>
                  </div>

                  {kpis.map((kpi, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-muted/20 p-2 rounded-lg border border-border">
                      <div className="col-span-4">
                        <Input
                          placeholder="Ví dụ: Chỉ tiêu doanh thu, Fix bug..."
                          value={kpi.kpiName}
                          onChange={(e) => handleKpiChange(idx, "kpiName", e.target.value)}
                          className="text-xs"
                        />
                      </div>
                      <div className="col-span-1">
                        <Input
                          type="number"
                          min="1"
                          max="100"
                          value={kpi.weight}
                          onChange={(e) => handleKpiChange(idx, "weight", Number(e.target.value))}
                          className="text-xs text-center"
                        />
                      </div>
                      <div className="col-span-3">
                        <Input
                          placeholder="Cam kết đạt được..."
                          value={kpi.target}
                          onChange={(e) => handleKpiChange(idx, "target", e.target.value)}
                          className="text-xs"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          placeholder="Thực tế làm được..."
                          value={kpi.actual}
                          onChange={(e) => handleKpiChange(idx, "actual", e.target.value)}
                          className="text-xs"
                        />
                      </div>
                      <div className="col-span-1">
                        <Input
                          type="number"
                          step="0.1"
                          min="1.0"
                          max="5.0"
                          value={kpi.score}
                          onChange={(e) => handleKpiChange(idx, "score", Number(e.target.value))}
                          className="text-xs text-center font-bold text-primary"
                        />
                      </div>
                      <div className="col-span-1 text-center">
                        <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveKpiRow(idx)} className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-end pr-8">
                    <span className="text-sm font-semibold text-muted-foreground">
                      Tổng tỷ trọng:{" "}
                      <strong className={kpis.reduce((acc, k) => acc + k.weight, 0) === 100 ? "text-emerald-500" : "text-rose-500"}>
                        {kpis.reduce((acc, k) => acc + k.weight, 0)}%
                      </strong>{" "}
                      / 100%
                    </span>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setIsManagerEvalOpen(false)}>
                Đóng
              </Button>
              <Button type="submit" disabled={managerEvalMutation.isPending} className="bg-primary text-white">
                {managerEvalMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Lưu và Hoàn Tất Đánh Giá
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 4: XEM CHI TIẾT KẾT QUẢ ĐÁNH GIÁ */}
      <Dialog open={isViewDetailOpen} onOpenChange={setIsViewDetailOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Star className="h-6 w-6 text-amber-500" /> Kết Quả Đánh Giá Năng Lực Chi Tiết
            </DialogTitle>
            <DialogDescription>
              Đợt đánh giá: <strong>{viewingReview?.cycleName}</strong>
            </DialogDescription>
          </DialogHeader>

          {viewingReview && (
            <div className="space-y-6 mt-4 max-h-[70vh] overflow-y-auto pr-2">
              {/* Thông tin nhân viên & Xếp hạng */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-muted/50 border border-border rounded-lg p-4 text-sm">
                <div>
                  <span className="text-muted-foreground block text-xs">Mã nhân viên:</span>
                  <span className="font-semibold text-foreground">{viewingReview.employeeCode}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">Họ và tên:</span>
                  <span className="font-semibold text-foreground">{viewingReview.employeeName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">Điểm tổng kết:</span>
                  <span className="font-extrabold text-primary text-base">{viewingReview.finalScore ? Number(viewingReview.finalScore).toFixed(2) : "—"} / 5.0</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">Xếp loại:</span>
                  {viewingReview.rating ? (
                    <Badge className={`${RATING_COLORS[viewingReview.rating]} border font-semibold mt-1`}>
                      {RATING_LABELS[viewingReview.rating]}
                    </Badge>
                  ) : (
                    "—"
                  )}
                </div>
              </div>

              {/* Chi tiết điểm thành phần */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-muted/20 border border-border p-4 rounded-lg space-y-2">
                  <h4 className="font-bold text-foreground text-sm border-b border-border pb-1">Đóng góp từ nhân viên</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Tự chấm điểm:</span> <strong className="text-foreground">{viewingReview.selfScore ? Number(viewingReview.selfScore).toFixed(1) : "—"}</strong></p>
                    <p><span className="text-muted-foreground">Điểm mạnh / Thành tích:</span></p>
                    <p className="text-foreground italic whitespace-pre-line bg-muted/30 p-2 rounded border border-border">{viewingReview.strengths || "Chưa nhập"}</p>
                    <p><span className="text-muted-foreground">Điểm cần cải thiện:</span></p>
                    <p className="text-foreground italic whitespace-pre-line bg-muted/30 p-2 rounded border border-border">{viewingReview.improvements || "Chưa nhập"}</p>
                    <p><span className="text-muted-foreground">Mục tiêu kỳ tới:</span></p>
                    <p className="text-foreground italic whitespace-pre-line bg-muted/30 p-2 rounded border border-border">{viewingReview.goalsNext || "Chưa nhập"}</p>
                  </div>
                </div>

                <div className="bg-muted/20 border border-border p-4 rounded-lg space-y-2">
                  <h4 className="font-bold text-primary text-sm border-b border-border pb-1">Ý kiến đánh giá của Quản lý</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Người đánh giá:</span> <strong className="text-foreground">{viewingReview.reviewerName}</strong></p>
                    <p><span className="text-muted-foreground">Điểm chấm trực tiếp của Quản lý:</span> <strong className="text-foreground">{viewingReview.reviewerScore ? Number(viewingReview.reviewerScore).toFixed(1) : "—"}</strong></p>
                    <p><span className="text-muted-foreground">Ngày hoàn thành đánh giá:</span> <span className="text-foreground/90">{viewingReview.completedAt ? new Date(viewingReview.completedAt).toLocaleDateString("vi-VN") : "Chưa hoàn thành"}</span></p>
                    <p><span className="text-muted-foreground">Trạng thái phiếu:</span> <Badge className={`${REVIEW_STATUS_COLORS[viewingReview.status]} border ml-1`}>{REVIEW_STATUS_LABELS[viewingReview.status]}</Badge></p>
                  </div>
                </div>
              </div>

              {/* Chi tiết bảng KPI */}
              {viewingReview.kpis && viewingReview.kpis.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-foreground text-sm flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" /> Chi tiết điểm chỉ tiêu KPI phòng ban
                  </h4>
                  <div className="border border-border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted">
                        <TableRow className="border-border">
                          <TableHead className="text-xs text-muted-foreground font-semibold">Tên chỉ tiêu</TableHead>
                          <TableHead className="text-xs text-muted-foreground font-semibold text-center">Tỷ trọng</TableHead>
                          <TableHead className="text-xs text-muted-foreground font-semibold">Mục tiêu</TableHead>
                          <TableHead className="text-xs text-muted-foreground font-semibold">Thực tế</TableHead>
                          <TableHead className="text-xs text-muted-foreground font-semibold text-center">Điểm (1-5)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="bg-muted/10">
                        {viewingReview.kpis.map((kpi, idx) => (
                          <TableRow key={idx} className="border-border">
                            <TableCell className="text-xs font-semibold text-foreground">{kpi.kpiName}</TableCell>
                            <TableCell className="text-xs text-center text-foreground/90">{kpi.weight}%</TableCell>
                            <TableCell className="text-xs text-foreground/90">{kpi.target || "—"}</TableCell>
                            <TableCell className="text-xs text-foreground/90">{kpi.actual || "—"}</TableCell>
                            <TableCell className="text-xs text-center font-bold text-primary">{kpi.score ? Number(kpi.score).toFixed(1) : "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="pt-2 border-t border-border">
            <Button onClick={() => setIsViewDetailOpen(false)} variant="outline">
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PerformancePage;
