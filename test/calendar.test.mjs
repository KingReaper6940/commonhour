import {test} from 'node:test';
import assert from 'node:assert/strict';
import {calendar} from '../src/calendar.mjs';
test('exports absolute UTC start/end and local date context',()=>{
  const slot={start:Date.parse('2026-10-12T14:00Z'),end:Date.parse('2026-10-12T15:00Z'),coverage:[60],duration:60};
  const data=calendar(slot,[{zone:'Asia/Kolkata'}],{uid:'test',now:slot.start});
  assert.ok(data.includes('DTSTART:20261012T140000Z\r\n'));
  assert.ok(data.includes('DTEND:20261012T150000Z\r\n'));
  assert.ok(data.replace(/\r\n /g,'').includes('19:30 to 2026-10-12 20:30'));
  assert.ok(data.endsWith('END:VCALENDAR\r\n'));
});
test('folds long descriptions to 75 bytes and labels compromise slots',()=>{
  const slot={start:0,end:3600000,coverage:Array(6).fill(0),duration:60};
  const data=calendar(slot,Array(6).fill({zone:'America/Argentina/Buenos_Aires'}),{uid:'test',now:0});
  for(const line of data.split('\r\n')) assert.ok(Buffer.byteLength(line)<=75);
  assert.ok(data.replace(/\r\n /g,'').includes('outside working hours'));
});
test('rejects invalid intervals',()=>{assert.throws(()=>calendar({start:2,end:1},[]));});
