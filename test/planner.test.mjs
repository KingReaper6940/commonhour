import { test } from 'node:test';
import assert from 'node:assert/strict';
import { plan, localTime, normalizeMember, inHours } from '../src/planner.mjs';
const person=(zone,start='09:00',end='17:00',weekends=false)=>({zone,start,end,weekends});
test('date-specific DST offsets and fractional time zones',()=>{
  assert.equal(localTime(Date.parse('2026-03-07T17:00Z'),'America/New_York').clock,'12:00');
  assert.equal(localTime(Date.parse('2026-03-08T17:00Z'),'America/New_York').clock,'13:00');
  assert.equal(localTime(Date.parse('2026-10-12T00:00Z'),'Asia/Kathmandu').clock,'05:45');
});
test('checks the whole meeting and treats closing time as exclusive',()=>{
  const result=plan('2026-10-12',[person('UTC','09:00','10:00')],60);
  assert.equal(result.matches,1);
  assert.equal(new Date(result.slots[0].start).toISOString(),'2026-10-12T09:00:00.000Z');
  assert.equal(result.slots.find(s=>new Date(s.start).getUTCHours()===9 && new Date(s.start).getUTCMinutes()===30).available,0);
});
test('uses local calendar weekdays, including previous dates',()=>{
  assert.equal(plan('2026-10-10',[person('UTC')]).matches,0);
  assert.ok(plan('2026-10-10',[person('UTC','09:00','17:00',true)]).matches>0);
  const local=localTime(Date.parse('2026-10-12T02:00Z'),'America/Los_Angeles');
  assert.equal(local.date,'2026-10-11'); assert.equal(local.weekday,'Sun');
});
test('supports overnight hours and identifies impossible overlap',()=>{
  const member=normalizeMember(person('UTC','22:00','06:00',true));
  assert.equal(inHours({minutes:60,weekday:'Mon'},member),true);
  assert.equal(inHours({minutes:720,weekday:'Mon'},member),false);
  assert.equal(plan('2026-10-12',[person('UTC','09:00','10:00'),person('UTC','15:00','16:00')]).matches,0);
});
test('rejects invalid dates, zones, durations and hours',()=>{
  for(const date of ['2026-02-30','bad']) assert.throws(()=>plan(date,[person('UTC')]));
  for(const p of [person('bad'),person('UTC','25:00'),person('UTC','09:00','09:00')]) assert.throws(()=>plan('2026-10-12',[p]));
  assert.throws(()=>plan('2026-10-12',[],60));
  assert.throws(()=>plan('2026-10-12',[person('UTC')],15));
});
