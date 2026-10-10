import { localTime } from './planner.mjs';
const stamp=value=>new Date(value).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
const escape=value=>String(value).replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
function fold(line) {
  let result='', current='', bytes=0;
  for(const ch of line) {
    const size=new TextEncoder().encode(ch).length;
    if(bytes+size>75) { result+=current+'\r\n'; current=' '; bytes=1; }
    current+=ch; bytes+=size;
  }
  return result+current;
}
export function calendar(slot,members,{uid=crypto.randomUUID(),now=Date.now()}={}) {
  if(!Number.isFinite(slot.start)||!Number.isFinite(slot.end)||slot.end<=slot.start) throw new Error('Invalid calendar interval.');
  const description=members.map((member,i)=>{
    const start=localTime(slot.start,member.zone),end=localTime(slot.end,member.zone);
    return `${member.zone}: ${start.date} ${start.clock} to ${end.date} ${end.clock}${slot.coverage[i]<slot.duration?' (outside working hours)':''}`;
  }).join('\n');
  return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Commonhour//Meeting planner//EN','CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',`UID:${escape(uid)}@commonhour`, `DTSTAMP:${stamp(now)}`,`DTSTART:${stamp(slot.start)}`,
    `DTEND:${stamp(slot.end)}`,'SUMMARY:Commonhour meeting',`DESCRIPTION:${escape(description)}`,
    'END:VEVENT','END:VCALENDAR'].map(fold).join('\r\n')+'\r\n';
}
