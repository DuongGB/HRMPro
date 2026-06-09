import React from "react";
import { Form, Input, Button, Card, Typography, message, Row, Col, theme } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "../api/authApi";
import { useAppDispatch } from "../../../store";
import { loginFailure, loginStart, loginSuccess } from "../../../store/slices/authSlice";
import { useNavigate, useLocation } from "react-router-dom";
import type { LoginRequest } from "../types";

const { Title, Text } = Typography;

const LoginPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = theme.useToken();

  // Lấy đường dẫn trước đó để quay lại sau khi đăng nhập thành công
  const from = (location.state as any)?.from?.pathname || "/";

  const loginMutation = useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onMutate: () => {
      dispatch(loginStart());
    },
    onSuccess: (data) => {
      dispatch(loginSuccess(data));
      message.success("Đăng nhập thành công!");
      navigate(from, { replace: true });
    },
    onError: (error: any) => {
      dispatch(loginFailure());
      message.error(error.message || "Đăng nhập thất bại, vui lòng thử lại!");
    },
  });

  const onFinish = (values: any) => {
    loginMutation.mutate({
      username: values.username,
      password: values.password,
    });
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
      }}
    >
      <Row justify="center" style={{ width: "100%", padding: "0 16px" }}>
        <Col xs={24} sm={18} md={12} lg={8}>
          <Card
            bordered={false}
            style={{
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.05)",
              borderRadius: 16,
              padding: "24px 12px",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: token.colorPrimary,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: 24,
                  marginBottom: 16,
                }}
              >
                H
              </div>
              <Title level={2} style={{ margin: 0, fontWeight: 700 }}>
                Chào mừng trở lại!
              </Title>
              <Text type="secondary">Đăng nhập để tiếp tục truy cập HRMPro</Text>
            </div>

            <Form name="login_form" initialValues={{ remember: true }} onFinish={onFinish} size="large">
              <Form.Item
                name="username"
                rules={[{ required: true, message: "Vui lòng nhập tên đăng nhập!" }]}
              >
                <Input prefix={<UserOutlined style={{ color: "#bfbfbf" }} />} placeholder="Tên đăng nhập" />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[{ required: true, message: "Vui lòng nhập mật khẩu!" }]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: "#bfbfbf" }} />}
                  placeholder="Mật khẩu"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loginMutation.isPending}
                  block
                  style={{
                    height: 48,
                    borderRadius: 8,
                    fontSize: 16,
                    fontWeight: 600,
                    boxShadow: "0 4px 10px rgba(24, 144, 255, 0.2)",
                  }}
                >
                  Đăng nhập
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default LoginPage;
