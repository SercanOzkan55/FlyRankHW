const http = require('http');
const path = require('path');
const fs = require('fs');

process.env.PORT = '3099';

const { app, start } = require('./server');

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 3099,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let parsed = data;
        try {
          parsed = JSON.parse(data);
        } catch (e) {}
        resolve({ status: res.statusCode, headers: res.headers, body: parsed });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ TEST FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ ${message}`);
  }
}

async function runTests() {
  console.log('--- Starting CRUD API & SQLite Tests ---');

  const server = await start();

  try {
    // Stage 0 & Stage 1: Initial tasks check
    const listRes = await makeRequest('GET', '/tasks');
    assert(listRes.status === 200, 'GET /tasks returns 200');
    assert(Array.isArray(listRes.body), 'GET /tasks returns array');
    assert(listRes.body.length >= 3, 'GET /tasks contains at least 3 initial seed tasks');
    assert(typeof listRes.body[0].done === 'boolean', 'Task done property is boolean');

    const firstId = listRes.body[0].id;

    // GET /tasks/:id
    const getOneRes = await makeRequest('GET', `/tasks/${firstId}`);
    assert(getOneRes.status === 200, `GET /tasks/${firstId} returns 200`);
    assert(getOneRes.body.id === firstId, 'GET /tasks/:id returns correct task object');

    // GET /tasks/9999 (404 check)
    const getNotFound = await makeRequest('GET', '/tasks/9999');
    assert(getNotFound.status === 404, 'GET /tasks/9999 returns 404');
    assert(getNotFound.body.error === 'Task not found', '404 contains error message');

    // Stage 2: Create tasks & validation
    const invalidPost = await makeRequest('POST', '/tasks', { title: '' });
    assert(invalidPost.status === 400, 'POST /tasks with empty title returns 400');
    assert(invalidPost.body.error === 'Title is required', '400 contains title required message');

    const validPost = await makeRequest('POST', '/tasks', { title: 'Persistent SQLite Task', done: false });
    assert(validPost.status === 201, 'POST /tasks with valid data returns 201');
    assert(validPost.body.title === 'Persistent SQLite Task', 'Created task returns title');
    assert(validPost.body.done === false, 'Created task returns done=false');
    const createdId = validPost.body.id;

    // Stage 3: Update & Delete
    const updateRes = await makeRequest('PUT', `/tasks/${createdId}`, { title: 'Updated SQLite Task', done: true });
    assert(updateRes.status === 200, `PUT /tasks/${createdId} returns 200`);
    assert(updateRes.body.title === 'Updated SQLite Task', 'Task title updated');
    assert(updateRes.body.done === true, 'Task done status updated');

    const deleteRes = await makeRequest('DELETE', `/tasks/${createdId}`);
    assert(deleteRes.status === 200, `DELETE /tasks/${createdId} returns 200`);

    const verifyDeleted = await makeRequest('GET', `/tasks/${createdId}`);
    assert(verifyDeleted.status === 404, 'Deleted task returns 404 on GET');

    // Optional Extras: Search, Filter, Stats
    await makeRequest('POST', '/tasks', { title: 'Buy milk and eggs', done: false });
    await makeRequest('POST', '/tasks', { title: 'Drink milk', done: true });

    const searchRes = await makeRequest('GET', '/tasks?search=milk');
    assert(searchRes.status === 200, 'GET /tasks?search=milk returns 200');
    assert(searchRes.body.length >= 2, 'Search returns matching items');

    const doneFilterRes = await makeRequest('GET', '/tasks?done=true');
    assert(doneFilterRes.status === 200, 'GET /tasks?done=true returns 200');
    assert(doneFilterRes.body.every(t => t.done === true), 'Filter returns only completed tasks');

    const statsRes = await makeRequest('GET', '/stats');
    assert(statsRes.status === 200, 'GET /stats returns 200');
    assert(typeof statsRes.body.total === 'number', 'Stats returns total count');
    assert(typeof statsRes.body.completed === 'number', 'Stats returns completed count');

    console.log('\n--- ALL TESTS PASSED SUCCESSFULLY! ---');
  } finally {
    server.close();
  }
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
