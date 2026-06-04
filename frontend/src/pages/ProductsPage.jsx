import React, { useEffect, useMemo, useState } from 'react';
import { Card, Button, Select, Input, Row, Col, Spin, message, Tag, Empty } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';
import { products as productsApi } from '../services/api';

export default function ProductsPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [size, setSize] = useState(null);
  const [color, setColor] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await productsApi.list({ limit: 100 });
      setList(data.data || []);
    } catch {
      message.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const sizes = useMemo(() => [...new Set(list.flatMap((p) => p.sizes || []))], [list]);
  const colors = useMemo(() => [...new Set(list.flatMap((p) => p.colors || []))], [list]);

  const filtered = list.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (size && !(p.sizes || []).includes(size)) return false;
    if (color && !(p.colors || []).includes(color)) return false;
    return true;
  });

  const addToCart = (p) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find((i) => i.productId === p.id);
    if (existing) existing.quantity += 1;
    else cart.push({ productId: p.id, name: p.name, price: Number(p.price), quantity: 1 });
    localStorage.setItem('cart', JSON.stringify(cart));
    message.success(`"${p.name}" added to cart`);
  };

  return (
    <div>
      <div className="filters">
        <Row gutter={[12, 12]}>
          <Col xs={24} md={10}>
            <Input.Search placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} allowClear />
          </Col>
          <Col xs={12} md={7}>
            <Select placeholder="Size" style={{ width: '100%' }} value={size} onChange={setSize} allowClear
              options={sizes.map((s) => ({ value: s, label: s }))} />
          </Col>
          <Col xs={12} md={7}>
            <Select placeholder="Color" style={{ width: '100%' }} value={color} onChange={setColor} allowClear
              options={colors.map((c) => ({ value: c, label: c }))} />
          </Col>
        </Row>
      </div>

      <Spin spinning={loading}>
        {filtered.length === 0 && !loading ? (
          <Empty description="No products found" />
        ) : (
          <Row gutter={[16, 16]}>
            {filtered.map((p) => (
              <Col key={p.id} xs={24} sm={12} md={8} lg={6}>
                <Card hoverable cover={<img alt={p.name} src={p.image} style={{ height: 220, objectFit: 'cover' }} />}>
                  <Card.Meta title={p.name} description={`${Number(p.price).toLocaleString()} UZS`} />
                  <div style={{ margin: '8px 0' }}>
                    {(p.sizes || []).map((s) => <Tag key={s}>{s}</Tag>)}
                  </div>
                  <p className="stock">In stock: {p.stock} units</p>
                  <Button type="primary" block icon={<ShoppingCartOutlined />} disabled={p.stock === 0} onClick={() => addToCart(p)}>
                    {p.stock === 0 ? 'Out of stock' : 'Add to cart'}
                  </Button>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Spin>
    </div>
  );
}
