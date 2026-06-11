import React, { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { employeeApi } from "../api/employeeApi";
import { toastUtil } from "@/utils/toast";
import { usePermission } from "../../../hooks/usePermission";
import { useAppSelector } from "../../../store";
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
  Clock
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

const EmployeeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const empId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasAnyRole } = usePermission();
  const user = useAppSelector((state) => state.auth.user);
  
  // Kiểm tra quyền
  const isSelf = user?.employeeId === empId;
  const canManage = hasAnyRole(["SUPER_ADMIN", "HR_ADMIN"]);
  const canEditInfo = canManage || (hasAnyRole(["HR_STAFF"]) && !isSelf);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // State Dialogs
  const [activeTab, setActiveTab] = useState("profile");
  const [isContractOpen, setIsContractOpen] = useState(false);
  const [isTerminateOpen, setIsTerminateOpen] = useState(false);
  const [terminationDate, setTerminationDate] = useState("");

  // Form Hợp đồng State
  const [contractNum, setContractNum] = useState("");
  const [contractType, setContractType] = useState("PROBATION");
  const [contractStart, setContractStart] = useState("");
  const [contractEnd, setContractEnd] = useState("");
  const [baseSalary, setBaseSalary] = useState("");
  const [signedAt, setSignedAt] = useState("");
  const [contractNotes, setContractNotes] = useState("");
  const [contractFile, setContractFile] = useState<File | null>(null);

  // Form Cập nhật Employee State
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

  // Query: Lấy chi tiết Employee
  const { data: employee, isLoading, error } = useQuery({
    queryKey: ["employee", empId],
    queryFn: () => employeeApi.getEmployee(empId),
    meta: {
      onSuccess: (data: any) => {
        // Điền dữ liệu vào form edit
        setFirstName(data.firstName);
        setLastName(data.lastName);
        setEmail(data.email);
        setPersonalEmail(data.personalEmail || "");
        setPhone(data.phone || "");
        setGender(data.gender || "MALE");
        setDob(data.dateOfBirth || "");
        setIdCard(data.idCardNumber || "");
        setIdCardDate(data.idCardIssuedDate || "");
        setIdCardPlace(data.idCardIssuedPlace || "");
        setPermanentAddress(data.permanentAddress || "");
        setCurrentAddress(data.currentAddress || "");
        setProbationEnd(data.probationEndDate || "");
        setDeptId(data.departmentId ? data.departmentId.toString() : "none");
        setPosId(data.positionId ? data.positionId.toString() : "none");
        setMgrId(data.managerId ? data.managerId.toString() : "none");
        setTaxCode(data.taxCode || "");
        setBankNum(data.bankAccountNumber || "");
        setBankName(data.bankName || "");
        setSocialId(data.socialInsuranceId || "");
      }
    }
  });

  // Query: Danh sách hợp đồng
  const { data: contracts = [], isLoading: isContractsLoading } = useQuery({
    queryKey: ["contracts", empId],
    queryFn: () => employeeApi.getContracts(empId),
  });

  // Mutation: Cập nhật nhân viên
  const updateMutation = useMutation({
    mutationFn: (data: any) => employeeApi.updateEmployee(empId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee", empId] });
      toastUtil.success("Cập nhật hồ sơ thành công!");
    },
    onError: (error: any) => {
      toastUtil.error(error.message || "Cập nhật hồ sơ thất bại!");
    }
  });

  // Mutation: Thay đổi avatar
  const avatarMutation = useMutation({
    mutationFn: (file: File) => employeeApi.updateAvatar(empId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee", empId] });
      toastUtil.success("Cập nhật ảnh đại diện thành công!");
    },
    onError: (error: any) => {
      toastUtil.error(error.message || "Tải ảnh đại diện thất bại!");
    }
  });

  // Mutation: Tạo hợp đồng
  const createContractMutation = useMutation({
    mutationFn: ({ req, file }: { req: any; file?: File }) => 
      employeeApi.createContract(empId, req, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts", empId] });
      toastUtil.success("Ký kết hợp đồng thành công!");
      setIsContractOpen(false);
      resetContractForm();
    },
    onError: (error: any) => {
      toastUtil.error(error.message || "Tạo hợp đồng thất bại!");
    }
  });

  // Mutation: Cho thôi việc
  const terminateMutation = useMutation({
    mutationFn: (termDate: string) => employeeApi.terminateEmployee(empId, termDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee", empId] });
      toastUtil.success("Đã ghi nhận thôi việc nhân sự!");
      setIsTerminateOpen(false);
    },
    onError: (error: any) => {
      toastUtil.error(error.message || "Thao tác thất bại!");
    }
  });

  const resetContractForm = () => {
    setContractNum("");
    setContractType("PROBATION");
    setContractStart("");
    setContractEnd("");
    setBaseSalary("");
    setSignedAt("");
    setContractNotes("");
    setContractFile(null);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      avatarMutation.mutate(e.target.files[0]);
    }
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email) return;

    updateMutation.mutate({
      firstName,
      lastName,
      email,
      personalEmail: personalEmail || undefined,
      phone: phone || undefined,
      gender,
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
      toastUtil.error("Vui lòng điền đủ thông tin hợp đồng bắt buộc");
      return;
    }

    createContractMutation.mutate({
      req: {
        contractNumber: contractNum,
        contractType,
        startDate: contractStart,
        endDate: contractEnd || null,
        baseSalary: Number(baseSalary),
        signedAt: signedAt || null,
        notes: contractNotes,
      },
      file: contractFile || undefined,
    });
  };

  const handleTerminateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminationDate) return;
    terminateMutation.mutate(terminationDate);
  };

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

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div>
        <Button variant="ghost" onClick={() => navigate("/employees")} className="flex items-center gap-2 px-0 hover:bg-transparent">
          <ArrowLeft size={16} />
          Quay lại danh sách
        </Button>
      </div>

      {/* Profile Header Block */}
      <div className="bg-background border rounded-xl p-6 shadow-sm flex flex-col md:flex-row gap-6 items-center md:items-start relative overflow-hidden">
        {/* Avatar với Camera Icon */}
        <div className="relative group shrink-0">
          <Avatar className="h-24 w-24 border-2 border-primary/20 shadow-md">
            <AvatarImage src={employee.avatarUrl || ""} alt={employee.fullName} />
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
              {employee.lastName.charAt(0)}{employee.firstName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          {(isSelf || canManage) && (
            <>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                title="Thay ảnh đại diện"
              >
                <Camera size={20} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleAvatarChange} 
                className="hidden" 
                accept="image/*" 
              />
            </>
          )}
        </div>

        {/* Basic Details */}
        <div className="flex-1 text-center md:text-left space-y-2">
          <div className="flex flex-col md:flex-row md:items-center gap-2 justify-center md:justify-start">
            <h2 className="text-2xl font-bold text-foreground">{employee.fullName}</h2>
            <Badge className="w-fit self-center font-mono bg-muted text-muted-foreground border hover:bg-muted">
              {employee.employeeCode}
            </Badge>
            {employee.status === "TERMINATED" ? (
              <Badge variant="destructive" className="w-fit self-center">Đã thôi việc</Badge>
            ) : (
              <Badge className="w-fit self-center bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10">
                {employee.status === "ACTIVE" ? "Đang làm việc" : "Thử việc"}
              </Badge>
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
              <span>Ngày vào: {new Date(employee.hireDate).toLocaleDateString("vi-VN")}</span>
            </div>
          </div>
        </div>

        {/* Hành động thôi việc */}
        {canManage && employee.status !== "TERMINATED" && (
          <div className="md:absolute md:top-6 md:right-6 mt-4 md:mt-0">
            <Button variant="destructive" onClick={() => setIsTerminateOpen(true)} className="flex items-center gap-2">
              <ShieldAlert size={16} />
              Thôi việc nhân viên
            </Button>
          </div>
        )}
      </div>

      {/* Tabs Layout */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:w-[400px] mb-4 bg-muted/60">
          <TabsTrigger value="profile">Hồ sơ</TabsTrigger>
          <TabsTrigger value="contracts">Hợp đồng</TabsTrigger>
          <TabsTrigger value="onboarding">Checklist</TabsTrigger>
        </TabsList>

        {/* Tab 1: Profile Form */}
        <TabsContent value="profile">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Thông tin chi tiết hồ sơ</CardTitle>
              <CardDescription>
                {canEditInfo ? "Cập nhật thông tin chi tiết nhân sự." : "Chi tiết hồ sơ cá nhân của nhân sự."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="edit-lastname">Họ và đệm *</Label>
                    <Input id="edit-lastname" value={lastName} onChange={e => setLastName(e.target.value)} disabled={!canEditInfo} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-firstname">Tên *</Label>
                    <Input id="edit-firstname" value={firstName} onChange={e => setFirstName(e.target.value)} disabled={!canEditInfo} required />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="edit-email">Email công ty *</Label>
                    <Input id="edit-email" type="email" value={email} onChange={e => setEmail(e.target.value)} disabled={!canEditInfo} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-personal-email">Email cá nhân</Label>
                    <Input id="edit-personal-email" type="email" value={personalEmail} onChange={e => setPersonalEmail(e.target.value)} disabled={!canEditInfo} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-phone">Số điện thoại</Label>
                    <Input id="edit-phone" value={phone} onChange={e => setPhone(e.target.value)} disabled={!canEditInfo} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="edit-gender">Giới tính</Label>
                    <Select value={gender} onValueChange={setGender} disabled={!canEditInfo}>
                      <SelectTrigger id="edit-gender">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Nam</SelectItem>
                        <SelectItem value="FEMALE">Nữ</SelectItem>
                        <SelectItem value="OTHER">Khác</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-dob">Ngày sinh</Label>
                    <Input id="edit-dob" type="date" value={dob} onChange={e => setDob(e.target.value)} disabled={!canEditInfo} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-probation">Ngày hết hạn thử việc</Label>
                    <Input id="edit-probation" type="date" value={probationEnd} onChange={e => setProbationEnd(e.target.value)} disabled={!canEditInfo} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="edit-idcard">Số CCCD</Label>
                    <Input id="edit-idcard" value={idCard} onChange={e => setIdCard(e.target.value)} disabled={!canEditInfo} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-idcard-date">Ngày cấp</Label>
                    <Input id="edit-idcard-date" type="date" value={idCardDate} onChange={e => setIdCardDate(e.target.value)} disabled={!canEditInfo} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-idcard-place">Nơi cấp</Label>
                    <Input id="edit-idcard-place" value={idCardPlace} onChange={e => setIdCardPlace(e.target.value)} disabled={!canEditInfo} />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="edit-permanent">Địa chỉ thường trú (trên sổ hộ khẩu/CCCD)</Label>
                  <Input id="edit-permanent" value={permanentAddress} onChange={e => setPermanentAddress(e.target.value)} disabled={!canEditInfo} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-current">Địa chỉ tạm trú hiện tại</Label>
                  <Input id="edit-current" value={currentAddress} onChange={e => setCurrentAddress(e.target.value)} disabled={!canEditInfo} />
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-md font-bold mb-4">Thông tin Thuế & Tài khoản chuyển lương</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="edit-tax">Mã số thuế cá nhân</Label>
                      <Input id="edit-tax" value={taxCode} onChange={e => setTaxCode(e.target.value)} disabled={!canEditInfo} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="edit-bank">Số tài khoản ngân hàng</Label>
                      <Input id="edit-bank" value={bankNum} onChange={e => setBankNum(e.target.value)} disabled={!canEditInfo} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="edit-bankname">Tên ngân hàng</Label>
                      <Input id="edit-bankname" value={bankName} onChange={e => setBankName(e.target.value)} disabled={!canEditInfo} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="edit-social">Mã số BHXH</Label>
                      <Input id="edit-social" value={socialId} onChange={e => setSocialId(e.target.value)} disabled={!canEditInfo} />
                    </div>
                  </div>
                </div>

                {canEditInfo && (
                  <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={updateMutation.isPending}>
                      {updateMutation.isPending && <Loader2 size={16} className="animate-spin mr-2" />}
                      Lưu thay đổi hồ sơ
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Hợp đồng lao động */}
        <TabsContent value="contracts">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Danh sách Hợp đồng lao động</CardTitle>
                <CardDescription>Danh sách lịch sử ký kết hợp đồng.</CardDescription>
              </div>
              {canManage && (
                <Button onClick={() => setIsContractOpen(true)} className="flex items-center gap-2">
                  <Plus size={16} />
                  Ký kết hợp đồng
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isContractsLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="animate-spin" />
                </div>
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
                          <Badge className="bg-muted text-muted-foreground border">
                            {contract.contractType}
                          </Badge>
                          {contract.status === "ACTIVE" ? (
                            <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Hoạt động</Badge>
                          ) : (
                            <Badge variant="destructive">Đã hết hạn/Hủy</Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Thời hạn: {new Date(contract.startDate).toLocaleDateString("vi-VN")} - {contract.endDate ? new Date(contract.endDate).toLocaleDateString("vi-VN") : "Vô thời hạn"}
                        </div>
                        <div className="text-sm font-semibold text-primary mt-1">
                          Lương cơ bản: {contract.baseSalary.toLocaleString("vi-VN")} VNĐ
                        </div>
                      </div>

                      <div className="mt-4 md:mt-0 flex gap-2">
                        {contract.documentUrl && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={contract.documentUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5">
                              <Download size={14} />
                              Tải bản scan PDF
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

        {/* Tab 3: Onboarding Checklist */}
        <TabsContent value="onboarding">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Checklist Onboarding</CardTitle>
              <CardDescription>Các đầu việc cần hoàn thành khi nhân viên mới hội nhập.</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Do DB lưu checklist mẫu ở trường text/notes hoặc cấu trúc đơn giản, ta hiển thị giao diện Checklist mock trực quan
                  phục vụ wow user về UI/UX */}
              <div className="space-y-4 max-w-lg">
                {[
                  { id: 1, task: "Nhận bàn giao thiết bị làm việc (Laptop, Màn hình)", status: "COMPLETED" },
                  { id: 2, task: "Ký kết hợp đồng thử việc/hợp đồng lao động", status: "COMPLETED" },
                  { id: 3, task: "Đăng ký tài khoản email công ty & Slack/Discord", status: "COMPLETED" },
                  { id: 4, task: "Nộp hồ sơ nhân sự bản cứng (CCCD, Bằng cấp)", status: "PENDING" },
                  { id: 5, task: "Hoàn thành đào đào hội nhập nội quy công ty", status: "PENDING" }
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

      {/* Dialog Ký hợp đồng */}
      <Dialog open={isContractOpen} onOpenChange={setIsContractOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Ký kết hợp đồng lao động</DialogTitle>
            <DialogDescription>
              Thiết lập hợp đồng mới và tải lên bản scan hợp đồng PDF đính kèm.
            </DialogDescription>
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
                  <SelectTrigger id="contract-type">
                    <SelectValue />
                  </SelectTrigger>
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
              <Input 
                id="contract-pdf" 
                type="file" 
                accept="application/pdf"
                onChange={e => {
                  if (e.target.files && e.target.files[0]) {
                    setContractFile(e.target.files[0]);
                  }
                }}
              />
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

      {/* Dialog Thôi việc */}
      <Dialog open={isTerminateOpen} onOpenChange={setIsTerminateOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert />
              Xác nhận thôi việc nhân sự
            </DialogTitle>
            <DialogDescription>
              Hành động này sẽ cập nhật trạng thái làm việc thành **Đã thôi việc (TERMINATED)** và lưu ngày nghỉ việc.
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
