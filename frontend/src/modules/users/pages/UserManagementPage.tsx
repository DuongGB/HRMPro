import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi, type UserResponse } from "../api/userApi";
import { toastUtil } from "@/utils/toast";
import { 
  Plus, 
  Search, 
  ShieldAlert, 
  UserCheck, 
  UserX, 
  KeyRound, 
  RefreshCw,
  Loader2,
  Shield,
  ShieldCheck,
  Check,
  X,
  HelpCircle,
  BookOpen
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

const ROLE_OPTIONS = [
  { value: "SUPER_ADMIN", label: "Super Admin", color: "bg-red-500/10 text-red-500 border-red-500/20" },
  { value: "HR_ADMIN", label: "HR Admin", color: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
  { value: "HR_STAFF", label: "HR Staff", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  { value: "MANAGER", label: "Manager", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  { value: "EMPLOYEE", label: "Employee", color: "bg-slate-500/10 text-slate-500 border-slate-500/20" },
  { value: "RECRUITER", label: "Recruiter", color: "bg-green-500/10 text-green-500 border-green-500/20" }
];

const ROLE_DESCRIPTIONS: Record<string, { desc: string; target: string }> = {
  SUPER_ADMIN: {
    desc: "Quản trị viên cấp cao nhất. Có toàn quyền kiểm soát hệ thống, quản lý tài khoản, cấu hình tổ chức và xem lịch sử hoạt động (audit logs) toàn diện.",
    target: "Thành viên Ban Giám đốc, Quản trị viên IT hệ thống."
  },
  HR_ADMIN: {
    desc: "Quản trị viên Nhân sự. Quản lý toàn bộ hồ sơ nhân sự, sơ đồ tổ chức, cơ cấu phòng ban và thực hiện các thiết lập nhân sự chung.",
    target: "Trưởng phòng Nhân sự, Trưởng nhóm Tuyển dụng/C&B."
  },
  HR_STAFF: {
    desc: "Nhân viên Nhân sự. Thực hiện các công việc nghiệp vụ nhân sự hàng ngày như cập nhật thông tin hồ sơ nhân sự, xem danh sách nhân sự.",
    target: "Chuyên viên Nhân sự, Chuyên viên C&B."
  },
  MANAGER: {
    desc: "Quản lý bộ phận. Có quyền quản lý trực tiếp và duyệt các yêu cầu (ví dụ: nghỉ phép) của các nhân viên thuộc phòng ban/nhóm của mình quản lý.",
    target: "Trưởng phòng ban, Trưởng nhóm (Team Leader)."
  },
  EMPLOYEE: {
    desc: "Nhân viên thông thường. Chỉ có quyền truy cập thông tin cá nhân của mình, tạo các yêu cầu cá nhân (nghỉ phép, phúc lợi) để gửi lên quản lý.",
    target: "Toàn thể cán bộ nhân viên trong công ty."
  },
  RECRUITER: {
    desc: "Chuyên viên tuyển dụng. Quản lý các tin tuyển dụng và xử lý hồ sơ ứng viên, đặt lịch phỏng vấn và đánh giá ứng viên.",
    target: "Chuyên viên Tuyển dụng (Recruitment Specialist)."
  }
};

interface Permission {
  code: string;
  name: string;
  description: string;
  category: string;
}

const PERMISSIONS_LIST: Permission[] = [
  // Hệ thống
  { code: "SYS_USER_MANAGE", name: "Quản lý tài khoản", description: "Tạo mới, khóa/mở khóa tài khoản, reset mật khẩu", category: "Hệ thống" },
  { code: "SYS_AUDIT_LOG", name: "Xem lịch sử hệ thống (Audit Logs)", description: "Xem nhật ký hoạt động hệ thống", category: "Hệ thống" },
  
  // Nhân sự
  { code: "HR_EMP_VIEW", name: "Xem hồ sơ nhân sự", description: "Xem thông tin hồ sơ nhân viên toàn công ty", category: "Nhân sự" },
  { code: "HR_EMP_MANAGE", name: "Quản lý hồ sơ nhân sự", description: "Tạo mới, cập nhật thông tin hồ sơ nhân viên", category: "Nhân sự" },
  { code: "HR_ORG_MANAGE", name: "Quản lý sơ đồ tổ chức", description: "Thiết lập phòng ban, chức vụ, bộ phận", category: "Nhân sự" },
  
  // Tuyển dụng
  { code: "REC_POST_MANAGE", name: "Quản lý tin tuyển dụng", description: "Đăng tin, cập nhật tin tuyển dụng", category: "Tuyển dụng" },
  { code: "REC_CV_MANAGE", name: "Quản lý hồ sơ ứng viên", description: "Tiếp nhận hồ sơ, đánh giá, xếp lịch phỏng vấn", category: "Tuyển dụng" },
  
  // Lương thưởng
  { code: "PAY_VIEW_ALL", name: "Xem bảng lương toàn công ty", description: "Xem thông tin lương, phụ cấp của nhân viên", category: "Lương thưởng" },
  { code: "PAY_MANAGE", name: "Tính lương & Phúc lợi", description: "Thiết lập bảng lương, tính lương hàng tháng", category: "Lương thưởng" },
  
  // Phê duyệt & Cá nhân
  { code: "SELF_LEAVE_REQUEST", name: "Đăng ký nghỉ phép", description: "Tạo yêu cầu nghỉ phép cá nhân", category: "Phê duyệt" },
  { code: "MGR_LEAVE_APPROVE", name: "Phê duyệt phép", description: "Duyệt yêu cầu nghỉ phép của nhân viên thuộc quyền quản lý", category: "Phê duyệt" },
  { code: "MGR_TEAM_VIEW", name: "Xem hồ sơ nhóm", description: "Xem hồ sơ nhân viên thuộc phòng ban quản lý", category: "Phê duyệt" },
];

const ROLE_PERMISSIONS_MAP: Record<string, string[]> = {
  SUPER_ADMIN: [
    "SYS_USER_MANAGE", "SYS_AUDIT_LOG", 
    "HR_EMP_VIEW", "HR_EMP_MANAGE", "HR_ORG_MANAGE", 
    "REC_POST_MANAGE", "REC_CV_MANAGE", 
    "PAY_VIEW_ALL", "PAY_MANAGE", 
    "SELF_LEAVE_REQUEST", "MGR_LEAVE_APPROVE", "MGR_TEAM_VIEW"
  ],
  HR_ADMIN: [
    "HR_EMP_VIEW", "HR_EMP_MANAGE", "HR_ORG_MANAGE", 
    "SELF_LEAVE_REQUEST"
  ],
  HR_STAFF: [
    "HR_EMP_VIEW", "HR_EMP_MANAGE",
    "SELF_LEAVE_REQUEST"
  ],
  MANAGER: [
    "HR_EMP_VIEW", 
    "SELF_LEAVE_REQUEST", "MGR_LEAVE_APPROVE", "MGR_TEAM_VIEW"
  ],
  EMPLOYEE: [
    "SELF_LEAVE_REQUEST"
  ],
  RECRUITER: [
    "REC_POST_MANAGE", "REC_CV_MANAGE",
    "SELF_LEAVE_REQUEST"
  ]
};

const UserManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
  const [isEditRolesOpen, setIsEditRolesOpen] = useState(false);
  const [editingRoles, setEditingRoles] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);

  const scrollToRoleManual = (roleValue: string) => {
    // Đợi modal mount xong hoặc dùng setTimeout
    setTimeout(() => {
      const element = document.getElementById(`manual-${roleValue}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  // Form State Tạo mới
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedEmpId, setSelectedEmpId] = useState<string>("none");
  const [selectedRoles, setSelectedRoles] = useState<string[]>(["EMPLOYEE"]);

  // Form State Reset Pass
  const [newPassword, setNewPassword] = useState("");

  // Query: Lấy danh sách Users
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["users", page],
    queryFn: () => userApi.getUsers(page, 10),
  });

  // Query: Lấy danh sách nhân viên để liên kết tài khoản
  const { data: employees = [] } = useQuery({
    queryKey: ["available-employees"],
    queryFn: () => userApi.getAvailableEmployees(),
    enabled: isCreateOpen,
  });

  // Mutation: Tạo tài khoản
  const createMutation = useMutation({
    mutationFn: userApi.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toastUtil.success("Tạo tài khoản thành công!");
      setIsCreateOpen(false);
      resetCreateForm();
    },
    onError: (error: any) => {
      toastUtil.error(error.message || "Tạo tài khoản thất bại!");
    }
  });

  // Mutation: Khóa/Mở khóa tài khoản
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => 
      userApi.toggleStatus(id, isActive),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toastUtil.success(variables.isActive ? "Đã kích hoạt tài khoản!" : "Đã khóa tài khoản!");
    },
    onError: (error: any) => {
      toastUtil.error(error.message || "Thao tác thất bại!");
    }
  });

  // Mutation: Reset mật khẩu
  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, pass }: { id: number; pass: string }) => 
      userApi.resetPassword(id, pass),
    onSuccess: () => {
      toastUtil.success("Đặt lại mật khẩu thành công!");
      setIsResetOpen(false);
      setNewPassword("");
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toastUtil.error(error.message || "Đặt lại mật khẩu thất bại!");
    }
  });

  // Mutation: Cập nhật Roles
  const updateRolesMutation = useMutation({
    mutationFn: ({ id, roles }: { id: number; roles: string[] }) =>
      userApi.updateRoles(id, roles),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toastUtil.success(`Đã cập nhật vai trò cho @${updatedUser.username}!`);
      setIsEditRolesOpen(false);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      toastUtil.error(error.message || "Cập nhật vai trò thất bại!");
    }
  });

  const resetCreateForm = () => {
    setUsername("");
    setPassword("");
    setSelectedEmpId("none");
    setSelectedRoles(["EMPLOYEE"]);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toastUtil.error("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu");
      return;
    }
    if (selectedRoles.length === 0) {
      toastUtil.error("Vui lòng chọn ít nhất một vai trò");
      return;
    }

    createMutation.mutate({
      username,
      password,
      employeeId: selectedEmpId === "none" ? null : Number(selectedEmpId),
      roles: selectedRoles,
    });
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newPassword) return;
    if (newPassword.length < 6) {
      toastUtil.error("Mật khẩu mới phải từ 6 ký tự trở lên");
      return;
    }

    resetPasswordMutation.mutate({
      id: selectedUser.id,
      pass: newPassword,
    });
  };

  const handleRoleCheckboxChange = (role: string, checked: boolean) => {
    if (checked) {
      setSelectedRoles([...selectedRoles, role]);
    } else {
      setSelectedRoles(selectedRoles.filter(r => r !== role));
    }
  };

  const handleEditRolesCheckboxChange = (role: string, checked: boolean) => {
    if (checked) {
      setEditingRoles([...editingRoles, role]);
    } else {
      setEditingRoles(editingRoles.filter(r => r !== role));
    }
  };

  const handleUpdateRoles = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (editingRoles.length === 0) {
      toastUtil.error("Vui lòng chọn ít nhất một vai trò");
      return;
    }
    updateRolesMutation.mutate({ id: selectedUser.id, roles: editingRoles });
  };

  // Lọc tìm kiếm client-side đơn giản cho trải nghiệm nhanh
  const filteredUsers = data?.content.filter(user => 
    user.username.toLowerCase().includes(search.toLowerCase()) ||
    (user.employeeName && user.employeeName.toLowerCase().includes(search.toLowerCase())) ||
    (user.employeeCode && user.employeeCode.toLowerCase().includes(search.toLowerCase()))
  ) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Quản lý tài khoản</h2>
          <p className="text-muted-foreground">
            Tạo mới, khóa/mở khóa tài khoản người dùng và gán vai trò hệ thống.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <HelpCircle size={16} />
                Hướng dẫn phân quyền
              </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-[540px] overflow-hidden flex flex-col">
              <SheetHeader className="pb-4 border-b">
                <SheetTitle className="flex items-center gap-2 text-lg font-bold">
                  <BookOpen className="text-primary h-5 w-5" />
                  Cẩm nang phân quyền HRMPro
                </SheetTitle>
                <SheetDescription>
                  Hướng dẫn chi tiết về các vai trò hệ thống (Roles) và các quyền hạn (Permissions) tương ứng.
                </SheetDescription>
              </SheetHeader>
              
              <div className="flex flex-col h-[calc(100vh-120px)] mt-4">
                {/* Quick links */}
                <div className="bg-muted/30 border rounded-lg p-3 mb-4 shrink-0">
                  <span className="text-xs font-semibold text-muted-foreground block mb-2">Xem nhanh vai trò:</span>
                  <div className="flex flex-wrap gap-2">
                    {ROLE_OPTIONS.map(role => (
                      <button
                        key={role.value}
                        onClick={() => scrollToRoleManual(role.value)}
                        className="text-left"
                      >
                        <Badge 
                          variant="outline" 
                          className={`text-[10px] font-semibold cursor-pointer hover:opacity-80 transition-all border ${role.color}`}
                        >
                          {role.label}
                        </Badge>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scroll Area containing manual */}
                <ScrollArea className="flex-1 pr-3 pb-8">
                  <div className="space-y-6">
                    {ROLE_OPTIONS.map(role => {
                      const descInfo = ROLE_DESCRIPTIONS[role.value];
                      const permissions = ROLE_PERMISSIONS_MAP[role.value] || [];
                      
                      return (
                        <div 
                          key={role.value} 
                          id={`manual-${role.value}`} 
                          className="border rounded-xl p-4 bg-background shadow-sm space-y-3 scroll-mt-4"
                        >
                          {/* Header */}
                          <div className="flex items-center justify-between border-b pb-2">
                            <span className="font-bold text-foreground">{role.label}</span>
                            <Badge variant="outline" className={`text-[10px] ${role.color}`}>
                              {role.value}
                            </Badge>
                          </div>
                          
                          {/* Desc */}
                          <div className="text-xs space-y-1">
                            <p className="text-muted-foreground leading-relaxed">
                              <span className="font-semibold text-foreground">Mô tả:</span> {descInfo?.desc}
                            </p>
                            <p className="text-muted-foreground leading-relaxed">
                              <span className="font-semibold text-foreground">Đối tượng:</span> {descInfo?.target}
                            </p>
                          </div>

                          {/* Permissions list */}
                          <div className="space-y-1.5">
                            <span className="text-xs font-semibold text-foreground block">Quyền hạn chi tiết ({permissions.length}):</span>
                            <div className="grid grid-cols-1 gap-2">
                              {permissions.map(permCode => {
                                const perm = PERMISSIONS_LIST.find(p => p.code === permCode);
                                if (!perm) return null;
                                return (
                                  <div key={permCode} className="flex items-start gap-2 bg-muted/40 p-2 rounded-md border border-muted/20">
                                    <div className="mt-0.5 rounded-full p-0.5 bg-emerald-500/10 text-emerald-600">
                                      <Check size={10} className="stroke-[3]" />
                                    </div>
                                    <div className="space-y-0.5">
                                      <span className="text-[11px] font-semibold text-foreground block">{perm.name}</span>
                                      <span className="text-[9px] text-muted-foreground block">{perm.description}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </SheetContent>
          </Sheet>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus size={16} />
                Tạo tài khoản
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
              <DialogHeader>
                <DialogTitle>Tạo tài khoản mới</DialogTitle>
                <DialogDescription>
                  Tạo tài khoản cho nhân viên hoặc tài khoản quản trị hệ thống.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4 py-2">
                <div className="space-y-1">
                  <Label htmlFor="create-username">Tên đăng nhập</Label>
                  <Input 
                    id="create-username" 
                    placeholder="Nhập tên đăng nhập..." 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="create-password">Mật khẩu ban đầu</Label>
                  <Input 
                    id="create-password" 
                    type="password" 
                    placeholder="Tối thiểu 6 ký tự..." 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="create-employee">Nhân viên liên kết</Label>
                  <Select value={selectedEmpId} onValueChange={setSelectedEmpId}>
                    <SelectTrigger id="create-employee">
                      <SelectValue placeholder="Chọn nhân viên..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Không liên kết (Tài khoản IT/Admin)</SelectItem>
                      {employees.map(emp => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>
                          {emp.employeeCode} - {emp.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Vai trò hệ thống (Roles)</Label>
                  <div className="grid grid-cols-2 gap-2 border rounded-md p-3 bg-muted/20">
                    {ROLE_OPTIONS.map(role => (
                      <div key={role.value} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`role-${role.value}`} 
                          checked={selectedRoles.includes(role.value)}
                          onCheckedChange={(checked) => handleRoleCheckboxChange(role.value, !!checked)}
                        />
                        <Label 
                          htmlFor={`role-${role.value}`} 
                          className="text-xs font-normal cursor-pointer"
                        >
                          {role.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Hủy</Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending && <Loader2 size={16} className="animate-spin mr-2" />}
                    Tạo tài khoản
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="flex items-center max-w-sm gap-2 bg-background border rounded-md px-3 py-1">
        <Search size={18} className="text-muted-foreground" />
        <Input 
          placeholder="Tìm kiếm tài khoản..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-8 text-sm"
        />
      </div>

      {/* Main Table */}
      <div className="border rounded-lg bg-background shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 size={36} className="animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Đang tải danh sách tài khoản...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            Không tìm thấy tài khoản người dùng nào.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên đăng nhập</TableHead>
                <TableHead>Nhân viên liên kết</TableHead>
                <TableHead>Vai trò (Roles)</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-semibold text-foreground">{user.username}</TableCell>
                  <TableCell>
                    {user.employeeId ? (
                      <div className="text-sm">
                        <span className="font-medium text-foreground">{user.employeeName}</span>
                        <span className="text-muted-foreground block text-xs">Mã: {user.employeeCode}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Không liên kết</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map(roleVal => {
                        const opt = ROLE_OPTIONS.find(o => o.value === roleVal);
                        return (
                          <Badge 
                            key={roleVal} 
                            variant="outline" 
                            className={`text-[10px] font-semibold px-2 py-0.5 border ${opt?.color || ""}`}
                          >
                            {opt?.label || roleVal}
                          </Badge>
                        );
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.isActive ? (
                      <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10 gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                        Đang hoạt động
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/10 gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-destructive inline-block animate-pulse"></span>
                        Đã khóa
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {new Date(user.createdAt).toLocaleDateString("vi-VN", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Cập nhật vai trò"
                        onClick={() => {
                          setSelectedUser(user);
                          setEditingRoles([...user.roles]);
                          setIsEditRolesOpen(true);
                        }}
                      >
                        <ShieldCheck size={16} className="text-muted-foreground hover:text-primary" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        title="Xem chi tiết quyền"
                        onClick={() => {
                          setSelectedUser(user);
                          setIsPermissionsOpen(true);
                        }}
                      >
                        <Shield size={16} className="text-muted-foreground hover:text-primary" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        title="Đặt lại mật khẩu"
                        onClick={() => {
                          setSelectedUser(user);
                          setIsResetOpen(true);
                        }}
                      >
                        <KeyRound size={16} className="text-muted-foreground hover:text-foreground" />
                      </Button>
                      
                      {user.isActive ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Khóa tài khoản"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            toastUtil.confirm(
                              `Bạn có chắc chắn muốn khóa tài khoản @${user.username}?`,
                              () => toggleStatusMutation.mutate({ id: user.id, isActive: false }),
                              {
                                description: "Người dùng này sẽ bị đăng xuất và không thể tiếp tục truy cập hệ thống.",
                                confirmLabel: "Khóa",
                                cancelLabel: "Hủy"
                              }
                            );
                          }}
                          disabled={user.username === "superadmin" || toggleStatusMutation.isPending}
                        >
                          <UserX size={16} />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Mở khóa tài khoản"
                          className="text-emerald-500 hover:bg-emerald-500/10"
                          onClick={() => toggleStatusMutation.mutate({ id: user.id, isActive: true })}
                          disabled={toggleStatusMutation.isPending}
                        >
                          <UserCheck size={16} />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination Controls */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            Trước
          </Button>
          <span className="text-sm text-muted-foreground">
            Trang {page + 1} / {data.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(data.totalPages - 1, p + 1))}
            disabled={page === data.totalPages - 1}
          >
            Sau
          </Button>
        </div>
      )}

      {/* Dialog Cập nhật Roles */}
      <Dialog open={isEditRolesOpen} onOpenChange={(open) => {
        setIsEditRolesOpen(open);
        if (!open) setSelectedUser(null);
      }}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="text-primary h-5 w-5" />
              Cập nhật vai trò
            </DialogTitle>
            <DialogDescription>
              Chỉnh sửa vai trò hệ thống cho tài khoản{" "}
              <span className="font-semibold text-foreground">@{selectedUser?.username}</span>.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateRoles} className="space-y-4 py-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Vai trò hệ thống (Roles)</Label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingRoles(ROLE_OPTIONS.map(r => r.value))}
                    className="text-xs text-primary font-medium hover:underline underline-offset-2 transition-colors"
                  >
                    Chọn tất cả
                  </button>
                  <span className="text-muted-foreground text-xs">|</span>
                  <button
                    type="button"
                    onClick={() => setEditingRoles([])}
                    className="text-xs text-muted-foreground font-medium hover:text-destructive hover:underline underline-offset-2 transition-colors"
                  >
                    Bỏ chọn tất cả
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 border rounded-md p-3 bg-muted/20">
                {ROLE_OPTIONS.map(role => (
                  <div key={role.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-role-${role.value}`}
                      checked={editingRoles.includes(role.value)}
                      onCheckedChange={(checked) => handleEditRolesCheckboxChange(role.value, !!checked)}
                    />
                    <Label
                      htmlFor={`edit-role-${role.value}`}
                      className="text-xs font-normal cursor-pointer"
                    >
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-semibold border ${
                          editingRoles.includes(role.value) ? role.color : "border-muted text-muted-foreground"
                        }`}
                      >
                        {role.label}
                      </Badge>
                    </Label>
                  </div>
                ))}
              </div>
              {editingRoles.length === 0 && (
                <p className="text-xs text-destructive">Cần chọn ít nhất một vai trò.</p>
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsEditRolesOpen(false)}>Hủy</Button>
              <Button
                type="submit"
                disabled={updateRolesMutation.isPending || editingRoles.length === 0}
              >
                {updateRolesMutation.isPending && <Loader2 size={16} className="animate-spin mr-2" />}
                Lưu thay đổi
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Reset Password */}
      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="text-amber-500" />
              Đặt lại mật khẩu
            </DialogTitle>
            <DialogDescription>
              Bạn đang thực hiện thay đổi mật khẩu cho tài khoản{" "}
              <span className="font-semibold text-foreground">@{selectedUser?.username}</span>.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="reset-new-password">Mật khẩu mới</Label>
              <Input 
                id="reset-new-password" 
                type="password"
                placeholder="Tối thiểu 6 ký tự..." 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsResetOpen(false)}>Hủy</Button>
              <Button type="submit" variant="destructive" disabled={resetPasswordMutation.isPending}>
                {resetPasswordMutation.isPending && <Loader2 size={16} className="animate-spin mr-2" />}
                Xác nhận đổi mật khẩu
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog View Permissions */}
      <Dialog open={isPermissionsOpen} onOpenChange={setIsPermissionsOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Shield className="text-primary h-5 w-5" />
              Chi tiết quyền hạn tài khoản
            </DialogTitle>
            <DialogDescription>
              Danh sách các quyền hạn được cấp của tài khoản{" "}
              <span className="font-semibold text-foreground">@{selectedUser?.username}</span> dựa trên các vai trò hệ thống.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* User Roles info */}
            <div>
              <Label className="text-sm font-semibold block mb-2 text-muted-foreground">Vai trò hiện tại</Label>
              <div className="flex flex-wrap gap-2">
                {selectedUser?.roles.map(roleVal => {
                  const opt = ROLE_OPTIONS.find(o => o.value === roleVal);
                  return (
                    <Badge 
                      key={roleVal} 
                      variant="outline" 
                      className={`text-xs font-semibold px-2.5 py-1 border ${opt?.color || ""}`}
                    >
                      {opt?.label || roleVal}
                    </Badge>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Permissions by Category */}
            <div className="space-y-4">
              <Label className="text-sm font-semibold block text-muted-foreground">Danh mục quyền chi tiết</Label>
              
              {/* Grouping permissions */}
              {["Hệ thống", "Nhân sự", "Tuyển dụng", "Lương thưởng", "Phê duyệt"].map((category) => {
                const categoryPermissions = PERMISSIONS_LIST.filter(p => p.category === category);
                return (
                  <div key={category} className="space-y-2 border rounded-lg p-3 bg-muted/10">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{category}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {categoryPermissions.map(permission => {
                        const isGranted = selectedUser?.roles.some(role => 
                          ROLE_PERMISSIONS_MAP[role]?.includes(permission.code)
                        );
                        return (
                          <div 
                            key={permission.code} 
                            className={`flex items-start space-x-2.5 p-2 rounded-md transition-all border ${
                              isGranted 
                                ? "bg-emerald-500/5 border-emerald-500/10" 
                                : "bg-muted/30 border-transparent opacity-60"
                            }`}
                          >
                            <div className={`mt-0.5 rounded-full p-0.5 ${
                              isGranted ? "bg-emerald-500/15 text-emerald-600" : "bg-muted text-muted-foreground"
                            }`}>
                              {isGranted ? <Check size={12} className="stroke-[3]" /> : <X size={12} />}
                            </div>
                            <div className="space-y-0.5">
                              <span className={`text-xs font-semibold block ${isGranted ? "text-foreground" : "text-muted-foreground line-through decoration-muted-foreground/30"}`}>
                                {permission.name}
                              </span>
                              <p className="text-[10px] text-muted-foreground leading-normal font-normal">
                                {permission.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" onClick={() => setIsPermissionsOpen(false)} className="w-full sm:w-auto">Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagementPage;
