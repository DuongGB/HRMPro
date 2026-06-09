import React, { useState } from "react";
import { Layout, Menu, Button, Avatar, Dropdown, Space, Typography, theme } from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  DashboardOutlined,
  TeamOutlined,
  PartitionOutlined,
  CalendarOutlined,
  FormOutlined,
  DollarOutlined,
  BarChartOutlined,
  NotificationOutlined,
  UnlockOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store";
import { logout } from "../../store/slices/authSlice";
import { usePermission } from "../../hooks/usePermission";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const SidebarLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { can } = usePermission();
  const { token } = theme.useToken();

  const handleLogout = () => {
    // Gọi API logout nếu cần, ở đây ta gọi dispatch trước
    dispatch(logout());
    navigate("/login");
  };

  const userMenuItems = [
    {
      key: "profile",
      label: <Link to={`/employees/${user?.employeeId || ""}`}>Hồ sơ của tôi</Link>,
      icon: <UserOutlined />,
    },
    {
      key: "password",
      label: <Link to="/change-password">Đổi mật khẩu</Link>,
      icon: <UnlockOutlined />,
    },
    {
      type: "divider" as const,
    },
    {
      key: "logout",
      label: "Đăng xuất",
      icon: <LogoutOutlined />,
      danger: true,
      onClick: handleLogout,
    },
  ];

  // Xây dựng Menu Sidebar dựa trên phân quyền
  const menuItems = [];

  // Mọi người đều xem được Dashboard
  menuItems.push({
    key: "/",
    icon: <DashboardOutlined />,
    label: <Link to="/">Dashboard</Link>,
  });

  // Module Nhân sự
  if (can("employee:read")) {
    menuItems.push({
      key: "/employees",
      icon: <TeamOutlined />,
      label: <Link to="/employees">Nhân viên</Link>,
    });
  } else {
    // Nhân viên bình thường chỉ xem profile của mình
    menuItems.push({
      key: `/employees/${user?.employeeId || ""}`,
      icon: <UserOutlined />,
      label: <Link to={`/employees/${user?.employeeId || ""}`}>Hồ sơ cá nhân</Link>,
    });
  }

  // Module Tổ chức
  if (can("organization:read")) {
    menuItems.push({
      key: "/organization",
      icon: <PartitionOutlined />,
      label: <Link to="/organization">Cơ cấu tổ chức</Link>,
    });
  }

  // Module Chấm công
  menuItems.push({
    key: "/attendance",
    icon: <CalendarOutlined />,
    label: <Link to="/attendance">Chấm công</Link>,
  });

  // Module Nghỉ phép
  menuItems.push({
    key: "/leaves",
    icon: <FormOutlined />,
    label: <Link to="/leaves">Đơn xin nghỉ</Link>,
  });

  // Module Tính lương
  menuItems.push({
    key: "/payroll",
    icon: <DollarOutlined />,
    label: <Link to="/payroll">Lương & Payslip</Link>,
  });

  // Module Đánh giá hiệu suất
  menuItems.push({
    key: "/performance",
    icon: <BarChartOutlined />,
    label: <Link to="/performance">Đánh giá hiệu suất</Link>,
  });

  // Module Tuyển dụng
  if (can("recruitment:read")) {
    menuItems.push({
      key: "/recruitment",
      icon: <NotificationOutlined />,
      label: <Link to="/recruitment">Tuyển dụng</Link>,
    });
  }

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="light"
        style={{
          boxShadow: "2px 0 8px 0 rgba(29,35,41,.05)",
          zIndex: 10,
        }}
      >
        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            paddingLeft: collapsed ? 0 : 24,
            borderBottom: "1px solid #f0f0f0",
            transition: "all 0.2s",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              background: token.colorPrimary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: "bold",
              fontSize: 16,
            }}
          >
            H
          </div>
          {!collapsed && (
            <span style={{ marginLeft: 12, fontWeight: "bold", fontSize: 18, color: token.colorPrimary }}>
              HRMPro
            </span>
          )}
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{ borderRight: 0, marginTop: 8 }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: "0 24px",
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 1px 4px rgba(0,21,41,.08)",
            zIndex: 9,
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: "16px",
              width: 64,
              height: 64,
            }}
          />
          <Space size={24}>
            <Dropdown menu={{ items: userMenuItems }} trigger={["click"]}>
              <Space style={{ cursor: "pointer" }}>
                <Avatar icon={<UserOutlined />} style={{ backgroundColor: token.colorPrimary }} />
                <Text style={{ fontWeight: 500 }}>{user?.username}</Text>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content
          style={{
            margin: "24px 16px",
            padding: 24,
            background: "#fff",
            borderRadius: 8,
            minHeight: 280,
            overflow: "initial",
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default SidebarLayout;
