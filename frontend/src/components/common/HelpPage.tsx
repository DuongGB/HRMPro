import React, { useState } from "react";
import { useAppSelector } from "../../store";
import { Link } from "react-router-dom";
import {
  HelpCircle,
  Keyboard,
  Search,
  CalendarClock,
  FileText,
  DollarSign,
  MessageCircle,
  User,
  ChevronRight,
  Sparkles,
  Info,
  Briefcase,
  Building2,
  Settings,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface GuideItem {
  id: string;
  category: string;
  title: string;
  description: string;
  steps: string[];
  icon: React.ReactNode;
  tags: string[];
  allowedRoles?: string[];
}

interface ShortcutItem {
  keys: string[];
  description: string;
  category: string;
  actionType: "navigation" | "chat" | "general";
}

const HelpPage: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("guides");

  // Danh sách hướng dẫn sử dụng các trang hiện hành theo vai trò (role)
  const guides: GuideItem[] = [
    {
      id: "attendance",
      category: "Chấm công",
      title: "Chấm công hàng ngày (Check-in/Check-out)",
      description: "Hướng dẫn ghi nhận thời gian làm việc hàng ngày của bạn trên hệ thống.",
      icon: <CalendarClock className="h-5 w-5 text-emerald-500" />,
      tags: ["attendance", "cham cong", "checkin", "checkout", "gio lam"],
      allowedRoles: ["SUPER_ADMIN", "HR_ADMIN", "HR_STAFF", "MANAGER", "EMPLOYEE"],
      steps: [
        "Truy cập phân hệ 'Chấm công' từ menu bên trái.",
        "Tại giao diện chấm công, bạn sẽ thấy nút 'Check-in' vào đầu ca làm việc và 'Check-out' khi kết thúc ca.",
        "Hệ thống sẽ tự động ghi nhận thời gian và định vị (nếu được yêu cầu) để xác nhận công việc.",
        "Bạn có thể xem lịch sử chấm công của cả tháng hiện tại ở bảng danh sách bên dưới.",
      ],
    },
    {
      id: "leave-request",
      category: "Nghỉ phép",
      title: "Tạo đơn xin nghỉ phép",
      description: "Cách tạo đơn nghỉ phép thường niên, nghỉ ốm hoặc nghỉ không lương và theo dõi phê duyệt.",
      icon: <FileText className="h-5 w-5 text-blue-500" />,
      tags: ["leave", "nghi phep", "don xin nghi", "phep nam", "nghi om"],
      allowedRoles: ["SUPER_ADMIN", "HR_ADMIN", "HR_STAFF", "MANAGER", "EMPLOYEE"],
      steps: [
        "Vào mục 'Đơn xin nghỉ' ở sidebar.",
        "Nhấn vào nút 'Tạo đơn mới' ở góc trên bên phải.",
        "Chọn loại hình nghỉ phép (Nghỉ phép năm, Nghỉ ốm, Việc riêng...), chọn khoảng thời gian và nhập lý do cụ thể.",
        "Chọn Người phê duyệt (thường là Trưởng phòng của bạn).",
        "Nhấn 'Gửi yêu cầu'. Trạng thái đơn sẽ được hiển thị là 'Đang chờ duyệt' (Pending) và hệ thống sẽ gửi thông báo đến cấp quản lý.",
      ],
    },
    {
      id: "payroll",
      category: "Lương & Thưởng",
      title: "Xem và tải phiếu lương (Payslip)",
      description: "Xem chi tiết bảng tính lương cá nhân hàng tháng và tải file PDF để lưu trữ.",
      icon: <DollarSign className="h-5 w-5 text-teal-500" />,
      tags: ["payroll", "luong", "payslip", "phieu luong", "thuong"],
      allowedRoles: ["SUPER_ADMIN", "HR_ADMIN", "EMPLOYEE"],
      steps: [
        "Di chuyển đến phân hệ 'Lương & Payslip'.",
        "Chọn kỳ lương tháng/năm bạn muốn tra cứu từ danh sách bộ lọc.",
        "Bảng chi tiết lương bao gồm: Lương cơ bản, các khoản phụ cấp, thưởng KPI, các khoản khấu trừ (bảo hiểm, thuế) và Lương thực nhận (Net Salary).",
        "Nếu muốn lưu trữ, chọn 'Tải phiếu lương' ở góc trên cùng của bảng lương để tải file PDF về thiết bị.",
      ],
    },
    {
      id: "recruitment",
      category: "Tuyển dụng",
      title: "Quản lý tuyển dụng & Ứng viên",
      description: "Đại lý đăng tuyển dụng, theo dõi phễu ứng viên và lên lịch phỏng vấn.",
      icon: <Briefcase className="h-5 w-5 text-sky-500" />,
      tags: ["recruitment", "tuyen dung", "ung vien", "cv", "tin tuyen", "phong van"],
      allowedRoles: ["SUPER_ADMIN", "HR_ADMIN", "MANAGER", "RECRUITER"],
      steps: [
        "Vào phân hệ 'Tuyển dụng' từ menu Sidebar.",
        "Tạo chiến dịch tuyển dụng mới (vị trí công việc, phòng ban, số lượng, mô tả công việc).",
        "Tiếp nhận hồ sơ ứng viên gửi đến và kéo-thả ứng viên qua các trạng thái phễu tuyển dụng (Mới, Test, Phỏng vấn, Đề nghị, Nhận việc).",
        "Lên lịch phỏng vấn và gửi mail thông báo tự động cho ứng viên.",
      ],
    },
    {
      id: "users",
      category: "Quản trị viên",
      title: "Quản lý tài khoản người dùng",
      description: "Cấp tài khoản mới, phân quyền truy cập và quản lý trạng thái hoạt động của nhân sự.",
      icon: <Settings className="h-5 w-5 text-zinc-500" />,
      tags: ["users", "tai khoan", "phan quyen", "admin", "employee", "super admin"],
      allowedRoles: ["SUPER_ADMIN"],
      steps: [
        "Truy cập phân hệ 'Quản lý tài khoản' (chỉ dành cho Super Admin).",
        "Bấm 'Thêm tài khoản' để cấp thông tin đăng nhập mới cho nhân viên mới vào.",
        "Gán vai trò phù hợp (Super Admin, HR Admin, Manager, Employee...) để cấp quyền tương ứng trên hệ thống.",
        "Khóa hoặc kích hoạt lại tài khoản khi nhân viên thay đổi trạng thái làm việc.",
      ],
    },
    {
      id: "automation",
      category: "Quản trị viên",
      title: "Cấu hình tự động hóa hệ thống",
      description: "Cấu hình các quy trình gửi mail tự động, cron jobs và thiết lập các biến số hệ thống.",
      icon: <RefreshCw className="h-5 w-5 text-indigo-500" />,
      tags: ["automation", "tu dong hoa", "scheduler", "cron job", "cau hinh", "system"],
      allowedRoles: ["SUPER_ADMIN", "HR_ADMIN"],
      steps: [
        "Vào mục 'Tự động hóa' trên menu Sidebar.",
        "Kiểm tra danh sách và trạng thái hoạt động của các Scheduler tác vụ tự động.",
        "Kích hoạt thủ công hoặc thiết lập lại tần suất chạy (cron expression) cho các Scheduler.",
        "Xem nhật ký chạy (Run Log) để kiểm soát lỗi trong các quy trình xử lý ngầm.",
      ],
    },
    {
      id: "organization",
      category: "Sơ đồ tổ chức",
      title: "Tra cứu sơ đồ tổ chức & Phòng ban",
      description: "Xem mối quan hệ phân cấp giữa các phòng ban và thông tin nhân sự trực thuộc.",
      icon: <Building2 className="h-5 w-5 text-amber-500" />,
      tags: ["organization", "co cau", "phong ban", "so do", "org chart"],
      steps: [
        "Di chuyển đến mục 'Cơ cấu tổ chức' ở sidebar.",
        "Xem sơ đồ phân cấp (Org Chart) trực quan dạng cây của toàn bộ các bộ phận trong công ty.",
        "Nhấp vào một phòng ban bất kỳ để xem danh sách chi tiết nhân viên đang trực thuộc phòng ban đó.",
        "Xem nhanh thông tin liên hệ và chức vụ quản trị của Trưởng bộ phận.",
      ],
    },
    {
      id: "chat",
      category: "Giao tiếp nội bộ",
      title: "Sử dụng Chat Widget để trao đổi công việc",
      description: "Nhắn tin thời gian thực với đồng nghiệp mà không cần rời khỏi màn hình làm việc.",
      icon: <MessageCircle className="h-5 w-5 text-purple-500" />,
      tags: ["chat", "tin nhan", "tro chuyen", "dong nghiep", "websocket"],
      steps: [
        "Chat Widget luôn hiển thị ở góc dưới cùng bên phải màn hình dưới dạng một bong bóng tròn màu xanh.",
        "Nhấp vào bong bóng để mở danh sách liên hệ nhân viên toàn công ty.",
        "Sử dụng thanh tìm kiếm để tìm nhanh đồng nghiệp theo Tên hoặc Phòng ban.",
        "Nhấp chọn đồng nghiệp để bắt đầu trò chuyện. Trạng thái tin nhắn chưa đọc sẽ được báo qua số badge đỏ nổi bật (tối đa 99+).",
        "Hỗ trợ phím tắt đóng nhanh (`Esc`) hoặc toggle widget (`Ctrl` + `Shift` + `M`).",
      ],
    },
    {
      id: "profile",
      category: "Hồ sơ cá nhân",
      title: "Cập nhật hồ sơ & Đổi mật khẩu",
      description: "Quản lý thông tin cá nhân, cập nhật avatar và duy trì bảo mật tài khoản.",
      icon: <User className="h-5 w-5 text-orange-500" />,
      tags: ["profile", "ho so", "ca nhan", "avatar", "doi mat khau", "password"],
      steps: [
        "Bấm vào avatar của bạn ở góc trên bên phải màn hình, chọn 'Hồ sơ của tôi'.",
        "Kiểm tra thông tin cá nhân, hợp đồng và thông tin liên hệ.",
        "Để cập nhật ảnh đại diện, nhấp trực tiếp vào vùng ảnh đại diện để tải ảnh mới lên.",
        "Để đổi mật khẩu, bấm vào menu avatar ở header, chọn 'Đổi mật khẩu'. Nhập mật khẩu hiện tại và mật khẩu mới có độ bảo mật cao (chứa chữ hoa, số và ký tự đặc biệt).",
      ],
    },
  ];

  // Danh sách phím tắt
  const shortcuts: ShortcutItem[] = [
    // Nhóm Chat
    {
      keys: ["Ctrl", "Shift", "M"],
      description: "Ẩn / Hiện (Toggle) cửa sổ Chat nội bộ",
      category: "Trò chuyện nội bộ",
      actionType: "chat",
    },
    {
      keys: ["Esc"],
      description: "Đóng cửa sổ Chat / Quay lại danh sách liên hệ / Đóng popover",
      category: "Trò chuyện nội bộ",
      actionType: "chat",
    },
    {
      keys: ["Ctrl", "Shift", "F"],
      description: "Tập trung (Focus) nhanh vào ô tìm kiếm trong danh sách Chat",
      category: "Trò chuyện nội bộ",
      actionType: "chat",
    },
    // Nhóm Điều hướng nhanh
    {
      keys: ["Ctrl", "Alt", "D"],
      description: "Đi tới trang Bảng điều khiển (Dashboard) (hỗ trợ cả Alt+D)",
      category: "Điều hướng nhanh",
      actionType: "navigation",
    },
    {
      keys: ["Ctrl", "Alt", "H"],
      description: "Đi tới trang Hướng dẫn & Phím tắt (Trang này) (hỗ trợ cả Alt+H)",
      category: "Điều hướng nhanh",
      actionType: "navigation",
    },
    {
      keys: ["Ctrl", "Alt", "P"],
      description: "Đi tới trang Hồ sơ cá nhân của bạn (hỗ trợ cả Alt+P)",
      category: "Điều hướng nhanh",
      actionType: "navigation",
    },
    {
      keys: ["Ctrl", "Alt", "C"],
      description: "Đi tới trang Đổi mật khẩu tài khoản (hỗ trợ cả Alt+C)",
      category: "Điều hướng nhanh",
      actionType: "navigation",
    },
    // Nhóm General
    {
      keys: ["Ctrl", "Alt", "T"],
      description: "Chuyển đổi giao diện Sáng / Tối (Light / Dark Mode) (hỗ trợ cả Alt+T)",
      category: "Hệ thống",
      actionType: "general",
    },
  ];

  const roles = user?.roles || [];

  // Lọc hướng dẫn sử dụng dựa trên vai trò (role) của user và từ khóa tìm kiếm
  const filteredGuides = guides.filter((g) => {
    // 1. Kiểm tra phân quyền truy cập trang theo role
    if (g.allowedRoles && g.allowedRoles.length > 0) {
      const hasPermission = g.allowedRoles.some((r) => roles.includes(r));
      if (!hasPermission) return false;
    }

    // 2. Kiểm tra từ khóa tìm kiếm
    const search = searchTerm.toLowerCase();
    return (
      g.title.toLowerCase().includes(search) ||
      g.description.toLowerCase().includes(search) ||
      g.category.toLowerCase().includes(search) ||
      g.tags.some((t) => t.toLowerCase().includes(search))
    );
  });

  // Lọc phím tắt dựa trên từ khóa tìm kiếm
  const filteredShortcuts = shortcuts.filter(
    (s) =>
      s.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.keys.some((k) => k.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-5xl animate-in fade-in duration-300">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
              <Sparkles className="h-3 w-3 mr-1" />
              Tính năng hữu ích
            </Badge>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <HelpCircle className="h-8 w-8 text-primary" /> Hướng dẫn & Phím tắt
          </h1>
          <p className="text-muted-foreground mt-1.5 text-sm md:text-base">
            Tìm hiểu cách sử dụng hệ thống HRMPro chuyên nghiệp và tăng tốc độ thao tác của bạn với phím tắt nhanh.
          </p>
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Tìm kiếm chủ đề hướng dẫn, phím tắt hoặc tính năng... (ví dụ: 'chấm công', 'Ctrl')"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-11 h-12 w-full bg-card border-border/80 rounded-xl shadow-sm focus-visible:ring-primary text-base"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="guides" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex justify-between items-center border-b pb-2">
          <TabsList className="bg-muted/80 p-1">
            <TabsTrigger value="guides" className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              Hướng dẫn sử dụng
              {searchTerm && (
                <Badge variant="secondary" className="ml-1 text-[10px] px-1 h-4 min-w-4 flex items-center justify-center">
                  {filteredGuides.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="shortcuts" className="flex items-center gap-2">
              <Keyboard className="h-4 w-4" />
              Phím tắt hệ thống
              {searchTerm && (
                <Badge variant="secondary" className="ml-1 text-[10px] px-1 h-4 min-w-4 flex items-center justify-center">
                  {filteredShortcuts.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <span className="text-xs text-muted-foreground hidden md:inline-flex items-center gap-1.5 bg-muted/30 px-3 py-1 rounded-full border">
            <Info className="h-3.5 w-3.5 text-primary" />
            Nhấn <kbd className="px-1.5 py-0.5 bg-muted border rounded font-mono text-[10px] shadow-sm">Ctrl</kbd> +{" "}
            <kbd className="px-1.5 py-0.5 bg-muted border rounded font-mono text-[10px] shadow-sm">Alt</kbd> +{" "}
            <kbd className="px-1.5 py-0.5 bg-muted border rounded font-mono text-[10px] shadow-sm">H</kbd> để mở nhanh trang này.
          </span>
        </div>

        {/* Tab CONTENT: Hướng dẫn sử dụng */}
        <TabsContent value="guides" className="space-y-4 focus-visible:outline-none">
          {filteredGuides.length === 0 ? (
            <div className="text-center py-16 bg-card border border-dashed rounded-2xl">
              <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground/60 mb-3" />
              <h3 className="text-lg font-semibold text-foreground">Không tìm thấy hướng dẫn nào</h3>
              <p className="text-muted-foreground mt-1 max-w-sm mx-auto text-sm">
                Không tìm thấy kết quả phù hợp với từ khóa "{searchTerm}". Vui lòng thử từ khóa khác như "nghỉ", "lương", "chat".
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {filteredGuides.map((guide) => (
                <Card
                  key={guide.id}
                  className="bg-card hover:bg-accent/5 border-border/80 transition-all duration-300 hover:shadow-md group overflow-hidden flex flex-col"
                >
                  <CardHeader className="pb-3 border-b bg-muted/10">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-card border flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300">
                          {guide.icon}
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                            {guide.category}
                          </span>
                          <CardTitle className="text-base font-bold text-foreground mt-0.5 line-clamp-1">
                            {guide.title}
                          </CardTitle>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] bg-background">
                        {guide.id === "chat" ? "Real-time" : "Tính năng"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 flex-1 flex flex-col justify-between">
                    <div>
                      <CardDescription className="text-sm text-muted-foreground leading-relaxed mb-4">
                        {guide.description}
                      </CardDescription>

                      <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                          Các bước thực hiện:
                        </h4>
                        <ol className="space-y-2.5">
                          {guide.steps.map((step, idx) => (
                            <li key={idx} className="flex gap-2.5 text-xs text-muted-foreground align-top">
                              <span className="h-5 w-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-[10px]">
                                {idx + 1}
                              </span>
                              <span className="leading-5 pt-0.5">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-dashed flex justify-between items-center">
                      <div className="flex gap-1">
                        {guide.tags.slice(0, 3).map((tag, i) => (
                          <span key={i} className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            #{tag}
                          </span>
                        ))}
                      </div>
                      {guide.id !== "chat" && (
                        <Link
                          to={`/${guide.id === "leave-request" ? "leaves" : guide.id}`}
                          className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1 group/link"
                        >
                          Truy cập ngay
                          <ChevronRight className="h-3 w-3 group-hover/link:translate-x-0.5 transition-transform" />
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab CONTENT: Phím tắt hệ thống */}
        <TabsContent value="shortcuts" className="space-y-6 focus-visible:outline-none">
          {filteredShortcuts.length === 0 ? (
            <div className="text-center py-16 bg-card border border-dashed rounded-2xl">
              <Keyboard className="h-12 w-12 mx-auto text-muted-foreground/60 mb-3" />
              <h3 className="text-lg font-semibold text-foreground">Không tìm thấy phím tắt nào</h3>
              <p className="text-muted-foreground mt-1 max-w-sm mx-auto text-sm">
                Không tìm thấy phím tắt phù hợp với từ khóa "{searchTerm}".
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Group shortcuts by Category */}
              {Array.from(new Set(filteredShortcuts.map((s) => s.category))).map((cat) => {
                const groupShortcuts = filteredShortcuts.filter((s) => s.category === cat);
                return (
                  <Card key={cat} className="border-border/80 shadow-sm overflow-hidden bg-card">
                    <CardHeader className="bg-muted/10 border-b py-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-primary" />
                          {cat}
                        </CardTitle>
                        <Badge variant="outline" className="text-[10px] bg-background">
                          {groupShortcuts.length} phím tắt
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y divide-border">
                        {groupShortcuts.map((shortcut, index) => (
                          <div
                            key={index}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 hover:bg-accent/5 transition-colors"
                          >
                            <span className="text-sm text-muted-foreground font-medium pr-4">
                              {shortcut.description}
                            </span>
                            <div className="flex items-center gap-1 shrink-0 flex-wrap">
                              {shortcut.keys.map((key, keyIdx) => (
                                <React.Fragment key={keyIdx}>
                                  {keyIdx > 0 && <span className="text-xs text-muted-foreground font-semibold px-0.5">+</span>}
                                  <kbd className="inline-flex items-center justify-center px-2 py-1 rounded bg-muted border border-border/80 text-foreground font-mono text-xs font-bold shadow-[0_2px_0_rgba(0,0,0,0.06)] dark:shadow-[0_2px_0_rgba(255,255,255,0.1)] min-w-[24px] text-center">
                                    {key}
                                  </kbd>
                                </React.Fragment>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Tips banner */}
              <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex items-start gap-3">
                <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-primary">Mẹo sử dụng phím tắt hiệu quả</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Bạn có thể sử dụng các tổ hợp phím tắt trên từ bất kỳ màn hình nào trong ứng dụng. Hãy thử nhấn{" "}
                    <kbd className="px-1 py-0.5 bg-muted border rounded font-mono text-[10px] shadow-sm">Ctrl</kbd> +{" "}
                    <kbd className="px-1 py-0.5 bg-muted border rounded font-mono text-[10px] shadow-sm">Alt</kbd> +{" "}
                    <kbd className="px-1 py-0.5 bg-muted border rounded font-mono text-[10px] shadow-sm">D</kbd> ngay bây giờ để quay về Bảng điều khiển (Dashboard) của bạn hoặc{" "}
                    <kbd className="px-1 py-0.5 bg-muted border rounded font-mono text-[10px] shadow-sm">Ctrl</kbd> +{" "}
                    <kbd className="px-1 py-0.5 bg-muted border rounded font-mono text-[10px] shadow-sm">Shift</kbd> +{" "}
                    <kbd className="px-1 py-0.5 bg-muted border rounded font-mono text-[10px] shadow-sm">M</kbd> để mở nhanh hộp thoại Chat!
                  </p>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HelpPage;
