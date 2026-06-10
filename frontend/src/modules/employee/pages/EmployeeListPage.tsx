import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { employeeApi } from "../api/employeeApi";
import { organizationApi } from "../../organization/api/organizationApi";
import { toast } from "sonner";
import { usePermission } from "../../../hooks/usePermission";
import { 
  Plus, 
  Search, 
  Filter, 
  Building, 
  Mail, 
  Phone, 
  Briefcase,
  Eye,
  Loader2,
  RefreshCw
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Label } from "@/components/ui/label";

const STATUS_BADGES: Record<string, string> = {
  ACTIVE: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10",
  PROBATION: "bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/10",
  ON_LEAVE: "bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/10",
  TERMINATED: "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/10"
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Đang làm việc",
  PROBATION: "Thử việc",
  ON_LEAVE: "Nghỉ phép dài",
  TERMINATED: "Đã thôi việc"
};

const EmployeeListPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasAnyRole } = usePermission();
  const canManage = hasAnyRole(["SUPER_ADMIN", "HR_ADMIN"]);

  // Search & Filter state
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form State tạo mới
  const [empCode, setEmpCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("MALE");
  const [hireDate, setHireDate] = useState("");
  const [formDeptId, setFormDeptId] = useState("none");
  const [formPosId, setFormPosId] = useState("none");

  // Query: Danh sách nhân viên
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["employees", page, search, selectedDeptId, selectedStatus],
    queryFn: () => employeeApi.getEmployees(
      search,
      selectedDeptId === "all" ? null : Number(selectedDeptId),
      selectedStatus === "all" ? "" : selectedStatus,
      page,
      10
    ),
  });

  // Query: Danh sách phòng ban phục vụ bộ lọc
  const { data: departments = [] } = useQuery({
    queryKey: ["flat-departments"],
    queryFn: organizationApi.getDepartments,
  });

  // Query: Danh sách chức danh phục vụ form
  const { data: positions = [] } = useQuery({
    queryKey: ["flat-positions", formDeptId],
    queryFn: () => formDeptId !== "none" ? organizationApi.getPositionsByDept(Number(formDeptId)) : Promise.resolve([]),
    enabled: formDeptId !== "none",
  });

  // Mutation: Thêm nhân viên mới
  const createMutation = useMutation({
    mutationFn: employeeApi.createEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Tạo hồ sơ nhân viên mới thành công!");
      setIsCreateOpen(false);
      resetCreateForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Tạo hồ sơ nhân viên thất bại!");
    }
  });

  const resetCreateForm = () => {
    setEmpCode("");
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setGender("MALE");
    setHireDate("");
    setFormDeptId("none");
    setFormPosId("none");
  };

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empCode || !firstName || !lastName || !email || !hireDate) {
      toast.error("Vui lòng nhập đầy đủ các trường bắt buộc");
      return;
    }

    createMutation.mutate({
      employeeCode: empCode,
      firstName,
      lastName,
      email,
      phone: phone || undefined,
      gender,
      hireDate,
      departmentId: formDeptId === "none" ? undefined : Number(formDeptId),
      positionId: formPosId === "none" ? undefined : Number(formPosId),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Hồ sơ nhân viên</h2>
          <p className="text-muted-foreground">
            Quản lý thông tin hồ sơ, quá trình công tác và hợp đồng của nhân sự toàn công ty.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
          </Button>

          {canManage && (
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus size={16} />
                  Thêm nhân viên
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Thêm nhân viên mới</DialogTitle>
                  <DialogDescription>
                    Tạo hồ sơ nhân viên mới. Hệ thống sẽ tự động tạo onboarding checklist ban đầu.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateEmployee} className="space-y-4 py-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="emp-code">Mã nhân viên *</Label>
                      <Input 
                        id="emp-code" 
                        placeholder="Ví dụ: EMP-001..." 
                        value={empCode}
                        onChange={(e) => setEmpCode(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="emp-gender">Giới tính</Label>
                      <Select value={gender} onValueChange={setGender}>
                        <SelectTrigger id="emp-gender">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MALE">Nam</SelectItem>
                          <SelectItem value="FEMALE">Nữ</SelectItem>
                          <SelectItem value="OTHER">Khác</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="emp-lastname">Họ *</Label>
                      <Input 
                        id="emp-lastname" 
                        placeholder="Ví dụ: Nguyễn Văn..." 
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="emp-firstname">Tên *</Label>
                      <Input 
                        id="emp-firstname" 
                        placeholder="Ví dụ: A..." 
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="emp-email">Email công việc *</Label>
                      <Input 
                        id="emp-email" 
                        type="email" 
                        placeholder="nhanvien@company.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="emp-phone">Số điện thoại</Label>
                      <Input 
                        id="emp-phone" 
                        placeholder="09xx..." 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="emp-hiredate">Ngày nhận việc *</Label>
                    <Input 
                      id="emp-hiredate" 
                      type="date" 
                      value={hireDate}
                      onChange={(e) => setHireDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="form-dept">Phòng ban</Label>
                      <Select value={formDeptId} onValueChange={(val) => { setFormDeptId(val); setFormPosId("none"); }}>
                        <SelectTrigger id="form-dept">
                          <SelectValue placeholder="Chọn phòng ban..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Chưa phân phòng</SelectItem>
                          {departments.map(d => (
                            <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="form-pos">Chức danh</Label>
                      <Select value={formPosId} onValueChange={setFormPosId} disabled={formDeptId === "none"}>
                        <SelectTrigger id="form-pos">
                          <SelectValue placeholder="Chọn chức danh..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Chưa phân chức danh</SelectItem>
                          {positions.map(p => (
                            <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <DialogFooter className="pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Hủy</Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending && <Loader2 size={16} className="animate-spin mr-2" />}
                      Tạo hồ sơ
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 bg-background border p-4 rounded-xl shadow-sm">
        <div className="flex items-center flex-1 max-w-sm gap-2 border rounded-md px-3 py-1 bg-muted/20">
          <Search size={18} className="text-muted-foreground" />
          <Input 
            placeholder="Tìm theo tên, mã, email..." 
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-8 text-sm bg-transparent"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">Lọc:</span>
          </div>

          <Select value={selectedDeptId} onValueChange={(val) => { setSelectedDeptId(val); setPage(0); }}>
            <SelectTrigger className="h-9 w-[180px] bg-background">
              <Building size={14} className="mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Tất cả phòng ban" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả phòng ban</SelectItem>
              {departments.map(d => (
                <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={(val) => { setSelectedStatus(val); setPage(0); }}>
            <SelectTrigger className="h-9 w-[160px] bg-background">
              <Briefcase size={14} className="mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Tất cả trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="ACTIVE">Đang làm việc</SelectItem>
              <SelectItem value="PROBATION">Thử việc</SelectItem>
              <SelectItem value="ON_LEAVE">Nghỉ phép dài</SelectItem>
              <SelectItem value="TERMINATED">Đã thôi việc</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table grid */}
      <div className="border rounded-xl bg-background shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 size={36} className="animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Đang tải danh sách nhân viên...</p>
          </div>
        ) : !data || data.content.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            Không tìm thấy nhân viên nào phù hợp.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nhân viên</TableHead>
                <TableHead>Mã nhân viên</TableHead>
                <TableHead>Phòng ban & Chức danh</TableHead>
                <TableHead>Liên hệ</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày vào làm</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.content.map((emp) => (
                <TableRow key={emp.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border shadow-sm">
                        <AvatarImage src={emp.avatarUrl || ""} alt={emp.fullName} />
                        <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                          {emp.lastName.charAt(0)}{emp.firstName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="font-semibold text-foreground">{emp.fullName}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{emp.employeeCode}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium text-foreground">{emp.departmentName || "Chưa phân phòng"}</div>
                      <div className="text-xs text-muted-foreground">{emp.positionName || "Chưa phân chức danh"}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Mail size={12} className="shrink-0 text-muted-foreground/60" />
                        <span>{emp.email}</span>
                      </div>
                      {emp.phone && (
                        <div className="flex items-center gap-1">
                          <Phone size={12} className="shrink-0 text-muted-foreground/60" />
                          <span>{emp.phone}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`font-semibold text-[10px] py-0.5 border ${STATUS_BADGES[emp.status] || ""}`}>
                      {STATUS_LABELS[emp.status] || emp.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(emp.hireDate).toLocaleDateString("vi-VN")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-1 text-xs"
                      onClick={() => navigate(`/employees/${emp.id}`)}
                    >
                      <Eye size={14} />
                      Chi tiết
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
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
    </div>
  );
};

export default EmployeeListPage;
