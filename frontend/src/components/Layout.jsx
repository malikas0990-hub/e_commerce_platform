import React from 'react';
import { Layout as AntLayout, Menu, Badge, Button } from 'antd';
import { ShoppingCartOutlined, ShopOutlined } from '@ant-design/icons';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { auth } from '../services/api';

const { Header, Content, Footer } = AntLayout;

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = auth.getUser();
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');

  const items = [
    { key: '/', label: <Link to="/">Bosh sahifa</Link> },
    { key: '/products', label: <Link to="/products">Katalog</Link> },
  ];
  if (user) items.push({ key: '/account', label: <Link to="/account">Kabinet</Link> });
  if (user && ['superadmin', 'admin', 'manager'].includes(user.role)) {
    items.push({ key: '/admin', label: <Link to="/admin">Dashboard</Link> });
  }

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: 18, whiteSpace: 'nowrap' }}>
          <ShopOutlined /> NavCloth
        </div>
        <Menu theme="dark" mode="horizontal" selectedKeys={[location.pathname]} items={items} style={{ flex: 1, minWidth: 0 }} />
        <Badge count={cart.length} size="small">
          <Button shape="circle" icon={<ShoppingCartOutlined />} onClick={() => navigate('/checkout')} />
        </Badge>
        {user ? (
          <Button onClick={() => { auth.logout(); navigate('/login'); }}>Chiqish ({user.name})</Button>
        ) : (
          <Button type="primary" onClick={() => navigate('/login')}>Kirish</Button>
        )}
      </Header>
      <Content>
        <div className="page"><Outlet /></div>
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        Ulgurji Kiyim Platformasi © 2026 — BTEC Cloud Computing Assignment
      </Footer>
    </AntLayout>
  );
}
