import React from 'react';
import { Row, Col, Card, Button } from 'antd';
import { CloudServerOutlined, ThunderboltOutlined, SafetyOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();
  return (
    <div>
      <div className="hero">
        <h1>Ulgurji Kiyim-Kechak Platformasi</h1>
        <p>Dinamik katalog, real vaqtli ombor va CRM — bulutli infratuzilmada</p>
        <Button size="large" onClick={() => navigate('/products')}>Katalogni ko'rish</Button>
      </div>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card><ThunderboltOutlined style={{ fontSize: 32, color: '#1677ff' }} />
            <h3>Tez va dinamik</h3><p>Redis kesh va SPA arxitekturasi bilan yuqori tezlik.</p></Card>
        </Col>
        <Col xs={24} md={8}>
          <Card><SafetyOutlined style={{ fontSize: 32, color: '#52c41a' }} />
            <h3>Xavfsiz</h3><p>JWT autentifikatsiya va rolga asoslangan kirish (RBAC).</p></Card>
        </Col>
        <Col xs={24} md={8}>
          <Card><CloudServerOutlined style={{ fontSize: 32, color: '#722ed1' }} />
            <h3>Auto-scaling</h3><p>AWS VPC, Load Balancer va avtomatik masshtablash.</p></Card>
        </Col>
      </Row>
    </div>
  );
}
