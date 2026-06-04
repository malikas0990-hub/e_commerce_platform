import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Spin } from 'antd';
import { orders as ordersApi, auth } from '../services/api';

const statusColor = { pending: 'orange', confirmed: 'blue', shipped: 'cyan', delivered: 'green', cancelled: 'red' };

export default function CustomerPanel() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const user = auth.getUser();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try { const { data } = await ordersApi.my(); setList(data); }
      finally { setLoading(false); }
    })();
  }, []);

  return (
    <div>
      <Card title={`My account — ${user?.name}`} style={{ marginBottom: 16 }}>
        <p>Email: {user?.email}</p>
        <p>Role: <Tag color="blue">{user?.role}</Tag></p>
      </Card>
      <Card title="My orders">
        <Spin spinning={loading}>
          <Table rowKey="id" dataSource={list}
            columns={[
              { title: 'Number', dataIndex: 'orderNumber' },
              { title: 'Total', dataIndex: 'totalPrice', render: (p) => `${Number(p).toLocaleString()} UZS` },
              { title: 'Status', dataIndex: 'status', render: (s) => <Tag color={statusColor[s]}>{s}</Tag> },
              { title: 'Date', dataIndex: 'createdAt', render: (d) => new Date(d).toLocaleString('en-US') },
            ]} />
        </Spin>
      </Card>
    </div>
  );
}
