
'use client';

import { Row, Col, Card, Statistic, Typography } from 'antd';
import {
  ProjectOutlined,
  CheckSquareOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';

const { Title } = Typography;

export default function Dashboard() {
  const { user } = useAuth();

  // Fetch projects from the backend
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get<unknown[]>('/projects'),
  });

  // Fetch tasks from the backend
  const { data: tasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.get<unknown[]>('/tasks'),
  });

  return (
    <div>
      <Title level={2}>
        Welcome back, {user?.firstName}!
      </Title>

      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Active Projects"
              value={projects?.length ?? 0}
              prefix={<ProjectOutlined />}
            />
          </Card>
        </Col>

        <Col span={8}>
          <Card>
            <Statistic
              title="Total Tasks"
              value={tasks?.length ?? 0}
              prefix={<CheckSquareOutlined />}
            />
          </Card>
        </Col>

        <Col span={8}>
          <Card>
            <Statistic
              title="Team Members"
              value={user?.role === 'admin' ? 10 : 3}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
