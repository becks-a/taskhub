'use client';

import { Form, Input, Button, Card, Typography, App } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../lib/api';
import Link from 'next/link';

const { Title, Text } = Typography;

type FormValues = { email: string; password: string };
interface AuthResponse {
  user: import('../../../context/AuthContext').User;
  accessToken: string;
}

export default function Login() {
  const { login } = useAuth();
  const { message } = App.useApp();

  const onFinish = async (values: FormValues) => {
    try {
      const response = await api.post<FormValues, AuthResponse>('/auth/login', values);
      login(response.user, response.accessToken);
      message.success('Logged in successfully');
    } catch (error: unknown) {
      message.error((error instanceof Error ? error.message : '') || 'Login failed');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.5)', background: '#18181A', borderColor: '#27272A' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2} style={{ margin: 0, color: '#5E6AD2' }}>TaskHub</Title>
          <Text type="secondary">Sign in to your account</Text>
        </div>
        
        <Form name="login" onFinish={onFinish} layout="vertical" size="large">
          <Form.Item name="email" rules={[{ required: true, message: 'Please input your email!' }]}>
            <Input prefix={<UserOutlined />} placeholder="Email" />
          </Form.Item>
          
          <Form.Item name="password" rules={[{ required: true, message: 'Please input your password!' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Sign In
            </Button>
          </Form.Item>
          
          <div style={{ textAlign: 'center' }}>
            <Text>Don&apos;t have an account? <Link href="/register" style={{ color: '#5E6AD2' }}>Sign up</Link></Text>
          </div>
        </Form>
      </Card>
    </div>
  );
}
