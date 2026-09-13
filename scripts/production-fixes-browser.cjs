async function runBrowserQA() {
 const { build } = require('esbuild');
 const { readFileSync, readdirSync, mkdtempSync } = require('node:fs');
 const http = require('node:http');
 const path = require('node:path');
 const assert = require('node:assert/strict');
 const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
 const root = path.resolve(__dirname, '..');
 const output = mkdtempSync(path.join(require('node:os').tmpdir(), 'wordpilot-auth-quota-qa-'));
 const captchaQA = process.env.QA_CAPTCHA === 'true';
 const ex=(id,type,skill)=>({id,type,skill,title:id,instruction:'Answer the question.',minScoreToPass:60,scoringRubric:{},content:{prompt:'Where is Mia?',readingText:'Mia is at school.',listeningScript:'Mia is at school.',choices:['At school','At home']},correctAnswer:'At school'});
 const lesson={id:'lesson',language:'English',levelNumber:1,cefrLevel:'A1',cefrSubLevel:'1',title:'Greetings',theme:'Greetings',objective:'Introduce yourself.',canDo:'I can introduce myself.',grammarFocus:'Present forms',targetSentence:'My name is Mia.',chunks:[],writingTask:{},speakingTask:{},roleplay:{},exercises:[ex('read1','reading_detail','reading'),ex('read2','reading_main_idea','reading'),ex('listen1','listen_for_detail','listening')]};
 const mocks={
  AuthContext:`export function useAuth(){return {authReady:true,user:{id:'qa-user'},
   signIn:async()=>{window.qaCalls=(window.qaCalls||0)+1;await new Promise(r=>setTimeout(r,20));return window.qaMode==='valid'?{success:true,error:null}:window.qaMode==='429'?{success:false,error:'private',status:429,code:'over_request_rate_limit'}:{success:false,error:'private-user-detail',status:400,code:'invalid_credentials'}},
   signUp:async()=>{window.qaSignup=(window.qaSignup||0)+1;await new Promise(r=>setTimeout(r,20));return {error:null,needsEmailVerification:true}},
   resetPassword:async()=>{window.qaReset=(window.qaReset||0)+1;await new Promise(r=>setTimeout(r,20));return {error:null}},
   resendConfirmation:async()=>({error:null}),
   signInWithGoogle:async()=>{window.qaGoogle=(window.qaGoogle||0)+1;if(window.qaMode==='pending')await new Promise(()=>{});if(window.qaMode==='throw')throw new Error('private-provider-detail');return window.qaMode==='success'?{error:null,url:location.origin+'/provider'}:{error:'private-provider-detail'}}}}`,
  i18n:`export function useI18n(){return {language:'en',t:k=>k}}`,
  LanguageSwitch:`export function LanguageSwitch(){return null}`,
  supabase:`export const supabase={auth:{getSession:async()=>{const p=new URLSearchParams(location.search);if(p.get('case')==='session')return {data:{session:{user:{id:'qa'}}}};if(p.get('case')==='network')throw new Error('private');return {data:{session:null}}}},rpc:(_,body)=>({abortSignal:async signal=>{const r=await fetch('/qa-quota',{method:'POST',body:JSON.stringify({...body,owner:window.qaOwner||'A'}),signal});return {data:await r.json(),error:null}}})};`,
  usePracticeProgress:`import {useState} from 'react';export function usePracticeProgress(){const [rows,setRows]=useState([]);return {rows,upsertProgress:async p=>{window.qaWrites=(window.qaWrites||0)+1;setRows(r=>[...r,{exercise_id:p.exerciseId,status:'completed'}]);return {error:null}}}}`,
  curriculumRepository:`export class CurriculumRepositoryError extends Error{};export async function loadCurriculumLevel(){return {lessons:[${JSON.stringify(lesson)}]}}`
 };
 const entry=`
 import React,{useState} from 'react';import {createRoot} from 'react-dom/client';import {BrowserRouter,Routes,Route} from 'react-router-dom';
 import {ExerciseRenderer} from './src/components/ExerciseRenderer';import Auth from './src/pages/AuthPage';import Forgot from './src/pages/ForgotPasswordPage';import {OAuthReturn} from './src/components/OAuthReturn';
 import Training from './src/features/training/PracticeTrainingPage';import {useShadowingQuota} from './src/features/shadowing/hooks/useShadowingQuota';
 import {ShadowingQuotaNotice} from './src/features/shadowing/sections/ShadowingQuotaNotice';
 function Legacy(){return <ExerciseRenderer exercise={{"id":"legacy-read","type":"reading_detail","skill":"reading","title":"Reading","instruction":"Answer the question.","minScoreToPass":60,"scoringRubric":{},"content":{"prompt":"Where is Mia?","readingText":"Mia is at school.","choices":["At school","At home"]},"correctAnswer":"At school"}} autoAdvanceOnPass={false} hasNext onNext={()=>window.qaNext=(window.qaNext||0)+1} onComplete={result=>{if(result.passed)window.qaCompleted=(window.qaCompleted||0)+1}}/>}
 function Quota(){const [owner,setOwner]=useState('A');window.qaOwner=owner;const q=useShadowingQuota(owner,'QA_video001');return <main className="wp-shell py-10"><h1>Shadowing</h1><ShadowingQuotaNotice quota={q}/>{[1,2,3,4].map(n=><button className="m-2 border p-3" key={n} disabled={q.pending} onClick={()=>q.ensure('QA_video00'+n)}>Video {n}</button>)}<button onClick={()=>setOwner(x=>x==='A'?'B':'A')}>Switch account</button></main>}
 createRoot(document.getElementById('root')).render(<BrowserRouter><OAuthReturn><Routes><Route path="/login" element={<Auth/>}/><Route path="/signup" element={<Auth/>}/><Route path="/forgot-password" element={<Forgot/>}/><Route path="/dashboard" element={<h1>Dashboard</h1>}/><Route path="/provider" element={<h1>Google redirect test</h1>}/><Route path="/legacy" element={<Legacy/>}/><Route path="/quota" element={<Quota/>}/><Route path="/practice/:experience/:language/:levelNumber/:lessonId/:exerciseId" element={<Training/>}/></Routes></OAuthReturn></BrowserRouter>);`;
 const bundle=await build({stdin:{contents:entry,resolveDir:root,loader:'tsx'},bundle:true,write:false,format:'iife',jsx:'automatic',
  define:{'import.meta.env.VITE_TURNSTILE_SITE_KEY':JSON.stringify(captchaQA ? 'qa-public-site-key' : ''),'import.meta.env.VITE_AUTH_CAPTCHA_REQUIRED':JSON.stringify(captchaQA ? 'true' : 'false')},
  plugins:[{name:'qa-boundaries',setup(b){b.onResolve({filter:/(AuthContext|i18n|LanguageSwitch|supabase|usePracticeProgress|curriculumRepository)$/},a=>({path:a.path.split('/').pop(),namespace:'qa'}));b.onLoad({filter:/.*/,namespace:'qa'},a=>({contents:mocks[a.path],loader:'tsx',resolveDir:root}));}}]});
 const css=readFileSync(path.join(root,'dist/assets',readdirSync(path.join(root,'dist/assets')).find(f=>f.endsWith('.css'))),'utf8');
 const accounts=new Map();
 const server=http.createServer(async(req,res)=>{
  if(req.url==='/qa-quota'){let body='';for await(const part of req)body+=part;const p=JSON.parse(body);const ids=accounts.get(p.owner)||[];const allowed=!p.p_video_id||ids.includes(p.p_video_id)||ids.length<3;
   if(allowed&&p.p_consume&&!ids.includes(p.p_video_id))ids.push(p.p_video_id);accounts.set(p.owner,ids);res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({allowed,used:ids.length,limit:3,isPro:false,videoIds:ids}));}
  if(req.url==='/wordpilot-logo.svg'){res.setHeader('Content-Type','image/svg+xml');return res.end(readFileSync(path.join(root,'public/wordpilot-logo.svg')));}
  res.setHeader('Content-Type','text/html');res.end('<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style></head><body><div id="root"></div><script>'+bundle.outputFiles[0].text.replaceAll('</script','<\\/script')+'</script></body></html>');
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;let browser;
 try{
  browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||'msedge'});
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const fillLogin=async()=>{await page.locator('input[type=email]').fill('qa@example.invalid');await page.locator('input[autocomplete=current-password]').fill('Test-only-pass123!');};
  if(captchaQA){
   let scriptFails=true;
   await page.route('https://challenges.cloudflare.com/**',route=>scriptFails?route.abort():route.fulfill({contentType:'application/javascript',body:"window.turnstile={render:(node,options)=>{window.qaChallenge=options;return 'qa-widget'},remove:()=>{window.qaRemoved=(window.qaRemoved||0)+1}};"}));
   await page.goto(origin+'/login');await fillLogin();
   await page.getByRole('alert').waitFor();
   assert.equal(await page.getByRole('button',{name:'Sign In',exact:true}).isDisabled(),true);
   await page.evaluate(()=>document.querySelector('form').requestSubmit());
   assert.equal(await page.evaluate(()=>window.qaCalls||0),0);
   scriptFails=false;await page.getByRole('button',{name:'Retry security check',exact:true}).click();
   await page.waitForFunction(()=>Boolean(window.qaChallenge));
   await page.evaluate(()=>window.qaChallenge.callback('qa-ephemeral-token'));
   assert.equal(await page.getByRole('button',{name:'Sign In',exact:true}).isEnabled(),true);
   await page.evaluate(()=>window.qaChallenge['expired-callback']());
   assert.equal(await page.getByRole('button',{name:'Sign In',exact:true}).isDisabled(),true);
   await page.evaluate(()=>window.qaChallenge.callback('qa-new-token'));
   await page.getByRole('button',{name:'Sign In',exact:true}).click();
   await page.getByText('Email or password is incorrect.',{exact:true}).waitFor();
   assert.equal(await page.getByRole('button',{name:'Sign In',exact:true}).isDisabled(),true);
   assert.ok(await page.evaluate(()=>window.qaRemoved>0));
   assert.deepEqual(errors,[]);
   console.log('PASS: CAPTCHA script failure/retry, missing token blocks direct submit, completion unlocks, expiry locks, attempt resets widget. Turnstile network mocked.');
   return;
  }
  for(const width of [390,768,1366,1920]){
   await page.setViewportSize({width,height:900});await page.goto(origin+'/login');await fillLogin();
   await page.evaluate(()=>{document.querySelector('form').requestSubmit();document.querySelector('form').requestSubmit();});
   await page.getByText('Email or password is incorrect.',{exact:true}).waitFor();
   assert.equal(await page.evaluate(()=>window.qaCalls),1);
   assert.equal(await page.getByRole('button',{name:'Sign In',exact:true}).isEnabled(),true);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.waitForFunction(()=>{let node=document.querySelector('form');while(node){if(Number(getComputedStyle(node).opacity)<0.99)return false;node=node.parentElement;}return true;});
   await page.screenshot({path:path.join(output,'login-'+width+'.png'),fullPage:true});
  }
  await page.goto(origin+'/login');await fillLogin();
  for(let n=1;n<=5;n++){await page.getByRole('button',{name:'Sign In',exact:true}).click();await page.waitForFunction(n=>window.qaCalls===n,n);await page.getByText('Email or password is incorrect.',{exact:true}).waitFor();}
  await page.getByText(/Too many unsuccessful attempts/).waitFor();
  assert.equal(await page.getByRole('button',{name:'Sign In',exact:true}).isDisabled(),true);
  assert.equal(await page.getByRole('button',{name:'Continue with Google'}).isEnabled(),true);
  await page.screenshot({path:path.join(output,'cooldown.png'),fullPage:true});
  await page.clock.install();await page.clock.fastForward(61000);
  await page.waitForFunction(() => [...document.querySelectorAll('button')].some(button => button.textContent.trim()==='Sign In' && !button.disabled));
  assert.equal(await page.getByRole('button',{name:'Sign In',exact:true}).isEnabled(),true);
  await page.evaluate(()=>window.qaMode='valid');await page.getByRole('button',{name:'Sign In',exact:true}).click();await page.getByRole('heading',{name:'Dashboard'}).waitFor();
  await page.goBack();assert.equal(await page.getByRole('button',{name:'Sign In',exact:true}).isEnabled(),true);
  await page.goto(origin+'/login');await fillLogin();await page.evaluate(()=>window.qaMode='429');await page.getByRole('button',{name:'Sign In',exact:true}).click();
  await page.getByText('Too many attempts. Please wait a moment and try again.',{exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Sign In',exact:true}).isDisabled(),true);
  await page.goto(origin+'/dashboard?error=access_denied&error_description=private');
  await page.getByText('Sign-in was cancelled. You can try again.',{exact:true}).waitFor();
  assert.equal(await page.getByText(/Too many unsuccessful attempts/).count(),0);
  await page.reload();assert.equal(await page.getByRole('button',{name:'Continue with Google'}).isEnabled(),true);
  for(const suffix of ['?oauth=callback','?oauth=callback&case=network','#error=server_error&error_description=private']){
   await page.goto(origin+'/dashboard'+suffix);await page.getByText("We couldn't sign you in. Please try again.",{exact:true}).waitFor();
  }
  await page.goto(origin+'/dashboard?oauth=callback&case=session');await page.getByRole('heading',{name:'Dashboard'}).waitFor();
  await page.goto(origin+'/login');await page.evaluate(()=>window.qaMode='pending');await page.getByRole('button',{name:'Continue with Google'}).click();await page.clock.fastForward(16000);
  await page.getByText("We couldn't sign you in. Please try again.",{exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Continue with Google'}).isEnabled(),true);
  await page.evaluate(()=>window.qaMode='success');await page.getByRole('button',{name:'Continue with Google'}).click();await page.waitForURL('**/provider');await page.goBack();
  assert.equal(await page.getByRole('button',{name:'Continue with Google'}).isEnabled(),true);
  await page.goto(origin+'/forgot-password');await page.locator('input[type=email]').fill('qa@example.invalid');
  await page.evaluate(()=>{document.querySelector('form').requestSubmit();document.querySelector('form').requestSubmit();});
  await page.getByText('If an account exists for this email, password reset instructions will be sent.',{exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>window.qaReset),1);
  await page.goto(origin+'/signup');await page.locator('input[autocomplete=name]').fill('QA Learner');await page.locator('input[type=email]').fill('qa@example.invalid');
  for(const input of await page.locator('input[autocomplete=new-password]').all())await input.fill('Test-only-pass123!');
  await page.getByRole('checkbox').check();await page.evaluate(()=>{document.querySelector('form').requestSubmit();document.querySelector('form').requestSubmit();});
  await page.waitForURL('**/login');assert.equal(await page.evaluate(()=>window.qaSignup),1);
  for(const experience of ['reading','review','progress-check']){
   await page.goto(origin+'/practice/'+experience+'/English/1/lesson/read1');
   await page.getByRole('button',{name:'At home',exact:true}).click();const label=experience==='reading'?'Check reading':experience==='review'?'Submit review item':'Submit check item';
   await page.getByRole('button',{name:label,exact:true}).click();
   assert.equal(await page.locator('[data-answer-state=incorrect]').count(),1);assert.equal(await page.evaluate(()=>window.qaWrites||0),0);
   await page.screenshot({path:path.join(output,experience+'-wrong.png'),fullPage:true});
   await page.getByRole('button',{name:'At school',exact:true}).click();assert.equal(await page.locator('[data-answer-state=incorrect]').count(),0);
   await page.getByRole('button',{name:label,exact:true}).click();await page.getByRole('button',{name:'Continue',exact:true}).waitFor();
   assert.equal(await page.evaluate(()=>window.qaWrites),1);assert.equal(await page.locator('[data-answer-state=correct]').count(),1);
   await page.screenshot({path:path.join(output,experience+'-correct.png'),fullPage:true});
  }
  await page.goto(origin+'/legacy');
  await page.getByRole('button',{name:'At home',exact:true}).click();await page.getByRole('button',{name:'Grade exercise',exact:true}).click();
  assert.equal(await page.locator('[data-answer-state=incorrect]').innerText(),'At home\nTry again');
  assert.equal(await page.evaluate(()=>window.qaCompleted||0),0);
  await page.getByRole('button',{name:'At school',exact:true}).click();
  await page.evaluate(()=>{const button=[...document.querySelectorAll('button')].find(b=>b.textContent==='Grade exercise');button.click();button.click();});
  await page.getByRole('button',{name:'Continue',exact:true}).waitFor();assert.equal(await page.evaluate(()=>window.qaCompleted),1);
  await page.evaluate(()=>{const button=[...document.querySelectorAll('button')].find(b=>b.textContent==='Continue');button.click();button.click();});
  assert.equal(await page.evaluate(()=>window.qaNext),1);
  await page.goto(origin+'/quota');await page.getByText('0 / 3 free Shadowing videos used').waitFor();await page.screenshot({path:path.join(output,'quota-0.png'),fullPage:true});
  for(let n=1;n<=3;n++){await page.getByRole('button',{name:'Video '+n,exact:true}).click();await page.getByText(n+' / 3 free Shadowing videos used').waitFor();await page.screenshot({path:path.join(output,'quota-'+n+'.png'),fullPage:true});}
  await page.getByRole('button',{name:'Video 4',exact:true}).click();await page.getByRole('link',{name:'Upgrade',exact:true}).waitFor();
  assert.equal(await page.getByRole('link',{name:'Upgrade',exact:true}).getAttribute('href'),'/pricing');await page.screenshot({path:path.join(output,'quota-blocked.png'),fullPage:true});
  await page.getByRole('button',{name:'Back to Shadowing',exact:true}).click();await page.getByRole('button',{name:'Video 1',exact:true}).click();
  await page.reload();await page.getByText('3 / 3 free Shadowing videos used').waitFor();await page.getByRole('button',{name:'Switch account'}).click();await page.getByText('0 / 3 free Shadowing videos used').waitFor();
  assert.deepEqual(errors,[]);console.log('PASS: auth/cooldown/reset/signup/OAuth, four responsive sizes, reading/review/check feedback, quota persistence/isolation UI. Provider/progress boundaries mocked; DB tested separately. Screenshots: '+output);
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
}
runBrowserQA().catch(e=>{console.error(e);process.exitCode=1;});
