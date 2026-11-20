const tiers = window.diveTiers;
document.querySelector('#scale').innerHTML=tiers.map(({name,points:score,color},k)=>`<div class="tier" style="--tone:${color}"><div aria-hidden="true" class="pixels">${tiers.map((_,i)=>`<i class="${i<=k?'on':''}" style="height:${4+i*3}px"></i>`).join('')}</div><strong>${name}</strong><small>${score} PTS</small></div>`).join('');
const ctx=document.querySelector('#mark').getContext('2d');
['              **','          ** *','        ****','       ******',' **   *******','  ** ********','   **********','    ********','  ****** **',' *** **   **','**   **'].forEach((row,y)=>[...row].forEach((cell,x)=>{if(cell==='*'){ctx.fillStyle=x===10&&y===3?'#071e26':'#ffa78f';ctx.fillRect(x+1,y+3,1,1)}}));
function readLog(){try{return JSON.parse(localStorage.getItem('undertow.runs')||'[]')}catch{return []}}
window.logDive=run=>{try{localStorage.setItem('undertow.runs',JSON.stringify([run,...readLog()].slice(0,50)))}catch{}};
function showHome(){window.stopDive?.();document.querySelector('#game').hidden=true;document.querySelector('#home').hidden=false;window.scrollTo(0,0)}
function goHome(){if(document.querySelector('#game').hidden)return;if(window.confirm('Return to the surface? Your current dive will end.'))showHome()}
function panel(kind){const title=document.querySelector('#panelTitle'),body=document.querySelector('#panelBody');if(kind==='help'){title.textContent='How to play';body.innerHTML='<ol><li>Choose a date to replay its seven questions in order, or shuffle questions from across the archive. The original date appears above each prompt.</li><li>Read the prompt, then type one answer within 25 seconds. Press Enter to submit.</li><li>Each correct answer earns 10–100 points based on its assigned rarity. A miss or a pass earns zero.</li></ol><p>Every point takes you 10 metres deeper. A perfect 700-point dive reaches 7,000 metres.</p><p>Undertow is an independent replay of selected <a href="https://krillion.io/" target="_blank" rel="noopener noreferrer">Krillion Daily Dives</a>. Each round links to its dated answer sheet. Prompts use the archived wording. Spelling aliases may differ.</p>'}else{title.textContent='Dive log';const runs=readLog();body.replaceChildren();if(!runs.length)body.textContent='Finish a dive to see your score here.';runs.forEach(run=>{const row=document.createElement('div');row.className='logrow';const label=document.createElement('span'),score=document.createElement('strong');label.textContent=new Date(run.date).toLocaleDateString(undefined,{month:'short',day:'numeric'})+' · '+(run.mode==='daily'?'Archive':'Shuffle');score.textContent=run.score+' / 700';row.append(label,score);body.append(row)})}document.querySelector('#modal').showModal()}
document.querySelector('#modal').addEventListener('click',e=>{if(e.target===e.currentTarget){const box=e.target.getBoundingClientRect();if(e.clientX<box.left||e.clientX>box.right||e.clientY<box.top||e.clientY>box.bottom)e.target.close()}});

const archiveDates = new Map();
for (const question of window.BANK) archiveDates.set(question.date, (archiveDates.get(question.date) || 0) + 1);
for (const [date, count] of [...archiveDates].sort()) {
  if (count !== 7) continue;
  const label = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {month:'long', day:'numeric', year:'numeric'});
  document.querySelector('#archive-date').add(new Option(label, date));
}
