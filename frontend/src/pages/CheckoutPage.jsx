import React, { useState } from 'react';
import { Card, Table, Button, InputNumber, Form, Input, message, Empty, Result } from 'antd';
import { useNavigate } from 'react-router-dom';
import { orders as ordersApi, auth } from '../services/api';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(JSON.parse(localStorage.getItem('cart') || '[]'));
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const persist = (next) => { setCart(next); localStorage.setItem('cart', JSON.stringify(next)); };
  const setQty = (id, qty) => persist(cart.map((i) => (i.productId === id ? { ...i, quantity: qty } : i)));
  const remove = (id) => persist(cart.filter((i) => i.productId !== id));
  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  const submit = async (values) => {
    if (!auth.getUser()) { message.warning('Buyurtma uchun avval tizimga kiring'); return navigate('/login'); }
    setLoading(true);
    try {
      await ordersApi.create({
        items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        shippingAddress: values,
      });
      persist([]);
      setDone(true);
    } catch (e) {
      message.error(e.response?.data?.error || 'Buyurtma berishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return <Result status="success" title="Buyurtmangiz qabul qilindi!"
      extra={[<Button type="primary" key="acc" onClick={() => navigate('/account')}>Buyurtmalarim</Button>]} />;
  }

  if (cart.length === 0) return <Empty description="Savatcha bo'sh"><Button type="primary" onClick={() => navigate('/products')}>Katalogga</Button></Empty>;

  return (
    <div>
      <Card title="Savatcha" style={{ marginBottom: 16 }}>
        <Table rowKey="productId" pagination={false} dataSource={cart}
          columns={[
            { title: 'Mahsulot', dataIndex: 'name' },
            { title: 'Narx', dataIndex: 'price', render: (p) => `${p.toLocaleString()} so'm` },
            { title: 'Soni', render: (_, r) => <InputNumber min={1} value={r.quantity} onChange={(v) => setQty(r.productId, v || 1)} /> },
            { title: 'Jami', render: (_, r) => `${(r.price * r.quantity).toLocaleString()} so'm` },
            { title: '', render: (_, r) => <Button danger size="small" onClick={() => remove(r.productId)}>O'chirish</Button> },
          ]}
          summary={() => <Table.Summary.Row><Table.Summary.Cell colSpan={3}><b>Umumiy</b></Table.Summary.Cell>
            <Table.Summary.Cell colSpan={2}><b>{total.toLocaleString()} so'm</b></Table.Summary.Cell></Table.Summary.Row>} />
      </Card>
      <Card title="Yetkazib berish manzili">
        <Form layout="vertical" onFinish={submit}>
          <Form.Item name="fullName" label="F.I.O" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="phone" label="Telefon" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="address" label="Manzil" rules={[{ required: true }]}><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="city" label="Shahar" rules={[{ required: true }]}><Input /></Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} size="large">Buyurtmani tasdiqlash</Button>
        </Form>
      </Card>
    </div>
  );
}
