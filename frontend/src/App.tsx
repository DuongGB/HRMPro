import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Provider as ReduxProvider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

import { store } from "./store";
import PrivateRoute from "./components/common/PrivateRoute";
import RoleProtectedRoute from "./components/common/RoleProtectedRoute";
import SidebarLayout from "./components/common/SidebarLayout";
import LoginPage from "./modules/auth/pages/LoginPage";
import DashboardPage from "./modules/dashboard/pages/DashboardPage";
import ChangePasswordPage from "./modules/auth/pages/ChangePasswordPage";
import UserManagementPage from "./modules/users/pages/UserManagementPage";
import SystemAutomationPage from "./modules/users/pages/SystemAutomationPage";
import UnauthorizedPage from "./components/common/UnauthorizedPage";
import NotFoundPage from "./components/common/NotFoundPage";
import OrgChartPage from "./modules/organization/pages/OrgChartPage";
import EmployeeListPage from "./modules/employee/pages/EmployeeListPage";
import EmployeeDetailPage from "./modules/employee/pages/EmployeeDetailPage";
import AttendancePage from "./modules/attendance/pages/AttendancePage";
import LeavePage from "./modules/leave/pages/LeavePage";
import PayrollPage from "./modules/payroll/pages/PayrollPage";
import PerformancePage from "./modules/performance/pages/PerformancePage";
import RecruitmentPage from "./modules/recruitment/pages/RecruitmentPage";
import HelpPage from "./components/common/HelpPage";


// Khởi tạo Query Client cho React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30 * 1000, // Dữ liệu được coi là fresh trong 30s, tránh refetch khi re-mount nhanh
    },
  },
});

const App: React.FC = () => {
  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
          <BrowserRouter>
            <Routes>
              {/* Public Route */}
              <Route path="/login" element={<LoginPage />} />

              {/* Private Route bọc bởi Layout chính */}
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <SidebarLayout />
                  </PrivateRoute>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="change-password" element={<ChangePasswordPage />} />
                
                {/* Router Quản lý tài khoản (Super Admin) */}
                <Route
                  path="users"
                  element={
                    <RoleProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                      <UserManagementPage />
                    </RoleProtectedRoute>
                  }
                />

                {/* Router Tự động hóa hệ thống (Super Admin, HR Admin) */}
                <Route
                  path="automation"
                  element={
                    <RoleProtectedRoute allowedRoles={["SUPER_ADMIN", "HR_ADMIN"]}>
                      <SystemAutomationPage />
                    </RoleProtectedRoute>
                  }
                />

                {/* Phân hệ Phòng ban / Sơ đồ tổ chức */}
                <Route path="organization" element={<OrgChartPage />} />

                {/* Phân hệ Hồ sơ nhân viên */}
                <Route
                  path="employees"
                  element={
                    <RoleProtectedRoute allowedRoles={["SUPER_ADMIN", "HR_ADMIN", "HR_STAFF", "MANAGER"]}>
                      <EmployeeListPage />
                    </RoleProtectedRoute>
                  }
                />
                <Route path="employees/:id" element={<EmployeeDetailPage />} />

                {/* Phân hệ Chấm công */}
                <Route
                  path="attendance"
                  element={
                    <RoleProtectedRoute allowedRoles={["SUPER_ADMIN", "HR_ADMIN", "HR_STAFF", "MANAGER", "EMPLOYEE"]}>
                      <AttendancePage />
                    </RoleProtectedRoute>
                  }
                />

                {/* Phân hệ Nghỉ phép */}
                <Route
                  path="leaves"
                  element={
                    <RoleProtectedRoute allowedRoles={["SUPER_ADMIN", "HR_ADMIN", "HR_STAFF", "MANAGER", "EMPLOYEE"]}>
                      <LeavePage />
                    </RoleProtectedRoute>
                  }
                />

                {/* Phân hệ Lương & Payslip */}
                <Route
                  path="payroll"
                  element={
                    <RoleProtectedRoute allowedRoles={["SUPER_ADMIN", "HR_ADMIN", "HR_STAFF", "MANAGER", "EMPLOYEE"]}>
                      <PayrollPage />
                    </RoleProtectedRoute>
                  }
                />

                {/* Phân hệ Đánh giá hiệu suất */}
                <Route
                  path="performance"
                  element={
                    <RoleProtectedRoute allowedRoles={["SUPER_ADMIN", "HR_ADMIN", "HR_STAFF", "MANAGER", "EMPLOYEE"]}>
                      <PerformancePage />
                    </RoleProtectedRoute>
                  }
                />

                {/* Phân hệ Tuyển dụng */}
                <Route
                  path="recruitment"
                  element={
                    <RoleProtectedRoute allowedRoles={["SUPER_ADMIN", "HR_ADMIN", "HR_STAFF", "RECRUITER", "MANAGER"]}>
                      <RecruitmentPage />
                    </RoleProtectedRoute>
                  }
                />

                {/* Trang Hướng dẫn & Phím tắt */}
                <Route path="help" element={<HelpPage />} />

                {/* Các trang lỗi */}
                <Route path="403" element={<UnauthorizedPage />} />
                <Route path="404" element={<NotFoundPage />} />
                
                {/* Fallback cho các trang chưa phát triển */}
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </QueryClientProvider>
    </ReduxProvider>
  );
};

export default App;
