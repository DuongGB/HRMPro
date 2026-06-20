import React from "react";
import { useMutation } from "@tanstack/react-query";
import { automationApi } from "../api/automationApi";
import { toast } from "sonner";
import {
  Gift,
  Briefcase,
  FileText,
  CalendarDays,
  RefreshCw,
  Info,
  Play,
  CheckCircle2,
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface JobConfig {
  id: string;
  title: string;
  description: string;
  cronExpr: string;
  cronDesc: string;
  targets: string;
  channels: string[];
  icon: React.ReactNode;
  iconBg: string;
  mutationKey: keyof typeof automationApi;
}

const SystemAutomationPage: React.FC = () => {
  // Định nghĩa các mutations cho các api tự động hóa
  const birthdayMutation = useMutation({
    mutationFn: automationApi.triggerBirthdayAnniversary,
    onSuccess: (res) => {
      toast.success(res.message || "Tác vụ chúc mừng sinh nhật & thâm niên đã hoàn tất!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Không thể kích hoạt tác vụ.");
    },
  });

  const jobsMutation = useMutation({
    mutationFn: automationApi.triggerCloseExpiredJobs,
    onSuccess: (res) => {
      toast.success(res.message || "Tác vụ đóng tin tuyển dụng quá hạn đã hoàn tất!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Không thể kích hoạt tác vụ.");
    },
  });

  const contractMutation = useMutation({
    mutationFn: automationApi.triggerContractWarning,
    onSuccess: (res) => {
      toast.success(res.message || "Tác vụ gửi cảnh báo hết hạn hợp đồng đã hoàn tất!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Không thể kích hoạt tác vụ.");
    },
  });

  const leaveInitMutation = useMutation({
    mutationFn: automationApi.triggerLeaveInit,
    onSuccess: (res) => {
      toast.success(res.message || "Tác vụ khởi tạo phép năm mới đã hoàn tất!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Không thể kích hoạt tác vụ.");
    },
  });

  const leaveSeniorityMutation = useMutation({
    mutationFn: automationApi.triggerLeaveSeniority,
    onSuccess: (res) => {
      toast.success(res.message || "Tác vụ tích lũy phép thâm niên đã hoàn tất!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Không thể kích hoạt tác vụ.");
    },
  });

  // Bản đồ các mutations để trigger động
  const runJob = (id: string) => {
    switch (id) {
      case "birthday":
        birthdayMutation.mutate();
        break;
      case "close-jobs":
        jobsMutation.mutate();
        break;
      case "contract-warning":
        contractMutation.mutate();
        break;
      case "leave-init":
        leaveInitMutation.mutate();
        break;
      case "leave-seniority":
        leaveSeniorityMutation.mutate();
        break;
      default:
        toast.error("Tác vụ không hợp lệ");
    }
  };

  const isPending = (id: string): boolean => {
    switch (id) {
      case "birthday":
        return birthdayMutation.isPending;
      case "close-jobs":
        return jobsMutation.isPending;
      case "contract-warning":
        return contractMutation.isPending;
      case "leave-init":
        return leaveInitMutation.isPending;
      case "leave-seniority":
        return leaveSeniorityMutation.isPending;
      default:
        return false;
    }
  };

  const automations: JobConfig[] = [
    {
      id: "birthday",
      title: "Chúc mừng Sinh nhật & Kỷ niệm ngày vào làm",
      description:
        "Tự động rà soát những nhân sự hoạt động có ngày sinh nhật hoặc ngày kỷ niệm vào làm hôm nay để gửi email chúc mừng và tạo thông báo hệ thống.",
      cronExpr: "0 0 8 * * ?",
      cronDesc: "Hằng ngày lúc 08:00 AM",
      targets: "Tất cả nhân sự có trạng thái ACTIVE",
      channels: ["Email SMTP", "Thông báo Hệ thống"],
      icon: <Gift className="h-6 w-6 text-pink-500" />,
      iconBg: "bg-pink-500/10 dark:bg-pink-500/20",
      mutationKey: "triggerBirthdayAnniversary",
    },
    {
      id: "close-jobs",
      title: "Tự động đóng tin Tuyển dụng quá hạn",
      description:
        "Tự động quét các tin tuyển dụng đang ở trạng thái OPEN nhưng đã vượt quá hạn nộp hồ sơ (closingDate) để chuyển trạng thái sang CLOSED.",
      cronExpr: "0 0 0 * * ?",
      cronDesc: "Hằng ngày lúc 12:00 AM (nửa đêm)",
      targets: "Các tin tuyển dụng (Job Postings) quá hạn",
      channels: ["Cập nhật Cơ sở dữ liệu", "Hệ thống Log"],
      icon: <Briefcase className="h-6 w-6 text-emerald-500" />,
      iconBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
      mutationKey: "triggerCloseExpiredJobs",
    },
    {
      id: "contract-warning",
      title: "Cảnh báo hết hạn Hợp đồng lao động",
      description:
        "Tự động rà soát các hợp đồng lao động đang hiệu lực (ACTIVE) sắp hết hạn sau đúng 15 ngày hoặc 30 ngày để gửi email và thông báo cho Nhân viên và Quản lý trực tiếp.",
      cronExpr: "0 30 8 * * ?",
      cronDesc: "Hằng ngày lúc 08:30 AM",
      targets: "Nhân viên sở hữu hợp đồng & Quản lý trực tiếp",
      channels: ["Email SMTP", "Thông báo Hệ thống"],
      icon: <FileText className="h-6 w-6 text-orange-500" />,
      iconBg: "bg-orange-500/10 dark:bg-orange-500/20",
      mutationKey: "triggerContractWarning",
    },
    {
      id: "leave-init",
      title: "Khởi tạo Phép năm định kỳ",
      description:
        "Tự động tạo bản ghi số dư phép năm mới (LeaveBalance) cho toàn bộ nhân sự hoạt động khi bước sang năm mới với số ngày phép tiêu chuẩn (12 ngày).",
      cronExpr: "0 0 0 1 1 ?",
      cronDesc: "Ngày 1 tháng 1 hằng năm lúc 12:00 AM",
      targets: "Toàn bộ nhân sự ACTIVE",
      channels: ["Cơ sở dữ liệu Leave Balance"],
      icon: <CalendarDays className="h-6 w-6 text-blue-500" />,
      iconBg: "bg-blue-500/10 dark:bg-blue-500/20",
      mutationKey: "triggerLeaveInit",
    },
    {
      id: "leave-seniority",
      title: "Tính tích lũy Phép thâm niên",
      description:
        "Tự động rà soát thâm niên làm việc của toàn bộ nhân viên. Cứ làm việc đủ mỗi 5 năm (thâm niên >= 5 năm), hệ thống sẽ cộng thêm 1 ngày phép năm vào số dư phép năm của năm hiện tại.",
      cronExpr: "0 0 0 1 * ?",
      cronDesc: "Ngày 1 hàng tháng lúc 12:00 AM",
      targets: "Nhân sự có thâm niên làm việc trên 5 năm",
      channels: ["Cơ sở dữ liệu Leave Balance", "Hệ thống Log"],
      icon: <Sparkles className="h-6 w-6 text-violet-500" />,
      iconBg: "bg-violet-500/10 dark:bg-violet-500/20",
      mutationKey: "triggerLeaveSeniority",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Tự động hóa hệ thống (Cron Jobs)
        </h2>
        <p className="text-muted-foreground">
          Quản lý lịch trình, xem cấu hình và kích hoạt thủ công các tiến trình chạy ngầm của hệ thống HRMPro.
        </p>
      </div>

      {/* Info Banner */}
      <Card className="border-l-4 border-l-primary bg-muted/40 shadow-sm">
        <CardContent className="pt-4 flex gap-3">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-sm text-foreground">
              Thông tin về Cơ chế Tự động hóa
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Hệ thống HRMPro sử dụng công nghệ **Spring Boot Scheduling** để kích hoạt các tiến trình ngầm 
              định kỳ dựa trên múi giờ máy chủ. Các tiến trình này được cấu hình bọc trong cơ chế quản lý giao dịch 
              (Transactional) an toàn và xử lý lỗi SMTP tự động, đảm bảo tính liên tục của hệ thống. 
              Quản trị viên có quyền bấm nút **Chạy thủ công ngay** để kích hoạt nghiệp vụ tức thì mà không cần chờ đến lịch chạy định kỳ.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Grid of Automation Tasks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {automations.map((job) => {
          const loading = isPending(job.id);
          return (
            <Card key={job.id} className="flex flex-col justify-between overflow-hidden border bg-background shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg ${job.iconBg}`}>
                    {job.icon}
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-base font-bold text-foreground">
                      {job.title}
                    </CardTitle>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-muted-foreground">
                        Lịch chạy: {job.cronDesc}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pb-4 flex-1 text-xs space-y-3">
                <p className="text-muted-foreground leading-relaxed">
                  {job.description}
                </p>

                <Separator />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground font-medium">Đối tượng:</span>
                    <span className="font-semibold text-foreground">{job.targets}</span>
                  </div>
                  <div className="flex items-start justify-between">
                    <span className="text-muted-foreground font-medium">Kênh đầu ra:</span>
                    <div className="flex flex-wrap gap-1 justify-end max-w-[70%]">
                      {job.channels.map((chan, idx) => (
                        <Badge key={idx} variant="outline" className="text-[9px] px-1.5 py-0">
                          {chan}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-2 border-t bg-muted/20 px-4 py-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-1 text-[11px] text-emerald-500 font-medium">
                  <CheckCircle2 size={14} className="stroke-[2.5]" />
                  <span>Sẵn sàng chạy ngầm</span>
                </div>

                <Button
                  size="sm"
                  onClick={() => runJob(job.id)}
                  disabled={loading}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3"
                >
                  {loading ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <Play size={12} className="fill-current" />
                  )}
                  {loading ? "Đang xử lý..." : "Chạy thủ công ngay"}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Safety Notice */}
      <Card className="border border-destructive/20 bg-destructive/5 dark:bg-destructive/10">
        <CardContent className="pt-4 flex gap-3 text-destructive">
          <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-sm">
              Lưu ý an toàn khi kích hoạt thủ công
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Việc kích hoạt thủ công sẽ quét cơ sở dữ liệu và ngay lập tức thực hiện các thay đổi (chuyển trạng thái, cộng dồn phép) 
              cũng như gửi thư trực tiếp cho người nhận. Vui lòng không nhấn liên tục nhiều lần một tác vụ trong thời gian ngắn để 
              tránh nghẽn hàng đợi SMTP và ghi lặp nhật ký.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemAutomationPage;
