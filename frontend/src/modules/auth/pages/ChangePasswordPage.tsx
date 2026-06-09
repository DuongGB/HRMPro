import React from "react";
import { Form, Input, Button, Card, Typography, message, Row, Col } from "antd";
import { LockOutlined } from "@ant-design/icons";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "../api/authApi";
import { useNavigate } from "react-router-dom";
import type { ChangePasswordRequest } from "../types";

const { Title, Paragraph } = Typography;

const ChangePasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const changePwdMutation = useMutation({
    mutationFn: (data: ChangePasswordRequest) => authApi.changePassword(data),
    onSuccess: () => {
      message.success("Thay đổi mật khẩu thành công!");
      form.resetFields();
      navigate("/");
    },
    onError: (error: any) => {
      message.error(error.message || "Thay đổi mật khẩu thất bại, vui lòng thử lại!");
    },
  });

  const onFinish = (values: any) => {
    changePwdMutation.mutate({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    });
  };

  return (
    <Row justify="center">
      <Col xs={24} sm={20} md={16} lg={12}>
        <Card bordered={false} style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.05)", borderRadius: 8 }}>
          <div style={{ marginBottom: 24 }}>
            <Title level={3} style={{ margin: 0 }}>Đổi mật khẩu</Title>
            <Paragraph type="secondary">Vui lòng nhập mật khẩu cũ và mật khẩu mới của bạn.</Paragraph>
          </div>

          <Form
            form={form}
            name="change_password_form"
            layout="vertical"
            onFinish={onFinish}
            size="large"
          >
            <Form.Item
              label="Mật khẩu hiện tại"
              name="currentPassword"
              rules={[{ required: true, message: "Vui lòng nhập mật khẩu hiện tại!" }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: "#bfbfbf" }} />}
                placeholder="Mật khẩu hiện tại"
              />
            </Form.Item>

            <Form.Item
              label="Mật khẩu mới"
              name="newPassword"
              rules={[
                { required: true, message: "Vui lòng nhập mật khẩu mới!" },
                { min: 6, message: "Mật khẩu mới phải có tối thiểu 6 ký tự!" }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: "#bfbfbf" }} />}
                placeholder="Mật khẩu mới"
              />
            </Form.Item>

            <Form.Item
              label="Xác nhận mật khẩu mới"
              name="confirmPassword"
              dependencies={["newPassword"]}
              rules={[
                { required: true, message: "Vui lòng xác nhận mật khẩu mới!" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("newPassword") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("Mật khẩu xác nhận không khớp!"));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: "#bfbfbf" }} />}
                placeholder="Xác nhận mật khẩu mới"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={changePwdMutation.isPending}
                block
                style={{ height: 44, borderRadius: 6 }}
              >
                Đổi mật khẩu
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Col>
    </Row>
  );
};

export default ChangePasswordPage;
