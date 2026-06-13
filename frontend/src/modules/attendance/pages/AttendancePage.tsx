import React, { useState, useEffect, useMemo } from "react";
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
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  FileSpreadsheet,
  Upload,
  UserCheck,
  Search,
  Filter,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Users,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Info,
  CalendarDays,
  LayoutGrid,
  Fingerprint
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

// ─── Status Config ──────────────────────────────────────────────────────────────
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

const STATUS_DOT_COLORS: Record<string, string> = {
  ON_TIME: "bg-emerald-500",
  LATE: "bg-amber-500",
  EARLY_LEAVE: "bg-blue-500",
  ABSENT: "bg-red-500",
  PENDING_ADJUST: "bg-orange-500 animate-pulse",
  ADJUSTED: "bg-purple-500"
};

const WEEKDAY_NAMES = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const MONTH_NAMES = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4",
  "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8",
  "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
];

// ─── Calendar helpers ───────────────────────────────────────────────────────────
function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDayOfWeek = firstDay.getDay(); // 0=Sun
  const totalDays = lastDay.getDate();
  
  const days: { date: Date; isCurrentMonth: boolean }[] = [];
  
  // Ngày của tháng trước (fill đầu)
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, prevMonthLastDay - i),
      isCurrentMonth: false,
    });
  }
  
  // Ngày trong tháng hiện tại
  for (let d = 1; d <= totalDays; d++) {
    days.push({
      date: new Date(year, month, d),
      isCurrentMonth: true,
    });
  }
  
  // Ngày của tháng sau (fill cuối, đủ 6 hàng = 42 ô)
  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    days.push({
      date: new Date(year, month + 1, d),
      isCurrentMonth: false,
    });
  }
  
  return days;
}

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isToday(date: Date): boolean {
  const now = new Date();
  return date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate();
}

function isWeekend(date: Date): boolean {
  return date.getDay() === 0 || date.getDay() === 6;
}

// ─── Calendar Day Cell Component ────────────────────────────────────────────────
interface CalendarDayCellProps {
  date: Date;
  isCurrentMonth: boolean;
  logs: AttendanceLogResponse[];
  onClickDay: (date: Date, logs: AttendanceLogResponse[]) => void;
}

const CalendarDayCell: React.FC<CalendarDayCellProps> = ({ date, isCurrentMonth, logs, onClickDay }) => {
  const today = isToday(date);
  const weekend = isWeekend(date);
  const dayNum = date.getDate();
  
  // Thống kê nhanh
  const onTimeCount = logs.filter(l => l.status === "ON_TIME").length;
  const lateCount = logs.filter(l => l.status === "LATE").length;
  const absentCount = logs.filter(l => l.status === "ABSENT").length;
  const earlyLeaveCount = logs.filter(l => l.status === "EARLY_LEAVE").length;
  const pendingCount = logs.filter(l => l.status === "PENDING_ADJUST").length;
  
  return (
    <div
      onClick={() => logs.length > 0 && onClickDay(date, logs)}
      className={`
        min-h-[100px] p-1.5 border-b border-r border-border/40 transition-all duration-200 relative
        ${!isCurrentMonth ? "bg-muted/20 opacity-50" : "bg-card hover:bg-accent/30"}
        ${today ? "ring-2 ring-primary/40 ring-inset bg-primary/5" : ""}
        ${weekend && isCurrentMonth ? "bg-muted/30" : ""}
        ${logs.length > 0 ? "cursor-pointer group" : "cursor-default"}
      `}
    >
      {/* Số ngày */}
      <div className="flex items-center justify-between mb-1">
        <span className={`
          text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full
          ${today ? "bg-primary text-primary-foreground" : ""}
          ${weekend && !today ? "text-red-400" : "text-foreground/80"}
          ${!isCurrentMonth ? "text-muted-foreground/40" : ""}
        `}>
          {dayNum}
        </span>
        {logs.length > 0 && (
          <span className="text-[10px] text-muted-foreground font-medium bg-muted/60 px-1.5 py-0.5 rounded-full">
            {logs.length}
          </span>
        )}
      </div>
      
      {/* Indicator dots */}
      {isCurrentMonth && logs.length > 0 && (
        <div className="space-y-0.5">
          {/* Thống kê dạng mini bar */}
          <div className="flex gap-0.5 flex-wrap">
            {onTimeCount > 0 && (
              <div className="flex items-center gap-0.5 bg-emerald-500/10 px-1 py-0.5 rounded text-[9px] font-semibold text-emerald-600">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {onTimeCount}
              </div>
            )}
            {lateCount > 0 && (
              <div className="flex items-center gap-0.5 bg-amber-500/10 px-1 py-0.5 rounded text-[9px] font-semibold text-amber-600">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {lateCount}
              </div>
            )}
            {absentCount > 0 && (
              <div className="flex items-center gap-0.5 bg-red-500/10 px-1 py-0.5 rounded text-[9px] font-semibold text-red-600">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                {absentCount}
              </div>
            )}
            {earlyLeaveCount > 0 && (
              <div className="flex items-center gap-0.5 bg-blue-500/10 px-1 py-0.5 rounded text-[9px] font-semibold text-blue-600">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                {earlyLeaveCount}
              </div>
            )}
            {pendingCount > 0 && (
              <div className="flex items-center gap-0.5 bg-orange-500/10 px-1 py-0.5 rounded text-[9px] font-semibold text-orange-600 animate-pulse">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                {pendingCount}
              </div>
            )}
          </div>
          
          {/* Hiển thị tối đa 2 dòng nhân viên tiêu biểu */}
          <div className="space-y-0.5 mt-0.5">
            {logs.slice(0, 2).map(log => (
              <div 
                key={log.id} 
                className="flex items-center gap-1 text-[9px] text-muted-foreground truncate"
              >
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT_COLORS[log.status] || "bg-gray-400"}`} />
                <span className="truncate">{log.employeeName}</span>
              </div>
            ))}
            {logs.length > 2 && (
              <div className="text-[9px] text-primary font-medium pl-2.5">
                +{logs.length - 2} người khác
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Hover overlay */}
      {logs.length > 0 && (
        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity rounded pointer-events-none" />
      )}
    </div>
  );
};


// ═══════════════════════════════════════════════════════════════════════════════
// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
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
  const [filterDeptId, setFilterDeptId] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchName, setSearchName] = useState("");
  const debouncedSearchName = useDebounce(searchName, 400);

  // Calendar state
  const now = new Date();
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [selectedDayLogs, setSelectedDayLogs] = useState<AttendanceLogResponse[] | null>(null);
  const [selectedDayDate, setSelectedDayDate] = useState<Date | null>(null);
  
  // Approval detail dialog
  const [approveDetailLog, setApproveDetailLog] = useState<AttendanceLogResponse | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ id: number; approve: boolean } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  
  // View detail dialog
  const [viewDetailLog, setViewDetailLog] = useState<AttendanceLogResponse | null>(null);

  // Xác định quyền hiển thị tab và duyệt
  const isEmployeeOnly = roles.includes("EMPLOYEE") && roles.length === 1;
  const isManager = roles.includes("MANAGER");
  const isHR = roles.some(r => ["SUPER_ADMIN", "HR_ADMIN", "HR_STAFF"].includes(r));
  const isSuperOrHRAdmin = roles.some(r => ["SUPER_ADMIN", "HR_ADMIN"].includes(r));
  const canApprove = roles.some(r => ["SUPER_ADMIN", "HR_ADMIN", "MANAGER"].includes(r));
  const canViewAllAttendance = isSuperOrHRAdmin || isManager;

  // Excel State
  const [excelFile, setExcelFile] = useState<File | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // IP và Location mock cho check-in
  const [ipAddress] = useState("192.168.1.52");
  const [location] = useState("Văn phòng Trụ sở chính (Hà Nội)");

  // ─── Calendar date range tính toán ────────────────────────────────────────────
  const calStartDate = useMemo(() => {
    const y = calYear;
    const m = String(calMonth + 1).padStart(2, "0");
    return `${y}-${m}-01`;
  }, [calYear, calMonth]);

  const calEndDate = useMemo(() => {
    const lastDay = new Date(calYear, calMonth + 1, 0).getDate();
    const m = String(calMonth + 1).padStart(2, "0");
    return `${calYear}-${m}-${String(lastDay).padStart(2, "0")}`;
  }, [calYear, calMonth]);

  // ─── Queries ──────────────────────────────────────────────────────────────────
  
  // Query: Lấy bảng công cá nhân (Employee)
  const { data: myLogs, isLoading: isMyLogsLoading } = useQuery({
    queryKey: ["my-attendance"],
    queryFn: () => attendanceApi.getAttendanceLogs({
      employeeId: user?.employeeId,
      size: 50
    }),
    enabled: !!user?.employeeId,
  });

  // Query: Lấy logs theo tháng cho Calendar view (Manager/HR)
  const { data: calendarLogs, isLoading: isCalendarLogsLoading } = useQuery({
    queryKey: ["calendar-attendance", calYear, calMonth, filterDeptId],
    queryFn: () => attendanceApi.getAttendanceLogs({
      startDate: calStartDate,
      endDate: calEndDate,
      departmentId: filterDeptId === "all" ? null : Number(filterDeptId),
      size: 1000, // Lấy đủ để render calendar
    }),
    enabled: canViewAllAttendance,
  });

  // Query: Lấy danh sách đơn sửa công chờ duyệt (Manager/HR)
  const { data: pendingLogs, isLoading: isPendingLoading } = useQuery({
    queryKey: ["pending-adjustments"],
    queryFn: () => attendanceApi.getAttendanceLogs({
      status: "PENDING_ADJUST",
      size: 100
    }),
    enabled: canApprove,
  });

  // Query: Danh sách phòng ban
  const { data: departments = [] } = useQuery({
    queryKey: ["flat-departments-attendance"],
    queryFn: organizationApi.getDepartments,
    enabled: canViewAllAttendance,
  });

  // ─── Calendar data grouping ───────────────────────────────────────────────────
  const calendarLogsByDate = useMemo(() => {
    const map = new Map<string, AttendanceLogResponse[]>();
    if (!calendarLogs?.content) return map;
    
    let filtered = calendarLogs.content;
    
    // Client-side filter theo tên/mã NV
    if (debouncedSearchName) {
      const q = debouncedSearchName.toLowerCase();
      filtered = filtered.filter(log =>
        log.employeeName.toLowerCase().includes(q) ||
        log.employeeCode.toLowerCase().includes(q)
      );
    }
    
    // Client-side filter theo status
    if (filterStatus !== "all") {
      filtered = filtered.filter(log => log.status === filterStatus);
    }
    
    for (const log of filtered) {
      const key = log.workDate; // yyyy-MM-dd
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(log);
    }
    return map;
  }, [calendarLogs, debouncedSearchName, filterStatus]);

  // Thống kê tổng tháng
  const monthStats = useMemo(() => {
    const allLogs = calendarLogs?.content || [];
    let filtered = allLogs;
    
    if (debouncedSearchName) {
      const q = debouncedSearchName.toLowerCase();
      filtered = filtered.filter(log =>
        log.employeeName.toLowerCase().includes(q) ||
        log.employeeCode.toLowerCase().includes(q)
      );
    }

    return {
      total: filtered.length,
      onTime: filtered.filter(l => l.status === "ON_TIME").length,
      late: filtered.filter(l => l.status === "LATE").length,
      absent: filtered.filter(l => l.status === "ABSENT").length,
      earlyLeave: filtered.filter(l => l.status === "EARLY_LEAVE").length,
      pending: filtered.filter(l => l.status === "PENDING_ADJUST").length,
      uniqueEmployees: new Set(filtered.map(l => l.employeeId)).size,
    };
  }, [calendarLogs, debouncedSearchName]);

  // Calendar grid
  const calendarDays = useMemo(() => getCalendarDays(calYear, calMonth), [calYear, calMonth]);

  // ─── Mutations ────────────────────────────────────────────────────────────────

  // Mutation: Chấm công (Single-button)
  const checkMutation = useMutation({
    mutationFn: attendanceApi.check,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["my-attendance"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-attendance"] });
      toast.success(
        data.checkCount === 1 
          ? "Check-in thành công!" 
          : `Ghi nhận lần check thứ ${data.checkCount} thành công!`
      );
    },
    onError: (error: any) => {
      toast.error(error.message || "Chấm công thất bại!");
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
      queryClient.invalidateQueries({ queryKey: ["calendar-attendance"] });
      queryClient.invalidateQueries({ queryKey: ["my-attendance"] });
      toast.success(variables.approve ? "Đã duyệt điều chỉnh công!" : "Đã từ chối điều chỉnh!");
      setIsConfirmDialogOpen(false);
      setConfirmAction(null);
      setApproveDetailLog(null);
      setRejectReason("");
    },
    onError: (error: any) => {
      toast.error(error.message || "Thao tác thất bại!");
    }
  });

  // Mutation: Import Excel
  const importMutation = useMutation({
    mutationFn: attendanceApi.importAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-attendance"] });
      toast.success("Import Excel chấm công thành công!");
      setExcelFile(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Import thất bại!");
    }
  });

  // ─── Handlers ─────────────────────────────────────────────────────────────────

  const resetAdjustForm = () => {
    setAdjustDate("");
    setAdjustIn("");
    setAdjustOut("");
    setAdjustNote("");
  };

  const handleCheck = () => {
    checkMutation.mutate({
      ipAddress,
      location,
      note: "Web Chấm công"
    });
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

  // Calendar navigation
  const goToPrevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear(y => y - 1);
    } else {
      setCalMonth(m => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear(y => y + 1);
    } else {
      setCalMonth(m => m + 1);
    }
  };

  const goToToday = () => {
    const n = new Date();
    setCalMonth(n.getMonth());
    setCalYear(n.getFullYear());
  };

  const handleDayClick = (date: Date, logs: AttendanceLogResponse[]) => {
    setSelectedDayDate(date);
    setSelectedDayLogs(logs);
  };

  const handleApproveAction = (id: number, approve: boolean) => {
    setConfirmAction({ id, approve });
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmApproval = () => {
    if (!confirmAction) return;
    approveMutation.mutate(confirmAction);
  };

  // Xác định log hôm nay để disable nút
  const todayLog = myLogs?.content.find(log => log.workDate === LocalDate.now().toString());

  const pendingCount = pendingLogs?.content.length || 0;

  // ═══════════════════════════════════════════════════════════════════════════════
  // ─── RENDER ───────────────────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════════
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
          {canViewAllAttendance && <TabsTrigger value="calendar-view" className="flex items-center gap-1.5"><CalendarDays size={14} />Bảng công</TabsTrigger>}
          {canApprove && (
            <TabsTrigger value="approve-adjust" className="flex items-center gap-1.5">
              Duyệt yêu cầu
              {pendingCount > 0 && (
                <span className="bg-orange-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
          )}
          {isSuperOrHRAdmin && <TabsTrigger value="import-excel">Import dữ liệu</TabsTrigger>}
        </TabsList>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* Tab 1: Cá nhân */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
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

              {/* Nút Chấm công duy nhất */}
              <div className="w-full pt-2">
                <Button 
                  onClick={handleCheck} 
                  disabled={checkMutation.isPending}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white flex items-center justify-center gap-2 h-12 rounded-xl shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  {checkMutation.isPending ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Fingerprint size={16} />
                  )}
                  Chấm công ngay
                </Button>
              </div>

              {todayLog && (
                <div className="text-xs text-muted-foreground w-full space-y-2 bg-muted/30 border rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span>Số lần đã chấm hôm nay:</span>
                    <span className="font-bold text-foreground bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[10px]">
                      {todayLog.checkCount || 1} lần
                    </span>
                  </div>
                  <div className="h-px bg-border/50 my-1" />
                  <div className="space-y-1 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Check-in:</span>
                      <span className="font-bold text-foreground">
                        {todayLog.checkIn ? new Date(todayLog.checkIn).toLocaleTimeString("vi-VN") : "—"}
                      </span>
                    </div>
                    {todayLog.checkCount && todayLog.checkCount > 1 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Check-out (lần cuối):</span>
                        <span className="font-bold text-emerald-600">
                          {todayLog.checkOut ? new Date(todayLog.checkOut).toLocaleTimeString("vi-VN") : "—"}
                        </span>
                      </div>
                    )}
                  </div>
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
                      <TableHead className="w-[80px] text-right">Chi tiết</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myLogs.content.map((log) => (
                      <TableRow 
                        key={log.id} 
                        className="hover:bg-muted/40 cursor-pointer transition-colors"
                        onClick={() => setViewDetailLog(log)}
                      >
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
                        <TableCell className="text-right" onClick={(e) => { e.stopPropagation(); setViewDetailLog(log); }}>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary rounded-full">
                            <Eye size={14} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* Tab 2: Bảng công dạng Calendar */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {canViewAllAttendance && (
          <TabsContent value="calendar-view">
            {/* Thanh thống kê tháng */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-4">
              <Card className="shadow-sm">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users size={18} className="text-primary" />
                  </div>
                  <div>
                    <div className="text-lg font-bold">{monthStats.uniqueEmployees}</div>
                    <div className="text-[10px] text-muted-foreground">Nhân viên</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center">
                    <CalendarIcon size={18} className="text-muted-foreground" />
                  </div>
                  <div>
                    <div className="text-lg font-bold">{monthStats.total}</div>
                    <div className="text-[10px] text-muted-foreground">Tổng lượt</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle2 size={18} className="text-emerald-500" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-emerald-600">{monthStats.onTime}</div>
                    <div className="text-[10px] text-muted-foreground">Đúng giờ</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <AlertTriangle size={18} className="text-amber-500" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-amber-600">{monthStats.late}</div>
                    <div className="text-[10px] text-muted-foreground">Đi muộn</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <XCircle size={18} className="text-red-500" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-red-600">{monthStats.absent}</div>
                    <div className="text-[10px] text-muted-foreground">Vắng mặt</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Clock size={18} className="text-blue-500" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-blue-600">{monthStats.earlyLeave}</div>
                    <div className="text-[10px] text-muted-foreground">Về sớm</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <AlertTriangle size={18} className="text-orange-500" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-orange-600">{monthStats.pending}</div>
                    <div className="text-[10px] text-muted-foreground">Chờ duyệt</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-sm">
              <CardHeader className="flex flex-col md:flex-row md:items-center justify-between space-y-3 md:space-y-0 gap-4 pb-4">
                {/* Điều hướng tháng */}
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={goToPrevMonth}>
                    <ChevronLeft size={16} />
                  </Button>
                  <div className="text-center min-w-[160px]">
                    <h3 className="text-lg font-bold text-foreground">
                      {MONTH_NAMES[calMonth]} {calYear}
                    </h3>
                  </div>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={goToNextMonth}>
                    <ChevronRight size={16} />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs h-8" onClick={goToToday}>
                    Hôm nay
                  </Button>
                </div>
                
                {/* Bộ lọc */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative w-full md:max-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input 
                      placeholder="Tìm tên, mã NV..." 
                      value={searchName}
                      onChange={(e) => setSearchName(e.target.value)}
                      className="pl-9 bg-background h-8 text-xs"
                    />
                  </div>

                  <Select value={filterDeptId} onValueChange={setFilterDeptId}>
                    <SelectTrigger className="h-8 w-[170px] text-xs">
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
                    <SelectTrigger className="h-8 w-[150px] text-xs">
                      <SelectValue placeholder="Trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      {Object.keys(STATUS_LABELS).map(k => (
                        <SelectItem key={k} value={k}>{STATUS_LABELS[k]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {isCalendarLogsLoading ? (
                  <div className="flex justify-center py-16">
                    <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    {/* Header: Thứ trong tuần */}
                    <div className="grid grid-cols-7 border-b border-border bg-muted/30">
                      {WEEKDAY_NAMES.map((day, i) => (
                        <div 
                          key={day} 
                          className={`text-center py-2 text-xs font-semibold ${i === 0 || i === 6 ? "text-red-400" : "text-muted-foreground"}`}
                        >
                          {day}
                        </div>
                      ))}
                    </div>
                    
                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7">
                      {calendarDays.map((dayInfo, idx) => {
                        const dateKey = formatDateKey(dayInfo.date);
                        const dayLogs = calendarLogsByDate.get(dateKey) || [];
                        return (
                          <CalendarDayCell
                            key={idx}
                            date={dayInfo.date}
                            isCurrentMonth={dayInfo.isCurrentMonth}
                            logs={dayLogs}
                            onClickDay={handleDayClick}
                          />
                        );
                      })}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-3 px-1">
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <div key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT_COLORS[key]}`} />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </TabsContent>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* Tab 3: Duyệt yêu cầu điều chỉnh ───────────────────────────────────── */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {canApprove && (
          <TabsContent value="approve-adjust">
            <Card className="shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <UserCheck size={20} className="text-orange-500" />
                      Yêu cầu điều chỉnh công
                    </CardTitle>
                    <CardDescription>Xét duyệt các đơn xin điều chỉnh giờ check-in/check-out của nhân sự.</CardDescription>
                  </div>
                  {pendingCount > 0 && (
                    <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/30 text-sm px-3 py-1">
                      {pendingCount} đơn chờ duyệt
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isPendingLoading ? (
                  <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>
                ) : !pendingLogs || pendingLogs.content.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <CheckCircle2 size={48} className="text-emerald-400 mb-3" />
                    <div className="font-semibold text-foreground mb-1">Không có đơn nào chờ duyệt</div>
                    <div className="text-sm italic">Tất cả yêu cầu điều chỉnh công đã được xử lý.</div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingLogs.content.map((log) => (
                      <div 
                        key={log.id} 
                        className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border rounded-xl hover:shadow-sm transition-all bg-card hover:bg-accent/20 gap-4"
                      >
                        {/* Thông tin nhân viên */}
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
                            <UserCheck size={18} className="text-orange-500" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm text-foreground">{log.employeeName}</span>
                              <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">{log.employeeCode}</span>
                              {log.departmentName && (
                                <span className="text-[10px] text-muted-foreground">• {log.departmentName}</span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              Ngày cần sửa: <span className="font-semibold text-foreground">
                                {new Date(log.workDate).toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })}
                              </span>
                            </div>
                            <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                              <span>
                                Check-in đề xuất: <span className="font-mono font-semibold text-foreground">
                                  {log.checkIn ? new Date(log.checkIn).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }) : "—"}
                                </span>
                              </span>
                              <span>
                                Check-out đề xuất: <span className="font-mono font-semibold text-foreground">
                                  {log.checkOut ? new Date(log.checkOut).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }) : "—"}
                                </span>
                              </span>
                            </div>
                            {log.note && (
                              <div className="text-xs text-foreground/80 mt-1.5 bg-muted/40 px-2.5 py-1.5 rounded-lg border border-border/50 italic">
                                "{log.note}"
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Nút hành động */}
                        <div className="flex items-center gap-2 shrink-0">
                          <Button 
                            size="sm" 
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 px-4 flex items-center gap-1.5"
                            onClick={() => handleApproveAction(log.id, true)}
                            disabled={approveMutation.isPending}
                          >
                            <ThumbsUp size={14} />
                            Duyệt
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            className="text-xs h-9 px-4 flex items-center gap-1.5"
                            onClick={() => handleApproveAction(log.id, false)}
                            disabled={approveMutation.isPending}
                          >
                            <ThumbsDown size={14} />
                            Từ chối
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* Tab 4: Import Excel chấm công */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
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

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* Dialog: Chi tiết chấm công 1 ngày (click từ Calendar) ─────────────────── */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      <Dialog open={!!selectedDayLogs} onOpenChange={(open) => { if (!open) { setSelectedDayLogs(null); setSelectedDayDate(null); } }}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon size={18} className="text-primary" />
              Chi tiết chấm công ngày {selectedDayDate?.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })}
            </DialogTitle>
            <DialogDescription>
              {selectedDayLogs?.length || 0} bản ghi chấm công
            </DialogDescription>
          </DialogHeader>
          
          {selectedDayLogs && selectedDayLogs.length > 0 && (
            <>
              {/* Thống kê nhanh */}
              <div className="flex gap-3 flex-wrap mb-2">
                {(() => {
                  const stats = {
                    onTime: selectedDayLogs.filter(l => l.status === "ON_TIME").length,
                    late: selectedDayLogs.filter(l => l.status === "LATE").length,
                    absent: selectedDayLogs.filter(l => l.status === "ABSENT").length,
                    earlyLeave: selectedDayLogs.filter(l => l.status === "EARLY_LEAVE").length,
                    pending: selectedDayLogs.filter(l => l.status === "PENDING_ADJUST").length,
                  };
                  return (
                    <>
                      {stats.onTime > 0 && (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                          <CheckCircle2 size={12} className="mr-1" /> {stats.onTime} đúng giờ
                        </Badge>
                      )}
                      {stats.late > 0 && (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                          <AlertTriangle size={12} className="mr-1" /> {stats.late} đi muộn
                        </Badge>
                      )}
                      {stats.absent > 0 && (
                        <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
                          <XCircle size={12} className="mr-1" /> {stats.absent} vắng mặt
                        </Badge>
                      )}
                      {stats.earlyLeave > 0 && (
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                          <Clock size={12} className="mr-1" /> {stats.earlyLeave} về sớm
                        </Badge>
                      )}
                      {stats.pending > 0 && (
                        <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20 animate-pulse">
                          <AlertTriangle size={12} className="mr-1" /> {stats.pending} chờ duyệt
                        </Badge>
                      )}
                    </>
                  );
                })()}
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nhân viên</TableHead>
                    <TableHead>Phòng ban</TableHead>
                    <TableHead>Check-in</TableHead>
                    <TableHead>Check-out</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ghi chú</TableHead>
                    <TableHead className="w-[80px] text-right">Chi tiết</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedDayLogs.map((log) => (
                    <TableRow 
                      key={log.id} 
                      className="hover:bg-muted/40 cursor-pointer transition-colors"
                      onClick={() => setViewDetailLog(log)}
                    >
                      <TableCell>
                        <div className="text-sm font-semibold">{log.employeeName}</div>
                        <span className="text-[10px] text-muted-foreground font-mono">{log.employeeCode}</span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {log.departmentName || "—"}
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
                      <TableCell className="text-xs text-muted-foreground italic truncate max-w-[120px]" title={log.note || ""}>
                        {log.note || "—"}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => { e.stopPropagation(); setViewDetailLog(log); }}>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary rounded-full">
                          <Eye size={14} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* Dialog: Chi tiết bản ghi chấm công (Click xem chi tiết từ các bảng) ────── */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      <Dialog open={!!viewDetailLog} onOpenChange={(open) => { if (!open) setViewDetailLog(null); }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Info size={20} className="text-primary" />
              Chi tiết bản ghi chấm công
            </DialogTitle>
            <DialogDescription>
              Thông tin chi tiết lượt chấm công ngày {viewDetailLog ? new Date(viewDetailLog.workDate).toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" }) : ""}
            </DialogDescription>
          </DialogHeader>

          {viewDetailLog && (
            <div className="space-y-6 py-2">
              {/* Thông tin nhân viên */}
              <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl border border-border/50">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                  {viewDetailLog.employeeName.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-sm text-foreground flex items-center gap-2">
                    {viewDetailLog.employeeName}
                    <Badge variant="outline" className="text-[9px] font-mono py-0 px-1">{viewDetailLog.employeeCode}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {viewDetailLog.departmentName || "Không rõ phòng ban"}
                  </div>
                </div>
              </div>

              {/* Chi tiết chấm công Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Check-in */}
                <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                    <Clock size={14} />
                    <span>Check-in</span>
                  </div>
                  <div className="text-lg font-bold font-mono text-emerald-700">
                    {viewDetailLog.checkIn ? new Date(viewDetailLog.checkIn).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : "—"}
                  </div>
                  <div className="text-[10px] text-muted-foreground space-y-0.5">
                    <p className="truncate">IP: {viewDetailLog.checkInIp || "—"}</p>
                    <p className="truncate">Vị trí: {viewDetailLog.checkInLocation || "—"}</p>
                  </div>
                </div>

                {/* Check-out */}
                <div className="p-3 bg-blue-500/5 rounded-xl border border-blue-500/10 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold">
                    <Clock size={14} />
                    <span>Check-out</span>
                  </div>
                  <div className="text-lg font-bold font-mono text-blue-700">
                    {viewDetailLog.checkOut ? new Date(viewDetailLog.checkOut).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : "—"}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    <p>Lượt chấm: <span className="font-bold text-foreground">{viewDetailLog.checkCount || "—"} lần</span></p>
                  </div>
                </div>
              </div>

              {/* Thông tin thêm */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs py-1 border-b">
                  <span className="text-muted-foreground">Trạng thái công</span>
                  <Badge variant="outline" className={`text-[10px] font-semibold ${STATUS_BADGES[viewDetailLog.status] || ""}`}>
                    {STATUS_LABELS[viewDetailLog.status] || viewDetailLog.status}
                  </Badge>
                </div>

                {viewDetailLog.approvedByName && (
                  <div className="flex justify-between items-center text-xs py-1 border-b">
                    <span className="text-muted-foreground">Người phê duyệt</span>
                    <span className="font-medium text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 size={12} />
                      {viewDetailLog.approvedByName}
                    </span>
                  </div>
                )}

                <div className="space-y-1 text-xs">
                  <span className="text-muted-foreground">Ghi chú nhật ký</span>
                  <p className="p-2.5 bg-muted/30 rounded-lg border text-foreground/80 italic text-xs leading-relaxed">
                    {viewDetailLog.note || "Không có ghi chú nào cho ngày này."}
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button onClick={() => setViewDetailLog(null)} className="w-24">Đóng</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* Dialog: Xác nhận Duyệt/Từ chối ──────────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {confirmAction?.approve ? (
                <><ThumbsUp size={18} className="text-emerald-500" /> Xác nhận phê duyệt</>
              ) : (
                <><ThumbsDown size={18} className="text-red-500" /> Xác nhận từ chối</>
              )}
            </DialogTitle>
            <DialogDescription>
              {confirmAction?.approve 
                ? "Bạn có chắc chắn muốn PHÊ DUYỆT yêu cầu điều chỉnh công này? Giờ check-in/out sẽ được cập nhật theo đề xuất." 
                : "Bạn có chắc chắn muốn TỪ CHỐI yêu cầu điều chỉnh công này?"}
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => { setIsConfirmDialogOpen(false); setConfirmAction(null); }}
            >
              Hủy
            </Button>
            <Button 
              onClick={handleConfirmApproval}
              disabled={approveMutation.isPending}
              className={confirmAction?.approve ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}
              variant={confirmAction?.approve ? "default" : "destructive"}
            >
              {approveMutation.isPending && <Loader2 size={16} className="animate-spin mr-2" />}
              {confirmAction?.approve ? "Phê duyệt" : "Từ chối"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* Dialog Sửa Công (Employee gửi yêu cầu) ─────────────────────────────────  */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
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
