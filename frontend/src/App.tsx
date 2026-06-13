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
import UnauthorizedPage from "./components/common/UnauthorizedPage";
import NotFoundPage from "./components/common/NotFoundPage";
import OrgChartPage from "./modules/organization/pages/OrgChartPage";
import EmployeeListPage from "./modules/employee/pages/EmployeeListPage";
import EmployeeDetailPage from "./modules/employee/pages/EmployeeDetailPage";
import AttendancePage from "./modules/attendance/pages/AttendancePage";

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
