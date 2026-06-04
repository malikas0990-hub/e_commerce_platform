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
      message.success('Xush kelibsiz!');
      navigate(data.user.role === 'customer' ? '/products' : '/admin');
    } catch (e) {
      message.error(e.response?.data?.error || 'Kirishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const doRegister = async (v) => {
    setLoading(true);
    try {
      const { data } = await auth.register(v);
      auth.save(data.token, data.user);
      message.success('Ro\'yxatdan o\'tdingiz!');
      navigate('/products');
    } catch (e) {
      message.error(e.response?.data?.error || 'Ro\'yxatdan o\'tishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '60px auto' }}>
      <Card title="Ulgurji Kiyim Platformasi">
        <Alert
          type="info" showIcon style={{ marginBottom: 16 }}
          message="Demo loginlar"
          description={<>Admin: admin@shop.uz / admin123<br />Mijoz: customer@shop.uz / customer123</>}
        />
        <Tabs
          items={[
            {
              key: 'login', label: 'Kirish',
              children: (
                <Form layout="vertical" onFinish={doLogin}>
                  <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                    <Input placeholder="admin@shop.uz" />
                  </Form.Item>
                  <Form.Item name="password" label="Parol" rules={[{ required: true }]}>
                    <Input.Password placeholder="admin123" />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" block loading={loading}>Kirish</Button>
                </Form>
              ),
            },
            {
              key: 'register', label: 'Ro\'yxatdan o\'tish',
              children: (
                <Form layout="vertical" onFinish={doRegister}>
                  <Form.Item name="name" label="Ism" rules={[{ required: true }]}><Input /></Form.Item>
                  <Form.Item name="company" label="Kompaniya"><Input /></Form.Item>
                  <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item>
                  <Form.Item name="password" label="Parol" rules={[{ required: true, min: 6 }]}><Input.Password /></Form.Item>
                  <Button type="primary" htmlType="submit" block loading={loading}>Ro'yxatdan o'tish</Button>
                </Form>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
