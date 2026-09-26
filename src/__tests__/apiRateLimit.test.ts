// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';

delete process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

let server: Server;
let base: string;

beforeAll(async () => {
  const mod = await import('../../api/app');
  server = mod.default.listen(0);
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => {
  server.close();
});

describe('Rate limiting', () => {
  it('stops a single client from flooding the survey endpoint', async () => {
    const survey = { role: 'Student', susQ1: 4, susQ2: 4, susQ3: 4, susQ4: 4, susQ5: 4 };
    const statuses: number[] = [];
    for (let i = 0; i < 25; i++) {
      const res = await fetch(`${base}/api/surveys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(survey),
      });
      statuses.push(res.status);
    }
    expect(statuses.slice(0, 20).every((s) => s === 201)).toBe(true);
    expect(statuses.slice(20).every((s) => s === 429)).toBe(true);
  });
});
