import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { attendanceApi, type AttendanceLogResponse } from "../api/attendanceApi";
import { organizationApi } from "../../organization/api/organizationApi";
import { toast } from "sonner";
import { usePermission } from "../../../hooks/usePermission";
import { useDebounce } from "../../../hooks/useDebounce";
import { 
  MapPin, 
  Monitor, 
  Play, 
  Square, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  FileSpreadsheet,
  Upload,
  UserCheck,
  Search,
  Filter,
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUS_BADGES: Record<string, string> = {
  ON_TIME: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  LATE: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  EARLY_LEAVE: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  ABSENT: "bg-destructive/10 text-destructive border-destructive/20",
  PENDING_ADJUST: "bg-orange-500/10 text-orange-500 border-orange-500/20 animate-pulse",
  ADJUSTED: "bg-purple-500/10 text-purple-500 border-purple-500/20"
};

const STATUS_LABELS: Record<string, string> = {
  ON_TIME: "Đúng giờ",
  LATE: "Đi muộn",
  EARLY_LEAVE: "Về sớm",
  ABSENT: "Vắng mặt",
  PENDING_ADJUST: "Chờ duyệt sửa",
  ADJUSTED: "Đã điều chỉnh"
};

const AttendancePage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = usePermission();
  const roles = user?.roles || [];


  // Time State
  const [currentTime, setCurrentTime] = useState(new Date());

  // Form State
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [adjustDate, setAdjustDate] = useState("");
  const [adjustIn, setAdjustIn] = useState("");
  const [adjustOut, setAdjustOut] = useState("");
  const [adjustNote, setAdjustNote] = useState("");

  // Filter State (Dành cho Manager/HR)
  const [filterEmployeeId, setFilterEmployeeId] = useState("");
  const [filterDeptId, setFilterDeptId] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchName, setSearchName] = useState("");
  const debouncedSearchName = useDebounce(searchName, 400);

  // Xác định quyền hiển thị tab và duyệt
  const isEmployeeOnly = roles.includes("EMPLOYEE") && roles.length === 1;
  const isManager = roles.includes("MANAGER");
  const isHR = roles.some(r => ["SUPER_ADMIN", "HR_ADMIN", "HR_STAFF"].includes(r));
  const isSuperOrHRAdmin = roles.some(r => ["SUPER_ADMIN", "HR_ADMIN"].includes(r));
  const canApprove = roles.some(r => ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"].includes(r));

  // Excel State
  const [excelFile, setExcelFile] = useState<File | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // IP và Location mock cho check-in
  const [ipAddress, setIpAddress] = useState("192.168.1.52");
  const [location, setLocation] = useState("Văn phòng Trụ sở chính (Hà Nội)");

  // Query: Lấy bảng công cá nhân (Employee)
  const { data: myLogs, isLoading: isMyLogsLoading } = useQuery({
    queryKey: ["my-attendance"],
    queryFn: () => attendanceApi.getAttendanceLogs({
      employeeId: user?.employeeId,
      size: 50
    }),
    enabled: !!user?.employeeId,
  });

  // Query: Lấy toàn bộ logs có lọc (Manager/HR)
  const { data: allLogs, isLoading: isAllLogsLoading } = useQuery({
    queryKey: ["all-attendance", filterDeptId, filterStatus, searchName],
    queryFn: () => attendanceApi.getAttendanceLogs({
      departmentId: filterDeptId === "all" ? null : Number(filterDeptId),
      status: filterStatus === "all" ? "" : filterStatus,
      size: 50
    }),
    enabled: isManager || isHR,
  });

  // Query: Lấy danh sách đơn sửa công chờ duyệt (Manager/HR)
  const { data: pendingLogs } = useQuery({
    queryKey: ["pending-adjustments"],
    queryFn: () => attendanceApi.getAttendanceLogs({
      status: "PENDING_ADJUST",
      size: 50
    }),
    enabled: canApprove,
  });

  // Lọc tìm kiếm client-side dựa trên debouncedSearchName
  const filteredLogs = allLogs?.content.filter(log => 
    log.employeeName.toLowerCase().includes(debouncedSearchName.toLowerCase()) ||
    log.employeeCode.toLowerCase().includes(debouncedSearchName.toLowerCase())
  ) || [];

  // Query: Danh sách phòng ban
  const { data: departments = [] } = useQuery({
    queryKey: ["flat-departments-attendance"],
    queryFn: organizationApi.getDepartments,
    enabled: isManager || isHR,
  });

  // Mutation: Check-in
  const checkInMutation = useMutation({
    mutationFn: attendanceApi.checkIn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-attendance"] });
      toast.success("Check-in thành công!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Check-in thất bại!");
    }
  });

  // Mutation: Check-out
  const checkOutMutation = useMutation({
    mutationFn: attendanceApi.checkOut,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-attendance"] });
      toast.success("Check-out thành công!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Check-out thất bại!");
    }
  });

  // Mutation: Gửi đơn sửa công
  const adjustMutation = useMutation({
    mutationFn: attendanceApi.requestAdjustment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-attendance"] });
      toast.success("Gửi yêu cầu điều chỉnh thành công!");
      setIsAdjustOpen(false);
      resetAdjustForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Gửi yêu cầu thất bại!");
    }
  });

  // Mutation: Phê duyệt sửa công
  const approveMutation = useMutation({
    mutationFn: ({ id, approve }: { id: number; approve: boolean }) => 
      attendanceApi.approveAdjustment(id, approve),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["pending-adjustments"] });
      queryClient.invalidateQueries({ queryKey: ["all-attendance"] });
      toast.success(variables.approve ? "Đã duyệt điều chỉnh công!" : "Đã từ chối điều chỉnh!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Thao tác thất bại!");
    }
  });

  // Mutation: Import Excel
  const importMutation = useMutation({
    mutationFn: attendanceApi.importAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-attendance"] });
      toast.success("Import Excel chấm công thành công!");
      setExcelFile(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Import thất bại!");
    }
  });

  const resetAdjustForm = () => {
    setAdjustDate("");
    setAdjustIn("");
    setAdjustOut("");
    setAdjustNote("");
  };

  const handleCheckIn = () => {
    checkInMutation.mutate({
      ipAddress,
      location,
      note: "Web Check-in"
    });
  };

  const handleCheckOut = () => {
    checkOutMutation.mutate();
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustDate || !adjustNote) {
      toast.error("Vui lòng điền ngày và lý do điều chỉnh");
      return;
    }

    adjustMutation.mutate({
      workDate: adjustDate,
      checkIn: adjustIn ? `${adjustDate}T${adjustIn}:00` : null,
      checkOut: adjustOut ? `${adjustDate}T${adjustOut}:00` : null,
      note: adjustNote
    });
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!excelFile) return;
    importMutation.mutate(excelFile);
  };

  // Xác định log hôm nay để disable nút
  const todayLog = myLogs?.content.find(log => log.workDate === LocalDate.now().toString());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Chấm công hàng ngày</h2>
        <p className="text-muted-foreground">
          Ghi nhận giờ làm việc, quản lý lịch sử chấm công và phê duyệt điều chỉnh công.
        </p>
      </div>

      <Tabs defaultValue="my-attendance" className="w-full">
        <TabsList className="bg-muted/60 mb-4">
          <TabsTrigger value="my-attendance">Cá nhân</TabsTrigger>
          {canApprove && <TabsTrigger value="approve-adjust">Duyệt yêu cầu ({pendingLogs?.content.length || 0})</TabsTrigger>}
          {(isManager || isHR) && <TabsTrigger value="all-attendance">Bảng công toàn bộ</TabsTrigger>}
          {isSuperOrHRAdmin && <TabsTrigger value="import-excel">Import dữ liệu</TabsTrigger>}
        </TabsList>

        {/* Tab 1: Cá nhân */}
        <TabsContent value="my-attendance" className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Widget Checkin/Checkout */}
          <Card className="lg:col-span-1 shadow-sm border-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="text-lg">Ghi nhận công việc</CardTitle>
              <CardDescription>Giờ chuẩn: 08:30 - 17:30</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-6">
              {/* Đồng hồ số */}
              <div className="flex flex-col items-center">
                <Clock size={32} className="text-primary animate-pulse mb-1" />
                <span className="text-3xl font-bold tracking-wider font-mono">
                  {currentTime.toLocaleTimeString("vi-VN")}
                </span>
                <span className="text-xs text-muted-foreground">
                  {currentTime.toLocaleDateString("vi-VN", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>

              {/* IP & Location */}
              <div className="w-full space-y-2 text-xs text-muted-foreground bg-muted/30 border rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Monitor size={14} className="text-primary/70 shrink-0" />
                  <span className="truncate">IP: <span className="font-semibold text-foreground">{ipAddress}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-primary/70 shrink-0" />
                  <span className="truncate" title={location}>Địa điểm: <span className="font-semibold text-foreground">{location}</span></span>
                </div>
              </div>

              {/* Nút Check-in / Check-out */}
              <div className="grid grid-cols-2 gap-4 w-full pt-2">
                <Button 
                  onClick={handleCheckIn} 
                  disabled={!!todayLog?.checkIn || checkInMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 h-12 rounded-xl"
                >
                  <Play size={16} />
                  Check-in
                </Button>
                <Button 
                  onClick={handleCheckOut} 
                  disabled={!todayLog?.checkIn || !!todayLog?.checkOut || checkOutMutation.isPending}
                  variant="destructive"
                  className="flex items-center justify-center gap-2 h-12 rounded-xl"
                >
                  <Square size={16} />
                  Check-out
                </Button>
              </div>

              {todayLog?.checkIn && (
                <div className="text-xs text-muted-foreground w-full text-center">
                  Hôm nay đã check-in lúc: <span className="font-bold text-foreground">{new Date(todayLog.checkIn).toLocaleTimeString("vi-VN")}</span>
                  {todayLog.checkOut && (
                    <> và check-out lúc: <span className="font-bold text-foreground">{new Date(todayLog.checkOut).toLocaleTimeString("vi-VN")}</span></>
                  )}
                </div>
              )}

              <Button 
                variant="outline" 
                className="w-full text-xs" 
                onClick={() => setIsAdjustOpen(true)}
              >
                Gửi yêu cầu sửa công
              </Button>
            </CardContent>
          </Card>

          {/* Bảng lịch sử chấm công cá nhân */}
          <Card className="lg:col-span-2 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Lịch sử chấm công cá nhân</CardTitle>
              <CardDescription>Bảng thống kê chấm công chi tiết theo từng ngày công.</CardDescription>
            </CardHeader>
            <CardContent>
              {isMyLogsLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>
              ) : !myLogs || myLogs.content.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground italic text-sm">Chưa có nhật ký chấm công nào.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ngày công</TableHead>
                      <TableHead>Check-in</TableHead>
                      <TableHead>Check-out</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Ghi chú</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myLogs.content.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-semibold text-sm">
                          {new Date(log.workDate).toLocaleDateString("vi-VN", { weekday: 'short', day: '2-digit', month: '2-digit' })}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-foreground">
                          {log.checkIn ? new Date(log.checkIn).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }) : "—"}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-foreground">
                          {log.checkOut ? new Date(log.checkOut).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }) : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] font-semibold ${STATUS_BADGES[log.status] || ""}`}>
                            {STATUS_LABELS[log.status] || log.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs truncate max-w-[150px]" title={log.note || ""}>
                          {log.note || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Duyệt yêu cầu điều chỉnh của team */}
        {canApprove && (
          <TabsContent value="approve-adjust">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Danh sách yêu cầu điều chỉnh công</CardTitle>
                <CardDescription>Xét duyệt các đơn xin điều chỉnh giờ check-in/check-out của nhân sự.</CardDescription>
              </CardHeader>
              <CardContent>
                {!pendingLogs || pendingLogs.content.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground italic text-sm">Không có yêu cầu điều chỉnh công nào đang chờ duyệt.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nhân viên</TableHead>
                        <TableHead>Ngày công cần sửa</TableHead>
                        <TableHead>Giờ check-in đề xuất</TableHead>
                        <TableHead>Giờ check-out đề xuất</TableHead>
                        <TableHead>Lý do</TableHead>
                        <TableHead className="text-right">Hành động</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingLogs.content.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <div className="text-sm font-semibold">{log.employeeName}</div>
                            <span className="text-[10px] text-muted-foreground font-mono">{log.employeeCode}</span>
                          </TableCell>
                          <TableCell className="font-medium">
                            {new Date(log.workDate).toLocaleDateString("vi-VN")}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {log.checkIn ? new Date(log.checkIn).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }) : "—"}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {log.checkOut ? new Date(log.checkOut).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }) : "—"}
                          </TableCell>
                          <TableCell className="text-sm text-foreground italic">{log.note}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                size="sm" 
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                                onClick={() => approveMutation.mutate({ id: log.id, approve: true })}
                              >
                                Duyệt
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                className="text-xs h-8"
                                onClick={() => approveMutation.mutate({ id: log.id, approve: false })}
                              >
                                Từ chối
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Tab 3: Bảng công toàn công ty */}
        {(isManager || isHR) && (
          <TabsContent value="all-attendance">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-col md:flex-row md:items-center justify-between space-y-0 gap-4">
                <div>
                  <CardTitle className="text-lg">Danh sách công toàn bộ</CardTitle>
                  <CardDescription>Xem và quản lý nhật ký chấm công của toàn nhân sự.</CardDescription>
                </div>
                
                {/* Bộ lọc bảng công */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative w-full md:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Tìm theo tên, mã NV..." 
                      value={searchName}
                      onChange={(e) => setSearchName(e.target.value)}
                      className="pl-9 bg-background h-9"
                    />
                  </div>

                  <Select value={filterDeptId} onValueChange={setFilterDeptId}>
                    <SelectTrigger className="h-9 w-[180px]">
                      <SelectValue placeholder="Phòng ban" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả phòng ban</SelectItem>
                      {departments.map(d => (
                        <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="h-9 w-[160px]">
                      <SelectValue placeholder="Trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả trạng thái</SelectItem>
                      {Object.keys(STATUS_LABELS).map(k => (
                        <SelectItem key={k} value={k}>{STATUS_LABELS[k]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {isAllLogsLoading ? (
                  <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>
                ) : !allLogs || allLogs.content.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground italic text-sm">Không tìm thấy bản ghi nào.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nhân viên</TableHead>
                        <TableHead>Ngày công</TableHead>
                        <TableHead>Check-in</TableHead>
                        <TableHead>Check-out</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Ghi chú</TableHead>
                        <TableHead>Người duyệt</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <div className="text-sm font-semibold">{log.employeeName}</div>
                            <span className="text-[10px] text-muted-foreground font-mono">{log.employeeCode}</span>
                          </TableCell>
                          <TableCell className="font-medium">
                            {new Date(log.workDate).toLocaleDateString("vi-VN")}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {log.checkIn ? new Date(log.checkIn).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }) : "—"}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {log.checkOut ? new Date(log.checkOut).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }) : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-[10px] font-semibold ${STATUS_BADGES[log.status] || ""}`}>
                              {STATUS_LABELS[log.status] || log.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground italic truncate max-w-[150px]">
                            {log.note || "—"}
                          </TableCell>
                          <TableCell className="text-xs text-foreground font-medium">
                            {log.approvedByName || "Tự động (GPS)"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Tab 4: Import Excel chấm công */}
        {isSuperOrHRAdmin && (
          <TabsContent value="import-excel">
            <Card className="shadow-sm max-w-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileSpreadsheet className="text-emerald-600" />
                  Import tệp dữ liệu máy công
                </CardTitle>
                <CardDescription>
                  Upload file Excel kết xuất từ máy chấm công để đồng bộ nhanh công tháng của toàn bộ nhân viên.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleImportSubmit} className="space-y-4">
                  <div className="border-2 border-dashed border-muted rounded-xl p-8 flex flex-col items-center justify-center text-center bg-muted/10 hover:bg-muted/20 transition-colors">
                    <Upload size={36} className="text-muted-foreground mb-3" />
                    <Label htmlFor="excel-file" className="cursor-pointer font-semibold text-primary mb-1">
                      Chọn file Excel (.xlsx) từ máy tính
                    </Label>
                    <span className="text-xs text-muted-foreground">Chỉ chấp nhận định dạng Excel</span>
                    <Input 
                      id="excel-file" 
                      type="file" 
                      accept=".xlsx" 
                      onChange={e => {
                        if (e.target.files && e.target.files[0]) {
                          setExcelFile(e.target.files[0]);
                        }
                      }}
                      className="hidden" 
                    />
                    {excelFile && (
                      <div className="mt-4 p-2 bg-background border rounded-lg text-xs font-mono text-foreground flex items-center gap-2">
                        <FileSpreadsheet size={14} className="text-emerald-600" />
                        {excelFile.name}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setExcelFile(null)} disabled={importMutation.isPending}>
                      Xóa chọn
                    </Button>
                    <Button type="submit" disabled={!excelFile || importMutation.isPending}>
                      {importMutation.isPending && <Loader2 size={16} className="animate-spin mr-2" />}
                      Bắt đầu Import
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Dialog Sửa Công */}
      <Dialog open={isAdjustOpen} onOpenChange={setIsAdjustOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Yêu cầu sửa đổi giờ công</DialogTitle>
            <DialogDescription>
              Đề xuất bổ sung giờ check-in/check-out cho các ngày bị thiếu công hoặc sai sót.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdjustSubmit} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="adj-date">Chọn ngày cần sửa *</Label>
              <Input id="adj-date" type="date" value={adjustDate} onChange={e => setAdjustDate(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="adj-in">Giờ check-in đề xuất</Label>
                <Input id="adj-in" type="time" value={adjustIn} onChange={e => setAdjustIn(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="adj-out">Giờ check-out đề xuất</Label>
                <Input id="adj-out" type="time" value={adjustOut} onChange={e => setAdjustOut(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="adj-note">Lý do điều chỉnh công *</Label>
              <Textarea id="adj-note" placeholder="Nhập lý do chi tiết..." value={adjustNote} onChange={e => setAdjustNote(e.target.value)} required />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAdjustOpen(false)}>Hủy</Button>
              <Button type="submit" disabled={adjustMutation.isPending}>
                {adjustMutation.isPending && <Loader2 size={16} className="animate-spin mr-2" />}
                Gửi yêu cầu
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Static helper cho LocalDate.now()
const LocalDate = {
  now: () => {
    const d = new Date();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
  }
};

export default AttendancePage;
