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
      <Card title={`Mening kabinetim — ${user?.name}`} style={{ marginBottom: 16 }}>
        <p>Email: {user?.email}</p>
        <p>Rol: <Tag color="blue">{user?.role}</Tag></p>
      </Card>
      <Card title="Buyurtmalarim">
        <Spin spinning={loading}>
          <Table rowKey="id" dataSource={list}
            columns={[
              { title: 'Raqam', dataIndex: 'orderNumber' },
              { title: 'Jami', dataIndex: 'totalPrice', render: (p) => `${Number(p).toLocaleString()} so'm` },
              { title: 'Status', dataIndex: 'status', render: (s) => <Tag color={statusColor[s]}>{s}</Tag> },
              { title: 'Sana', dataIndex: 'createdAt', render: (d) => new Date(d).toLocaleString('uz-UZ') },
            ]} />
        </Spin>
      </Card>
    </div>
  );
}
