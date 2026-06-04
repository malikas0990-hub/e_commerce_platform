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

  const changePayment = async (id, paymentStatus) => {
    try { await ordersApi.setPayment(id, paymentStatus); message.success("To'lov holati yangilandi"); load(); }
    catch (e) { message.error(e.response?.data?.error || 'Xatolik'); }
  };

  const deleteStaff = async (id) => {
    try { await staffApi.remove(id); message.success("Xodim o'chirildi"); load(); }
    catch (e) { message.error(e.response?.data?.error || 'Xatolik'); }
  };

  /* ---------- STAFF ---------- */
  const createStaff = async (v) => {
    try { await staffApi.create(v); message.success("Xodim qo'shildi"); setStaffModal(false); staffForm.resetFields(); load(); }
    catch (e) { message.error(e.response?.data?.error || 'Xatolik'); }
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
      if (editingProd) { await productsApi.update(editingProd.id, payload); message.success('Mahsulot yangilandi'); }
      else { await productsApi.create(payload); message.success("Mahsulot qo'shildi"); }
      setProdModal(false); prodForm.resetFields(); setEditingProd(null); load();
    } catch (e) { message.error(e.response?.data?.error || 'Xatolik'); }
  };
  const deleteProduct = async (id) => {
    try { await productsApi.remove(id); message.success("O'chirildi"); load(); }
    catch (e) { message.error(e.response?.data?.error || "O'chirishda xatolik (faqat admin)"); }
  };

  /* ---------- TABS ---------- */
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

  const productsTab = (
    <div>
      <Button type="primary" icon={<PlusOutlined />} style={{ marginBottom: 16 }} onClick={openNewProduct}>Yangi mahsulot</Button>
      <Table rowKey="id" loading={loading} dataSource={productList} scroll={{ x: 800 }}
        columns={[
          { title: 'Rasm', dataIndex: 'image', render: (src) => src ? <Image src={src} width={48} height={48} style={{ objectFit: 'cover' }} /> : '—' },
          { title: 'Nomi', dataIndex: 'name' },
          { title: 'Toifa', dataIndex: 'category', render: (c) => <Tag>{c}</Tag> },
          { title: 'Narx', dataIndex: 'price', render: (p) => `${Number(p).toLocaleString()} so'm` },
          { title: 'Ombor', dataIndex: 'stock', render: (s) => <Tag color={s > 0 ? 'green' : 'red'}>{s}</Tag> },
          { title: 'SKU', dataIndex: 'sku' },
          { title: 'Amallar', render: (_, r) => (
            <>
              <Button size="small" onClick={() => openEditProduct(r)} style={{ marginRight: 8 }}>Tahrirlash</Button>
              {me?.role === 'superadmin' || me?.role === 'admin' ? (
                <Popconfirm title="O'chirilsinmi?" okText="Ha" cancelText="Yo'q" onConfirm={() => deleteProduct(r.id)}>
                  <Button size="small" danger>O'chirish</Button>
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
        { title: 'Raqam', dataIndex: 'orderNumber' },
        { title: 'Mijoz', dataIndex: 'customerName' },
        { title: 'Jami', dataIndex: 'totalPrice', render: (p) => `${Number(p).toLocaleString()} so'm` },
        { title: "To'lov", dataIndex: 'paymentStatus', render: (p, r) => (
          <Select size="small" value={p} style={{ width: 110 }} onChange={(v) => changePayment(r.id, v)}
            options={[{ value: 'unpaid', label: "to'lanmagan" }, { value: 'paid', label: "to'langan" }, { value: 'refunded', label: 'qaytarilgan' }]} />
        ) },
        { title: 'Status', dataIndex: 'status', render: (s, r) => (
          <Select size="small" value={s} style={{ width: 130 }} onChange={(v) => changeStatus(r.id, v)}
            options={STATUSES.map((x) => ({ value: x, label: x }))} />
        ) },
        { title: 'Sana', dataIndex: 'createdAt', render: (d) => new Date(d).toLocaleDateString('uz-UZ') },
      ]} />
  );

  const crmTab = (
    <Table rowKey="id" loading={loading} dataSource={customers} scroll={{ x: 700 }}
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
      <Button type="primary" icon={<PlusOutlined />} style={{ marginBottom: 16 }} onClick={() => setStaffModal(true)}>Yangi xodim (admin/manager)</Button>
      <Table rowKey="id" loading={loading} dataSource={staffList} scroll={{ x: 600 }}
        columns={[
          { title: 'Ism', dataIndex: 'name' },
          { title: 'Email', dataIndex: 'email' },
          { title: 'Rol', dataIndex: 'role', render: (r, row) => (
            <Select size="small" value={r} style={{ width: 130 }} disabled={r === 'superadmin'}
              onChange={async (v) => { try { await staffApi.setRole(row.id, v); message.success('Rol yangilandi'); load(); } catch (e) { message.error(e.response?.data?.error || 'Xatolik'); } }}
              options={['admin', 'manager', 'customer'].map((x) => ({ value: x, label: x }))} />
          ) },
          { title: 'Yaratilgan', dataIndex: 'createdAt', render: (d) => new Date(d).toLocaleDateString('uz-UZ') },
          { title: 'Amal', render: (_, row) => row.role === 'superadmin' ? null : (
            <Popconfirm title="Xodim o'chirilsinmi?" okText="Ha" cancelText="Yo'q" onConfirm={() => deleteStaff(row.id)}>
              <Button size="small" danger>O'chirish</Button>
            </Popconfirm>
          ) },
        ]} />
    </div>
  );

  const tabs = [
    { key: 'dash', label: 'Dashboard', children: dashboardTab },
    { key: 'products', label: 'Mahsulotlar', children: productsTab },
    { key: 'orders', label: 'Buyurtmalar', children: ordersTab },
    { key: 'crm', label: 'CRM (Mijozlar)', children: crmTab },
  ];
  if (me?.role === 'superadmin') tabs.push({ key: 'staff', label: 'Xodimlar (RBAC)', children: staffTab });

  return (
    <div>
      <h1>📊 CRM Boshqaruv Paneli <Tag color={roleColor[me?.role]}>{me?.role}</Tag></h1>
      <Tabs items={tabs} />

      {/* Staff modal */}
      <Modal title="Yangi xodim qo'shish" open={staffModal} onCancel={() => setStaffModal(false)} onOk={() => staffForm.submit()} okText="Qo'shish">
        <Form form={staffForm} layout="vertical" onFinish={createStaff}>
          <Form.Item name="name" label="Ism" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item>
          <Form.Item name="password" label="Parol" rules={[{ required: true, min: 6 }]}><Input.Password /></Form.Item>
          <Form.Item name="role" label="Rol" initialValue="manager" rules={[{ required: true }]}>
            <Select options={[{ value: 'admin', label: 'Admin' }, { value: 'manager', label: 'Manager' }]} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Product modal */}
      <Modal title={editingProd ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'} open={prodModal} onCancel={() => { setProdModal(false); setEditingProd(null); }} onOk={() => prodForm.submit()} okText="Saqlash" width={600}>
        <Form form={prodForm} layout="vertical" onFinish={saveProduct}>
          <Row gutter={12}>
            <Col span={12}><Form.Item name="name" label="Nomi" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="category" label="Toifa" rules={[{ required: true }]}><Input placeholder="Ko'ylak, Shim..." /></Form.Item></Col>
            <Col span={12}><Form.Item name="price" label="Narx (so'm)" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}><Form.Item name="cost" label="Tannarx" initialValue={0}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}><Form.Item name="stock" label="Ombor (dona)" rules={[{ required: true }]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}><Form.Item name="sku" label="SKU (kod)" rules={[{ required: true }]}><Input placeholder="SHRT-007" /></Form.Item></Col>
            <Col span={12}><Form.Item name="sizes" label="O'lchamlar (vergul bilan)"><Input placeholder="S, M, L, XL" /></Form.Item></Col>
            <Col span={12}><Form.Item name="colors" label="Ranglar (vergul bilan)"><Input placeholder="Black, White" /></Form.Item></Col>
            <Col span={24}><Form.Item name="image" label="Rasm URL"><Input placeholder="https://..." /></Form.Item></Col>
            <Col span={24}><Form.Item name="description" label="Tavsif"><Input.TextArea rows={2} /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
