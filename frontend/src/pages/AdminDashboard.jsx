import React, { useEffect, useState, useCallback } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Select, Spin, Tabs, message, Form, Input, InputNumber, Button, Modal, Popconfirm, Image } from 'antd';
import { ShoppingOutlined, UserOutlined, DollarOutlined, ClockCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { io } from 'socket.io-client';
import { admin, orders as ordersApi, staff as staffApi, products as productsApi, auth } from '../services/api';

const STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const statusColor = { pending: 'orange', confirmed: 'blue', shipped: 'cyan', delivered: 'green', cancelled: 'red' };
const roleColor = { superadmin: 'magenta', admin: 'geekblue', manager: 'green', customer: 'default' };
const toArr = (v) => Array.isArray(v) ? v : (v ? String(v).split(',').map((s) => s.trim()).filter(Boolean) : []);

export default function AdminDashboard() {
  const me = auth.getUser();
  const [stats, setStats] = useState({});
  const [analytics, setAnalytics] = useState({ trend: [], categories: [] });
  const [orderList, setOrderList] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [productList, setProductList] = useState([]);
  const [loading, setLoading] = useState(false);

  // staff modal
  const [staffModal, setStaffModal] = useState(false);
  const [staffForm] = Form.useForm();
  // product modal
  const [prodModal, setProdModal] = useState(false);
  const [editingProd, setEditingProd] = useState(null);
  const [prodForm] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const calls = [admin.stats(), admin.analytics(), admin.orders(), admin.customers(), productsApi.list({ limit: 100 })];
      if (me?.role === 'superadmin') calls.push(staffApi.list());
      const [s, a, o, c, p, st] = await Promise.all(calls);
      setStats(s.data); setAnalytics(a.data); setOrderList(o.data); setCustomers(c.data);
      setProductList(p.data.data || []);
      if (st) setStaffList(st.data);
    } catch {
      message.error('Failed to load data');
    } finally { setLoading(false); }
  }, [me?.role]);

  useEffect(() => {
    load();
    const socket = io(import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : '/', { path: '/socket.io' });
    socket.on('order:new', () => { message.info('🔔 New order received!'); load(); });
    socket.on('order:updated', load);
    return () => socket.disconnect();
  }, [load]);

  const changeStatus = async (id, status) => {
    try { await ordersApi.setStatus(id, status); message.success('Status updated'); load(); }
    catch { message.error('Error'); }
  };

  const changePayment = async (id, paymentStatus) => {
    try { await ordersApi.setPayment(id, paymentStatus); message.success('Payment status updated'); load(); }
    catch (e) { message.error(e.response?.data?.error || 'Error'); }
  };

  const deleteStaff = async (id) => {
    try { await staffApi.remove(id); message.success('Staff member deleted'); load(); }
    catch (e) { message.error(e.response?.data?.error || 'Error'); }
  };

  /* ---------- STAFF ---------- */
  const createStaff = async (v) => {
    try { await staffApi.create(v); message.success('Staff member added'); setStaffModal(false); staffForm.resetFields(); load(); }
    catch (e) { message.error(e.response?.data?.error || 'Error'); }
  };

  /* ---------- PRODUCTS ---------- */
  const openNewProduct = () => { setEditingProd(null); prodForm.resetFields(); setProdModal(true); };
  const openEditProduct = (p) => {
    setEditingProd(p);
    prodForm.setFieldsValue({ ...p, price: Number(p.price), cost: Number(p.cost), sizes: (p.sizes || []).join(', '), colors: (p.colors || []).join(', ') });
    setProdModal(true);
  };
  const saveProduct = async (v) => {
    const payload = { ...v, sizes: toArr(v.sizes), colors: toArr(v.colors) };
    try {
      if (editingProd) { await productsApi.update(editingProd.id, payload); message.success('Product updated'); }
      else { await productsApi.create(payload); message.success('Product added'); }
      setProdModal(false); prodForm.resetFields(); setEditingProd(null); load();
    } catch (e) { message.error(e.response?.data?.error || 'Error'); }
  };
  const deleteProduct = async (id) => {
    try { await productsApi.remove(id); message.success('Deleted'); load(); }
    catch (e) { message.error(e.response?.data?.error || 'Delete failed (admin only)'); }
  };

  /* ---------- TABS ---------- */
  const dashboardTab = (
    <Spin spinning={loading}>
      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}><Card><Statistic title="Orders" value={stats.totalOrders || 0} prefix={<ShoppingOutlined />} /></Card></Col>
        <Col xs={12} md={6}><Card><Statistic title="Customers" value={stats.totalCustomers || 0} prefix={<UserOutlined />} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col xs={12} md={6}><Card><Statistic title="Revenue" value={stats.totalRevenue || 0} suffix="UZS" prefix={<DollarOutlined />} valueStyle={{ color: '#faad14' }} /></Card></Col>
        <Col xs={12} md={6}><Card><Statistic title="Pending" value={stats.pendingOrders || 0} prefix={<ClockCircleOutlined />} valueStyle={{ color: '#f5222d' }} /></Card></Col>
      </Row>
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={12}><Card title="Sales trend (7 days)">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={analytics.trend}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis /><Tooltip /><Line type="monotone" dataKey="sales" stroke="#1677ff" /></LineChart>
          </ResponsiveContainer></Card></Col>
        <Col xs={24} md={12}><Card title="Products by category">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={analytics.categories}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="category" /><YAxis /><Tooltip /><Bar dataKey="count" fill="#722ed1" /></BarChart>
          </ResponsiveContainer></Card></Col>
      </Row>
    </Spin>
  );

  const productsTab = (
    <div>
      <Button type="primary" icon={<PlusOutlined />} style={{ marginBottom: 16 }} onClick={openNewProduct}>New product</Button>
      <Table rowKey="id" loading={loading} dataSource={productList} scroll={{ x: 800 }}
        columns={[
          { title: 'Image', dataIndex: 'image', render: (src) => src ? <Image src={src} width={48} height={48} style={{ objectFit: 'cover' }} /> : '—' },
          { title: 'Name', dataIndex: 'name' },
          { title: 'Category', dataIndex: 'category', render: (c) => <Tag>{c}</Tag> },
          { title: 'Price', dataIndex: 'price', render: (p) => `${Number(p).toLocaleString()} UZS` },
          { title: 'Stock', dataIndex: 'stock', render: (s) => <Tag color={s > 0 ? 'green' : 'red'}>{s}</Tag> },
          { title: 'SKU', dataIndex: 'sku' },
          { title: 'Actions', render: (_, r) => (
            <>
              <Button size="small" onClick={() => openEditProduct(r)} style={{ marginRight: 8 }}>Edit</Button>
              {me?.role === 'superadmin' || me?.role === 'admin' ? (
                <Popconfirm title="Delete?" okText="Yes" cancelText="No" onConfirm={() => deleteProduct(r.id)}>
                  <Button size="small" danger>Delete</Button>
                </Popconfirm>
              ) : null}
            </>
          ) },
        ]} />
    </div>
  );

  const ordersTab = (
    <Table rowKey="id" loading={loading} dataSource={orderList} scroll={{ x: 700 }}
      columns={[
        { title: 'Number', dataIndex: 'orderNumber' },
        { title: 'Customer', dataIndex: 'customerName' },
        { title: 'Total', dataIndex: 'totalPrice', render: (p) => `${Number(p).toLocaleString()} UZS` },
        { title: 'Payment', dataIndex: 'paymentStatus', render: (p, r) => (
          <Select size="small" value={p} style={{ width: 110 }} onChange={(v) => changePayment(r.id, v)}
            options={[{ value: 'unpaid', label: 'unpaid' }, { value: 'paid', label: 'paid' }, { value: 'refunded', label: 'refunded' }]} />
        ) },
        { title: 'Status', dataIndex: 'status', render: (s, r) => (
          <Select size="small" value={s} style={{ width: 130 }} onChange={(v) => changeStatus(r.id, v)}
            options={STATUSES.map((x) => ({ value: x, label: x }))} />
        ) },
        { title: 'Date', dataIndex: 'createdAt', render: (d) => new Date(d).toLocaleDateString('en-US') },
      ]} />
  );

  const crmTab = (
    <Table rowKey="id" loading={loading} dataSource={customers} scroll={{ x: 700 }}
      columns={[
        { title: 'Customer', render: (_, r) => r.User?.name || '—' },
        { title: 'Email', render: (_, r) => r.User?.email || '—' },
        { title: 'Company', dataIndex: 'company' },
        { title: 'Phone', dataIndex: 'phone' },
        { title: 'Status', dataIndex: 'status', render: (s) => <Tag color={s === 'vip' ? 'gold' : s === 'active' ? 'green' : 'default'}>{s}</Tag> },
        { title: 'Total spent', dataIndex: 'totalSpent', render: (v) => `${Number(v).toLocaleString()} UZS` },
      ]} />
  );

  const staffTab = (
    <div>
      <Button type="primary" icon={<PlusOutlined />} style={{ marginBottom: 16 }} onClick={() => setStaffModal(true)}>New staff (admin/manager)</Button>
      <Table rowKey="id" loading={loading} dataSource={staffList} scroll={{ x: 600 }}
        columns={[
          { title: 'Name', dataIndex: 'name' },
          { title: 'Email', dataIndex: 'email' },
          { title: 'Role', dataIndex: 'role', render: (r, row) => (
            <Select size="small" value={r} style={{ width: 130 }} disabled={r === 'superadmin'}
              onChange={async (v) => { try { await staffApi.setRole(row.id, v); message.success('Role updated'); load(); } catch (e) { message.error(e.response?.data?.error || 'Error'); } }}
              options={['admin', 'manager', 'customer'].map((x) => ({ value: x, label: x }))} />
          ) },
          { title: 'Created', dataIndex: 'createdAt', render: (d) => new Date(d).toLocaleDateString('en-US') },
          { title: 'Action', render: (_, row) => row.role === 'superadmin' ? null : (
            <Popconfirm title="Delete this staff member?" okText="Yes" cancelText="No" onConfirm={() => deleteStaff(row.id)}>
              <Button size="small" danger>Delete</Button>
            </Popconfirm>
          ) },
        ]} />
    </div>
  );

  const tabs = [
    { key: 'dash', label: 'Dashboard', children: dashboardTab },
    { key: 'products', label: 'Products', children: productsTab },
    { key: 'orders', label: 'Orders', children: ordersTab },
    { key: 'crm', label: 'CRM (Customers)', children: crmTab },
  ];
  if (me?.role === 'superadmin') tabs.push({ key: 'staff', label: 'Staff (RBAC)', children: staffTab });

  return (
    <div>
      <h1>📊 CRM Management Panel <Tag color={roleColor[me?.role]}>{me?.role}</Tag></h1>
      <Tabs items={tabs} />

      {/* Staff modal */}
      <Modal title="Add new staff" open={staffModal} onCancel={() => setStaffModal(false)} onOk={() => staffForm.submit()} okText="Add">
        <Form form={staffForm} layout="vertical" onFinish={createStaff}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true, min: 6 }]}><Input.Password /></Form.Item>
          <Form.Item name="role" label="Role" initialValue="manager" rules={[{ required: true }]}>
            <Select options={[{ value: 'admin', label: 'Admin' }, { value: 'manager', label: 'Manager' }]} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Product modal */}
      <Modal title={editingProd ? 'Edit product' : 'New product'} open={prodModal} onCancel={() => { setProdModal(false); setEditingProd(null); }} onOk={() => prodForm.submit()} okText="Save" width={600}>
        <Form form={prodForm} layout="vertical" onFinish={saveProduct}>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="category" label="Category" rules={[{ required: true }]}><Input placeholder="Shirt, Trousers..." /></Form.Item></Col>
            <Col span={12}><Form.Item name="price" label="Price (UZS)" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}><Form.Item name="cost" label="Cost" initialValue={0}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}><Form.Item name="stock" label="Stock (units)" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}><Form.Item name="sku" label="SKU (code)" rules={[{ required: true }]}><Input placeholder="SHRT-007" /></Form.Item></Col>
            <Col span={12}><Form.Item name="sizes" label="Sizes (comma-separated)"><Input placeholder="S, M, L, XL" /></Form.Item></Col>
            <Col span={12}><Form.Item name="colors" label="Colors (comma-separated)"><Input placeholder="Black, White" /></Form.Item></Col>
            <Col span={24}><Form.Item name="image" label="Image URL"><Input placeholder="https://..." /></Form.Item></Col>
            <Col span={24}><Form.Item name="description" label="Description"><Input.TextArea rows={2} /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
