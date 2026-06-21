import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { employeeApi, type SelfUpdateRequest } from "../api/employeeApi";
import { organizationApi } from "../../organization/api/organizationApi";
import { toast } from "sonner";
import { usePermission } from "../../../hooks/usePermission";
import { useAppDispatch, useAppSelector } from "../../../store";
import { updateUser } from "../../../store/slices/authSlice";
import {
  ArrowLeft,
  Building,
  Briefcase,
  Calendar,
  Camera,
  ShieldAlert,
  Plus,
  Loader2,
  Download,
  CheckCircle2,
  Clock,
  Pencil,
  X,
  Mail,
  Phone,
  User,
  CreditCard,
  MapPin,
  Landmark,
  Users,
  Hash
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// ─── Helper: Format date ────────────────────────────────────────────────────────
const fmtDate = (val: string | null | undefined) =>
  val ? new Date(val).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

const fmtGender = (val: string | null | undefined) => {
  if (val === "MALE") return "Nam";
  if (val === "FEMALE") return "Nữ";
  if (val === "OTHER") return "Khác";
  return "—";
};

// ─── InfoRow: row hiển thị nhãn + giá trị ──────────────────────────────────────
interface InfoRowProps {
  icon?: React.ReactNode;
  label: string;
  value?: string | null;
  full?: boolean;
}
const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value, full }) => (
  <div className={`flex flex-col gap-0.5 ${full ? "col-span-2" : ""}`}>
    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
      {icon && <span className="opacity-60">{icon}</span>}
      {label}
    </span>
    <span className="text-sm font-medium text-foreground leading-snug">
      {value || <span className="text-muted-foreground/50 italic text-xs">Chưa cập nhật</span>}
    </span>
  </div>
);

// ─── SectionCard ────────────────────────────────────────────────────────────────
interface SectionCardProps {
  title: string;
  children: React.ReactNode;
}
const SectionCard: React.FC<SectionCardProps> = ({ title, children }) => (
  <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
    <div className="px-5 py-3 border-b bg-muted/30">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    </div>
    <div className="p-5 grid grid-cols-2 gap-x-8 gap-y-5">{children}</div>
  </div>
);

// ══════════════════════════════════════════════════════════════════════════════
const EmployeeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const empId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasAnyRole } = usePermission();
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();

  const isSelf = user?.employeeId === empId;
  const canManage = hasAnyRole(["SUPER_ADMIN", "HR_ADMIN"]);
  const canEditInfo = canManage || (hasAnyRole(["HR_STAFF"]) && !isSelf);
  const canViewContracts = canManage || hasAnyRole(["HR_STAFF"]) || isSelf;

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── UI State ─────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSelfEditMode, setIsSelfEditMode] = useState(false);
  const [isContractOpen, setIsContractOpen] = useState(false);
  const [isTerminateOpen, setIsTerminateOpen] = useState(false);
  const [terminationDate, setTerminationDate] = useState("");

  // ── Form Edit State ───────────────────────────────────────────────────────
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [personalEmail, setPersonalEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("MALE");
  const [dob, setDob] = useState("");
  const [idCard, setIdCard] = useState("");
  const [idCardDate, setIdCardDate] = useState("");
  const [idCardPlace, setIdCardPlace] = useState("");
  const [permanentAddress, setPermanentAddress] = useState("");
  const [currentAddress, setCurrentAddress] = useState("");
  const [probationEnd, setProbationEnd] = useState("");
  const [deptId, setDeptId] = useState("none");
  const [posId, setPosId] = useState("none");
  const [mgrId, setMgrId] = useState("none");
  const [taxCode, setTaxCode] = useState("");
  const [bankNum, setBankNum] = useState("");
  const [bankName, setBankName] = useState("");
  const [socialId, setSocialId] = useState("");

  // ── Form Hợp đồng State ───────────────────────────────────────────────────
  const [contractNum, setContractNum] = useState("");
  const [contractType, setContractType] = useState("PROBATION");
  const [contractStart, setContractStart] = useState("");
  const [contractEnd, setContractEnd] = useState("");
  const [baseSalary, setBaseSalary] = useState("");
  const [signedAt, setSignedAt] = useState("");
  const [contractNotes, setContractNotes] = useState("");
  const [contractFile, setContractFile] = useState<File | null>(null);

  // ── Query: Chi tiết Employee ──────────────────────────────────────────────
  const { data: employee, isLoading, error } = useQuery({
    queryKey: ["employee", empId],
    queryFn: () => employeeApi.getEmployee(empId),
  });

  // Lấy danh sách phòng ban phục vụ chỉnh sửa
  const { data: departments = [] } = useQuery({
    queryKey: ["flat-departments"],
    queryFn: organizationApi.getDepartments,
    enabled: isEditMode,
  });

  // Lấy danh sách chức vụ
  const { data: positions = [] } = useQuery({
    queryKey: ["all-positions"],
    queryFn: organizationApi.getPositions,
    enabled: isEditMode,
  });

  // Lấy danh sách nhân viên làm quản lý
  const { data: managersPage } = useQuery({
    queryKey: ["managers-list"],
    queryFn: () => employeeApi.getEmployees("", null, "ACTIVE", 0, 200),
    enabled: isEditMode,
  });
  const managers = managersPage?.content || [];

  // Sync form state mỗi khi employee data thay đổi (fix meta.onSuccess deprecated)
  useEffect(() => {
    if (!employee) return;
    setFirstName(employee.firstName);
    setLastName(employee.lastName);
    setEmail(employee.email);
    setPersonalEmail(employee.personalEmail || "");
    setPhone(employee.phone || "");
    setGender(employee.gender || "MALE");
    setDob(employee.dateOfBirth || "");
    setIdCard(employee.idCardNumber || "");
    setIdCardDate(employee.idCardIssuedDate || "");
    setIdCardPlace(employee.idCardIssuedPlace || "");
    setPermanentAddress(employee.permanentAddress || "");
    setCurrentAddress(employee.currentAddress || "");
    setProbationEnd(employee.probationEndDate || "");
    setDeptId(employee.departmentId ? employee.departmentId.toString() : "none");
    setPosId(employee.positionId ? employee.positionId.toString() : "none");
    setMgrId(employee.managerId ? employee.managerId.toString() : "none");
    setTaxCode(employee.taxCode || "");
    setBankNum(employee.bankAccountNumber || "");
    setBankName(employee.bankName || "");
    setSocialId(employee.socialInsuranceId || "");
  }, [employee]);

  // ── Query: Hợp đồng ──────────────────────────────────────────────────────
  const { data: contracts = [], isLoading: isContractsLoading } = useQuery({
    queryKey: ["contracts", empId],
    queryFn: () => employeeApi.getContracts(empId),
    enabled: canViewContracts,
  });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: (data: any) => employeeApi.updateEmployee(empId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["employee", empId] });
      toast.success("Cập nhật hồ sơ thành công!");
      setIsEditMode(false);
      if (isSelf) {
        dispatch(
          updateUser({
            employeeName: data.fullName,
            fullName: data.fullName,
            avatarUrl: data.avatarUrl ? `${data.avatarUrl}${data.avatarUrl.includes('?') ? '&' : '?'}t=${Date.now()}` : undefined,
          })
        );
      }
    },
    onError: (error: any) => toast.error(error.message || "Cập nhật hồ sơ thất bại!"),
  });

  const selfUpdateMutation = useMutation({
    mutationFn: (data: SelfUpdateRequest) => employeeApi.selfUpdate(empId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["employee", empId] });
      toast.success("Đã cập nhật thông tin cá nhân!");
      setIsSelfEditMode(false);
      if (isSelf) {
        dispatch(
          updateUser({
            employeeName: data.fullName,
            fullName: data.fullName,
            avatarUrl: data.avatarUrl ? `${data.avatarUrl}${data.avatarUrl.includes('?') ? '&' : '?'}t=${Date.now()}` : undefined,
          })
        );
      }
    },
    onError: (error: any) => toast.error(error.message || "Cập nhật thất bại!"),
  });

  const avatarMutation = useMutation({
    mutationFn: (file: File) => employeeApi.updateAvatar(empId, file),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["employee", empId] });
      toast.success("Cập nhật ảnh đại diện thành công!");
      if (isSelf) {
        dispatch(
          updateUser({
            avatarUrl: data.avatarUrl ? `${data.avatarUrl}${data.avatarUrl.includes('?') ? '&' : '?'}t=${Date.now()}` : undefined,
          })
        );
      }
    },
    onError: (error: any) => toast.error(error.message || "Tải ảnh đại diện thất bại!"),
  });

  const createContractMutation = useMutation({
    mutationFn: ({ req, file }: { req: any; file?: File }) =>
      employeeApi.createContract(empId, req, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts", empId] });
      toast.success("Ký kết hợp đồng thành công!");
      setIsContractOpen(false);
      resetContractForm();
    },
    onError: (error: any) => toast.error(error.message || "Tạo hợp đồng thất bại!"),
  });

  const terminateMutation = useMutation({
    mutationFn: (termDate: string) => employeeApi.terminateEmployee(empId, termDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee", empId] });
      toast.success("Đã ghi nhận thôi việc nhân sự!");
      setIsTerminateOpen(false);
    },
    onError: (error: any) => toast.error(error.message || "Thao tác thất bại!"),
  });

  // ── Handlers ──────────────────────────────────────────────────────────────
  const resetContractForm = () => {
    setContractNum(""); setContractType("PROBATION"); setContractStart("");
    setContractEnd(""); setBaseSalary(""); setSignedAt("");
    setContractNotes(""); setContractFile(null);
  };

  const handleCancelEdit = () => {
    if (employee) {
      setFirstName(employee.firstName); setLastName(employee.lastName);
      setEmail(employee.email); setPersonalEmail(employee.personalEmail || "");
      setPhone(employee.phone || ""); setGender(employee.gender || "MALE");
      setDob(employee.dateOfBirth || ""); setIdCard(employee.idCardNumber || "");
      setIdCardDate(employee.idCardIssuedDate || ""); setIdCardPlace(employee.idCardIssuedPlace || "");
      setPermanentAddress(employee.permanentAddress || ""); setCurrentAddress(employee.currentAddress || "");
      setProbationEnd(employee.probationEndDate || "");
      setDeptId(employee.departmentId ? employee.departmentId.toString() : "none");
      setPosId(employee.positionId ? employee.positionId.toString() : "none");
      setMgrId(employee.managerId ? employee.managerId.toString() : "none");
      setTaxCode(employee.taxCode || ""); setBankNum(employee.bankAccountNumber || "");
      setBankName(employee.bankName || ""); setSocialId(employee.socialInsuranceId || "");
    }
    setIsEditMode(false);
  };

  const handleSelfUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    selfUpdateMutation.mutate({
      phone: phone || undefined,
      personalEmail: personalEmail || undefined,
      currentAddress: currentAddress || undefined,
    });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) avatarMutation.mutate(e.target.files[0]);
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email) return;
    updateMutation.mutate({
      firstName, lastName, email,
      personalEmail: personalEmail || undefined,
      phone: phone || undefined, gender,
      dateOfBirth: dob || undefined,
      idCardNumber: idCard || undefined,
      idCardIssuedDate: idCardDate || undefined,
      idCardIssuedPlace: idCardPlace || undefined,
      permanentAddress: permanentAddress || undefined,
      currentAddress: currentAddress || undefined,
      probationEndDate: probationEnd || undefined,
      departmentId: deptId === "none" ? undefined : Number(deptId),
      positionId: posId === "none" ? undefined : Number(posId),
      managerId: mgrId === "none" ? undefined : Number(mgrId),
      taxCode: taxCode || undefined,
      bankAccountNumber: bankNum || undefined,
      bankName: bankName || undefined,
      socialInsuranceId: socialId || undefined,
    });
  };

  const handleCreateContract = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractNum || !contractStart || !baseSalary) {
      toast.error("Vui lòng điền đủ thông tin hợp đồng bắt buộc");
      return;
    }
    createContractMutation.mutate({
      req: {
        contractNumber: contractNum, contractType,
        startDate: contractStart, endDate: contractEnd || null,
        baseSalary: Number(baseSalary),
        signedAt: signedAt || null, notes: contractNotes,
      },
      file: contractFile || undefined,
    });
  };

  const handleTerminateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminationDate) return;
    terminateMutation.mutate(terminationDate);
  };

  // ── Loading / Error states ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <Loader2 size={40} className="animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Đang tải hồ sơ nhân viên...</p>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Không tìm thấy thông tin nhân viên hoặc bạn không có quyền truy cập.
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Back */}
      <Button variant="ghost" onClick={() => navigate("/employees")} className="flex items-center gap-2 px-0 hover:bg-transparent">
        <ArrowLeft size={16} /> Quay lại danh sách
      </Button>

      {/* Profile Header */}
      <div className="bg-background border rounded-xl p-6 shadow-sm flex flex-col md:flex-row gap-6 items-center md:items-start relative overflow-hidden">
        {/* Avatar */}
        <div className="relative group shrink-0">
          <Avatar className="h-24 w-24 border-2 border-primary/20 shadow-md">
            <AvatarImage src={employee.avatarUrl || ""} alt={employee.fullName} />
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
              {employee.lastName.charAt(0)}{employee.firstName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          {isSelf && (
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                title="Thay ảnh đại diện"
              >
                <Camera size={20} />
              </button>
              <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />
            </>
          )}
        </div>

        {/* Basic Info */}
        <div className="flex-1 text-center md:text-left space-y-2">
          <div className="flex flex-col md:flex-row md:items-center gap-2 justify-center md:justify-start">
            <h2 className="text-2xl font-bold text-foreground">{employee.fullName}</h2>
            <Badge className="w-fit self-center font-mono bg-muted text-muted-foreground border hover:bg-muted">
              {employee.employeeCode}
            </Badge>
            {employee.status === "TERMINATED" ? (
              <Badge variant="destructive" className="w-fit self-center">Đã thôi việc</Badge>
            ) : employee.status === "PROBATION" ? (
              <Badge className="w-fit self-center bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/10">Thử việc</Badge>
            ) : (
              <Badge className="w-fit self-center bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10">Đang làm việc</Badge>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-sm text-muted-foreground">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <Building size={16} />
              <span>{employee.departmentName || "Chưa phân phòng"}</span>
            </div>
            <div className="flex items-center justify-center md:justify-start gap-2">
              <Briefcase size={16} />
              <span>{employee.positionName || "Chưa phân chức danh"}</span>
            </div>
            <div className="flex items-center justify-center md:justify-start gap-2">
              <Calendar size={16} />
              <span>Ngày vào: {fmtDate(employee.hireDate)}</span>
            </div>
          </div>
        </div>

        {/* Thôi việc action */}
        {canManage && employee.status !== "TERMINATED" && (
          <div className="md:absolute md:top-6 md:right-6 mt-4 md:mt-0">
            <Button variant="destructive" onClick={() => setIsTerminateOpen(true)} className="flex items-center gap-2">
              <ShieldAlert size={16} /> Thôi việc nhân viên
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList 
          className="grid w-full mb-4 bg-muted/60"
          style={{ 
            gridTemplateColumns: canViewContracts ? "repeat(3, minmax(0, 1fr))" : "repeat(2, minmax(0, 1fr))",
            width: canViewContracts ? "400px" : "280px"
          }}
        >
          <TabsTrigger value="profile">Hồ sơ</TabsTrigger>
          {canViewContracts && <TabsTrigger value="contracts">Hợp đồng</TabsTrigger>}
          <TabsTrigger value="onboarding">Checklist</TabsTrigger>
        </TabsList>

        {/* ─── Tab 1: Hồ sơ ────────────────────────────────────────────────── */}
        <TabsContent value="profile">
          {isEditMode ? (
            /* ── EDIT MODE ── */
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle>Chỉnh sửa hồ sơ</CardTitle>
                  <CardDescription>Cập nhật thông tin chi tiết nhân sự.</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={handleCancelEdit} title="Hủy chỉnh sửa">
                  <X size={18} />
                </Button>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  {/* Thông tin cơ bản */}
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Thông tin cơ bản</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="edit-lastname">Họ và đệm *</Label>
                        <Input id="edit-lastname" value={lastName} onChange={e => setLastName(e.target.value)} required />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="edit-firstname">Tên *</Label>
                        <Input id="edit-firstname" value={firstName} onChange={e => setFirstName(e.target.value)} required />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div className="space-y-1">
                        <Label htmlFor="edit-gender">Giới tính</Label>
                        <Select value={gender} onValueChange={setGender}>
                          <SelectTrigger id="edit-gender"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MALE">Nam</SelectItem>
                            <SelectItem value="FEMALE">Nữ</SelectItem>
                            <SelectItem value="OTHER">Khác</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="edit-dob">Ngày sinh</Label>
                        <Input id="edit-dob" type="date" value={dob} onChange={e => setDob(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="edit-phone">Số điện thoại</Label>
                        <Input id="edit-phone" value={phone} onChange={e => setPhone(e.target.value)} />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Liên hệ */}
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Email & Liên hệ</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="edit-email">Email công ty *</Label>
                        <Input id="edit-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="edit-personal-email">Email cá nhân</Label>
                        <Input id="edit-personal-email" type="email" value={personalEmail} onChange={e => setPersonalEmail(e.target.value)} />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* CCCD */}
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Giấy tờ tùy thân</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="edit-idcard">Số CCCD/CMND</Label>
                        <Input id="edit-idcard" value={idCard} onChange={e => setIdCard(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="edit-idcard-date">Ngày cấp</Label>
                        <Input id="edit-idcard-date" type="date" value={idCardDate} onChange={e => setIdCardDate(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="edit-idcard-place">Nơi cấp</Label>
                        <Input id="edit-idcard-place" value={idCardPlace} onChange={e => setIdCardPlace(e.target.value)} />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Địa chỉ */}
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Địa chỉ</h3>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label htmlFor="edit-permanent">Địa chỉ thường trú (theo CCCD)</Label>
                        <Input id="edit-permanent" value={permanentAddress} onChange={e => setPermanentAddress(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="edit-current">Địa chỉ tạm trú hiện tại</Label>
                        <Input id="edit-current" value={currentAddress} onChange={e => setCurrentAddress(e.target.value)} />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Tổ chức */}
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Phân công tổ chức</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="edit-probation">Ngày hết thử việc</Label>
                        <Input id="edit-probation" type="date" value={probationEnd} onChange={e => setProbationEnd(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="edit-dept">Phòng ban</Label>
                        <Select value={deptId} onValueChange={setDeptId}>
                          <SelectTrigger id="edit-dept">
                            <SelectValue placeholder="Chọn phòng ban..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Chưa phân phòng</SelectItem>
                            {departments.map(d => (
                              <SelectItem key={d.id} value={d.id.toString()} disabled={!d.isActive}>
                                {d.name} {!d.isActive && " (Ngừng hoạt động)"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="edit-pos">Chức danh</Label>
                        <Select value={posId} onValueChange={setPosId}>
                          <SelectTrigger id="edit-pos">
                            <SelectValue placeholder="Chọn chức danh..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Chưa phân chức danh</SelectItem>
                            {positions.map(p => (
                              <SelectItem key={p.id} value={p.id.toString()} disabled={!p.isActive}>
                                {p.name} {!p.isActive && " (Ngừng hoạt động)"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="edit-mgr">Quản lý trực tiếp</Label>
                        <Select value={mgrId} onValueChange={setMgrId}>
                          <SelectTrigger id="edit-mgr">
                            <SelectValue placeholder="Chọn quản lý..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Không có quản lý</SelectItem>
                            {managers
                              .filter(m => m.id !== empId)
                              .map(m => (
                                <SelectItem key={m.id} value={m.id.toString()}>
                                  {m.fullName} ({m.employeeCode})
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Tài chính */}
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Thuế & Tài khoản ngân hàng</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="edit-tax">Mã số thuế</Label>
                        <Input id="edit-tax" value={taxCode} onChange={e => setTaxCode(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="edit-bank">Số tài khoản</Label>
                        <Input id="edit-bank" value={bankNum} onChange={e => setBankNum(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="edit-bankname">Ngân hàng</Label>
                        <Input id="edit-bankname" value={bankName} onChange={e => setBankName(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="edit-social">Mã BHXH</Label>
                        <Input id="edit-social" value={socialId} onChange={e => setSocialId(e.target.value)} />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={handleCancelEdit}>Hủy</Button>
                    <Button type="submit" disabled={updateMutation.isPending}>
                      {updateMutation.isPending && <Loader2 size={16} className="animate-spin mr-2" />}
                      Lưu thay đổi
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            /* ── VIEW MODE ── */
            <div className="space-y-4">
              {/* Nút actions */}
              <div className="flex justify-end gap-2">
                {isSelf && !isEditMode && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsSelfEditMode(v => !v)}
                    className="flex items-center gap-2"
                  >
                    {isSelfEditMode ? <X size={14} /> : <Pencil size={14} />}
                    {isSelfEditMode ? "Đóng" : "Cập nhật thông tin của tôi"}
                  </Button>
                )}
                {canEditInfo && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditMode(true)}
                    className="flex items-center gap-2"
                  >
                    <Pencil size={14} />
                    Chỉnh sửa hồ sơ
                  </Button>
                )}
              </div>

              {/* Self-edit mini form (chỉ hiện khi isSelf bật) */}
              {isSelf && isSelfEditMode && (
                <Card className="border-primary/30 shadow-sm bg-primary/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Pencil size={16} className="text-primary" />
                      Cập nhật thông tin cá nhân
                    </CardTitle>
                    <CardDescription>
                      Bạn chỉ có thể cập nhật số điện thoại, email cá nhân và địa chỉ tạm trú.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSelfUpdate} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <Label htmlFor="self-phone">Số điện thoại</Label>
                          <Input
                            id="self-phone"
                            placeholder="Nhập số điện thoại..."
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="self-personal-email">Email cá nhân</Label>
                          <Input
                            id="self-personal-email"
                            type="email"
                            placeholder="Nhập email cá nhân..."
                            value={personalEmail}
                            onChange={e => setPersonalEmail(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="self-current-address">Địa chỉ tạm trú hiện tại</Label>
                          <Input
                            id="self-current-address"
                            placeholder="Nhập địa chỉ tạm trú..."
                            value={currentAddress}
                            onChange={e => setCurrentAddress(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-3">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsSelfEditMode(false)}
                        >
                          Hủy
                        </Button>
                        <Button
                          type="submit"
                          size="sm"
                          disabled={selfUpdateMutation.isPending}
                        >
                          {selfUpdateMutation.isPending && <Loader2 size={14} className="animate-spin mr-2" />}
                          Lưu thay đổi
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Thông tin cơ bản */}
              <SectionCard title="Thông tin cơ bản">
                <InfoRow icon={<User size={12} />} label="Họ và đệm" value={employee.lastName} />
                <InfoRow icon={<User size={12} />} label="Tên" value={employee.firstName} />
                <InfoRow icon={<Hash size={12} />} label="Giới tính" value={fmtGender(employee.gender)} />
                <InfoRow icon={<Calendar size={12} />} label="Ngày sinh" value={fmtDate(employee.dateOfBirth)} />
                <InfoRow icon={<Phone size={12} />} label="Số điện thoại" value={employee.phone} />
                <InfoRow icon={<Calendar size={12} />} label="Ngày vào làm" value={fmtDate(employee.hireDate)} />
                {employee.probationEndDate && (
                  <InfoRow icon={<Calendar size={12} />} label="Hết thử việc" value={fmtDate(employee.probationEndDate)} />
                )}
                {employee.terminationDate && (
                  <InfoRow icon={<Calendar size={12} />} label="Ngày thôi việc" value={fmtDate(employee.terminationDate)} />
                )}
              </SectionCard>

              {/* Liên hệ */}
              <SectionCard title="Email & Liên hệ">
                <InfoRow icon={<Mail size={12} />} label="Email công ty" value={employee.email} />
                <InfoRow icon={<Mail size={12} />} label="Email cá nhân" value={employee.personalEmail} />
              </SectionCard>

              {/* Giấy tờ */}
              <SectionCard title="Giấy tờ tùy thân">
                <InfoRow icon={<CreditCard size={12} />} label="Số CCCD/CMND" value={employee.idCardNumber} />
                <InfoRow icon={<Calendar size={12} />} label="Ngày cấp" value={fmtDate(employee.idCardIssuedDate)} />
                <InfoRow icon={<MapPin size={12} />} label="Nơi cấp" value={employee.idCardIssuedPlace} full />
              </SectionCard>

              {/* Địa chỉ */}
              <SectionCard title="Địa chỉ">
                <InfoRow icon={<MapPin size={12} />} label="Địa chỉ thường trú (theo CCCD)" value={employee.permanentAddress} full />
                <InfoRow icon={<MapPin size={12} />} label="Địa chỉ tạm trú hiện tại" value={employee.currentAddress} full />
              </SectionCard>

              {/* Tổ chức */}
              <SectionCard title="Phân công tổ chức">
                <InfoRow icon={<Building size={12} />} label="Phòng ban" value={employee.departmentName} />
                <InfoRow icon={<Briefcase size={12} />} label="Chức danh" value={employee.positionName} />
                <InfoRow icon={<Users size={12} />} label="Quản lý trực tiếp" value={employee.managerName} />
              </SectionCard>

              {/* Tài chính — chỉ hiện với HR_ADMIN trở lên */}
              {canManage && (
                <SectionCard title="Thuế & Tài khoản ngân hàng">
                  <InfoRow icon={<Hash size={12} />} label="Mã số thuế cá nhân" value={employee.taxCode} />
                  <InfoRow icon={<Hash size={12} />} label="Mã BHXH" value={employee.socialInsuranceId} />
                  <InfoRow icon={<Landmark size={12} />} label="Số tài khoản ngân hàng" value={employee.bankAccountNumber} />
                  <InfoRow icon={<Landmark size={12} />} label="Tên ngân hàng" value={employee.bankName} />
                </SectionCard>
              )}
            </div>
          )}
        </TabsContent>

        {/* ─── Tab 2: Hợp đồng ─────────────────────────────────────────────── */}
        {canViewContracts && (
          <TabsContent value="contracts">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>Danh sách Hợp đồng lao động</CardTitle>
                  <CardDescription>Danh sách lịch sử ký kết hợp đồng.</CardDescription>
                </div>
                {canManage && (
                  <Button onClick={() => setIsContractOpen(true)} className="flex items-center gap-2">
                    <Plus size={16} /> Ký kết hợp đồng
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {isContractsLoading ? (
                  <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>
                ) : contracts.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground italic text-sm">
                    Chưa ký hợp đồng lao động nào.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {contracts.map(contract => (
                      <div key={contract.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border rounded-xl hover:shadow-sm transition-shadow">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground">{contract.contractNumber}</span>
                            <Badge className="bg-muted text-muted-foreground border">{contract.contractType}</Badge>
                            {contract.status === "ACTIVE" ? (
                              <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Hoạt động</Badge>
                            ) : (
                              <Badge variant="destructive">Đã hết hạn/Hủy</Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Thời hạn: {fmtDate(contract.startDate)} — {contract.endDate ? fmtDate(contract.endDate) : "Vô thời hạn"}
                          </div>
                          <div className="text-sm font-semibold text-primary mt-1">
                            Lương cơ bản: {contract.baseSalary.toLocaleString("vi-VN")} VNĐ
                          </div>
                        </div>
                        <div className="mt-4 md:mt-0 flex gap-2">
                          {contract.documentUrl && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={contract.documentUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5">
                                <Download size={14} /> Tải bản scan PDF
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* ─── Tab 3: Checklist ─────────────────────────────────────────────── */}
        <TabsContent value="onboarding">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Checklist Onboarding</CardTitle>
              <CardDescription>Các đầu việc cần hoàn thành khi nhân viên mới hội nhập.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-w-lg">
                {[
                  { id: 1, task: "Nhận bàn giao thiết bị làm việc (Laptop, Màn hình)", status: "COMPLETED" },
                  { id: 2, task: "Ký kết hợp đồng thử việc/hợp đồng lao động", status: "COMPLETED" },
                  { id: 3, task: "Đăng ký tài khoản email công ty & Slack/Discord", status: "COMPLETED" },
                  { id: 4, task: "Nộp hồ sơ nhân sự bản cứng (CCCD, Bằng cấp)", status: "PENDING" },
                  { id: 5, task: "Hoàn thành đào tạo hội nhập nội quy công ty", status: "PENDING" }
                ].map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                    <div className="flex items-center gap-3">
                      {item.status === "COMPLETED" ? (
                        <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />
                      ) : (
                        <Clock className="text-amber-500 shrink-0 animate-pulse" size={20} />
                      )}
                      <span className={`text-sm ${item.status === "COMPLETED" ? "line-through text-muted-foreground" : "text-foreground font-medium"}`}>
                        {item.task}
                      </span>
                    </div>
                    {canManage && item.status === "PENDING" && (
                      <Button variant="ghost" size="sm" className="text-xs text-primary hover:bg-primary/10">
                        Đánh dấu hoàn thành
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Dialog: Ký hợp đồng ────────────────────────────────────────────── */}
      <Dialog open={isContractOpen} onOpenChange={setIsContractOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Ký kết hợp đồng lao động</DialogTitle>
            <DialogDescription>Thiết lập hợp đồng mới và tải lên bản scan hợp đồng PDF đính kèm.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateContract} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="contract-num">Số hợp đồng *</Label>
                <Input id="contract-num" placeholder="Ví dụ: 01/2026/HĐLĐ..." value={contractNum} onChange={e => setContractNum(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="contract-type">Loại hợp đồng</Label>
                <Select value={contractType} onValueChange={setContractType}>
                  <SelectTrigger id="contract-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PROBATION">Thử việc (Probation)</SelectItem>
                    <SelectItem value="FIXED_TERM_1Y">Xác định thời hạn 1 năm</SelectItem>
                    <SelectItem value="FIXED_TERM_3Y">Xác định thời hạn 3 năm</SelectItem>
                    <SelectItem value="INDEFINITE">Không xác định thời hạn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="contract-start">Ngày bắt đầu *</Label>
                <Input id="contract-start" type="date" value={contractStart} onChange={e => setContractStart(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="contract-end">Ngày kết thúc</Label>
                <Input id="contract-end" type="date" value={contractEnd} onChange={e => setContractEnd(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="contract-salary">Lương cơ bản * (VNĐ)</Label>
                <Input id="contract-salary" type="number" placeholder="Ví dụ: 15000000..." value={baseSalary} onChange={e => setBaseSalary(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="contract-signed">Ngày ký</Label>
                <Input id="contract-signed" type="date" value={signedAt} onChange={e => setSignedAt(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="contract-pdf">Bản scan hợp đồng (PDF)</Label>
              <Input id="contract-pdf" type="file" accept="application/pdf"
                onChange={e => { if (e.target.files?.[0]) setContractFile(e.target.files[0]); }} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="contract-notes">Ghi chú</Label>
              <Textarea id="contract-notes" placeholder="Nhập ghi chú hợp đồng..." value={contractNotes} onChange={e => setContractNotes(e.target.value)} />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsContractOpen(false)}>Hủy</Button>
              <Button type="submit" disabled={createContractMutation.isPending}>
                {createContractMutation.isPending && <Loader2 size={16} className="animate-spin mr-2" />}
                Lưu hợp đồng
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Thôi việc ──────────────────────────────────────────────── */}
      <Dialog open={isTerminateOpen} onOpenChange={setIsTerminateOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert /> Xác nhận thôi việc nhân sự
            </DialogTitle>
            <DialogDescription>
              Hành động này sẽ cập nhật trạng thái thành <strong>Đã thôi việc (TERMINATED)</strong> và lưu ngày nghỉ việc.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleTerminateSubmit} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="term-date">Ngày nghỉ việc chính thức *</Label>
              <Input id="term-date" type="date" value={terminationDate} onChange={e => setTerminationDate(e.target.value)} required />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsTerminateOpen(false)}>Hủy</Button>
              <Button type="submit" variant="destructive" disabled={terminateMutation.isPending}>
                {terminateMutation.isPending && <Loader2 size={16} className="animate-spin mr-2" />}
                Xác nhận thôi việc
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeDetailPage;
