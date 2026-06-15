import React from "react";
import { useQuery } from "@tanstack/react-query";
import { reportApi, type DashboardReportResponse, type EmployeeDashboardResponse } from "../api/reportApi";
import { usePermission } from "../../../hooks/usePermission";
import {
  Users,
  Briefcase,
  FileText,
  DollarSign,
  TrendingUp,
  Activity,
  BarChart3,
  CalendarClock,
  Clock,
  AlertCircle,
  ArrowRight
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
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const DONUT_COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899", "#06b6d4"];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name?: string; value: number; color?: string; fill?: string }>;
  label?: string;
  valueFormatter?: (value: number) => string;
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
          {payload.map((item, index: number) => {
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
  const isEmployee = userRoles.includes("EMPLOYEE");

  const { data: report, isLoading } = useQuery<DashboardReportResponse>({
    queryKey: ["dashboard-report"],
    queryFn: reportApi.getDashboardReport,
  });

  const { data: employeeDashboard, isLoading: isEmployeeDashboardLoading } = useQuery<EmployeeDashboardResponse>({
    queryKey: ["employee-dashboard"],
    queryFn: reportApi.getEmployeeDashboard,
    enabled: isEmployee,
  });

  const formatCurrency = (val?: number | { _value?: number }) => {
    const num = typeof val === 'number' ? val : (typeof val === 'object' && val?._value ? val._value : 0);
    if (!num) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(Number(num));
  };

  if (isLoading || (isEmployee && isEmployeeDashboardLoading)) {
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

  // Chart data mapping
  const headcountData = report?.deptHeadcounts || [];
  const payrollTrendData = report?.monthlyPayrolls || [];
  const attendanceStats = report?.deptAttendanceStats || [];
  const recruitmentFunnel = report?.recruitmentFunnels || [];
  const recruitmentSource = report?.recruitmentSources || [];

  // ==================== HR/ADMIN Dashboard ====================
  if (isHR && !isManager && !isRecruiter && !isEmployee) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto p-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Xin chào, {user?.fullName || user?.username}!
            </h1>
            <p className="text-muted-foreground mt-1">
              Bộ phận Nhân sự - Quản lý toàn bộ hoạt động nhân sự, tuyển dụng và lương.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-card border border-border px-3 py-1.5 rounded-lg text-xs text-muted-foreground">
            <Activity className="h-4 w-4 text-emerald-500 animate-pulse" />
            <span>{userRoles.join(" / ")}</span>
          </div>
        </div>

        {/* KPI Cards - HR Focused */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Tổng nhân viên</CardTitle>
              <Users className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{totalEmployees}</div>
              <p className="text-[10px] text-muted-foreground mt-1">Đang hoạt động</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Vị trí mở tuyển</CardTitle>
              <Briefcase className="h-5 w-5 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{activeJobs}</div>
              <p className="text-[10px] text-muted-foreground mt-1">Chiến dịch hoạt động</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Hồ sơ CV</CardTitle>
              <FileText className="h-5 w-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{totalApplications}</div>
              <p className="text-[10px] text-muted-foreground mt-1">Tổng nộp</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Chi phí lương tháng</CardTitle>
              <DollarSign className="h-5 w-5 text-teal-500" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-foreground truncate">{formatCurrency(currentMonthPayrollCost)}</div>
              <p className="text-[10px] text-muted-foreground mt-1">Quỹ net</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Dept Headcount */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-1.5">
                <Users className="h-5 w-5 text-primary" /> Cơ cấu nhân sự theo Phòng ban
              </CardTitle>
              <CardDescription>
                Thống kê số lượng nhân viên đang làm việc tại các bộ phận.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {headcountData.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">Chưa có dữ liệu</div>
              ) : (
                <div className="h-72 w-full">
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

          {/* Cost Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-1.5">
                <TrendingUp className="h-5 w-5 text-teal-500" /> Xu hướng chi phí quỹ lương
              </CardTitle>
              <CardDescription>
                Biểu đồ quỹ lương Net qua các kỳ lương tháng.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {payrollTrendData.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">Chưa có dữ liệu (chờ bảng lương Publish)</div>
              ) : (
                <div className="h-72 w-full">
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

          {/* Recruitment Funnel */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-1.5">
                <BarChart3 className="h-5 w-5 text-purple-500" /> Phễu tuyển dụng
              </CardTitle>
              <CardDescription>
                Phân bổ ứng viên theo giai đoạn tuyển dụng.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recruitmentFunnel.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">Chưa có dữ liệu</div>
              ) : (
                <div className="h-72 w-full">
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

          {/* Recruitment Source */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-1.5">
                <Activity className="h-5 w-5 text-amber-500" /> Nguồn ứng viên
              </CardTitle>
              <CardDescription>
                Tỉ lệ hồ sơ từ các nguồn đăng tuyển.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recruitmentSource.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">Chưa có dữ liệu</div>
              ) : (
                <div className="h-72 w-full flex flex-col md:flex-row items-center justify-between">
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
                        <span className="text-foreground font-bold">{src.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ==================== RECRUITER Dashboard ====================
  if (isRecruiter && !isHR && !isManager && !isEmployee) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto p-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Xin chào, {user?.fullName || user?.username}!
            </h1>
            <p className="text-muted-foreground mt-1">
              Chuyên viên Tuyển dụng - Theo dõi quy trình tuyển dụng và quản lý ứng viên.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-card border border-border px-3 py-1.5 rounded-lg text-xs text-muted-foreground">
            <Briefcase className="h-4 w-4 text-emerald-500 animate-pulse" />
            <span>Chuyên viên Tuyển dụng</span>
          </div>
        </div>

        {/* KPI Cards - Recruiter Focused */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Vị trí mở tuyển</CardTitle>
              <Briefcase className="h-5 w-5 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{activeJobs}</div>
              <p className="text-[10px] text-muted-foreground mt-1">Đang tuyển</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Hồ sơ CV</CardTitle>
              <FileText className="h-5 w-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{totalApplications}</div>
              <p className="text-[10px] text-muted-foreground mt-1">Tổng nộp</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Hồ sơ mới</CardTitle>
              <AlertCircle className="h-5 w-5 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {recruitmentFunnel.find(f => f.stage === "NEW")?.count || 0}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Cần xử lý</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Recruitment Funnel */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-1.5">
                <BarChart3 className="h-5 w-5 text-purple-500" /> Phễu tuyển dụng
              </CardTitle>
              <CardDescription>
                Phân bổ ứng viên theo giai đoạn tuyển dụng.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recruitmentFunnel.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">Chưa có dữ liệu ứng viên</div>
              ) : (
                <div className="h-72 w-full">
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

          {/* Recruitment Source */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-1.5">
                <Activity className="h-5 w-5 text-amber-500" /> Nguồn ứng viên
              </CardTitle>
              <CardDescription>
                Tỉ lệ hồ sơ từ các nguồn đăng tuyển.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recruitmentSource.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">Chưa có dữ liệu</div>
              ) : (
                <div className="h-72 w-full flex flex-col md:flex-row items-center justify-between">
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
                        <span className="text-foreground font-bold">{src.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ==================== MANAGER Dashboard ====================
  if (isManager) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto p-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Xin chào, {user?.fullName || user?.username}!
            </h1>
            <p className="text-muted-foreground mt-1">
              Trưởng phòng - Quản lý bộ phận, phê duyệt yêu cầu và theo dõi hiệu suất nhân viên.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-card border border-border px-3 py-1.5 rounded-lg text-xs text-muted-foreground">
            <Users className="h-4 w-4 text-blue-500 animate-pulse" />
            <span>Trưởng phòng / Quản lý</span>
          </div>
        </div>

        {/* Attendance Stats - Manager Priority */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-1.5">
              <CalendarClock className="h-5 w-5 text-amber-500" /> Báo cáo Điểm danh Team tháng này
            </CardTitle>
            <CardDescription>
              Top 5 nhân viên đi muộn/vắng mặt - cần theo dõi gần gũi.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {attendanceStats.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm flex flex-col items-center gap-2">
                <AlertCircle className="h-8 w-8 text-emerald-500" />
                <span>Tuyệt vời! Team của bạn có ghi nhận đi muộn/vắng. Không có cảnh báo cần hành động.</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground font-medium">Nhân viên</TableHead>
                      <TableHead className="text-muted-foreground font-medium text-center">Đi muộn</TableHead>
                      <TableHead className="text-muted-foreground font-medium text-center">Vắng mặt</TableHead>
                      <TableHead className="text-muted-foreground font-medium">Cảnh báo</TableHead>
                      <TableHead className="text-muted-foreground font-medium text-center">Hành động</TableHead>
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
                            <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20">
                              <AlertCircle className="h-3 w-3 mr-1" /> Cần hành động
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Bình thường</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button variant="ghost" size="sm" className="h-7 px-2">
                            <ArrowRight className="h-3 w-3" />
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

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold">Hành động nhanh</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              <Button variant="outline" className="h-auto flex flex-col items-center gap-2 py-4">
                <FileText className="h-5 w-5" />
                <span className="text-xs">Phê duyệt Đơn Xin Nghỉ</span>
              </Button>
              <Button variant="outline" className="h-auto flex flex-col items-center gap-2 py-4">
                <Users className="h-5 w-5" />
                <span className="text-xs">Xem Đánh Giá Hiệu Suất</span>
              </Button>
              <Button variant="outline" className="h-auto flex flex-col items-center gap-2 py-4">
                <Clock className="h-5 w-5" />
                <span className="text-xs">Điều Chỉnh Điểm Danh</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ==================== EMPLOYEE Dashboard ====================
  if (isEmployee) {
    const remaining = employeeDashboard?.remainingLeaveDays ?? 0;
    const used = employeeDashboard?.usedLeaveDays ?? 0;
    const total = employeeDashboard?.totalLeaveDays ?? 0;
    const usedPct = total > 0 ? Math.round((used / total) * 100) : 0;
    const workDays = employeeDashboard?.currentMonthWorkDays ?? 0;
    const stdDays = employeeDashboard?.standardWorkDays ?? 22;
    const lateCount = employeeDashboard?.currentMonthLateCount ?? 0;
    const absentCount = employeeDashboard?.currentMonthAbsentCount ?? 0;
    const pendingLeave = employeeDashboard?.pendingLeaveRequests ?? 0;
    const pendingAttendance = employeeDashboard?.pendingAttendanceAdjustments ?? 0;
    const latestPayslip = employeeDashboard?.latestPayslip ?? null;
    const totalPending = pendingLeave + pendingAttendance;

    return (
      <div className="space-y-6 max-w-7xl mx-auto p-4">
        {/* Header - đồng bộ style với HR/Manager */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Xin chào, {user?.fullName || user?.username}!
            </h1>
            <p className="text-muted-foreground mt-1">
              Trang cá nhân — Theo dõi điểm danh, ngày phép, lương và hiệu suất làm việc của bạn.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-card border border-border px-3 py-1.5 rounded-lg text-xs text-muted-foreground">
            <Activity className="h-4 w-4 text-blue-500 animate-pulse" />
            <span>Nhân viên</span>
          </div>
        </div>

        {/* KPI Cards - đồng bộ với HR/Recruiter (header row, icon, text size) */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Phép còn lại */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Phép còn lại</CardTitle>
              <FileText className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{remaining} <span className="text-sm font-normal text-muted-foreground">ngày</span></div>
              <div className="mt-2 w-full bg-muted h-1.5 rounded-full overflow-hidden">
                <div className="bg-primary h-full transition-all" style={{ width: `${Math.min(usedPct, 100)}%` }} />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Đã dùng {used}/{total} ngày năm nay</p>
            </CardContent>
          </Card>

          {/* Ngày công tháng này */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Ngày công tháng này</CardTitle>
              <CalendarClock className="h-5 w-5 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{workDays}<span className="text-sm font-normal text-muted-foreground">/{stdDays}</span></div>
              <p className="text-[10px] text-muted-foreground mt-1">Ngày đi làm thực tế</p>
            </CardContent>
          </Card>

          {/* Lương tháng gần nhất */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Lương tháng gần nhất</CardTitle>
              <DollarSign className="h-5 w-5 text-teal-500" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-foreground truncate">
                {latestPayslip ? formatCurrency(latestPayslip.netSalary) : "—"}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                {latestPayslip ? `Kỳ ${latestPayslip.month}/${latestPayslip.year}` : "Chưa có phiếu lương"}
              </p>
            </CardContent>
          </Card>

          {/* Yêu cầu đang chờ */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Yêu cầu chờ duyệt</CardTitle>
              <AlertCircle className={`h-5 w-5 ${totalPending > 0 ? "text-amber-500" : "text-muted-foreground"}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totalPending > 0 ? "text-amber-500" : "text-foreground"}`}>{totalPending}</div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Phép: {pendingLeave} · Công: {pendingAttendance}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Grid: Điểm danh chi tiết + Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Điểm danh tháng chi tiết */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-1.5">
                <CalendarClock className="h-5 w-5 text-amber-500" /> Điểm danh tháng này
              </CardTitle>
              <CardDescription>Thống kê chi tiết chấm công trong tháng hiện tại.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Ngày đi làm thực tế</span>
                  <span className="font-bold text-foreground">{workDays} / {stdDays} ngày</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Số lần đi muộn</span>
                  <Badge className={lateCount > 0 ? "bg-amber-500/10 text-amber-600 border-amber-500/20" : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"}>
                    {lateCount} lần
                  </Badge>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Số lần vắng mặt</span>
                  <Badge className={absentCount > 0 ? "bg-rose-500/10 text-rose-600 border-rose-500/20" : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"}>
                    {absentCount} lần
                  </Badge>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">Yêu cầu điều chỉnh đang chờ</span>
                  {pendingAttendance > 0 ? (
                    <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">{pendingAttendance} đơn</Badge>
                  ) : (
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Không có</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-1.5">
                <ArrowRight className="h-5 w-5 text-primary" /> Thao tác nhanh
              </CardTitle>
              <CardDescription>Các hành động thường dùng hàng ngày.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                <Button variant="outline" className="h-auto flex flex-col items-start gap-1.5 py-3 px-4 text-left">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm font-medium">Chấm công</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Check-in / Check-out hôm nay</span>
                </Button>
                <Button variant="outline" className="h-auto flex flex-col items-start gap-1.5 py-3 px-4 text-left relative">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Đơn xin nghỉ</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Tạo hoặc xem tiến độ đơn</span>
                  {pendingLeave > 0 && (
                    <span className="absolute top-2 right-2 h-4 w-4 rounded-full bg-amber-500 text-white text-[9px] flex items-center justify-center font-bold">{pendingLeave}</span>
                  )}
                </Button>
                <Button variant="outline" className="h-auto flex flex-col items-start gap-1.5 py-3 px-4 text-left">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-teal-500" />
                    <span className="text-sm font-medium">Phiếu lương</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Xem & tải phiếu lương</span>
                </Button>
                <Button variant="outline" className="h-auto flex flex-col items-start gap-1.5 py-3 px-4 text-left">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">Đánh giá hiệu suất</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">Xem kết quả đánh giá của bạn</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Fallback - không có role phù hợp
  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <Card>
        <CardHeader>
          <CardTitle>Không tìm thấy Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Vai trò của bạn chưa được cấu hình trên Dashboard. Vui lòng liên hệ quản trị viên.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;
