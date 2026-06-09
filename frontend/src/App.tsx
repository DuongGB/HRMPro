import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Provider as ReduxProvider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider } from "antd";
import viVN from "antd/locale/vi_VN";

import { store } from "./store";
import PrivateRoute from "./components/common/PrivateRoute";
import SidebarLayout from "./components/common/SidebarLayout";
import LoginPage from "./modules/auth/pages/LoginPage";
import DashboardPage from "./modules/dashboard/pages/DashboardPage";
import ChangePasswordPage from "./modules/auth/pages/ChangePasswordPage";

// Khởi tạo Query Client cho React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App: React.FC = () => {
  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider
          locale={viVN}
          theme={{
            token: {
              colorPrimary: "#1890ff", // Xanh công ty
              borderRadius: 6,
              fontFamily: "'Outfit', 'Inter', sans-serif",
            },
          }}
        >
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
                
                {/* Fallback cho các trang chưa phát triển */}
                <Route
                  path="*"
                  element={
                    <div style={{ padding: 24, textAlign: "center" }}>
                      <h2>Trang đang được phát triển</h2>
                    </div>
                  }
                />
              </Route>
            </Routes>
          </BrowserRouter>
        </ConfigProvider>
      </QueryClientProvider>
    </ReduxProvider>
  );
};

export default App;
