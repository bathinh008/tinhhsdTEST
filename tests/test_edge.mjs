// Unit tests without real Supabase/OpenAI/hCaptcha network.
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
let handler;
const fakeEnv={
 OPENAI_API_KEY:'sk-private-do-not-expose', HCAPTCHA_SECRET:'hcaptcha-private',
 HCAPTCHA_SITE_KEY:'10000000-ffff-ffff-ffff-000000000001',
 ALLOWED_ORIGINS:'https://tp.bongbup.online',OPENAI_MODEL:'gpt-4.1',
 SUPABASE_URL:'https://project.supabase.co',
 SUPABASE_SECRET_KEYS:JSON.stringify({default:'sb_secret_not_for_browser'}),
 MAX_DAILY_CALLS:'100',MAX_MINUTE_CALLS:'6'
};
globalThis.Deno={env:{get:key=>fakeEnv[key]},serve:fn=>{handler=fn;}};
const originalFetch=globalThis.fetch;
let captchaReply={success:true,hostname:'tp.bongbup.online'};
let quotaReply='ok';
let upstreamStatus=200;
let calls=[];
globalThis.fetch=async (url,opt={})=>{
  calls.push({url:String(url),opt});
  if(String(url).includes('hcaptcha.com'))return Response.json(captchaReply);
  if(String(url).includes('/rpc/consume_hsd_quota'))return Response.json(quotaReply);
  if(String(url).includes('api.openai.com')){
    if(upstreamStatus!==200)return Response.json({error:'fake'}, {status:upstreamStatus});
    return Response.json({usage:{input_tokens:120,output_tokens:70},output:[{content:[{type:'output_text',text:JSON.stringify({mfg_raw:'NSX 10/04/2026',exp_raw:'HSD 10/04/2027',mfg:'2026-04-10',exp:'2027-04-10',months:'',confidence:'high',notes:'Đọc đủ'})}]}]});
  }
  throw Error('Unexpected network: '+url);
};
await import(pathToFileURL(new URL('../supabase/functions/read-expiry-date/index.ts',import.meta.url).pathname).href);
const image='data:image/jpeg;base64,'+'A'.repeat(420);
const makeReq=(body,origin='https://tp.bongbup.online')=>new Request('https://project.supabase.co/functions/v1/read-expiry-date',{
 method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(body)
});
const valid={image,roi:null,captchaToken:'x'.repeat(60)};
const result=async req=>{const r=await handler(req);return {r,body:await r.json()}};
let t=await result(makeReq(valid,'https://malicious.example'));
assert.equal(t.r.status,403);assert.equal(calls.length,0,'wrong origin blocked before captcha');
let pre=await handler(new Request('https://project.supabase.co/functions/v1/read-expiry-date',{method:'OPTIONS',headers:{Origin:'https://tp.bongbup.online'}}));
assert.equal(pre.status,204);assert.equal(pre.headers.get('access-control-allow-origin'),'https://tp.bongbup.online');
let wrong=await result(makeReq({...valid,image:'https://example.com/image.jpg'}));
assert.equal(wrong.r.status,400);
t=await result(makeReq({...valid,captchaToken:''}));assert.equal(t.r.status,403);
captchaReply={success:false,hostname:'tp.bongbup.online'};
t=await result(makeReq(valid));assert.equal(t.r.status,403);
assert.equal(calls.some(c=>c.url.includes('api.openai.com')),false,'invalid captcha blocked AI');
calls=[];captchaReply={success:true,hostname:'tp.bongbup.online'};
quotaReply='daily';t=await result(makeReq(valid));assert.equal(t.r.status,429);
assert.equal(calls.some(c=>c.url.includes('api.openai.com')),false,'daily quota blocked AI');
calls=[];quotaReply='minute';t=await result(makeReq(valid));assert.equal(t.r.status,429);
quotaReply='ok';calls=[];
t=await result(makeReq(valid));assert.equal(t.r.status,200);
assert.equal(t.body.result.mfg,'2026-04-10');assert.equal(t.body.result.exp,'2027-04-10');
assert.equal(t.body.model,'gpt-4.1');assert.equal(t.body.usage.input_tokens,120);
assert.equal(JSON.stringify(t.body).includes('sk-private-do-not-expose'),false);
const q=calls.find(c=>c.url.includes('/rpc/consume_hsd_quota'));
assert.equal(q.opt.headers.apikey,'sb_secret_not_for_browser');
assert.equal(Object.keys(q.opt.headers).includes('Authorization'),false,'do not use sb_secret as JWT');
const openai=calls.find(c=>c.url.includes('api.openai.com'));
assert.equal(openai.opt.headers.Authorization,'Bearer sk-private-do-not-expose');
const sent=JSON.parse(openai.opt.body);assert.equal(sent.model,'gpt-4.1');assert.equal(sent.store,false);
calls=[];upstreamStatus=429;t=await result(makeReq(valid));assert.equal(t.r.status,502);
assert.equal(JSON.stringify(t.body).includes('sk-private-do-not-expose'),false);
upstreamStatus=200;
console.log('PASS: 12 Supabase Edge Function security/payload/quota tests');
globalThis.fetch=originalFetch;
