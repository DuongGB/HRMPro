import React, { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store";
import { logout } from "../../store/slices/authSlice";
import { cn } from "@/lib/utils";
import {
  Menu as MenuIcon,
  User,
  LayoutDashboard,
  Users,
  Building2,
  CalendarDays,
  FileEdit,
  CircleDollarSign,
  BarChart4,
  Megaphone,
  Unlock,
  LogOut,
  Settings,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";

const SidebarLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const menuItems = [
    {
      key: "/",
      icon: <LayoutDashboard size={20} />,
      label: "Dashboard",
    },
  ];

  const roles = user?.roles || [];

  // 1. Phân hệ Nhân viên / Hồ sơ cá nhân
  if (roles.some(r => ["SUPER_ADMIN", "HR_ADMIN", "HR_STAFF", "MANAGER"].includes(r))) {
    menuItems.push({
      key: "/employees",
      icon: <Users size={20} />,
      label: "Nhân viên",
    });
  } else if (roles.includes("EMPLOYEE")) {
    menuItems.push({
      key: `/employees/${user?.employeeId || ""}`,
      icon: <User size={20} />,
      label: "Hồ sơ cá nhân",
    });
  }

  // 2. Phân hệ Cơ cấu tổ chức (Mọi vai trò đều xem được sơ đồ tổ chức)
  menuItems.push({
    key: "/organization",
    icon: <Building2 size={20} />,
    label: "Cơ cấu tổ chức",
  });

  // 3. Phân hệ Chấm công (Trừ Recruiter)
  if (roles.some(r => ["SUPER_ADMIN", "HR_ADMIN", "HR_STAFF", "MANAGER", "EMPLOYEE"].includes(r))) {
    menuItems.push({
      key: "/attendance",
      icon: <CalendarDays size={20} />,
      label: "Chấm công",
    });
  }

  // 4. Phân hệ Nghỉ phép (Trừ Recruiter)
  if (roles.some(r => ["SUPER_ADMIN", "HR_ADMIN", "HR_STAFF", "MANAGER", "EMPLOYEE"].includes(r))) {
    menuItems.push({
      key: "/leaves",
      icon: <FileEdit size={20} />,
      label: "Đơn xin nghỉ",
    });
  }

  // 5. Phân hệ Lương & Payslip (Chỉ Super Admin, HR Admin, Employee)
  if (roles.some(r => ["SUPER_ADMIN", "HR_ADMIN", "EMPLOYEE"].includes(r))) {
    menuItems.push({
      key: "/payroll",
      icon: <CircleDollarSign size={20} />,
      label: "Lương & Payslip",
    });
  }

  // 6. Phân hệ Đánh giá hiệu suất (Trừ Super Admin, Recruiter)
  if (roles.some(r => ["HR_ADMIN", "HR_STAFF", "MANAGER", "EMPLOYEE"].includes(r))) {
    menuItems.push({
      key: "/performance",
      icon: <BarChart4 size={20} />,
      label: "Đánh giá hiệu suất",
    });
  }

  // 7. Phân hệ Tuyển dụng (Chỉ HR Admin, Manager, Recruiter)
  if (roles.some(r => ["HR_ADMIN", "MANAGER", "RECRUITER"].includes(r))) {
    menuItems.push({
      key: "/recruitment",
      icon: <Megaphone size={20} />,
      label: "Tuyển dụng",
    });
  }

  // 8. Quản lý tài khoản (Chỉ dành cho SUPER_ADMIN)
  if (roles.includes("SUPER_ADMIN")) {
    menuItems.push({
      key: "/users",
      icon: <Settings size={20} />,
      label: "Quản lý tài khoản",
    });
  }

  return (
    <div className="flex h-screen bg-muted/40">
      {/* Sider */}
      <aside
        className={cn(
          "bg-background border-r transition-all duration-300 flex flex-col z-20",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className="h-16 flex items-center justify-center border-b px-4">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-primary-foreground font-bold shrink-0">
            H
          </div>
          {!collapsed && (
            <span className="ml-3 font-bold text-lg text-primary truncate whitespace-nowrap">
              HRMPro
            </span>
          )}
        </div>
        <nav className="flex-1 overflow-y-auto py-4 flex flex-col gap-1 px-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.key || 
                            (item.key !== "/" && location.pathname.startsWith(item.key));
            return (
              <Link
                key={item.key}
                to={item.key}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  collapsed && "justify-center"
                )}
                title={collapsed ? item.label : undefined}
              >
                <span className="shrink-0">{item.icon}</span>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-background border-b flex items-center justify-between px-4 z-10 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="text-muted-foreground"
          >
            <MenuIcon size={20} />
          </Button>

          <div className="flex items-center gap-4">
            <ModeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2 py-1 h-auto rounded-full md:rounded-md">
                  <Avatar className="w-8 h-8 border">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user?.username?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium hidden md:inline">{user?.username}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to={`/employees/${user?.employeeId || ""}`} className="cursor-pointer w-full flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Hồ sơ của tôi
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/change-password" className="cursor-pointer w-full flex items-center">
                    <Unlock className="mr-2 h-4 w-4" />
                    Đổi mật khẩu
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-auto p-4 md:p-6 bg-muted/20">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SidebarLayout;
