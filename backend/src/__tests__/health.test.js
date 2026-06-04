const request = require('supertest');
const app = require('../app');

describe('Health & basic API', () => {
  it('GET /health returns OK', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('OK');
  });

  it('unknown route returns 404', async () => {
    const res = await request(app).get('/no-such-route');
    expect(res.statusCode).toBe(404);
  });

  it('login without credentials returns 400', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.statusCode).toBe(400);
  });
});
