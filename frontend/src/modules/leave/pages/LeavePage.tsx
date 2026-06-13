import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { leaveApi, type LeaveBalanceResponse, type LeaveRequestResponse } from "../api/leaveApi";
import { organizationApi } from "../../organization/api/organizationApi";
import { toast } from "sonner";
import { usePermission } from "../../../hooks/usePermission";
import {
  Calendar,
  Clock,
  FileText,
  Check,
  X,
  AlertCircle,
  Filter,
  Upload,
  Plus,
  Search,
  FileSpreadsheet,
  Info,
  CalendarDays,
  UserCheck,
  Download,
  Loader2
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
import { Progress } from "@/components/ui/progress";

const STATUS_BADGES: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse",
  APPROVED: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  REJECTED: "bg-destructive/10 text-destructive border-destructive/20",
  CANCELLED: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ phê duyệt",
  APPROVED: "Đã phê duyệt",
  REJECTED: "Đã từ chối",
  CANCELLED: "Đã hủy",
};

const LEAVE_TYPE_COLORS: Record<string, string> = {
  AL: "bg-blue-500", // Phép năm
  SL: "bg-emerald-500", // Nghỉ ốm
  UL: "bg-rose-500", // Nghỉ không lương
  CL: "bg-amber-500", // Nghỉ bù
  ML: "bg-purple-500", // Nghỉ thai sản
};

const LeavePage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = usePermission();
  const roles = user?.roles || [];

  const currentYear = new Date().getFullYear();

  // Quyền hạn của user
  const isManager = roles.includes("MANAGER");
  const isHR = roles.some(r => ["SUPER_ADMIN", "HR_ADMIN", "HR_STAFF"].includes(r));
  const isSuperOrHRAdmin = roles.some(r => ["SUPER_ADMIN", "HR_ADMIN"].includes(r));
  const canApprove = roles.some(r => ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"].includes(r));

  // Form State tạo đơn nghỉ
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [leaveTypeCode, setLeaveTypeCode] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [totalDays, setTotalDays] = useState(1);
  const [reason, setReason] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

  // Form State duyệt đơn (Manager/HR)
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequestResponse | null>(null);
  const [approvalStatus, setApprovalStatus] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [managerNote, setManagerNote] = useState("");
  const [isOverride, setIsOverride] = useState(false);

  // Filter State (Dành cho HR/Manager)
  const [filterDeptId, setFilterDeptId] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchEmployeeName, setSearchEmployeeName] = useState("");

  // ─── Queries ──────────────────────────────────────────────────────────────────

  // 1. Số dư phép cá nhân
  const { data: myBalances = [], isLoading: isMyBalancesLoading } = useQuery({
    queryKey: ["my-leave-balances", user?.employeeId, currentYear],
    queryFn: () => leaveApi.getLeaveBalances(user?.employeeId, currentYear),
    enabled: !!user?.employeeId,
  });

  // 2. Lịch sử đơn nghỉ phép cá nhân
  const { data: myRequestsData, isLoading: isMyRequestsLoading } = useQuery({
    queryKey: ["my-leave-requests", user?.employeeId],
    queryFn: () => leaveApi.getLeaveRequests({
      employeeId: user?.employeeId,
      page: 0,
      size: 50,
    }),
    enabled: !!user?.employeeId,
  });

  // 3. Đơn nghỉ phép chờ duyệt của team (Manager hoặc HR)
  const { data: pendingRequestsData, isLoading: isPendingRequestsLoading } = useQuery({
    queryKey: ["pending-leave-requests"],
    queryFn: () => leaveApi.getLeaveRequests({
      status: "PENDING",
      page: 0,
      size: 100,
    }),
    enabled: canApprove,
  });

  // 4. Danh sách toàn bộ đơn nghỉ phép (HR xem toàn công ty, Manager xem theo phòng)
  const { data: allRequestsData, isLoading: isAllRequestsLoading } = useQuery({
    queryKey: ["all-leave-requests", filterDeptId, filterStatus],
    queryFn: () => leaveApi.getLeaveRequests({
      departmentId: filterDeptId === "all" ? null : Number(filterDeptId),
      status: filterStatus === "all" ? null : filterStatus,
      page: 0,
      size: 100,
    }),
    enabled: isHR || isManager,
  });

  // 5. Số dư phép của toàn công ty (Dành cho HR)
  const { data: allBalances = [], isLoading: isAllBalancesLoading } = useQuery({
    queryKey: ["all-leave-balances", currentYear],
    queryFn: () => leaveApi.getLeaveBalances(null, currentYear),
    enabled: isHR,
  });

  // 6. Danh sách phòng ban phục vụ bộ lọc
  const { data: departments = [] } = useQuery({
    queryKey: ["flat-departments-leave"],
    queryFn: organizationApi.getDepartments,
    enabled: isHR || isManager,
  });

  // ─── Mutations ────────────────────────────────────────────────────────────────

  // 1. Tạo đơn nghỉ phép
  const createRequestMutation = useMutation({
    mutationFn: ({ data, file }: { data: any; file?: File }) => 
      leaveApi.createLeaveRequest(data, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["my-leave-balances"] });
      toast.success("Gửi đơn xin nghỉ phép thành công!");
      setIsCreateOpen(false);
      resetCreateForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Gửi đơn xin nghỉ thất bại!");
    }
  });

  // 2. Phê duyệt/Từ chối đơn nghỉ phép (Manager)
  const approveRequestMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      leaveApi.approveLeaveRequest(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["all-leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["my-leave-balances"] });
      queryClient.invalidateQueries({ queryKey: ["all-leave-balances"] });
      toast.success("Đã cập nhật trạng thái phê duyệt đơn nghỉ!");
      setIsApprovalOpen(false);
      resetApprovalForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Phê duyệt thất bại!");
    }
  });

  // 3. HR Override phê duyệt/từ chối đơn nghỉ phép (HR Admin / Super Admin)
  const overrideRequestMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      leaveApi.hrOverrideLeaveRequest(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["all-leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["my-leave-balances"] });
      queryClient.invalidateQueries({ queryKey: ["all-leave-balances"] });
      toast.success("HR đã duyệt ghi đè đơn nghỉ thành công!");
      setIsApprovalOpen(false);
      resetApprovalForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Ghi đè duyệt thất bại!");
    }
  });

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  const resetCreateForm = () => {
    setLeaveTypeCode("");
    setStartDate("");
    setEndDate("");
    setTotalDays(1);
    setReason("");
    setAttachmentFile(null);
  };

  const resetApprovalForm = () => {
    setSelectedRequest(null);
    setManagerNote("");
    setApprovalStatus("APPROVED");
    setIsOverride(false);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!leaveTypeCode) {
      toast.error("Vui lòng chọn loại nghỉ phép");
      return;
    }
    if (!startDate || !endDate) {
      toast.error("Vui lòng nhập khoảng thời gian nghỉ");
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      toast.error("Ngày bắt đầu không được lớn hơn ngày kết thúc");
      return;
    }
    if (totalDays <= 0) {
      toast.error("Số ngày nghỉ phải lớn hơn 0");
      return;
    }

    const balance = myBalances.find(b => b.leaveTypeCode === leaveTypeCode);
    if (balance && totalDays > balance.remainingDays && leaveTypeCode !== "UL") {
      toast.error(`Số ngày nghỉ đề xuất (${totalDays} ngày) vượt quá số ngày phép còn lại (${balance.remainingDays} ngày) của loại phép này.`);
      return;
    }

    createRequestMutation.mutate({
      data: {
        leaveTypeCode,
        startDate,
        endDate,
        totalDays,
        reason,
      },
      file: attachmentFile || undefined
    });
  };

  const handleApprovalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    const data = {
      status: approvalStatus,
      managerNote,
    };

    if (isOverride) {
      overrideRequestMutation.mutate({ id: selectedRequest.id, data });
    } else {
      approveRequestMutation.mutate({ id: selectedRequest.id, data });
    }
  };

  const openApprovalDialog = (req: LeaveRequestResponse, override = false) => {
    setSelectedRequest(req);
    setApprovalStatus("APPROVED");
    setManagerNote("");
    setIsOverride(override);
    setIsApprovalOpen(true);
  };

  // Tính toán tự động số ngày nghỉ khi thay đổi ngày bắt đầu/ngày kết thúc
  React.useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = end.getTime() - start.getTime();
      if (diffTime >= 0) {
        // Cộng 1 ngày vì nghỉ tính cả ngày đầu và ngày cuối
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setTotalDays(diffDays);
      }
    }
  }, [startDate, endDate]);

  // Bộ lọc tìm kiếm Client-side cho danh sách nghỉ phép toàn công ty
  const filteredAllRequests = React.useMemo(() => {
    const list = allRequestsData?.content || [];
    if (!searchEmployeeName) return list;

    const query = searchEmployeeName.toLowerCase();
    return list.filter(
      r =>
        r.employeeName.toLowerCase().includes(query) ||
        r.employeeCode.toLowerCase().includes(query)
    );
  }, [allRequestsData, searchEmployeeName]);

  // Bộ lọc số dư phép toàn công ty dành cho HR
  const [balanceSearch, setBalanceSearch] = useState("");
  const filteredAllBalances = React.useMemo(() => {
    if (!balanceSearch) return allBalances;
    const query = balanceSearch.toLowerCase();
    return allBalances.filter(
      b =>
        b.employeeName.toLowerCase().includes(query) ||
        b.leaveTypeName.toLowerCase().includes(query) ||
        b.leaveTypeCode.toLowerCase().includes(query)
    );
  }, [allBalances, balanceSearch]);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý Nghỉ phép</h1>
          <p className="text-muted-foreground">
            Xin nghỉ phép trực tuyến, theo dõi số dư phép năm và phê duyệt đơn nghỉ của nhân viên.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
            <Plus size={16} /> Tạo đơn xin nghỉ
          </Button>
        </div>
      </div>

      <Tabs defaultValue="my-leaves" className="w-full space-y-6">
        <TabsList className="grid w-full grid-cols-3 md:w-[480px]">
          <TabsTrigger value="my-leaves">Phép của tôi</TabsTrigger>
          {canApprove && (
            <TabsTrigger value="team-approvals" className="relative">
              Duyệt đơn của team
              {pendingRequestsData?.content && pendingRequestsData.content.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground animate-bounce">
                  {pendingRequestsData.content.length}
                </span>
              )}
            </TabsTrigger>
          )}
          {(isHR || isManager) && (
            <TabsTrigger value="company-leaves">Quản lý toàn công ty</TabsTrigger>
          )}
        </TabsList>

        {/* ==================== TAB 1: PHÉP CỦA TÔI ==================== */}
        <TabsContent value="my-leaves" className="space-y-6">
          {/* Hộp số dư phép */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {isMyBalancesLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="h-20 bg-muted" />
                  <CardContent className="h-16 bg-muted/50" />
                </Card>
              ))
            ) : myBalances.length === 0 ? (
              <Card className="col-span-full border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-6 text-center">
                  <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="font-semibold text-muted-foreground">Không tìm thấy số dư phép năm {currentYear}</p>
                  <p className="text-sm text-muted-foreground">Vui lòng liên hệ HR để phân bổ phép năm cho bạn.</p>
                </CardContent>
              </Card>
            ) : (
              myBalances.map((balance) => {
                const percent = Math.min(100, Math.round((balance.usedDays / balance.totalDays) * 100)) || 0;
                return (
                  <Card key={balance.id} className="relative overflow-hidden border shadow-sm hover:shadow-md transition-shadow">
                    <div className={`absolute top-0 left-0 w-full h-1 ${LEAVE_TYPE_COLORS[balance.leaveTypeCode] || "bg-primary"}`} />
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg font-bold">{balance.leaveTypeName}</CardTitle>
                        <Badge variant="outline" className="font-semibold">
                          {balance.leaveTypeCode}
                        </Badge>
                      </div>
                      <CardDescription>Số dư phép trong năm {balance.year}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-baseline">
                        <span className="text-3xl font-extrabold tracking-tight text-foreground">
                          {balance.remainingDays}
                        </span>
                        <span className="text-xs text-muted-foreground font-medium">
                          còn lại / {balance.totalDays} ngày
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Đã nghỉ: {balance.usedDays}d</span>
                          <span>Chờ duyệt: {balance.pendingDays}d</span>
                        </div>
                        <Progress value={percent} className="h-1.5" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* Bảng đơn nghỉ phép cá nhân */}
          <Card>
            <CardHeader>
              <CardTitle>Lịch sử nghỉ phép của tôi</CardTitle>
              <CardDescription>Danh sách các đơn xin nghỉ phép bạn đã gửi và trạng thái phê duyệt của chúng.</CardDescription>
            </CardHeader>
            <CardContent>
              {isMyRequestsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !myRequestsData?.content || myRequestsData.content.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Bạn chưa gửi đơn xin nghỉ phép nào.
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Loại phép</TableHead>
                        <TableHead>Từ ngày</TableHead>
                        <TableHead>Đến ngày</TableHead>
                        <TableHead className="text-center">Số ngày</TableHead>
                        <TableHead>Lý do nghỉ</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Minh chứng</TableHead>
                        <TableHead>Người duyệt / Ghi chú</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {myRequestsData.content.map((req) => (
                        <TableRow key={req.id}>
                          <TableCell className="font-semibold">
                            {req.leaveTypeName}
                            <span className="ml-1 text-[10px] text-muted-foreground">({req.leaveTypeCode})</span>
                          </TableCell>
                          <TableCell>{new Date(req.startDate).toLocaleDateString("vi-VN")}</TableCell>
                          <TableCell>{new Date(req.endDate).toLocaleDateString("vi-VN")}</TableCell>
                          <TableCell className="text-center font-bold text-primary">{req.totalDays}</TableCell>
                          <TableCell className="max-w-xs truncate" title={req.reason}>
                            {req.reason}
                          </TableCell>
                          <TableCell>
                            <Badge className={STATUS_BADGES[req.status] || ""} variant="outline">
                              {STATUS_LABELS[req.status] || req.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {req.attachmentUrl ? (
                              <a
                                href={req.attachmentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 text-xs text-primary hover:underline"
                              >
                                <Download size={12} /> Tải file
                              </a>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {req.managerId ? (
                              <div className="text-xs space-y-0.5">
                                <span className="font-medium">{req.managerName}</span>
                                {req.managerNote && (
                                  <p className="text-muted-foreground italic">"{req.managerNote}"</p>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
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

        {/* ==================== TAB 2: DUYỆT ĐƠN CỦA TEAM ==================== */}
        {canApprove && (
          <TabsContent value="team-approvals" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Danh sách đơn nghỉ chờ duyệt</CardTitle>
                    <CardDescription>Phê duyệt hoặc từ chối các đơn nghỉ phép từ nhân viên cấp dưới.</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ["pending-leave-requests"] })}
                  >
                    Làm mới
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isPendingRequestsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : !pendingRequestsData?.content || pendingRequestsData.content.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground flex flex-col items-center gap-2">
                    <UserCheck className="h-10 w-10 text-muted-foreground" />
                    <span>Không có đơn nghỉ phép nào đang chờ phê duyệt.</span>
                  </div>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nhân viên</TableHead>
                          <TableHead>Loại phép</TableHead>
                          <TableHead>Từ ngày</TableHead>
                          <TableHead>Đến ngày</TableHead>
                          <TableHead className="text-center">Số ngày</TableHead>
                          <TableHead>Lý do xin nghỉ</TableHead>
                          <TableHead>Minh chứng</TableHead>
                          <TableHead>Hành động</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingRequestsData.content.map((req) => (
                          <TableRow key={req.id}>
                            <TableCell>
                              <div className="font-medium">{req.employeeName}</div>
                              <div className="text-xs text-muted-foreground">{req.employeeCode}</div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {req.leaveTypeName}
                              <span className="ml-1 text-[10px] text-muted-foreground">({req.leaveTypeCode})</span>
                            </TableCell>
                            <TableCell>{new Date(req.startDate).toLocaleDateString("vi-VN")}</TableCell>
                            <TableCell>{new Date(req.endDate).toLocaleDateString("vi-VN")}</TableCell>
                            <TableCell className="text-center font-bold text-primary">{req.totalDays}</TableCell>
                            <TableCell className="max-w-xs truncate" title={req.reason}>
                              {req.reason}
                            </TableCell>
                            <TableCell>
                              {req.attachmentUrl ? (
                                <a
                                  href={req.attachmentUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                                >
                                  <Download size={12} /> Xem file
                                </a>
                              ) : (
                                <span className="text-muted-foreground text-xs">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1.5">
                                <Button
                                  size="sm"
                                  onClick={() => openApprovalDialog(req)}
                                  className="h-8 px-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                  Duyệt
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

        {/* ==================== TAB 3: QUẢN LÝ TOÀN CÔNG TY ==================== */}
        {(isHR || isManager) && (
          <TabsContent value="company-leaves" className="space-y-6">
            {/* Bộ lọc đơn phép */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Bộ lọc tìm kiếm</CardTitle>
                <CardDescription>Lọc danh sách đơn nghỉ phép của toàn bộ nhân viên.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-1">
                    <Label htmlFor="search-name">Tên / Mã nhân viên</Label>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search-name"
                        type="text"
                        placeholder="Tìm nhân viên..."
                        className="pl-9"
                        value={searchEmployeeName}
                        onChange={(e) => setSearchEmployeeName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="filter-dept">Phòng ban</Label>
                    <Select value={filterDeptId} onValueChange={setFilterDeptId}>
                      <SelectTrigger id="filter-dept">
                        <SelectValue placeholder="Tất cả phòng ban" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả phòng ban</SelectItem>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id.toString()}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="filter-status">Trạng thái</Label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger id="filter-status">
                        <SelectValue placeholder="Tất cả trạng thái" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả trạng thái</SelectItem>
                        <SelectItem value="PENDING">Chờ phê duyệt</SelectItem>
                        <SelectItem value="APPROVED">Đã phê duyệt</SelectItem>
                        <SelectItem value="REJECTED">Đã từ chối</SelectItem>
                        <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => {
                        setSearchEmployeeName("");
                        setFilterDeptId("all");
                        setFilterStatus("all");
                      }}
                    >
                      Xóa bộ lọc
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="all-requests" className="w-full space-y-4">
              <TabsList className="bg-muted p-1 rounded-md">
                <TabsTrigger value="all-requests">Đơn xin nghỉ phép</TabsTrigger>
                {isHR && <TabsTrigger value="all-balances">Số dư phép nhân viên</TabsTrigger>}
              </TabsList>

              <TabsContent value="all-requests">
                <Card>
                  <CardHeader>
                    <CardTitle>Bảng đơn nghỉ phép</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isAllRequestsLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : filteredAllRequests.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Không tìm thấy đơn nghỉ phép nào khớp với bộ lọc.
                      </div>
                    ) : (
                      <div className="rounded-md border overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Nhân viên</TableHead>
                              <TableHead>Loại phép</TableHead>
                              <TableHead>Từ ngày</TableHead>
                              <TableHead>Đến ngày</TableHead>
                              <TableHead className="text-center">Số ngày</TableHead>
                              <TableHead>Lý do nghỉ</TableHead>
                              <TableHead>Trạng thái</TableHead>
                              <TableHead>Minh chứng</TableHead>
                              <TableHead>Người duyệt / Ghi chú</TableHead>
                              {isSuperOrHRAdmin && <TableHead>Hành động</TableHead>}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredAllRequests.map((req) => (
                              <TableRow key={req.id}>
                                <TableCell>
                                  <div className="font-semibold">{req.employeeName}</div>
                                  <div className="text-xs text-muted-foreground">{req.employeeCode}</div>
                                </TableCell>
                                <TableCell className="font-medium">
                                  {req.leaveTypeName}
                                  <span className="ml-1 text-[10px] text-muted-foreground">({req.leaveTypeCode})</span>
                                </TableCell>
                                <TableCell>{new Date(req.startDate).toLocaleDateString("vi-VN")}</TableCell>
                                <TableCell>{new Date(req.endDate).toLocaleDateString("vi-VN")}</TableCell>
                                <TableCell className="text-center font-bold text-primary">{req.totalDays}</TableCell>
                                <TableCell className="max-w-xs truncate" title={req.reason}>
                                  {req.reason}
                                </TableCell>
                                <TableCell>
                                  <Badge className={STATUS_BADGES[req.status] || ""} variant="outline">
                                    {STATUS_LABELS[req.status] || req.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {req.attachmentUrl ? (
                                    <a
                                      href={req.attachmentUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                                    >
                                      <Download size={12} /> Xem
                                    </a>
                                  ) : (
                                    <span className="text-muted-foreground text-xs">—</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {req.managerId ? (
                                    <div className="text-xs">
                                      <span className="font-medium">{req.managerName}</span>
                                      {req.managerNote && (
                                        <p className="text-muted-foreground italic">"{req.managerNote}"</p>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground text-xs">—</span>
                                  )}
                                </TableCell>
                                {isSuperOrHRAdmin && (
                                  <TableCell>
                                    {req.status === "PENDING" && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 border-primary text-primary hover:bg-primary/10"
                                        onClick={() => openApprovalDialog(req, true)}
                                      >
                                        Duyệt đè
                                      </Button>
                                    )}
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

              {/* Lịch số dư phép toàn công ty dành cho HR */}
              {isHR && (
                <TabsContent value="all-balances">
                  <Card>
                    <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3">
                      <div>
                        <CardTitle>Bảng tổng hợp số dư phép nhân viên</CardTitle>
                        <CardDescription>Xem số ngày phép còn lại của từng nhân viên trong năm {currentYear}.</CardDescription>
                      </div>
                      <div className="w-72">
                        <Input
                          placeholder="Tìm nhân viên hoặc loại phép..."
                          value={balanceSearch}
                          onChange={(e) => setBalanceSearch(e.target.value)}
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      {isAllBalancesLoading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : filteredAllBalances.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          Không tìm thấy số dư phép nào.
                        </div>
                      ) : (
                        <div className="rounded-md border overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Nhân viên</TableHead>
                                <TableHead>Loại phép</TableHead>
                                <TableHead>Năm</TableHead>
                                <TableHead className="text-center">Tổng số ngày</TableHead>
                                <TableHead className="text-center">Đã nghỉ</TableHead>
                                <TableHead className="text-center">Chờ duyệt</TableHead>
                                <TableHead className="text-center">Còn lại</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredAllBalances.map((bal) => (
                                <TableRow key={bal.id}>
                                  <TableCell className="font-semibold">{bal.employeeName}</TableCell>
                                  <TableCell>
                                    {bal.leaveTypeName}
                                    <span className="ml-1 text-[10px] text-muted-foreground">({bal.leaveTypeCode})</span>
                                  </TableCell>
                                  <TableCell>{bal.year}</TableCell>
                                  <TableCell className="text-center">{bal.totalDays}</TableCell>
                                  <TableCell className="text-center text-emerald-600 font-medium">{bal.usedDays}</TableCell>
                                  <TableCell className="text-center text-amber-600 font-medium">{bal.pendingDays}</TableCell>
                                  <TableCell className="text-center text-primary font-bold">{bal.remainingDays}</TableCell>
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
          </TabsContent>
        )}
      </Tabs>

      {/* ==================== DIALOG: TẠO ĐƠN XIN NGHỈ PHÉP ==================== */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleCreateSubmit}>
            <DialogHeader>
              <DialogTitle>Đơn xin nghỉ phép</DialogTitle>
              <DialogDescription>
                Điền đầy đủ thông tin để gửi yêu cầu nghỉ phép lên Quản lý trực tiếp.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="leave-type">Loại nghỉ phép <span className="text-destructive">*</span></Label>
                <Select value={leaveTypeCode} onValueChange={setLeaveTypeCode} required>
                  <SelectTrigger id="leave-type">
                    <SelectValue placeholder="Chọn loại phép..." />
                  </SelectTrigger>
                  <SelectContent>
                    {myBalances.map((bal) => (
                      <SelectItem key={bal.id} value={bal.leaveTypeCode}>
                        {bal.leaveTypeName} ({bal.leaveTypeCode}) - Còn lại {bal.remainingDays} ngày
                      </SelectItem>
                    ))}
                    {/* Thêm lựa chọn phép không lương nếu không có hoặc hết phép năm */}
                    <SelectItem value="UL">Nghỉ không lương (UL)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="start-date">Từ ngày <span className="text-destructive">*</span></Label>
                  <Input
                    id="start-date"
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="end-date">Đến ngày <span className="text-destructive">*</span></Label>
                  <Input
                    id="end-date"
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="total-days">Số ngày nghỉ đề xuất</Label>
                <Input
                  id="total-days"
                  type="number"
                  min="0.5"
                  step="0.5"
                  required
                  value={totalDays}
                  onChange={(e) => setTotalDays(Number(e.target.value))}
                />
                <p className="text-[11px] text-muted-foreground">
                  Số ngày nghỉ được tự động tính toán dựa trên khoảng ngày (bao gồm cả ngày nghỉ tuần). Bạn có thể chỉnh sửa lại nếu cần nghỉ nửa ngày.
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="reason">Lý do nghỉ <span className="text-destructive">*</span></Label>
                <Textarea
                  id="reason"
                  placeholder="Lý do chi tiết..."
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="attachment">Tài liệu đính kèm (nếu có)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="attachment"
                    type="file"
                    className="cursor-pointer"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setAttachmentFile(e.target.files[0]);
                      }
                    }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Đính kèm giấy chứng nhận y tế (nếu nghỉ ốm), hóa đơn hoặc tài liệu scan minh chứng liên quan.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={createRequestMutation.isPending}>
                {createRequestMutation.isPending ? "Đang gửi..." : "Gửi yêu cầu"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ==================== DIALOG: PHÊ DUYỆT ĐƠN NGHỈ PHÉP (MANAGER & HR OVERRIDE) ==================== */}
      <Dialog open={isApprovalOpen} onOpenChange={setIsApprovalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <form onSubmit={handleApprovalSubmit}>
            <DialogHeader>
              <DialogTitle>
                {isOverride ? "HR Phê duyệt ghi đè đơn nghỉ" : "Phê duyệt đơn xin nghỉ phép"}
              </DialogTitle>
              <DialogDescription>
                {isOverride 
                  ? `Đang duyệt ghi đè cho nhân viên ${selectedRequest?.employeeName}.` 
                  : `Phản hồi yêu cầu xin nghỉ phép của nhân viên ${selectedRequest?.employeeName}.`}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="bg-muted/40 p-3 rounded-lg text-xs space-y-2 border">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nhân viên:</span>
                  <span className="font-semibold">{selectedRequest?.employeeName} ({selectedRequest?.employeeCode})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Loại phép:</span>
                  <span className="font-semibold">{selectedRequest?.leaveTypeName} ({selectedRequest?.leaveTypeCode})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Thời gian nghỉ:</span>
                  <span className="font-semibold">
                    {selectedRequest && new Date(selectedRequest.startDate).toLocaleDateString("vi-VN")} - {selectedRequest && new Date(selectedRequest.endDate).toLocaleDateString("vi-VN")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tổng số ngày:</span>
                  <span className="font-bold text-primary">{selectedRequest?.totalDays} ngày</span>
                </div>
                <div className="pt-1 border-t space-y-1">
                  <span className="text-muted-foreground block">Lý do nghỉ:</span>
                  <p className="italic text-foreground">"{selectedRequest?.reason}"</p>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="approval-action">Quyết định <span className="text-destructive">*</span></Label>
                <Select
                  value={approvalStatus}
                  onValueChange={(val) => setApprovalStatus(val as "APPROVED" | "REJECTED")}
                >
                  <SelectTrigger id="approval-action">
                    <SelectValue placeholder="Chọn quyết định..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="APPROVED">Đồng ý phê duyệt (APPROVED)</SelectItem>
                    <SelectItem value="REJECTED">Từ chối đơn (REJECTED)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="manager-note">Ghi chú phản hồi</Label>
                <Textarea
                  id="manager-note"
                  placeholder="Ghi chú, lý do phê duyệt/từ chối..."
                  rows={3}
                  value={managerNote}
                  onChange={(e) => setManagerNote(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsApprovalOpen(false)}>
                Đóng
              </Button>
              <Button
                type="submit"
                disabled={approveRequestMutation.isPending || overrideRequestMutation.isPending}
                className={approvalStatus === "APPROVED" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-destructive hover:bg-destructive/90 text-white"}
              >
                {approveRequestMutation.isPending || overrideRequestMutation.isPending ? "Đang xử lý..." : "Xác nhận"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeavePage;
