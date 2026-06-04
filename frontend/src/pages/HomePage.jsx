import React from 'react';
import { Row, Col, Card, Button } from 'antd';
import { CloudServerOutlined, ThunderboltOutlined, SafetyOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();
  return (
    <div>
      <div className="hero">
        <h1>Wholesale Clothing Platform</h1>
        <p>Dynamic catalog, real-time inventory and CRM — on cloud infrastructure</p>
        <Button size="large" onClick={() => navigate('/products')}>Browse catalog</Button>
      </div>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card><ThunderboltOutlined style={{ fontSize: 32, color: '#1677ff' }} />
            <h3>Fast and dynamic</h3><p>High performance with Redis cache and SPA architecture.</p></Card>
        </Col>
        <Col xs={24} md={8}>
          <Card><SafetyOutlined style={{ fontSize: 32, color: '#52c41a' }} />
            <h3>Secure</h3><p>JWT authentication and role-based access control (RBAC).</p></Card>
        </Col>
        <Col xs={24} md={8}>
          <Card><CloudServerOutlined style={{ fontSize: 32, color: '#722ed1' }} />
            <h3>Auto-scaling</h3><p>AWS VPC, Load Balancer and automatic scaling.</p></Card>
        </Col>
      </Row>
    </div>
  );
}
