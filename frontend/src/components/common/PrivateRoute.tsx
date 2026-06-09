import React from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAppSelector } from "../../store";
import { Button } from "@/components/ui/button";

interface PrivateRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const location = useLocation();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    // Lưu lại vị trí trang hiện tại để sau khi đăng nhập xong tự động điều hướng quay lại
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user) {
    const hasPermission = user.roles.some((role) => allowedRoles.includes(role));
    if (!hasPermission) {
      return (
        <div className="flex flex-col justify-center items-center h-screen bg-muted/40">
          <div className="text-center space-y-4">
            <h1 className="text-6xl font-bold text-primary">403</h1>
            <h2 className="text-2xl font-semibold tracking-tight">Từ chối truy cập</h2>
            <p className="text-muted-foreground">Xin lỗi, bạn không có quyền truy cập trang này.</p>
            <Button onClick={() => navigate(-1)} className="mt-4">
              Quay lại
            </Button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default PrivateRoute;
