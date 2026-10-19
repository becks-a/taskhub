'use client';

import { Form, Input, Button, Card, Typography, App } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../lib/api';
import Link from 'next/link';

const { Title, Text } = Typography;

type FormValues = { firstName: string; lastName: string; email: string; password: string };
interface AuthResponse {
  user: import('../../../context/AuthContext').User;
  accessToken: string;
}

export default function Register() {
  const { login } = useAuth();
  const { message } = App.useApp();

  const onFinish = async (values: FormValues) => {
    try {
      const response = await api.post<FormValues, AuthResponse>('/auth/register', values);
      login(response.user, response.accessToken);
      message.success('Registered successfully');
    } catch (error: unknown) {
      message.error((error instanceof Error ? error.message : '') || 'Registration failed');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.5)', background: '#18181A', borderColor: '#27272A' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2} style={{ margin: 0, color: '#5E6AD2' }}>TaskHub</Title>
          <Text type="secondary">Create a new account</Text>
        </div>
        
        <Form name="register" onFinish={onFinish} layout="vertical" size="large">
          <Form.Item name="firstName" rules={[{ required: true, message: 'Please input your first name!' }]}>
            <Input placeholder="First Name" />
          </Form.Item>

          <Form.Item name="lastName" rules={[{ required: true, message: 'Please input your last name!' }]}>
            <Input placeholder="Last Name" />
          </Form.Item>

          <Form.Item name="email" rules={[{ required: true, message: 'Please input your email!' }]}>
            <Input prefix={<UserOutlined />} placeholder="Email" />
          </Form.Item>
          
          <Form.Item name="password" rules={[{ required: true, message: 'Please input your password!' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Sign Up
            </Button>
          </Form.Item>
          
          <div style={{ textAlign: 'center' }}>
            <Text>Already have an account? <Link href="/login" style={{ color: '#5E6AD2' }}>Sign in</Link></Text>
          </div>
        </Form>
      </Card>
    </div>
  );
}
