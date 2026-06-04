import React, { useState } from 'react';
import { Card, Form, Input, Button, Tabs, message, Alert } from 'antd';
import { useNavigate } from 'react-router-dom';
import { auth } from '../services/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const doLogin = async (v) => {
    setLoading(true);
    try {
      const { data } = await auth.login(v.email, v.password);
      auth.save(data.token, data.user);
      message.success('Welcome!');
      navigate(data.user.role === 'customer' ? '/products' : '/admin');
    } catch (e) {
      message.error(e.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const doRegister = async (v) => {
    setLoading(true);
    try {
      const { data } = await auth.register(v);
      auth.save(data.token, data.user);
      message.success('Registration successful!');
      navigate('/products');
    } catch (e) {
      message.error(e.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '60px auto' }}>
      <Card title="Wholesale Clothing Platform">
        <Alert
          type="info" showIcon style={{ marginBottom: 16 }}
          message="Demo logins"
          description={<>Admin: admin@shop.uz / admin123<br />Customer: customer@shop.uz / customer123</>}
        />
        <Tabs
          items={[
            {
              key: 'login', label: 'Log in',
              children: (
                <Form layout="vertical" onFinish={doLogin}>
                  <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                    <Input placeholder="admin@shop.uz" />
                  </Form.Item>
                  <Form.Item name="password" label="Password" rules={[{ required: true }]}>
                    <Input.Password placeholder="admin123" />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" block loading={loading}>Log in</Button>
                </Form>
              ),
            },
            {
              key: 'register', label: 'Register',
              children: (
                <Form layout="vertical" onFinish={doRegister}>
                  <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
                  <Form.Item name="company" label="Company"><Input /></Form.Item>
                  <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item>
                  <Form.Item name="password" label="Password" rules={[{ required: true, min: 6 }]}><Input.Password /></Form.Item>
                  <Button type="primary" htmlType="submit" block loading={loading}>Register</Button>
                </Form>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
