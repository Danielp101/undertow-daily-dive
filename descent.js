// The world scrolls past the swimmer. Distances in the HUD are actual game metres.
window.renderDescent = function renderDescent(canvas, from, to, points, colour, onProgress) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};
  const width = 360, height = 105;
  canvas.width = width;
  canvas.height = height;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const animated = to !== from && !reduced;
  const duration = 760 + points * 11;
  const start = performance.now();
  let handle = 0;
  const sprite = ['                 xx   x','               xx   xx','             xxxx xx','           xabbaxx','          xabbaaax','  x      xabbbbbax','  xxx  xxabbbbcax','   xxxxxabbbbaax','    xabbbbaaaax','   xaaaaax x x','  xx  x x   x','      x  x'];
  const hash = n => { const k=Math.sin(n*78.233)*43758.5453;return k-Math.floor(k); };
  function draw(now) {
    const t = animated ? Math.min(1,Math.max(0,(now-start)/duration)) : 1;
    const ease = t*t*(3-2*t);
    const depth = from+(to-from)*ease;
    const speed = animated ? Math.sin(t*Math.PI) : 0;
    const shade = Math.min(1,depth/7000);
    const gradient = ctx.createLinearGradient(0,0,width,height);
    gradient.addColorStop(0,'hsl('+ (184+shade*48)+' 60% '+(24-shade*14)+'%)');
    gradient.addColorStop(1,'hsl('+ (202+shade*42)+' 62% '+(12-shade*7)+'%)');
    ctx.fillStyle=gradient;ctx.fillRect(0,0,width,height);
    for(let layer=0;layer<3;layer++){
      const spacing=layer===2?16:24, offset=depth*(0.025+layer*.05);
      const first=Math.floor(offset/spacing);
      for(let row=first-1;row<=first+height/spacing+1;row++){
        for(let i=0;i<5;i++){
          const seed=row*61+i*7+layer*303;
          const x=Math.floor(hash(seed+1)*width), y=Math.round(row*spacing-offset+hash(seed+4)*spacing);
          ctx.fillStyle=['#386275','#48838b','#92c9bb'][layer];
          ctx.globalAlpha=.35+hash(seed+9)*.45;
          ctx.fillRect(x,y,layer===2?2:1,1+Math.round(speed*(layer+1)*2));
        }
      }
    }
    ctx.globalAlpha=1;
    const x=115+Math.round(18*ease),y=36+Math.round(speed*15);
    ctx.save();ctx.translate(x,y);ctx.rotate(speed*.32);
    const colours={x:'#603e58',a:'#ea806c',b:'#ffb58e',c:'#142839'};
    sprite.forEach((row,yy)=>[...row].forEach((v,xx)=>{if(colours[v]){ctx.fillStyle=colours[v];ctx.fillRect(xx*2,yy*2,2,2)}}));
    ctx.restore();
    if(animated && points>=60 && t>.53){
      const k=(t-.53)/.47;
      ctx.fillStyle=colour;ctx.globalAlpha=Math.sin(k*Math.PI);
      const count=points===100?22:points===85?14:8;
      for(let i=0;i<count;i++){const a=i*2*Math.PI/count,rad=(10+43*k)*(.65+.5*hash(i+1));
        const ax=Math.round(x+25+Math.cos(a)*rad),ay=Math.round(y+10+Math.sin(a)*rad);
        ctx.fillRect(ax-1,ay,3,1);ctx.fillRect(ax,ay-1,1,3);}
      ctx.globalAlpha=1;
    }
    ctx.font='8px monospace';ctx.textBaseline='middle';
    for(let m=Math.floor(depth/100)*100-300;m<=depth+300;m+=100){
      if(m<0)continue;const yy=Math.round(height*.52+(m-depth)*.20);
      ctx.fillStyle=m%500===0?'#bfe8dc':'#66949c';
      ctx.fillRect(width-12,yy,12,1);
      if(m%500===0)ctx.fillText(m+'m',width-43,yy);
    }
    onProgress(Math.round(depth),t);
    if(t<1)handle=requestAnimationFrame(draw);
  }
  draw(start);
  return ()=>cancelAnimationFrame(handle);
};
