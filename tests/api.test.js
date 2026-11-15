require('dotenv').config();
const { test } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const User = require('../src/models/User');
const Project = require('../src/models/Project');
const Task = require('../src/models/Task');
const { spawnSync } = require('node:child_process');

// El tests yasna3ou donnees temporaires w yna77iw ken elli sna3ouh.
test('API integration: authentication, project permissions and task lifecycle', async (t) => {
  const users = [];
  let server;
  const password = 'TemporaryTest2026!';
  try {
    assert.ok(process.env.JWT_SECRET, 'JWT_SECRET is required');
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    await User.init();
    server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}/api`;
    await t.test('Local interface serves assets without exposing configuration or source', async () => {
      const origin = base.slice(0, -4);
      const home = await fetch(origin + '/');
      assert.equal(home.status, 200);
      assert.match(await home.text(), /Retrouvez vos projets/);
      for (const path of ['/app.js', '/style.css']) assert.equal((await fetch(origin + path)).status, 200);
      for (const path of ['/.env', '/package.json', '/src/app.js']) assert.equal((await fetch(origin + path)).status, 404);
    });
    async function request(method, path, body, token, expected) {
      const response = await fetch(base + path, {
        method,
        headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      const data = await response.json();
      assert.equal(response.status, expected, `${method} ${path}: ${JSON.stringify(data)}`);
      return data;
    }
    const stamp = Date.now();
    const logins = [0, 1, 2].map(i => `integration_${stamp}_${i}`);
    for (const login of logins) {
      const result = await request('POST', '/auth/register', { name: 'Temporary test', login, password, role: 'manager' }, null, 201);
      users.push(result.user.id);
      assert.equal(result.user.role, 'user');
      assert.equal(result.user.password, undefined);
    }
    // El manager yet7added localement, moch mel inscription publique.
    const promotion = spawnSync(process.execPath, ['scripts/promote-manager.js', logins[2]], { encoding: 'utf8' });
    assert.equal(promotion.status, 0, promotion.stderr);
    assert.equal((await User.findById(users[2])).role, 'manager');
    const tokens = [];
    for (const login of logins) {
      const result = await request('POST', '/auth/login', { login, password }, null, 200);
      tokens.push(result.token);
      const payload = jwt.verify(result.token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
      assert.ok(payload.exp);
      assert.equal(result.user.password, undefined);
    }
    await t.test('Authentication rejects missing, invalid, expired tokens and wrong passwords', async () => {
      await request('GET', '/auth/me', undefined, null, 401);
      await request('GET', '/auth/me', undefined, 'invalid', 401);
      const expired = jwt.sign({}, process.env.JWT_SECRET, { subject: users[0], expiresIn: -1 });
      await request('GET', '/auth/me', undefined, expired, 401);
      await request('POST', '/auth/login', { login: logins[0], password: 'WrongPassword!' }, null, 401);
      await request('POST', '/auth/login', {}, null, 400);
      await request('POST', '/auth/register', { name: 'Duplicate', login: logins[0], password }, null, 409);
      const profile = await request('GET', '/auth/me', undefined, tokens[0], 200);
      assert.equal(profile.user.id, users[0]);
      const stored = await User.findById(users[0]).select('+password');
      assert.notEqual(stored.password, password);
      assert.equal(await stored.comparePassword(password), true);
    });
    const p = (await request('POST', '/projects', { name: 'Alpha [literal]', description: 'SearchNeedle', owner: users[1] }, tokens[0], 201)).project;
    const p2 = (await request('POST', '/projects', { name: 'Zulu', description: 'SearchNeedle' }, tokens[1], 201)).project;
    await t.test('Project ownership, role visibility, search, sorting and validation', async () => {
      assert.equal(p.owner, users[0]);
      await request('POST', '/projects', { name: ' ' }, tokens[0], 400);
      await request('GET', '/projects', undefined, null, 401);
      const own = await request('GET', '/projects?search=searchneedle', undefined, tokens[0], 200);
      assert.equal(own.count, 1);
      assert.equal(own.projects[0]._id, p._id);
      const literal = await request('GET', '/projects?search=%5Bliteral%5D', undefined, tokens[0], 200);
      assert.equal(literal.count, 1);
      const all = await request('GET', '/projects?search=SearchNeedle&sortBy=name&order=asc', undefined, tokens[2], 200);
      assert.ok(all.projects.some(item => item._id === p._id));
      assert.ok(all.projects.some(item => item._id === p2._id));
      assert.deepEqual(all.projects.map(item => item.name), [...all.projects.map(item => item.name)].sort());
      await request('GET', '/projects?order=invalid', undefined, tokens[0], 400);
      for (const method of ['GET', 'PATCH', 'DELETE']) {
        const body = method === 'PATCH' ? { name: 'Blocked' } : undefined;
        await request(method, `/projects/${p._id}`, body, tokens[1], 404);
        await request(method, '/projects/invalid', body, tokens[0], 400);
      }
      await request('GET', `/projects/${p._id}`, undefined, tokens[2], 200);
      await request('PATCH', `/projects/${p._id}`, { status: 'completed' }, tokens[0], 200);
      await request('PATCH', `/projects/${p._id}`, { description: 'Manager edited' }, tokens[2], 200);
      await request('PATCH', `/projects/${p._id}`, { owner: users[1] }, tokens[0], 400);
    });
    const path = `/projects/${p._id}/tasks`;
    const task = (await request('POST', path, { title: 'Alpha task', deadline: '2026-12-01' }, tokens[0], 201)).task;
    await t.test('Only managers assign tasks; task search, sort and filters', async () => {
      await request('POST', path, { title: 'Blocked assignment', assignedTo: users[1] }, tokens[0], 403);
      await request('PATCH', `${path}/${task._id}`, { assignedTo: users[1] }, tokens[0], 403);
      await request('PATCH', `${path}/${task._id}`, { assignedTo: null }, tokens[0], 403);
      await request('PATCH', `${path}/${task._id}`, { assignedTo: 'invalid' }, tokens[2], 400);
      await request('PATCH', `${path}/${task._id}`, { assignedTo: '000000000000000000000001' }, tokens[2], 404);
      const assigned = await request('PATCH', `${path}/${task._id}`, { assignedTo: users[1] }, tokens[2], 200);
      assert.equal(assigned.task.assignedTo, users[1]);
      // Affectation wa7adha ma ta3tich acces lel projet el prive.
      await request('GET', path, undefined, tokens[1], 404);
      const extra = (await request('POST', path, { title: 'Zulu [literal]', description: 'Needle', status: 'doing', assignedTo: users[1] }, tokens[2], 201)).task;
      const searched = await request('GET', `${path}?search=needle&status=doing`, undefined, tokens[0], 200);
      assert.equal(searched.count, 1);
      assert.equal(searched.tasks[0]._id, extra._id);
      const literal = await request('GET', `${path}?search=%5Bliteral%5D`, undefined, tokens[2], 200);
      assert.equal(literal.count, 1);
      const asc = await request('GET', `${path}?sortBy=title&order=asc`, undefined, tokens[0], 200);
      assert.deepEqual(asc.tasks.map(item => item.title), ['Alpha task', 'Zulu [literal]']);
      const desc = await request('GET', `${path}?sortBy=title&order=desc`, undefined, tokens[0], 200);
      assert.deepEqual(desc.tasks.map(item => item.title), ['Zulu [literal]', 'Alpha task']);
      for (const query of ['?sortBy=invalid', '?order=wrong', '?status=wrong', '?search=a&search=b']) {
        await request('GET', path + query, undefined, tokens[0], 400);
      }
      const unassigned = await request('PATCH', `${path}/${task._id}`, { assignedTo: null }, tokens[2], 200);
      assert.equal(unassigned.task.assignedTo, null);
      await request('DELETE', `${path}/${extra._id}`, undefined, tokens[2], 200);
    });
    await t.test('Task lifecycle and project access boundaries', async () => {
      assert.equal(task.status, 'todo');
      assert.equal(task.project, p._id);
      await request('GET', path, undefined, null, 401);
      await request('GET', path, undefined, tokens[1], 404);
      await request('POST', path, { title: 'Blocked' }, tokens[1], 404);
      await request('GET', `${path}/${task._id}`, undefined, tokens[0], 200);
      await request('GET', `/projects/${p2._id}/tasks/${task._id}`, undefined, tokens[1], 404);
      await request('PATCH', `${path}/${task._id}`, { status: 'doing' }, tokens[0], 200);
      await request('PATCH', `${path}/${task._id}`, { deadline: null, status: 'done' }, tokens[2], 200);
      for (const body of [{ status: 'wrong' }, { title: ' ' }, { deadline: 'yesterday' }, { project: p2._id }, { title: 'x'.repeat(121) }]) {
        await request('PATCH', `${path}/${task._id}`, body, tokens[0], 400);
      }
      await request('DELETE', `${path}/${task._id}`, undefined, tokens[1], 404);
      await request('DELETE', `${path}/${task._id}`, undefined, tokens[0], 200);
      await request('GET', `${path}/${task._id}`, undefined, tokens[0], 404);
      await request('POST', path, { title: 'Cascade test' }, tokens[0], 201);
      await request('DELETE', `/projects/${p._id}`, undefined, tokens[2], 200);
      assert.equal(await Task.countDocuments({ project: p._id }), 0);
    });
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    if (mongoose.connection.readyState === 1) {
      const projects = await Project.find({ owner: { $in: users } }).select('_id');
      await Task.deleteMany({ project: { $in: projects.map(p => p._id) } });
      await Project.deleteMany({ owner: { $in: users } });
      await User.deleteMany({ _id: { $in: users } });
    }
    await mongoose.disconnect();
  }
});
