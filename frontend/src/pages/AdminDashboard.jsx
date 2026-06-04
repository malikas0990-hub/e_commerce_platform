import React, { useEffect, useState, useCallback } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Select, Spin, Tabs, message, Form, Input, Button, Modal } from 'antd';
import { ShoppingOutlined, UserOutlined, DollarOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { io } from 'socket.io-client';
import { admin, orders as ordersApi, staff as staffApi, auth } from '../services/api';

const STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const statusColor = { pending: 'orange', confirmed: 'blue', shipped: 'cyan', delivered: 'green', cancelled: 'red' };
const roleColor = { superadmin: 'magenta', admin: 'geekblue', manager: 'green', customer: 'default' };

export default function AdminDashboard() {
  const me = auth.getUser();
  const [stats, setStats] = useState({});
  const [analytics, setAnalytics] = useState({ trend: [], categories: [] });
  const [orderList, setOrderList] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const calls = [admin.stats(), admin.analytics(), admin.orders(), admin.customers()];
      if (me?.role === 'superadmin') calls.push(staffApi.list());
      const [s, a, o, c, st] = await Promise.all(calls);
      setStats(s.data); setAnalytics(a.data); setOrderList(o.data); setCustomers(c.data);
      if (st) setStaffList(st.data);
    } catch {
      message.error("Ma'lumotlarni yuklashda xatolik");
    } finally { setLoading(false); }
  }, [me?.role]);

  useEffect(() => {
    load();
    const socket = io(import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : '/', { path: '/socket.io' });
    socket.on('order:new', () => { message.info('🔔 Yangi buyurtma tushdi!'); load(); });
    socket.on('order:updated', load);
    return () => socket.disconnect();
  }, [load]);

  const changeStatus = async (id, status) => {
    try { await ordersApi.setStatus(id, status); message.success('Status yangilandi'); load(); }
    catch { message.error('Xatolik'); }
  };

  const createStaff = async (v) => {
    try { await staffApi.create(v); message.success('Xodim qo\'shildi'); setModalOpen(false); form.resetFields(); load(); }
    catch (e) { message.error(e.response?.data?.error || 'Xatolik'); }
  };

  const dashboardTab = (
    <Spin spinning={loading}>
      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}><Card><Statistic title="Buyurtmalar" value={stats.totalOrders || 0} prefix={<ShoppingOutlined />} /></Card></Col>
        <Col xs={12} md={6}><Card><Statistic title="Mijozlar" value={stats.totalCustomers || 0} prefix={<UserOutlined />} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col xs={12} md={6}><Card><Statistic title="Daromad" value={stats.totalRevenue || 0} suffix="so'm" prefix={<DollarOutlined />} valueStyle={{ color: '#faad14' }} /></Card></Col>
        <Col xs={12} md={6}><Card><Statistic title="Kutilmoqda" value={stats.pendingOrders || 0} prefix={<ClockCircleOutlined />} valueStyle={{ color: '#f5222d' }} /></Card></Col>
      </Row>
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={12}><Card title="Sotuvlar trendi (7 kun)">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={analytics.trend}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis /><Tooltip /><Line type="monotone" dataKey="sales" stroke="#1677ff" /></LineChart>
          </ResponsiveContainer></Card></Col>
        <Col xs={24} md={12}><Card title="Toifalar bo'yicha mahsulotlar">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={analytics.categories}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="category" /><YAxis /><Tooltip /><Bar dataKey="count" fill="#722ed1" /></BarChart>
          </ResponsiveContainer></Card></Col>
      </Row>
    </Spin>
  );

  const ordersTab = (
    <Table rowKey="id" loading={loading} dataSource={orderList}
      columns={[
        { title: 'Raqam', dataIndex: 'orderNumber' },
        { title: 'Mijoz', dataIndex: 'customerName' },
        { title: 'Jami', dataIndex: 'totalPrice', render: (p) => `${Number(p).toLocaleString()} so'm` },
        { title: 'To\'lov', dataIndex: 'paymentStatus' },
        { title: 'Status', dataIndex: 'status', render: (s, r) => (
          <Select size="small" value={s} style={{ width: 130 }} onChange={(v) => changeStatus(r.id, v)}
            options={STATUSES.map((x) => ({ value: x, label: x }))} />
        ) },
        { title: 'Sana', dataIndex: 'createdAt', render: (d) => new Date(d).toLocaleDateString('uz-UZ') },
      ]} />
  );

  const crmTab = (
    <Table rowKey="id" loading={loading} dataSource={customers}
      columns={[
        { title: 'Mijoz', render: (_, r) => r.User?.name || '—' },
        { title: 'Email', render: (_, r) => r.User?.email || '—' },
        { title: 'Kompaniya', dataIndex: 'company' },
        { title: 'Telefon', dataIndex: 'phone' },
        { title: 'Status', dataIndex: 'status', render: (s) => <Tag color={s === 'vip' ? 'gold' : s === 'active' ? 'green' : 'default'}>{s}</Tag> },
        { title: 'Jami xarid', dataIndex: 'totalSpent', render: (v) => `${Number(v).toLocaleString()} so'm` },
      ]} />
  );

  const staffTab = (
    <div>
      <Button type="primary" style={{ marginBottom: 16 }} onClick={() => setModalOpen(true)}>+ Yangi xodim (admin/manager)</Button>
      <Table rowKey="id" loading={loading} dataSource={staffList}
        columns={[
          { title: 'Ism', dataIndex: 'name' },
          { title: 'Email', dataIndex: 'email' },
          { title: 'Rol', dataIndex: 'role', render: (r, row) => (
            <Select size="small" value={r} style={{ width: 130 }} disabled={r === 'superadmin'}
              onChange={async (v) => { try { await staffApi.setRole(row.id, v); message.success('Rol yangilandi'); load(); } catch (e) { message.error(e.response?.data?.error || 'Xatolik'); } }}
              options={['admin', 'manager', 'customer'].map((x) => ({ value: x, label: x }))} />
          ) },
          { title: 'Yaratilgan', dataIndex: 'createdAt', render: (d) => new Date(d).toLocaleDateString('uz-UZ') },
        ]} />
      <Modal title="Yangi xodim qo'shish" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()} okText="Qo'shish">
        <Form form={form} layout="vertical" onFinish={createStaff}>
          <Form.Item name="name" label="Ism" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item>
          <Form.Item name="password" label="Parol" rules={[{ required: true, min: 6 }]}><Input.Password /></Form.Item>
          <Form.Item name="role" label="Rol" initialValue="manager" rules={[{ required: true }]}>
            <Select options={[{ value: 'admin', label: 'Admin' }, { value: 'manager', label: 'Manager' }]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );

  const tabs = [
    { key: 'dash', label: 'Dashboard', children: dashboardTab },
    { key: 'orders', label: 'Buyurtmalar', children: ordersTab },
    { key: 'crm', label: 'CRM (Mijozlar)', children: crmTab },
  ];
  if (me?.role === 'superadmin') tabs.push({ key: 'staff', label: 'Xodimlar (RBAC)', children: staffTab });

  return (
    <div>
      <h1>📊 CRM Boshqaruv Paneli <Tag color={roleColor[me?.role]}>{me?.role}</Tag></h1>
      <Tabs items={tabs} />
    </div>
  );
}
