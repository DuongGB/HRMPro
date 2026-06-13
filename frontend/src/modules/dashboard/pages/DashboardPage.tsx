import React from "react";
import { useQuery } from "@tanstack/react-query";
import { reportApi, type DashboardReportResponse } from "../api/reportApi";
import { usePermission } from "../../../hooks/usePermission";
import {
  Users,
  Briefcase,
  FileText,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Activity,
  BarChart3,
  CalendarClock
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

const DONUT_COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899", "#06b6d4"];

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  valueFormatter?: (value: any) => string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, valueFormatter }) => {
  if (active && payload && payload.length) {
    const isPie = !label || typeof label === "number";
    const tooltipLabel = isPie ? null : label;

    return (
      <div className="bg-popover/95 text-popover-foreground border border-border/80 backdrop-blur-md p-3 rounded-lg shadow-xl text-xs space-y-1.5 min-w-[140px] transition-all duration-200">
        {tooltipLabel && (
          <p className="font-bold border-b border-border/60 pb-1 mb-1 text-foreground">
            {tooltipLabel}
          </p>
        )}
        <div className="space-y-1">
          {payload.map((item: any, index: number) => {
            const val = valueFormatter ? valueFormatter(item.value) : item.value;
            return (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: item.color || item.fill || "hsl(var(--primary))" }}
                  />
                  <span className="text-muted-foreground">{item.name || "Giá trị"}:</span>
                </div>
                <span className="font-bold text-foreground">{val}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

const DashboardPage: React.FC = () => {
  const { user, userRoles } = usePermission();

  const isHR = userRoles.some(r => ["SUPER_ADMIN", "HR_ADMIN", "HR_STAFF"].includes(r));
  const isManager = userRoles.includes("MANAGER");
  const isRecruiter = userRoles.includes("RECRUITER");

  const { data: report, isLoading } = useQuery<DashboardReportResponse>({
    queryKey: ["dashboard-report"],
    queryFn: reportApi.getDashboardReport,
  });

  const formatCurrency = (val?: number) => {
    if (!val) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="ml-2 text-gray-400">Đang tải dữ liệu báo cáo thống kê...</span>
      </div>
    );
  }

  // Fallback data if API returns null structure
  const totalEmployees = report?.totalEmployees ?? 0;
  const activeJobs = report?.activeJobs ?? 0;
  const totalApplications = report?.totalApplications ?? 0;
  const currentMonthPayrollCost = report?.currentMonthPayrollCost ?? 0;
  const turnoverRate = report?.turnoverRate ?? 0.0;

  // Chart data mapping
  const headcountData = report?.deptHeadcounts || [];
  const payrollTrendData = report?.monthlyPayrolls || [];
  const attendanceStats = report?.deptAttendanceStats || [];
  const recruitmentFunnel = report?.recruitmentFunnels || [];
  const recruitmentSource = report?.recruitmentSources || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4">
      {/* Greetings */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Xin chào, {(user as any)?.fullName || user?.username}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Chào mừng bạn quay trở lại với Hệ thống Quản lý Nhân sự HRMPro. Dưới đây là thống kê tổng quan.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-card border border-border px-3 py-1.5 rounded-lg text-xs text-muted-foreground">
          <Activity className="h-4 w-4 text-emerald-500 animate-pulse" /> Trực tuyến: {userRoles.join(" | ")}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Tổng nhân viên</CardTitle>
            <Users className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalEmployees}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Nhân viên đang hoạt động</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Chiến dịch tuyển</CardTitle>
            <Briefcase className="h-5 w-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{activeJobs}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Vị trí đang mở tuyển</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Hồ sơ ứng tuyển</CardTitle>
            <FileText className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalApplications}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Tổng số CV đã nộp</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Chi phí lương</CardTitle>
            <DollarSign className="h-5 w-5 text-teal-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-foreground truncate">{formatCurrency(currentMonthPayrollCost)}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Tổng thực nhận kỳ gần nhất</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Tỷ lệ nghỉ việc</CardTitle>
            <TrendingDown className="h-5 w-5 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{turnoverRate.toFixed(1)}%</div>
            <p className="text-[10px] text-muted-foreground mt-1">Tỉ lệ hao hụt nhân sự năm</p>
          </CardContent>
        </Card>
      </div>

      {/* Dynamic Role-Based Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* 1. CHART: Dept Headcount (HR & Admin) */}
        {isHR && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-1.5">
                <Users className="h-5 w-5 text-primary" /> Cơ cấu nhân sự theo Phòng ban
              </CardTitle>
              <CardDescription>
                Thống kê số lượng nhân viên thực tế đang làm việc tại các bộ phận.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {headcountData.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">Chưa có dữ liệu thống kê</div>
              ) : (
                <div className="h-72 w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={headcountData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="departmentName" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="headcount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Nhân viên" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 2. CHART: Cost Trend (HR & Admin) */}
        {isHR && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-1.5">
                <TrendingUp className="h-5 w-5 text-teal-500" /> Xu hướng chi phí quỹ lương
              </CardTitle>
              <CardDescription>
                Biểu đồ quỹ lương chuyển khoản Net qua các kỳ lương tháng.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {payrollTrendData.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">Chưa có dữ liệu chi phí lương (Yêu cầu bảng lương được Publish)</div>
              ) : (
                <div className="h-72 w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={payrollTrendData}>
                      <defs>
                        <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="monthYear" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                      <Tooltip content={<CustomTooltip valueFormatter={formatCurrency} />} />
                      <Area type="monotone" dataKey="totalCost" stroke="#0d9488" fill="url(#colorCost)" strokeWidth={2} name="Quỹ lương" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 3. CHART: Recruitment Funnel (HR & Recruiter) */}
        {(isHR || isRecruiter) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-1.5">
                <BarChart3 className="h-5 w-5 text-purple-500" /> Phễu trạng thái Tuyển dụng
              </CardTitle>
              <CardDescription>
                Phân bổ ứng viên theo các giai đoạn tuyển dụng hiện hành.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recruitmentFunnel.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">Chưa có dữ liệu ứng tuyển</div>
              ) : (
                <div className="h-72 w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={recruitmentFunnel}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
                      <YAxis type="category" dataKey="stageLabel" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Ứng viên" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 4. CHART: Recruitment Source (HR & Recruiter) */}
        {(isHR || isRecruiter) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-1.5">
                <Activity className="h-5 w-5 text-amber-500" /> Nguồn ứng viên ứng tuyển
              </CardTitle>
              <CardDescription>
                Tỉ lệ hồ sơ nộp về từ các nguồn đăng tuyển khác nhau.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recruitmentSource.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">Chưa có dữ liệu nguồn tuyển</div>
              ) : (
                <div className="h-72 w-full mt-2 flex flex-col md:flex-row items-center justify-between">
                  <div className="h-52 w-full md:w-3/5">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={recruitmentSource}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="count"
                          nameKey="source"
                        >
                          {recruitmentSource.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-full md:w-2/5 space-y-2 text-xs">
                    {recruitmentSource.map((src, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: DONUT_COLORS[index % DONUT_COLORS.length] }} />
                        <span className="text-muted-foreground font-semibold">{src.source}:</span>
                        <span className="text-foreground font-bold">{src.count} hồ sơ</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 5. Attendance Stats (Manager only) */}
        {isManager && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-1.5">
                <CalendarClock className="h-5 w-5 text-amber-500" /> Báo cáo đi muộn/Vắng mặt của Team trong tháng
              </CardTitle>
              <CardDescription>
                Danh sách 5 nhân sự đi muộn hoặc vắng nhiều nhất tháng hiện tại trong phòng ban quản lý.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {attendanceStats.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  Ghi nhận đi muộn của team tốt. Không có nhân viên nào bị phạt/vắng trong tháng này.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead className="text-muted-foreground font-medium">Nhân viên</TableHead>
                        <TableHead className="text-muted-foreground font-medium text-center">Số lần đi muộn</TableHead>
                        <TableHead className="text-muted-foreground font-medium text-center">Số lần vắng mặt</TableHead>
                        <TableHead className="text-muted-foreground font-medium">Trạng thái cảnh báo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendanceStats.map((stat, idx) => (
                        <TableRow key={idx} className="border-border hover:bg-muted/20">
                          <TableCell className="font-semibold text-foreground">{stat.employeeName}</TableCell>
                          <TableCell className="text-center font-bold text-amber-500">{stat.lateCount} lần</TableCell>
                          <TableCell className="text-center font-bold text-rose-500">{stat.absentCount} lần</TableCell>
                          <TableCell>
                            {stat.lateCount > 3 || stat.absentCount > 1 ? (
                              <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20">Cần nhắc nhở</Badge>
                            ) : (
                              <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Bình thường</Badge>
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
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
