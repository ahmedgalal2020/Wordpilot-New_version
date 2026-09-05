const { createRequire } = require('node:module');
const { readFileSync, readdirSync, mkdtempSync } = require('node:fs');
const http = require('node:http');
const assert = require('node:assert/strict');
const path = require('node:path');
const repo = path.resolve(__dirname, '..');
const outputDir = mkdtempSync(path.join(require('node:os').tmpdir(), 'wordpilot-training-qa-'));
const req = createRequire(path.join(repo, 'package.json'));
const { build } = req('esbuild');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const exercise = (id, type, skill, content, correctAnswer) => ({ id, type, skill, content, correctAnswer, minScoreToPass:60, title:id, instruction:'Complete this activity.', scoringRubric:{} });
const listening = id => exercise(id,'listen_for_detail','listening',{listeningScript:'Mia is at school.', prompt:'Where is Mia?', choices:['At school','At home']},'At school');
const lesson = {id:'lesson',language:'English',levelNumber:1,cefrLevel:'A1',cefrSubLevel:'1',title:'Greetings',theme:'Greetings',objective:'Introduce yourself.',canDo:'I can introduce myself.',grammarFocus:'Present forms',targetSentence:'My name is Mia.',chunks:[],writingTask:{},speakingTask:{prompt:'Say hello.',focus:[]},roleplay:{},exercises:[listening('listen1'),listening('listen2'),exercise('write','guided_writing','writing',{prompt:'Introduce yourself in two sentences.'}),exercise('gap','grammar_gap','grammar',{template:'She ___ here.'},'is')]};
const mocks = {
 AuthContext: "export function useAuth(){return {user:{id:'qa-user'}};}",
 usePracticeProgress: "import {useState} from 'react'; export function usePracticeProgress(){const [rows,setRows]=useState([]); return {rows,upsertProgress:async(p)=>{window.qaWrites=(window.qaWrites||0)+1;if(window.qaFail)return {error:'offline'};setRows(r=>[...r,{exercise_id:p.exerciseId,status:'completed'}]);return {error:null};}}}",
 curriculumRepository: 'export class CurriculumRepositoryError extends Error {} export async function loadCurriculumLevel(){return {lessons:['+JSON.stringify(lesson)+']};}'
};
(async()=>{
 const bundle = await build({stdin:{contents:"import React from 'react';import {createRoot} from 'react-dom/client';import {BrowserRouter,Routes,Route} from 'react-router-dom';import Page from './src/features/training/PracticeTrainingPage';createRoot(document.getElementById('root')).render(<BrowserRouter><Routes><Route path='/practice/:experience/:language/:levelNumber/:lessonId/:exerciseId' element={<Page/>}/></Routes></BrowserRouter>);",resolveDir:repo,loader:'tsx'},bundle:true,write:false,format:'iife',jsx:'automatic',plugins:[{name:'qa-boundaries',setup(b){b.onResolve({filter:/(AuthContext|usePracticeProgress|curriculumRepository)$/},a=>({path:a.path.split('/').pop(),namespace:'mock'}));b.onLoad({filter:/.*/,namespace:'mock'},a=>({contents:mocks[a.path],loader:'tsx',resolveDir:repo}));}}]});
 const css = readFileSync(path.join(repo,'dist/assets',readdirSync(path.join(repo,'dist/assets')).find(f=>f.endsWith('.css'))),'utf8');
 const server = http.createServer((q,s)=>{s.setHeader('Content-Type','text/html');s.end('<html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>'+css+'</style></head><body><div id="root"></div><script>'+bundle.outputFiles[0].text.replaceAll('</script','<\\/script')+'</script></body></html>');});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 let browser;
 try {
 browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL || 'msedge'});
 const page=await browser.newPage(); const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const origin='http://127.0.0.1:'+server.address().port;
 const go=async(experience,id)=>{await page.goto(origin+'/practice/'+experience+'/English/1/lesson/'+id);await page.getByText('Loading practice...', {exact:true}).waitFor({state:'hidden'});};
 for(const width of [390,768,1366,1920]){
 await page.setViewportSize({width,height:900});
 await go('listening','listen1');
 assert.equal(await page.getByRole('button',{name:'View transcript'}).count(),0);
 await page.getByRole('button',{name:'At home',exact:true}).click();
 await page.getByRole('button',{name:'Submit answer',exact:true}).click();
 await page.getByText('Not quite - try again.',{exact:true}).waitFor();
 assert.equal(await page.evaluate(()=>window.qaWrites||0),0);
 await page.getByRole('button',{name:'At school',exact:true}).click();
 await page.evaluate(()=>window.qaFail=true);
 await page.getByRole('button',{name:'Try again',exact:true}).click();
 await page.getByRole('alert').waitFor();
 assert.equal(await page.getByRole('button',{name:'Continue',exact:true}).count(),0);
 await page.evaluate(()=>window.qaFail=false);
 await page.getByRole('button',{name:'Submit answer',exact:true}).click();
 await page.getByRole('button',{name:'Continue',exact:true}).waitFor();
 await page.getByRole('button',{name:'View transcript'}).click();
 await page.getByText('Mia is at school.',{exact:true}).waitFor();
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.screenshot({path:path.join(outputDir,'training-'+width+'.png'),fullPage:true});
 await page.getByRole('button',{name:'Continue',exact:true}).click();
 await page.waitForURL('**/listen2');
 await page.getByRole('button',{name:'At school',exact:true}).click();
 await page.getByRole('button',{name:'Submit answer',exact:true}).click();
 await page.getByRole('heading',{name:'Listening complete',exact:true}).waitFor();
 await page.getByRole('button',{name:'View transcript'}).click();
 await page.getByText('Mia is at school.',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Continue to next skill',exact:true}).click();
 await page.waitForURL('**/write');
 await page.goBack(); await page.waitForURL('**/listen2');
 await page.reload(); await page.getByRole('heading',{name:'listen2',exact:true}).waitFor();
 }
 await go('review','gap');
 await page.getByRole('textbox').fill('is');
 await page.getByRole('button',{name:'Submit review item'}).click();
 await page.getByRole('button',{name:'Continue',exact:true}).click();
 await page.waitForURL('**/listen1');
 await go('progress-check','gap');
 await page.getByRole('textbox').fill('is');
 await page.getByRole('button',{name:'Submit check item'}).click();
 await page.getByRole('button',{name:'Continue',exact:true}).click();
 await page.waitForURL('**/listen1');
 await go('writing','write');
 await page.getByRole('textbox').fill('Hello, my name is Alex.');
 await page.getByRole('button',{name:'Complete writing'}).click();
 await page.getByRole('heading',{name:'Writing complete',exact:true}).waitFor();
 assert.equal(await page.getByText('100%',{exact:true}).count(),0);
 assert.deepEqual(errors,[]);
 console.log('Browser QA PASS: 4 viewport widths, wrong answer, failed save retry, transcript on final listening item, continuation, Back/refresh, Review/Progress Check, subjective writing, no overflow or page errors. Auth/content/progress mocked; no database writes.');
 }finally{await browser?.close(); await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
