import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Provider as ReduxProvider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

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
                
                {/* Fallback cho các trang chưa phát triển */}
                <Route
                  path="*"
                  element={
                    <div className="p-6 text-center">
                      <h2 className="text-xl font-semibold">Trang đang được phát triển</h2>
                    </div>
                  }
                />
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
