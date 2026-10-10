const minute = 60000;
export function localTime(instant, zone) {
  const format = new Intl.DateTimeFormat('en-GB', { timeZone: zone, year:'numeric', month:'2-digit', day:'2-digit', weekday:'short', hour:'2-digit', minute:'2-digit', hourCycle:'h23' });
  const parts = Object.fromEntries(format.formatToParts(instant).map(p => [p.type, p.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, clock: `${parts.hour}:${parts.minute}`, weekday: parts.weekday,
    minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}
function clock(value, end = false) {
  if (!/^\d{2}:\d{2}$/.test(value)) throw new Error('Working hours must use HH:MM.');
  const [h,m] = value.split(':').map(Number);
  if (m > 59 || h > 23 && !(end && h === 24 && m === 0)) throw new Error('Invalid working hours.');
  return h * 60 + m;
}
export function normalizeMember(member) {
  try { new Intl.DateTimeFormat('en', { timeZone: member.zone }).format(); }
  catch { throw new Error('Choose a valid IANA time zone.'); }
  const start = clock(member.start), end = clock(member.end, true);
  if (start === end) throw new Error('Start and end must differ; use 00:00–24:00 for all day.');
  return { ...member, startMinute:start, endMinute:end };
}
export function inHours(local, member) {
  if (!member.weekends && ['Sat','Sun'].includes(local.weekday)) return false;
  const start = member.startMinute, end = member.endMinute;
  return start < end ? local.minutes >= start && local.minutes < end
    : local.minutes >= start || local.minutes < end;
}
export function plan(date, members, duration = 60) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Choose a valid UTC date.');
  const base = Date.parse(`${date}T00:00:00Z`);
  if (!Number.isFinite(base) || new Date(base).toISOString().slice(0,10) !== date) throw new Error('Choose a valid UTC date.');
  if (![30,60,90,120].includes(duration)) throw new Error('Duration must be 30, 60, 90 or 120 minutes.');
  if (!Array.isArray(members) || !members.length || members.length > 6) throw new Error('Choose between one and six time zones.');
  const normalized = members.map(normalizeMember);
  const availability = normalized.map(member => {
    const formatter = new Intl.DateTimeFormat('en-GB', { timeZone: member.zone, weekday:'short', hour:'2-digit', minute:'2-digit', hourCycle:'h23' });
    const counts = [0];
    for (let i = 0; i < 1440 + duration; i++) {
      const p = Object.fromEntries(formatter.formatToParts(base + i * minute).map(part => [part.type, part.value]));
      counts.push(counts[i] + Number(inHours({ weekday:p.weekday, minutes:Number(p.hour)*60+Number(p.minute) }, member)));
    }
    return counts;
  });
  const slots = [];
  for (let start = 0; start < 1440; start += 30) {
    const coverage = availability.map(counts => counts[start+duration] - counts[start]);
    slots.push({ start:base+start*minute, end:base+(start+duration)*minute, coverage,
      available:coverage.filter(n => n === duration).length,
      total:coverage.reduce((a,b)=>a+b,0), duration });
  }
  slots.sort((a,b) => b.available-a.available || b.total-a.total || a.start-b.start);
  return { slots, members:normalized, matches:slots.filter(s=>s.available === members.length).length };
}
