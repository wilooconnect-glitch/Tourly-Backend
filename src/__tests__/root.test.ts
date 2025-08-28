import express from 'express';
import request from 'supertest';
import { rootRoutes } from '../routes/root';

const app = express();
app.use('/', rootRoutes);

describe('Root Route', () => {
  it('should return application information', async () => {
    const response = await request(app).get('/').expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty(
      'message',
      'SND CRM Backend API is running'
    );
    expect(response.body.data).toHaveProperty('name', 'SND CRM Backend');
    expect(response.body.data).toHaveProperty('version');
    expect(response.body.data).toHaveProperty('environment');
    expect(response.body.data).toHaveProperty('timestamp');
    expect(response.body.data).toHaveProperty('uptime');
  });

  it('should return valid JSON structure', async () => {
    const response = await request(app).get('/').expect(200);

    expect(response.body).toHaveProperty('success');
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('data');
    expect(typeof response.body.success).toBe('boolean');
    expect(typeof response.body.message).toBe('string');
    expect(typeof response.body.data).toBe('object');
  });
});
