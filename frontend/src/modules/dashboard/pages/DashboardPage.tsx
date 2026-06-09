import React from "react";
import { Typography, Row, Col, Card, Statistic, theme } from "antd";
import { UserOutlined, CalendarOutlined, TeamOutlined, ScheduleOutlined } from "@ant-design/icons";
import { useAppSelector } from "../../../store";

const { Title, Paragraph } = Typography;

const DashboardPage: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { token } = theme.useToken();

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          Xin chào, {user?.username}!
        </Title>
        <Paragraph type="secondary">Chào mừng bạn quay trở lại với Hệ thống Quản lý Nhân sự HRMPro.</Paragraph>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <Statistic
              title="Tổng số nhân viên"
              value={150}
              prefix={<TeamOutlined style={{ color: token.colorPrimary }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <Statistic
              title="Đi muộn hôm nay"
              value={3}
              valueStyle={{ color: "#cf1322" }}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <Statistic
              title="Đơn nghỉ chờ duyệt"
              value={5}
              valueStyle={{ color: "#d46b08" }}
              prefix={<ScheduleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <Statistic
              title="Chiến dịch tuyển dụng"
              value={4}
              prefix={<UserOutlined style={{ color: "#3f8600" }} />}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
