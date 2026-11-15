const { test } = require('node:test');
const assert = require('node:assert/strict');
const authorize = require('../src/middleware/authorize');

// Netthabtou mel autorisation bla ma nesta3mlou base.
for (const [name, user, expected] of [
  ['manager allowed', { role: 'manager' }, 200],
  ['ordinary user denied', { role: 'user' }, 403],
  ['unauthenticated denied', undefined, 401],
]) {
  test(name, () => {
    let status = 200;
    let nextCalls = 0;
    const headers = {};
    const response = {
      set(key, value) { headers[key] = value; return this; },
      status(code) { status = code; return this; },
      json(body) { return body; },
    };
    authorize('manager')({ user }, response, () => { nextCalls++; });
    assert.equal(status, expected);
    assert.equal(nextCalls, expected === 200 ? 1 : 0);
    if (expected === 401) assert.equal(headers['WWW-Authenticate'], 'Bearer');
  });
}
