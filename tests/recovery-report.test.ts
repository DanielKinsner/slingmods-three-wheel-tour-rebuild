import test from 'node:test';import assert from 'node:assert/strict';
import {classifyStartupError,recoveryCopy,recoveryReport,retainRecoveryReport,RECOVERY_REPORT_KEY} from '../src/demo/recovery-report';

test('startup bugs and timeouts are distinguished from asset and graphics failures',()=>{
 assert.equal(classifyStartupError(new ReferenceError('Cannot access initialization before initialization')),'startup');
 assert.equal(classifyStartupError(new Error('Career context is invalid')),'startup');
 assert.equal(classifyStartupError(new Error('Required scene loading timed out')),'timeout');
 assert.equal(classifyStartupError(new TypeError('Failed to fetch dynamically imported module: http://localhost/assets/garage.js')),'assets');
 assert.equal(classifyStartupError(new Error('THREE.WebGLRenderer: Error creating WebGL context.')),'graphics');
 assert.equal(classifyStartupError(new Error('The demo session cannot be read')),'demo');
});

test('career startup messages name the career and do not misdiagnose its connection',()=>{
 for(const kind of ['startup','assets','timeout'] as const){const copy=recoveryCopy(kind,'bay');assert.match(copy.heading,/Your career/);assert.doesNotMatch(copy.message,/connection|internet/i);assert.match(copy.message,/saved career has not been reset/)}
 assert.match(recoveryCopy('assets','ridge').heading,/The drive/);assert.match(recoveryCopy('assets','signature').heading,/The showroom/);
});

test('retained diagnostics strip URL payloads and write only their own session key',()=>{
 const error=new Error('Failed to fetch http://localhost/assets/garage.js?token=private#build=secret');error.stack='Error\n at http://localhost/assets/game.js?transfer=private#build=secret';
 const report=recoveryReport('assets',error,{scene:'bay',build:'tested-build',elapsedMs:42.6}),values=new Map<string,string>([['career','unchanged']]);
 retainRecoveryReport(report,{setItem:(key,value)=>{values.set(key,value)}});
 assert.equal(values.get('career'),'unchanged');assert.equal(values.size,2);
 const saved=JSON.parse(values.get(RECOVERY_REPORT_KEY)!);assert.equal(saved.build,'tested-build');assert.equal(saved.elapsedMs,43);assert.equal(saved.scene,'bay');assert.doesNotMatch(JSON.stringify(saved),/private|secret|token=|transfer=/);
 assert.match(saved.stack,/assets\/game.js/);assert.ok(Date.parse(saved.at));
});

test('unavailable session storage never prevents recovery and error text stays bounded',()=>{
 const report=recoveryReport('startup',new Error('x'.repeat(10000)),{scene:'bay',build:'test',elapsedMs:1});
 assert.ok(report.message.length<=5000);assert.ok(report.stack!.length<=5000);
 assert.doesNotThrow(()=>retainRecoveryReport(report,{setItem:()=>{throw new DOMException('Denied','SecurityError')}}));
});
