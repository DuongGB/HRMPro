import React from "react";
import { Navigate } from "react-router-dom";
import { useAppSelector } from "../../store";

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const hasPermission = user.roles.some((role) => allowedRoles.includes(role));
  if (!hasPermission) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
};

export default RoleProtectedRoute;
