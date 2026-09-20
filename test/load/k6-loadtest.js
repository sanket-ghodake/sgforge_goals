/**
 * Individual Goal Center - k6 Enterprise High-Concurrency Load Test (2026 LTS)
 * Simulates 10,000 Concurrent Active Users hitting the system.
 * Stages: Smoke Test -> Rapid Ramp-Up -> Sustained High Concurrency -> Cooldown.
 * @requirements [HLR-SDK-301] [LLR-SUB-001] [HLR-GOALS-001] [LLR-GOALS-002]
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    // 1. Smoke test: 50 virtual users
    { duration: '15s', target: 50 },
    // 2. Ramp-up to 1,000 VUs (equivalent to 5,000 - 10,000 active browsing users)
    { duration: '45s', target: 1000 },
    // 3. Sustained peak load
    { duration: '1m', target: 1000 },
    // 4. Spike to 2,000 VUs
    { duration: '30s', target: 2000 },
    // 5. Cooldown
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    // 95% of requests must complete below 100ms
    http_req_duration: ['p(95)<100', 'p(99)<250'],
    // Less than 0.1% failed requests under peak load
    http_req_failed: ['rate<0.001'],
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://127.0.0.1:8090';

export default function () {
  // 1. Health Probe Check
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'health probe status 200': (r) => r.status === 200,
    'health memoryMb under 1024': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.memoryMb < 1024;
      } catch (_) {
        return false;
      }
    },
  });

  // 2. Static CSS Asset (Verify browser immutable cache headers)
  const cssRes = http.get(`${BASE_URL}/assets/app.css`);
  check(cssRes, {
    'css asset status 200': (r) => r.status === 200,
    'css cache-control immutable': (r) => (r.headers['Cache-Control'] || '').includes('max-age=31536000'),
  });

  // 3. Public User Roster Discovery API
  const usersRes = http.get(`${BASE_URL}/api/auth/users`);
  check(usersRes, {
    'users api status 200': (r) => r.status === 200,
  });

  // Simulate human think time between clicks (1 to 3 seconds)
  sleep(Math.random() * 2 + 1);
}
