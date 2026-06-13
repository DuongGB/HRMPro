import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { payrollApi, type SalaryConfigResponse, type EmployeeAllowanceResponse, type PayslipResponse } from "../api/payrollApi";
import { employeeApi } from "../../employee/api/employeeApi";
import api from "../../../config/api";
import { toast } from "sonner";
import { usePermission } from "../../../hooks/usePermission";
import {
  CheckCircle,
  Plus,
  Edit,
  Trash2,
  Download,
  Lock,
  Unlock,
  Send,
  Eye,
  RefreshCw,
  SlidersHorizontal,
  Loader2,
  Info
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

const RUN_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  PROCESSING: "bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse",
  COMPLETED: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  PUBLISHED: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
};

const RUN_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Nháp",
  PROCESSING: "Đang tính toán",
  COMPLETED: "Đã chốt lương",
  PUBLISHED: "Đã phát hành",
};

const ALLOWANCE_TYPE_LABELS: Record<string, string> = {
  MEAL: "Ăn trưa",
  TRANSPORT: "Xăng xe/Đi lại",
  PHONE: "Điện thoại",
  HOUSING: "Nhà ở",
  RESPONSIBILITY: "Trách nhiệm",
};

const PayrollPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = usePermission();
  const roles = user?.roles || [];

  const isSuperAdmin = roles.includes("SUPER_ADMIN");
  const isHRAdmin = roles.includes("HR_ADMIN");
  const isHR = roles.some(r => ["SUPER_ADMIN", "HR_ADMIN", "HR_STAFF"].includes(r));

  // State quản lý tab đang chọn
  const [activeMainTab, setActiveMainTab] = useState("my-payslips");

  // State Quản lý kỳ lương
  const [selectedRunId, setSelectedRunId] = useState<string>("all");
  const [isCreateRunOpen, setIsCreateRunOpen] = useState(false);
  const [newRunYear, setNewRunYear] = useState<number>(new Date().getFullYear());
  const [newRunMonth, setNewRunMonth] = useState<number>(new Date().getMonth() + 1);
  const [newRunNotes, setNewRunNotes] = useState("");

  // State sửa khấu trừ khác
  const [isEditDeductionOpen, setIsEditDeductionOpen] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<PayslipResponse | null>(null);
  const [editDeductionAmount, setEditDeductionAmount] = useState<number>(0);

  // State cấu hình lương gốc (Salary Config)
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [configId, setConfigId] = useState<number | null>(null);
  const [configEffectiveDate, setConfigEffectiveDate] = useState("");
  const [configMinWage, setConfigMinWage] = useState<number>(0);
  const [configSocialRate, setConfigSocialRate] = useState<number>(8.0);
  const [configHealthRate, setConfigHealthRate] = useState<number>(1.5);
  const [configUnemploymentRate, setConfigUnemploymentRate] = useState<number>(1.0);
  const [configPersonalDeduction, setConfigPersonalDeduction] = useState<number>(11000000);
  const [configDependentDeduction, setConfigDependentDeduction] = useState<number>(4400000);
  const [configIsActive, setConfigIsActive] = useState(true);

  // State Phụ cấp nhân viên (Allowances)
  const [selectedEmpId, setSelectedEmpId] = useState<string>("");
  const [isAllowanceOpen, setIsAllowanceOpen] = useState(false);
  const [allowanceId, setAllowanceId] = useState<number | null>(null);
  const [allowanceType, setAllowanceType] = useState("MEAL");
  const [allowanceAmount, setAllowanceAmount] = useState<number>(0);
  const [allowanceIsTaxable, setAllowanceIsTaxable] = useState(false);
  const [allowanceEffectiveDate, setAllowanceEffectiveDate] = useState("");
  const [allowanceEndDate, setAllowanceEndDate] = useState("");

  // State xem chi tiết phiếu lương cá nhân (Payslip Modal)
  const [isPayslipDetailOpen, setIsPayslipDetailOpen] = useState(false);
  const [viewingPayslip, setViewingPayslip] = useState<PayslipResponse | null>(null);

  // ─── Queries ──────────────────────────────────────────────────────────────────

  // 1. Lấy danh sách phiếu lương cá nhân (Employee)
  const { data: myPayslips = [], isLoading: isMyPayslipsLoading } = useQuery({
    queryKey: ["my-payslips", user?.employeeId],
    queryFn: payrollApi.getMyPayslips,
    enabled: !!user?.employeeId,
  });

  // 2. Lấy danh sách kỳ lương (HR/Super Admin)
  const { data: payrollRuns = [] } = useQuery({
    queryKey: ["payroll-runs"],
    queryFn: payrollApi.getPayrollRuns,
    enabled: isHR,
  });

  // 3. Lấy danh sách phiếu lương của kỳ được chọn (HR/Super Admin)
  const runIdNumber = selectedRunId && selectedRunId !== "all" ? Number(selectedRunId) : null;
  const { data: payslips = [], isLoading: isPayslipsLoading } = useQuery({
    queryKey: ["payslips", runIdNumber],
    queryFn: () => payrollApi.getPayslips(runIdNumber!),
    enabled: isHR && runIdNumber !== null,
  });

  // 4. Lấy danh sách cấu hình lương gốc (Super Admin)
  const { data: salaryConfigs = [], isLoading: isConfigsLoading } = useQuery({
    queryKey: ["salary-configs"],
    queryFn: payrollApi.getConfigs,
    enabled: isSuperAdmin,
  });

  // 5. Lấy danh sách nhân viên phục vụ dropdown phụ cấp (HR Admin / Super Admin)
  const { data: employeeListResponse } = useQuery({
    queryKey: ["active-employees-payroll-dropdown"],
    queryFn: () => employeeApi.getEmployees("", null, "ACTIVE", 0, 200),
    enabled: isHR,
  });
  const employees = employeeListResponse?.content || [];

  // 6. Lấy danh sách phụ cấp của nhân viên được chọn trong tab phụ cấp (HR Admin / Super Admin)
  const empIdNumber = selectedEmpId ? Number(selectedEmpId) : null;
  const { data: allowances = [], isLoading: isAllowancesLoading } = useQuery({
    queryKey: ["employee-allowances", empIdNumber],
    queryFn: () => payrollApi.getAllowances(empIdNumber!),
    enabled: isHR && empIdNumber !== null,
  });

  // ─── Mutations ────────────────────────────────────────────────────────────────

  // 1. Tạo kỳ chạy lương mới
  const createRunMutation = useMutation({
    mutationFn: payrollApi.createPayrollRun,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["payroll-runs"] });
      toast.success(`Khởi tạo kỳ lương tháng ${data.month}/${data.year} thành công!`);
      setSelectedRunId(data.id.toString());
      setIsCreateRunOpen(false);
      resetRunForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Khởi tạo kỳ lương thất bại!");
    }
  });

  // 2. Tính toán lại kỳ chạy lương
  const recalculateMutation = useMutation({
    mutationFn: payrollApi.recalculateRun,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payslips", runIdNumber] });
      toast.success("Đã tính toán lại bảng lương kỳ này thành công!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Tính toán lại thất bại!");
    }
  });

  // 3. Khóa/Publish kỳ lương
  const updateRunStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => 
      payrollApi.updateRunStatus(id, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["payroll-runs"] });
      queryClient.invalidateQueries({ queryKey: ["payslips", data.id] });
      toast.success(`Trạng thái kỳ lương đã chuyển sang: ${RUN_STATUS_LABELS[data.status]}`);
    },
    onError: (error: any) => {
      toast.error(error.message || "Cập nhật trạng thái thất bại!");
    }
  });

  // 4. Sửa khấu trừ khác
  const editDeductionMutation = useMutation({
    mutationFn: ({ id, amount }: { id: number; amount: number }) => 
      payrollApi.updatePayslipDeductions(id, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payslips", runIdNumber] });
      toast.success("Cập nhật khấu trừ thành công!");
      setIsEditDeductionOpen(false);
      setSelectedPayslip(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Cập nhật khấu trừ thất bại!");
    }
  });

  // 5. Thêm/Sửa cấu hình lương gốc
  const saveConfigMutation = useMutation({
    mutationFn: ({ id, data }: { id: number | null; data: any }) => 
      id ? payrollApi.updateConfig(id, data) : payrollApi.createConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salary-configs"] });
      toast.success("Lưu cấu hình lương gốc thành công!");
      setIsConfigOpen(false);
      resetConfigForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Lưu cấu hình thất bại!");
    }
  });

  // 6. Thêm/Sửa phụ cấp nhân viên
  const saveAllowanceMutation = useMutation({
    mutationFn: ({ id, data }: { id: number | null; data: any }) => 
      id ? payrollApi.updateAllowance(id, data) : payrollApi.createAllowance(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-allowances", empIdNumber] });
      toast.success("Lưu phụ cấp thành công!");
      setIsAllowanceOpen(false);
      resetAllowanceForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Lưu phụ cấp thất bại!");
    }
  });

  // 7. Xóa phụ cấp nhân viên
  const deleteAllowanceMutation = useMutation({
    mutationFn: payrollApi.deleteAllowance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-allowances", empIdNumber] });
      toast.success("Đã xóa phụ cấp nhân viên!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Xóa phụ cấp thất bại!");
    }
  });

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  const resetRunForm = () => {
    setNewRunNotes("");
  };

  const resetConfigForm = () => {
    setConfigId(null);
    setConfigEffectiveDate("");
    setConfigMinWage(0);
    setConfigSocialRate(8.0);
    setConfigHealthRate(1.5);
    setConfigUnemploymentRate(1.0);
    setConfigPersonalDeduction(11000000);
    setConfigDependentDeduction(4400000);
    setConfigIsActive(true);
  };

  const resetAllowanceForm = () => {
    setAllowanceId(null);
    setAllowanceType("MEAL");
    setAllowanceAmount(0);
    setAllowanceIsTaxable(false);
    setAllowanceEffectiveDate("");
    setAllowanceEndDate("");
  };

  const handleCreateRun = (e: React.FormEvent) => {
    e.preventDefault();
    createRunMutation.mutate({
      year: newRunYear,
      month: newRunMonth,
      notes: newRunNotes,
    });
  };

  const handleRecalculate = () => {
    if (!runIdNumber) return;
    recalculateMutation.mutate(runIdNumber);
  };

  const handleUpdateStatus = (status: string) => {
    if (!runIdNumber) return;
    updateRunStatusMutation.mutate({ id: runIdNumber, status });
  };

  const handleEditDeductionClick = (payslip: PayslipResponse) => {
    setSelectedPayslip(payslip);
    setEditDeductionAmount(payslip.otherDeductions);
    setIsEditDeductionOpen(true);
  };

  const handleEditDeductionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayslip) return;
    editDeductionMutation.mutate({
      id: selectedPayslip.id,
      amount: editDeductionAmount,
    });
  };

  const handleExportBank = async () => {
    if (!runIdNumber) return;
    try {
      const response = await api.get(`/payroll/runs/${runIdNumber}/export-bank`, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `danh-sach-chuyen-khoan-${runIdNumber}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success("Xuất file chuyển khoản ngân hàng thành công!");
    } catch (error) {
      toast.error("Xuất file ngân hàng thất bại!");
    }
  };

  const handleDownloadPdf = async (payslipId: number) => {
    try {
      const url = await payrollApi.getPayslipPdfUrl(payslipId);
      window.open(url, "_blank");
    } catch (error) {
      toast.error("Tải PDF phiếu lương thất bại!");
    }
  };

  const openConfigModal = (config?: SalaryConfigResponse) => {
    if (config) {
      setConfigId(config.id);
      setConfigEffectiveDate(config.effectiveDate);
      setConfigMinWage(config.minWage);
      setConfigSocialRate(config.socialInsuranceRate);
      setConfigHealthRate(config.healthInsuranceRate);
      setConfigUnemploymentRate(config.unemploymentRate);
      setConfigPersonalDeduction(config.personalDeduction);
      setConfigDependentDeduction(config.dependentDeduction);
      setConfigIsActive(config.isActive);
    } else {
      resetConfigForm();
      setConfigEffectiveDate(new Date().toISOString().split("T")[0]);
    }
    setIsConfigOpen(true);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveConfigMutation.mutate({
      id: configId,
      data: {
        effectiveDate: configEffectiveDate,
        minWage: configMinWage,
        socialInsuranceRate: configSocialRate,
        healthInsuranceRate: configHealthRate,
        unemploymentRate: configUnemploymentRate,
        personalDeduction: configPersonalDeduction,
        dependentDeduction: configDependentDeduction,
        isActive: configIsActive,
      }
    });
  };

  const openAllowanceModal = (allowance?: EmployeeAllowanceResponse) => {
    if (allowance) {
      setAllowanceId(allowance.id);
      setAllowanceType(allowance.allowanceType);
      setAllowanceAmount(allowance.amount);
      setAllowanceIsTaxable(allowance.isTaxable);
      setAllowanceEffectiveDate(allowance.effectiveDate);
      setAllowanceEndDate(allowance.endDate || "");
    } else {
      resetAllowanceForm();
      setAllowanceEffectiveDate(new Date().toISOString().split("T")[0]);
    }
    setIsAllowanceOpen(true);
  };

  const handleSaveAllowance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId) return;

    saveAllowanceMutation.mutate({
      id: allowanceId,
      data: {
        employeeId: Number(selectedEmpId),
        allowanceType,
        amount: allowanceAmount,
        isTaxable: allowanceIsTaxable,
        effectiveDate: allowanceEffectiveDate,
        endDate: allowanceEndDate || null,
      }
    });
  };

  const handleDeleteAllowance = (id: number) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa khoản phụ cấp này không?")) {
      deleteAllowanceMutation.mutate(id);
    }
  };

  const openPayslipDetail = (payslip: PayslipResponse) => {
    setViewingPayslip(payslip);
    setIsPayslipDetailOpen(true);
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  const currentRun = payrollRuns.find(r => r.id.toString() === selectedRunId);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tính lương & Phiếu lương</h1>
          <p className="text-muted-foreground">
            Quản lý bảng lương hàng tháng, tính bảo hiểm, thuế TNCN và gửi phiếu lương bảo mật cho nhân viên.
          </p>
        </div>
      </div>

      <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="w-full space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:w-[600px] lg:grid-cols-4">
          <TabsTrigger value="my-payslips">Phiếu lương của tôi</TabsTrigger>
          {isHR && <TabsTrigger value="runs-management">Quản lý kỳ lương</TabsTrigger>}
          {isSuperAdmin && <TabsTrigger value="salary-configs">Cấu hình lương gốc</TabsTrigger>}
          {isHR && <TabsTrigger value="allowances-management">Quản lý phụ cấp</TabsTrigger>}
        </TabsList>

        {/* ==================== TAB 1: PHIẾU LƯƠNG CỦA TÔI ==================== */}
        <TabsContent value="my-payslips" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lịch sử nhận phiếu lương</CardTitle>
              <CardDescription>Xem và tải về các phiếu lương hàng tháng đã được phát hành.</CardDescription>
            </CardHeader>
            <CardContent>
              {isMyPayslipsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : myPayslips.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Chưa có phiếu lương nào được phát hành cho bạn.
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kỳ lương</TableHead>
                        <TableHead>Lương cơ bản</TableHead>
                        <TableHead>Tổng phụ cấp</TableHead>
                        <TableHead>Bảo hiểm khấu trừ</TableHead>
                        <TableHead>Thuế TNCN</TableHead>
                        <TableHead>Khấu trừ khác</TableHead>
                        <TableHead className="font-bold text-primary">Thực nhận (Net)</TableHead>
                        <TableHead className="text-right">Hành động</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {myPayslips.map((p) => {
                        const totalIns = p.socialInsurance + p.healthInsurance + p.unemployment;
                        return (
                          <TableRow key={p.id}>
                            <TableCell className="font-semibold">Tháng {p.month}/{p.year}</TableCell>
                            <TableCell>{formatMoney(p.baseSalary)}</TableCell>
                            <TableCell>{formatMoney(p.totalAllowances)}</TableCell>
                            <TableCell className="text-destructive">-{formatMoney(totalIns)}</TableCell>
                            <TableCell className="text-destructive">-{formatMoney(p.personalIncomeTax)}</TableCell>
                            <TableCell className="text-destructive">-{formatMoney(p.otherDeductions)}</TableCell>
                            <TableCell className="font-bold text-emerald-600">{formatMoney(p.netSalary)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button size="sm" variant="outline" onClick={() => openPayslipDetail(p)} className="gap-1.5 h-8">
                                  <Eye size={14} /> Chi tiết
                                </Button>
                                <Button size="sm" onClick={() => handleDownloadPdf(p.id)} className="gap-1.5 h-8 bg-blue-600 hover:bg-blue-700">
                                  <Download size={14} /> Tải PDF
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== TAB 2: QUẢN LÝ KỲ LƯƠNG ==================== */}
        {isHR && (
          <TabsContent value="runs-management" className="space-y-6">
            {/* Bộ chọn kỳ lương & Action */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Bảng lương các phòng ban</CardTitle>
                    <CardDescription>Chọn kỳ lương để quản lý, tính toán và duyệt chốt.</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={selectedRunId} onValueChange={setSelectedRunId}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Chọn kỳ lương..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">-- Chọn kỳ lương --</SelectItem>
                        {payrollRuns.map((run) => (
                          <SelectItem key={run.id} value={run.id.toString()}>
                            Tháng {run.month}/{run.year} ({RUN_STATUS_LABELS[run.status] || run.status})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isHRAdmin && (
                      <Button onClick={() => setIsCreateRunOpen(true)} className="gap-1.5">
                        <Plus size={16} /> Kỳ lương mới
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              {currentRun && (
                <CardContent className="border-t pt-4">
                  <div className="flex flex-wrap items-center justify-between gap-4 bg-muted/30 p-3 rounded-lg border">
                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        Trạng thái:{" "}
                        <Badge className={`${RUN_STATUS_COLORS[currentRun.status]} ml-1 font-semibold`} variant="outline">
                          {RUN_STATUS_LABELS[currentRun.status] || currentRun.status}
                        </Badge>
                      </div>
                      <div>Người tạo: <span className="font-semibold">{currentRun.runByName}</span></div>
                      <div>Ngày tạo: <span className="font-semibold">{new Date(currentRun.runAt).toLocaleDateString("vi-VN")}</span></div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isHRAdmin && (currentRun.status === "DRAFT" || currentRun.status === "PROCESSING") && (
                        <>
                          <Button variant="outline" size="sm" onClick={handleRecalculate} disabled={recalculateMutation.isPending} className="gap-1.5">
                            <RefreshCw size={14} className={recalculateMutation.isPending ? "animate-spin" : ""} /> Tính toán lại
                          </Button>
                          <Button size="sm" onClick={() => handleUpdateStatus("COMPLETED")} className="gap-1.5 bg-blue-600 hover:bg-blue-700">
                            <Lock size={14} /> Phê duyệt & Khóa
                          </Button>
                        </>
                      )}

                      {isHRAdmin && currentRun.status === "COMPLETED" && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => handleUpdateStatus("DRAFT")} className="gap-1.5">
                            <Unlock size={14} /> Mở lại Nháp
                          </Button>
                          <Button size="sm" onClick={handleExportBank} className="gap-1.5 bg-indigo-600 hover:bg-indigo-700">
                            <Download size={14} /> Xuất file ngân hàng
                          </Button>
                          <Button size="sm" onClick={() => handleUpdateStatus("PUBLISHED")} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
                            <Send size={14} /> Phát hành phiếu lương
                          </Button>
                        </>
                      )}

                      {currentRun.status === "PUBLISHED" && (
                        <>
                          <Button size="sm" onClick={handleExportBank} className="gap-1.5 bg-indigo-600 hover:bg-indigo-700">
                            <Download size={14} /> Xuất file ngân hàng
                          </Button>
                          <div className="text-xs text-emerald-600 flex items-center gap-1 font-semibold">
                            <CheckCircle size={14} /> Phiếu lương đã được gửi đến nhân viên
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Bảng chi tiết lương nhân viên */}
            {selectedRunId === "all" ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                  <SlidersHorizontal className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="font-semibold text-muted-foreground">Chưa chọn kỳ lương</p>
                  <p className="text-sm text-muted-foreground">Vui lòng chọn một kỳ chạy lương ở góc phải để hiển thị chi tiết bảng tính toán lương.</p>
                </CardContent>
              </Card>
            ) : isPayslipsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : payslips.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground border rounded-lg bg-background">
                Không tìm thấy thông tin tính lương của nhân viên nào trong kỳ này.
              </div>
            ) : (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Bảng chi tiết lương chi tiết</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nhân viên</TableHead>
                          <TableHead>Lương cơ bản</TableHead>
                          <TableHead className="text-center">Công chuẩn/thực</TableHead>
                          <TableHead>Phụ cấp</TableHead>
                          <TableHead>Gross Salary</TableHead>
                          <TableHead>BHXH/BHYT/BHTN</TableHead>
                          <TableHead>Thuế TNCN</TableHead>
                          <TableHead>Khấu trừ khác</TableHead>
                          <TableHead className="font-bold text-primary">Thực nhận (Net)</TableHead>
                          <TableHead className="text-right">Hành động</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payslips.map((p) => {
                          const totalIns = p.socialInsurance + p.healthInsurance + p.unemployment;
                          return (
                            <TableRow key={p.id} className="hover:bg-muted/30">
                              <TableCell>
                                <div className="font-medium">{p.employeeName}</div>
                                <div className="text-[10px] text-muted-foreground">{p.employeeCode} - {p.departmentName}</div>
                              </TableCell>
                              <TableCell>{formatMoney(p.baseSalary)}</TableCell>
                              <TableCell className="text-center font-semibold text-muted-foreground">
                                {p.standardWorkDays}/{p.actualWorkDays}
                              </TableCell>
                              <TableCell>{formatMoney(p.totalAllowances)}</TableCell>
                              <TableCell className="font-medium">{formatMoney(p.grossSalary)}</TableCell>
                              <TableCell className="text-destructive">
                                -{formatMoney(totalIns)}
                                <div className="text-[9px] text-muted-foreground mt-0.5">
                                  XH:{formatMoney(p.socialInsurance)} | YT:{formatMoney(p.healthInsurance)} | TN:{formatMoney(p.unemployment)}
                                </div>
                              </TableCell>
                              <TableCell className="text-destructive">-{formatMoney(p.personalIncomeTax)}</TableCell>
                              <TableCell className="text-destructive font-medium">
                                -{formatMoney(p.otherDeductions)}
                                {isHRAdmin && (currentRun?.status === "DRAFT" || currentRun?.status === "PROCESSING") && (
                                  <Button variant="ghost" size="icon" className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground" onClick={() => handleEditDeductionClick(p)}>
                                    <Edit size={12} />
                                  </Button>
                                )}
                              </TableCell>
                              <TableCell className="font-extrabold text-emerald-600">{formatMoney(p.netSalary)}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => openPayslipDetail(p)}>
                                    Chi tiết
                                  </Button>
                                  {currentRun?.status === "PUBLISHED" && (
                                    <Button size="sm" variant="outline" className="h-8 px-2 border-primary text-primary" onClick={() => handleDownloadPdf(p.id)}>
                                      PDF
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}

        {/* ==================== TAB 3: CẤU HÌNH LƯƠNG GỐC ==================== */}
        {isSuperAdmin && (
          <TabsContent value="salary-configs" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Tham số bảo hiểm & Thuế hệ thống</CardTitle>
                    <CardDescription>Cập nhật mức lương tối thiểu, tỷ lệ bảo hiểm xã hội bắt buộc và ngưỡng giảm trừ gia cảnh.</CardDescription>
                  </div>
                  <Button onClick={() => openConfigModal()} className="gap-1.5">
                    <Plus size={16} /> Thêm cấu hình
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isConfigsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : salaryConfigs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Chưa có cấu hình lương gốc nào.
                  </div>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ngày hiệu lực</TableHead>
                          <TableHead>Lương tối thiểu vùng</TableHead>
                          <TableHead>Tỷ lệ đóng (XH / YT / TN)</TableHead>
                          <TableHead>Giảm trừ bản thân</TableHead>
                          <TableHead>Giảm trừ phụ thuộc</TableHead>
                          <TableHead>Trạng thái</TableHead>
                          <TableHead className="text-right">Hành động</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {salaryConfigs.map((c) => (
                          <TableRow key={c.id}>
                            <TableCell className="font-semibold">
                              {new Date(c.effectiveDate).toLocaleDateString("vi-VN")}
                            </TableCell>
                            <TableCell>{formatMoney(c.minWage)}</TableCell>
                            <TableCell>
                              <div className="space-y-0.5">
                                <div>BHXH: <span className="font-semibold">{c.socialInsuranceRate}%</span></div>
                                <div>BHYT: <span className="font-semibold">{c.healthInsuranceRate}%</span></div>
                                <div>BHTN: <span className="font-semibold">{c.unemploymentRate}%</span></div>
                              </div>
                            </TableCell>
                            <TableCell>{formatMoney(c.personalDeduction)}</TableCell>
                            <TableCell>{formatMoney(c.dependentDeduction)}</TableCell>
                            <TableCell>
                              <Badge variant={c.isActive ? "default" : "secondary"}>
                                {c.isActive ? "Đang áp dụng" : "Hết hiệu lực"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="outline" size="sm" onClick={() => openConfigModal(c)}>
                                Sửa
                              </Button>
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

        {/* ==================== TAB 4: QUẢN LÝ PHỤ CẤP NHÂN VIÊN ==================== */}
        {isHR && (
          <TabsContent value="allowances-management" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Phụ cấp cố định của nhân viên</CardTitle>
                    <CardDescription>Cấu hình các khoản phụ cấp hàng tháng (ăn trưa, điện thoại, xăng xe...) cho nhân viên.</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={selectedEmpId} onValueChange={setSelectedEmpId}>
                      <SelectTrigger className="w-[250px]">
                        <SelectValue placeholder="Chọn nhân viên..." />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id.toString()}>
                            {emp.lastName} {emp.firstName} ({emp.employeeCode})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedEmpId && (
                      <Button onClick={() => openAllowanceModal()} className="gap-1.5">
                        <Plus size={16} /> Thêm phụ cấp
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {!selectedEmpId ? (
                  <div className="text-center py-10 text-muted-foreground flex flex-col items-center gap-2 border-2 border-dashed rounded-lg">
                    <Info className="h-8 w-8 text-muted-foreground" />
                    <span>Chọn một nhân viên từ hộp chọn ở góc trên bên phải để bắt đầu quản lý phụ cấp của họ.</span>
                  </div>
                ) : isAllowancesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : allowances.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nhân viên này chưa được cấu hình khoản phụ cấp nào.
                  </div>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Loại phụ cấp</TableHead>
                          <TableHead>Số tiền hàng tháng</TableHead>
                          <TableHead>Tính thuế TNCN?</TableHead>
                          <TableHead>Từ ngày</TableHead>
                          <TableHead>Đến ngày</TableHead>
                          <TableHead className="text-right">Hành động</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allowances.map((a) => (
                          <TableRow key={a.id}>
                            <TableCell className="font-semibold">
                              {ALLOWANCE_TYPE_LABELS[a.allowanceType] || a.allowanceType}
                            </TableCell>
                            <TableCell className="text-emerald-600 font-bold">{formatMoney(a.amount)}</TableCell>
                            <TableCell>
                              <Badge variant={a.isTaxable ? "destructive" : "outline"}>
                                {a.isTaxable ? "Chịu thuế" : "Miễn thuế"}
                              </Badge>
                            </TableCell>
                            <TableCell>{new Date(a.effectiveDate).toLocaleDateString("vi-VN")}</TableCell>
                            <TableCell>{a.endDate ? new Date(a.endDate).toLocaleDateString("vi-VN") : "—"}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" onClick={() => openAllowanceModal(a)}>
                                  <Edit size={14} />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteAllowance(a.id)}>
                                  <Trash2 size={14} />
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
      </Tabs>

      {/* ==================== DIALOG: TẠO KỲ CHẠY LƯƠNG MỚI ==================== */}
      <Dialog open={isCreateRunOpen} onOpenChange={setIsCreateRunOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <form onSubmit={handleCreateRun}>
            <DialogHeader>
              <DialogTitle>Khởi tạo kỳ chạy lương mới</DialogTitle>
              <DialogDescription>
                Hệ thống sẽ tự động quét dữ liệu hợp đồng và ngày công thực tế của nhân viên để khởi tạo bảng lương nháp.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="run-month">Tháng</Label>
                  <Select value={newRunMonth.toString()} onValueChange={(val) => setNewRunMonth(Number(val))}>
                    <SelectTrigger id="run-month">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }).map((_, i) => (
                        <SelectItem key={i} value={(i + 1).toString()}>
                          Tháng {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="run-year">Năm</Label>
                  <Select value={newRunYear.toString()} onValueChange={(val) => setNewRunYear(Number(val))}>
                    <SelectTrigger id="run-year">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[-1, 0, 1].map((offset) => {
                        const y = new Date().getFullYear() + offset;
                        return (
                          <SelectItem key={y} value={y.toString()}>
                            Năm {y}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="run-notes">Ghi chú kỳ lương</Label>
                <Textarea
                  id="run-notes"
                  placeholder="Ghi chú kỳ lương (ví dụ: Lương tháng 5/2026 đợt 1)..."
                  rows={3}
                  value={newRunNotes}
                  onChange={(e) => setNewRunNotes(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateRunOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={createRunMutation.isPending}>
                {createRunMutation.isPending ? "Đang xử lý..." : "Khởi tạo bảng lương"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ==================== DIALOG: SỬA KHẤU TRỪ KHÁC ==================== */}
      <Dialog open={isEditDeductionOpen} onOpenChange={setIsEditDeductionOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <form onSubmit={handleEditDeductionSubmit}>
            <DialogHeader>
              <DialogTitle>Điều chỉnh khấu trừ khác</DialogTitle>
              <DialogDescription>
                Nhập số tiền khấu trừ khác (ứng lương, phạt đi muộn bổ sung...) cho nhân viên {selectedPayslip?.employeeName}.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="deduction-amount">Số tiền khấu trừ (VNĐ)</Label>
                <Input
                  id="deduction-amount"
                  type="number"
                  min="0"
                  required
                  value={editDeductionAmount}
                  onChange={(e) => setEditDeductionAmount(Number(e.target.value))}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDeductionOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={editDeductionMutation.isPending}>
                {editDeductionMutation.isPending ? "Đang lưu..." : "Xác nhận điều chỉnh"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ==================== DIALOG: THÊM / SỬA CẤU HÌNH LƯƠNG GỐC ==================== */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
          <form onSubmit={handleSaveConfig}>
            <DialogHeader>
              <DialogTitle>{configId ? "Cập nhật tham số lương gốc" : "Thêm cấu hình lương gốc mới"}</DialogTitle>
              <DialogDescription>
                Thiết lập thông số thuế lũy tiến và tỷ lệ bảo hiểm xã hội bắt buộc theo quy định nhà nước.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="config-date">Ngày hiệu lực</Label>
                <Input
                  id="config-date"
                  type="date"
                  required
                  value={configEffectiveDate}
                  onChange={(e) => setConfigEffectiveDate(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="config-minwage">Lương tối thiểu vùng (VNĐ)</Label>
                <Input
                  id="config-minwage"
                  type="number"
                  required
                  value={configMinWage}
                  onChange={(e) => setConfigMinWage(Number(e.target.value))}
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="grid gap-1">
                  <Label htmlFor="config-bhxh">BHXH (%)</Label>
                  <Input
                    id="config-bhxh"
                    type="number"
                    step="0.1"
                    required
                    value={configSocialRate}
                    onChange={(e) => setConfigSocialRate(Number(e.target.value))}
                  />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="config-bhyt">BHYT (%)</Label>
                  <Input
                    id="config-bhyt"
                    type="number"
                    step="0.1"
                    required
                    value={configHealthRate}
                    onChange={(e) => setConfigHealthRate(Number(e.target.value))}
                  />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="config-bhtn">BHTN (%)</Label>
                  <Input
                    id="config-bhtn"
                    type="number"
                    step="0.1"
                    required
                    value={configUnemploymentRate}
                    onChange={(e) => setConfigUnemploymentRate(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="config-personal">Giảm trừ bản thân (VNĐ)</Label>
                  <Input
                    id="config-personal"
                    type="number"
                    required
                    value={configPersonalDeduction}
                    onChange={(e) => setConfigPersonalDeduction(Number(e.target.value))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="config-dependent">Giảm trừ phụ thuộc (VNĐ)</Label>
                  <Input
                    id="config-dependent"
                    type="number"
                    required
                    value={configDependentDeduction}
                    onChange={(e) => setConfigDependentDeduction(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <input
                  id="config-active"
                  type="checkbox"
                  checked={configIsActive}
                  onChange={(e) => setConfigIsActive(e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="config-active" className="cursor-pointer select-none">Kích hoạt làm cấu hình mặc định hiện tại</Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsConfigOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={saveConfigMutation.isPending}>
                Lưu cấu hình
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ==================== DIALOG: THÊM / SỬA PHỤ CẤP NHÂN VIÊN ==================== */}
      <Dialog open={isAllowanceOpen} onOpenChange={setIsAllowanceOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <form onSubmit={handleSaveAllowance}>
            <DialogHeader>
              <DialogTitle>{allowanceId ? "Cập nhật phụ cấp" : "Thêm mới phụ cấp nhân viên"}</DialogTitle>
              <DialogDescription>
                Thiết lập mức phụ cấp hàng tháng áp dụng cho nhân viên đã chọn.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="allowance-type">Loại phụ cấp</Label>
                <Select value={allowanceType} onValueChange={setAllowanceType}>
                  <SelectTrigger id="allowance-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEAL">Ăn trưa (MEAL)</SelectItem>
                    <SelectItem value="TRANSPORT">Xăng xe/Đi lại (TRANSPORT)</SelectItem>
                    <SelectItem value="PHONE">Điện thoại (PHONE)</SelectItem>
                    <SelectItem value="HOUSING">Nhà ở (HOUSING)</SelectItem>
                    <SelectItem value="RESPONSIBILITY">Trách nhiệm (RESPONSIBILITY)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="allowance-amount">Số tiền phụ cấp hàng tháng (VNĐ)</Label>
                <Input
                  id="allowance-amount"
                  type="number"
                  required
                  value={allowanceAmount}
                  onChange={(e) => setAllowanceAmount(Number(e.target.value))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="allowance-start">Ngày hiệu lực</Label>
                  <Input
                    id="allowance-start"
                    type="date"
                    required
                    value={allowanceEffectiveDate}
                    onChange={(e) => setAllowanceEffectiveDate(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="allowance-end">Ngày hết hạn (nếu có)</Label>
                  <Input
                    id="allowance-end"
                    type="date"
                    value={allowanceEndDate}
                    onChange={(e) => setAllowanceEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <input
                  id="allowance-tax"
                  type="checkbox"
                  checked={allowanceIsTaxable}
                  onChange={(e) => setAllowanceIsTaxable(e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="allowance-tax" className="cursor-pointer select-none">Có chịu thuế TNCN (is Taxable)</Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAllowanceOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={saveAllowanceMutation.isPending}>
                Lưu phụ cấp
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ==================== DIALOG: CHI TIẾT PHIẾU LƯƠNG NHÂN VIÊN ==================== */}
      <Dialog open={isPayslipDetailOpen} onOpenChange={setIsPayslipDetailOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          {viewingPayslip && (
            <div className="space-y-6">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-center">CHI TIẾT PHIẾU LƯƠNG</DialogTitle>
                <DialogDescription className="text-center font-medium">
                  Tháng {viewingPayslip.month}/{viewingPayslip.year}
                </DialogDescription>
              </DialogHeader>

              {/* Employee Info */}
              <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg border text-sm">
                <div>Nhân viên: <span className="font-semibold">{viewingPayslip.employeeName}</span></div>
                <div>Mã nhân viên: <span className="font-semibold">{viewingPayslip.employeeCode}</span></div>
                <div>Phòng ban: <span className="font-semibold">{viewingPayslip.departmentName}</span></div>
                <div>Chức danh: <span className="font-semibold">{viewingPayslip.positionName}</span></div>
                <div className="col-span-2 border-t pt-2 mt-2">
                  Ngày công chuẩn / thực tế: <span className="font-bold text-primary">{viewingPayslip.standardWorkDays} / {viewingPayslip.actualWorkDays} ngày</span>
                </div>
              </div>

              {/* Details Breakdown */}
              <div className="space-y-4">
                <h4 className="font-bold text-sm border-b pb-1">KHOẢN MỤC THU NHẬP (EARNINGS)</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Lương cơ bản (từ Hợp đồng):</span>
                    <span>{formatMoney(viewingPayslip.baseSalary)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Lương prorated theo công thực tế:</span>
                    <span>{formatMoney(viewingPayslip.grossSalary - viewingPayslip.totalAllowances)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tổng phụ cấp hàng tháng:</span>
                    <span>{formatMoney(viewingPayslip.totalAllowances)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-2">
                    <span>Tổng lương Gross:</span>
                    <span>{formatMoney(viewingPayslip.grossSalary)}</span>
                  </div>
                </div>

                <h4 className="font-bold text-sm border-b pb-1">KHOẢN MỤC KHẤU TRỪ (DEDUCTIONS)</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bảo hiểm xã hội (BHXH - 8%):</span>
                    <span className="text-destructive">-{formatMoney(viewingPayslip.socialInsurance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bảo hiểm y tế (BHYT - 1.5%):</span>
                    <span className="text-destructive">-{formatMoney(viewingPayslip.healthInsurance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bảo hiểm thất nghiệp (BHTN - 1%):</span>
                    <span className="text-destructive">-{formatMoney(viewingPayslip.unemployment)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Thuế thu nhập cá nhân (PIT):</span>
                    <span className="text-destructive">-{formatMoney(viewingPayslip.personalIncomeTax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Khấu trừ khác:</span>
                    <span className="text-destructive">-{formatMoney(viewingPayslip.otherDeductions)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-2 text-destructive">
                    <span>Tổng khấu trừ:</span>
                    <span>
                      -{formatMoney(
                        viewingPayslip.socialInsurance +
                        viewingPayslip.healthInsurance +
                        viewingPayslip.unemployment +
                        viewingPayslip.personalIncomeTax +
                        viewingPayslip.otherDeductions
                      )}
                    </span>
                  </div>
                </div>

                {/* Net Salary Highlight */}
                <div className="flex justify-between items-baseline bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20 mt-4">
                  <span className="font-extrabold text-sm text-emerald-800">THỰC NHẬN (NET SALARY):</span>
                  <span className="font-extrabold text-xl text-emerald-700">{formatMoney(viewingPayslip.netSalary)}</span>
                </div>
              </div>

              <DialogFooter className="flex justify-between items-center sm:justify-between">
                <Button type="button" variant="outline" onClick={() => setIsPayslipDetailOpen(false)}>
                  Đóng
                </Button>
                <Button type="button" onClick={() => handleDownloadPdf(viewingPayslip.id)} className="gap-1.5 bg-blue-600 hover:bg-blue-700">
                  <Download size={14} /> Tải PDF Phiếu lương
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PayrollPage;
