import { plan, localTime } from './src/planner.mjs';
import { calendar } from './src/calendar.mjs';
const $=id=>document.getElementById(id);
let members=[{zone:'America/New_York',start:'09:00',end:'17:00'},{zone:'Europe/London',start:'09:00',end:'18:00'},{zone:'Asia/Kolkata',start:'11:00',end:'20:00'}];
let result=null, selected=null;
const nextDay=()=>{const d=new Date();while([0,6].includes(d.getUTCDay()))d.setUTCDate(d.getUTCDate()+1);return d.toISOString().slice(0,10);};
$('date').value=nextDay();
const el=(tag,text,className)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(className)node.className=className;return node;};
const zones=['UTC',...(Intl.supportedValuesOf?Intl.supportedValuesOf('timeZone'):['America/New_York','Europe/London','Asia/Kolkata','Asia/Tokyo','Australia/Sydney'])];
$('zones').replaceChildren(...zones.map(zone=>{const option=el('option');option.value=zone;return option;}));
function clear(){result=null;selected=null;$('slots').replaceChildren();$('detail').hidden=true;$('empty-art').hidden=false;$('heading').textContent='Your next good time.';$('explanation').textContent='Settings changed. Find a shared window to update the results.';}
function read(){members=[...$('members').children].map(row=>({zone:row.querySelector('[data-zone]').value.trim(),start:row.querySelector('[data-start]').value,end:row.querySelector('[data-end]').value}));}
function renderMembers(){
  $('members').replaceChildren(...members.map((member,i)=>{
    const row=el('div',undefined,'member'),head=el('div',undefined,'member-head');
    const label=el('label',`Time zone ${i+1}`);label.htmlFor=`zone-${i}`;
    const remove=el('button','×','remove');remove.type='button';remove.setAttribute('aria-label',`Remove time zone ${i+1}`);remove.disabled=members.length===1;
    remove.addEventListener('click',()=>{read();members.splice(i,1);renderMembers();clear();});head.append(label,remove);
    const zone=el('input');zone.id=`zone-${i}`;zone.value=member.zone;zone.setAttribute('list','zones');zone.dataset.zone='';zone.required=true;
    const hours=el('div',undefined,'hours');
    for(const [key,caption] of [['start','From'],['end','Until']]){
      const label=el('label',caption),input=el('input');input.type='time';input.id=`${key}-${i}`;label.htmlFor=input.id;input.value=member[key];input.required=true;input.step=60;input.dataset[key]='';hours.append(label,input);
    }
    row.append(head,zone,hours);return row;
  }));$('add').disabled=members.length>=6;
}
function choose(slot){selected=slot;
  [...$('slots').children].forEach((button,i)=>{const chosen=result.slots[i]===slot;button.classList.toggle('selected',chosen);button.setAttribute('aria-pressed',String(chosen));});
  $('detail').hidden=false;
  $('local-times').replaceChildren(...result.members.map((member,i)=>{
    const start=localTime(slot.start,member.zone),end=localTime(slot.end,member.zone),row=el('div',undefined,'local');
    const location=el('div');location.append(el('strong',member.zone.replaceAll('_',' ')),el('div',`${start.weekday} ${start.date}`,'sub'));
    const good=slot.coverage[i]===slot.duration;location.append(el('span',good?'Within working hours':`${slot.duration-slot.coverage[i]} min outside hours`,good?'badge':'badge warn'));
    const time=el('div');time.append(el('div',`${start.clock} – ${end.clock}`,'clock'),el('div',start.date!==end.date?`Ends ${end.weekday} ${end.date}`:'Same local day','sub'));row.append(location,time);return row;
  }));
}
function run(){clear();$('status').classList.remove('error');
  try{read();result=plan($('date').value,members.map(m=>({...m,weekends:$('weekends').checked})),Number($('duration').value));
    $('empty-art').hidden=true;$('heading').textContent=result.matches?'You have common ground.':'No full overlap on this day.';
    $('explanation').textContent=result.matches?`${result.matches} start times fit everyone’s full meeting. Earliest shared windows shown below.`:'Closest compromises are shown below. Check the outside-hours labels before choosing.';
    $('slots').replaceChildren(...result.slots.slice(0,6).map(slot=>{
      const button=el('button',undefined,'slot'+(slot.available===members.length?'':' compromise'));button.type='button';
      button.append(el('strong',new Date(slot.start).toISOString().slice(11,16)),el('small','UTC start'),el('small',`${slot.available}/${members.length} fully within hours`));button.addEventListener('click',()=>choose(slot));return button;
    }));choose(result.slots[0]);$('status').textContent=`${$('date').value} UTC · Starts every 30 minutes · Full duration checked`;
  }catch(error){clear();$('status').textContent=error.message;$('status').classList.add('error');}
}
$('planner').addEventListener('submit',event=>{event.preventDefault();run();});
$('planner').addEventListener('input',()=>clear());
$('add').addEventListener('click',()=>{read();if(members.length<6)members.push({zone:'Asia/Tokyo',start:'09:00',end:'17:00'});renderMembers();clear();});
$('demo').addEventListener('click',()=>{members=[{zone:'America/New_York',start:'09:00',end:'17:00'},{zone:'Europe/London',start:'09:00',end:'18:00'},{zone:'Asia/Kolkata',start:'11:00',end:'20:00'}];$('date').value=nextDay();$('duration').value='60';$('weekends').checked=false;renderMembers();run();});
$('download').addEventListener('click',()=>{if(!selected)return;const url=URL.createObjectURL(new Blob([calendar(selected,result.members)],{type:'text/calendar'}));const link=el('a');link.href=url;link.download='commonhour-meeting.ics';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
renderMembers();run();
