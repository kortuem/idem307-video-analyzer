const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const { once } = require('node:events');
const root = path.join(__dirname, '..');
const key = 'AIzaSy' + 'x'.repeat(33);

test('server refuses absent and documented placeholder credentials', () => {
  for (const values of [{}, { GEMINI_API_KEY:' ', ACCESS_KEYWORD:'test', SESSION_SECRET:'s'.repeat(32) }, { GEMINI_API_KEY:'test', ACCESS_KEYWORD:'demo123', SESSION_SECRET:'a'.repeat(32) },
    { GEMINI_API_KEY:'test', ACCESS_KEYWORD:'test', SESSION_SECRET:'short' }]) {
    const result = spawnSync(process.execPath, ['-e', "require('./server.js')"], { cwd:root, env:{ PATH:process.env.PATH, ...values }, encoding:'utf8' });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Configure GEMINI_API_KEY/);
  }
});

test('direct client uses headers and sanitizes HTTP, transport, parse and abort failures', async () => {
  const { GeminiClient } = await import('../src/services/geminiClient.js');
  const client = new GeminiClient({logger:{log(){}}});
  client.setApiKey(key);
  const oldFetch = global.fetch;
  try {
    for (const method of ['analyzeFrame','generateText']) {
      const args = {prompt:'test',base64Image:'data:image/jpeg;base64,aW1hZ2U='};
      global.fetch = async (url, opts) => {
        assert.ok(!url.includes(key));
        assert.equal(opts.headers['x-goog-api-key'], key);
        return { ok:true, json:async()=>({ candidates:[{content:{parts:[{text:'result'}]}}] }) };
      };
      assert.equal((await client[method](args)).text, 'result');
      global.fetch = async () => ({ok:false,status:403,json(){throw Error(key);}});
      await assert.rejects(client[method](args), error => !error.message.includes(key) && /HTTP 403/.test(error.message));
      global.fetch = async () => {throw Error(key);};
      await assert.rejects(client[method](args), error => !error.message.includes(key));
      global.fetch = async () => ({ok:true,json:async()=>{throw Error(key);}});
      await assert.rejects(client[method](args), error => !error.message.includes(key));
      global.fetch = async () => {throw new DOMException(key,'AbortError');};
      await assert.rejects(client[method](args), error => error.name === 'AbortError' && !error.message.includes(key));
    }
  } finally { global.fetch = oldFetch; }
});

test('proxy rejects unauthenticated calls and keeps upstream errors and secrets private', async () => {
  Object.assign(process.env, { GEMINI_API_KEY:key, ACCESS_KEYWORD:'test-access', SESSION_SECRET:'s'.repeat(40), NODE_ENV:'test' });
  const app = require('../server.js');
  const server = app.listen(0,'127.0.0.1');
  await once(server,'listening');
  const localFetch = global.fetch;
  const oldError = console.error;
  const logs=[];
  let calls=0;
  const url='http://127.0.0.1:'+server.address().port;
  const post=(route,body,cookie)=>localFetch(url+route,{method:'POST',headers:{'Content-Type':'application/json',...(cookie ? {cookie}: {})},body:JSON.stringify(body)});
  console.error=(...items)=>logs.push(items.join(' '));
  global.fetch=async (upstream,options)=>{
    calls++;
    assert.ok(!upstream.includes(key));
    assert.equal(options.headers['x-goog-api-key'],key);
    return {ok:false,status:403,text(){throw Error('raw response must not be read');}};
  };
  try {
    assert.equal((await post('/api/analyze',{image_data:'test',perspective_prompt:'test'})).status,401);
    assert.equal(calls,0);
    assert.equal((await post('/api/auth/validate',{keyword:7})).status,400);
    const auth=await post('/api/auth/validate',{keyword:'test-access'});
    assert.equal(auth.status,200);
    const cookie=auth.headers.get('set-cookie').split(';')[0];
    for (const [route,body] of [['/api/analyze',{image_data:'test',perspective_prompt:'test'}],['/api/generate-summary',{prompt:'test'}]]) {
      const response=await post(route,body,cookie);
      assert.equal(response.status,403);
      assert.ok(!(await response.text()).includes(key));
    }
    assert.equal(calls,2);
    assert.ok(!logs.join().includes(key));
  } finally {
    global.fetch=localFetch;console.error=oldError;
    await new Promise(resolve=>server.close(resolve));
  }
});
