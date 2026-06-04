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
    if (!auth.getUser()) { message.warning('Please log in to place an order'); return navigate('/login'); }
    setLoading(true);
    try {
      await ordersApi.create({
        items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        shippingAddress: values,
      });
      persist([]);
      setDone(true);
    } catch (e) {
      message.error(e.response?.data?.error || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return <Result status="success" title="Your order has been placed!"
      extra={[<Button type="primary" key="acc" onClick={() => navigate('/account')}>My orders</Button>]} />;
  }

  if (cart.length === 0) return <Empty description="Cart is empty"><Button type="primary" onClick={() => navigate('/products')}>Go to catalog</Button></Empty>;

  return (
    <div>
      <Card title="Cart" style={{ marginBottom: 16 }}>
        <Table rowKey="productId" pagination={false} dataSource={cart}
          columns={[
            { title: 'Product', dataIndex: 'name' },
            { title: 'Price', dataIndex: 'price', render: (p) => `${p.toLocaleString()} UZS` },
            { title: 'Quantity', render: (_, r) => <InputNumber min={1} value={r.quantity} onChange={(v) => setQty(r.productId, v || 1)} /> },
            { title: 'Total', render: (_, r) => `${(r.price * r.quantity).toLocaleString()} UZS` },
            { title: '', render: (_, r) => <Button danger size="small" onClick={() => remove(r.productId)}>Remove</Button> },
          ]}
          summary={() => <Table.Summary.Row><Table.Summary.Cell colSpan={3}><b>Grand total</b></Table.Summary.Cell>
            <Table.Summary.Cell colSpan={2}><b>{total.toLocaleString()} UZS</b></Table.Summary.Cell></Table.Summary.Row>} />
      </Card>
      <Card title="Shipping address">
        <Form layout="vertical" onFinish={submit}>
          <Form.Item name="fullName" label="Full name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="phone" label="Phone" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="address" label="Address" rules={[{ required: true }]}><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="city" label="City" rules={[{ required: true }]}><Input /></Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} size="large">Confirm order</Button>
        </Form>
      </Card>
    </div>
  );
}
