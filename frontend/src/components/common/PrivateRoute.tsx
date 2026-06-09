import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "../../store";
import { Result, Button } from "antd";

interface PrivateRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const location = useLocation();

  if (!isAuthenticated) {
    // Lưu lại vị trí trang hiện tại để sau khi đăng nhập xong tự động điều hướng quay lại
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user) {
    const hasPermission = user.roles.some((role) => allowedRoles.includes(role));
    if (!hasPermission) {
      return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
          <Result
            status="403"
            title="403"
            subTitle="Xin lỗi, bạn không có quyền truy cập trang này."
            extra={
              <Button type="primary" onClick={() => window.history.back()}>
                Quay lại
              </Button>
            }
          />
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default PrivateRoute;
