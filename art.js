(() => {
  function drawOcean() {
    const canvas = document.getElementById("ocean-art");
    if (!canvas) return;
    const width = 288;
    const height = 168;
    canvas.width = width;
    canvas.height = height;
    canvas.style.imageRendering = "pixelated";
    const g = canvas.getContext("2d");
    if (!g) return;
    let seed = 54216;
    const random = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296);
    function box(color,x,y,w,h) {
      g.fillStyle=color;
      g.fillRect(x,y,w,h);
    }
    // Scanline fill preserves crisp one-pixel edges at every display scale.
    function poly(color, points) {
      const ys = points.map(p => p[1]);
      for(let y=Math.min(...ys); y<Math.max(...ys); y++) {
        const hits=[];
        for(let j=0; j<points.length; j++) {
          const a=points[j], b=points[(j+1)%points.length], mid=y+0.5;
          if((a[1]<=mid && b[1]>mid)||(b[1]<=mid && a[1]>mid))
            hits.push(a[0]+(mid-a[1])*(b[0]-a[0])/(b[1]-a[1]));
        }
        hits.sort((a,b)=>a-b);
        for(let j=0;j<hits.length;j+=2) box(color,Math.round(hits[j]),y,Math.round(hits[j+1])-Math.round(hits[j]),1);
      }
    }
    function line(color,points,size=1) {
      for(let i=1;i<points.length;i++) {
        const [x,y]=points[i-1], [u,v]=points[i];
        const n=Math.max(Math.abs(u-x),Math.abs(v-y));
        for(let t=0;t<=n;t++) box(color,Math.round(x+(u-x)*t/(n||1)),Math.round(y+(v-y)*t/(n||1)),size,size);
      }
    }
    const sea=g.createLinearGradient(0,0,0,height);
    sea.addColorStop(0,"#326d77");sea.addColorStop(.43,"#19495e");sea.addColorStop(1,"#102e43");
    box(sea,0,0,width,height);
    for(const [x,w,dx] of [[56,13,-66],[77,5,-65],[121,24,-69],[155,7,-70],[215,16,-70],[239,5,-70]]) {
      poly("rgba(154,231,203,.045)",[[x,0],[x+w,0],[x+w+dx,145],[x+dx,145]]);
    }
    for(let i=0;i<450;i++) {
      const x=Math.floor(random()*288), y=Math.floor(random()*168);
      box(y<20?"rgba(185,238,210,.12)":"rgba(161,226,206,.1)",x,y,random()<.06?3:1,1);
    }
    function ridge(color,base,amp,step) {
      const pts=[[0,height],[0,base]];
      for(let x=0;x<width+step;x+=step) pts.push([x,Math.round(base+random()*amp)]);
      pts.push([width,height]);poly(color,pts);
    }
    ridge("#245566",105,17,13);
    ridge("#1a4154",114,16,10);
    const kelp=(x,base,h,c,phase)=>{
      const path=[];
      for(let i=0;i<h;i++) path.push([x+Math.round(Math.sin(i/10+phase)*3+i*.035),base-i]);
      line(c,path,2);
      for(let i=5;i<h-4;i+=6) {
        const [a,b]=path[i], sign=(i%12<6?1:-1);
        poly(c,[[a,b+2],[a+5*sign,b-2],[a+7*sign,b-8],[a+3*sign,b-5],[a,b-1]]);
      }
    };
    for(let i=0;i<28;i++) kelp(Math.floor(random()*288),147,10+Math.floor(random()*31),"#1c4958",random()*5);
    ridge("#103344",127,15,13);
    function fish(x,y,c,dir) {
      poly(c,[[x,y],[x+3*dir,y-2],[x+7*dir,y-1],[x+9*dir,y+1],[x+6*dir,y+2],[x+3*dir,y+1]]);
      poly(c,[[x+dir,y],[x-3*dir,y-2],[x-3*dir,y+2]]);
    }
    for(const [x,y] of [[209,47],[222,50],[236,43],[219,39],[241,54],[249,48]]) fish(x,y,"#47808a",1);
    for(const [x,y] of [[45,96],[34,101],[49,106]]) fish(x,y,"#387080",-1);
    // Antennae arc above the head and taper out into the open water.
    line("#ffc292",[[165,60],[174,52],[190,44],[209,39],[222,39],[229,41]]);
    line("#d88b7d",[[168,64],[187,57],[203,56],[214,58],[219,62]]);
    line("#ffb089",[[166,61],[180,50],[195,47]]);
    // Swimmerets, walking legs and the tail fan are layered behind the shell.
    for(const [x,y,dx] of [[129,88,-4],[137,84,-3],[145,80,-1],[152,77,1],[158,73,3]]) {
      line("#ba6a6b",[[x,y],[x+3,y+7],[x+dx+1,y+15],[x+dx-5,y+18]],2);
      line("#ffac84",[[x,y],[x+3,y+6],[x+dx,y+12]]);
    }
    poly("#743f55",[[111,90],[104,100],[91,112],[83,114],[85,107],[74,110],[78,102],[70,101],[73,94],[84,91],[100,90]]);
    poly("#e57872",[[108,92],[99,101],[86,112],[87,106],[96,97]]);
    poly("#fc9a79",[[105,91],[94,100],[77,106],[81,99],[93,94]]);
    poly("#ffd098",[[101,91],[88,96],[72,99],[76,93],[92,90]]);
    // Each shell plate has its own ridge, shadow and narrow warm rim.
    const plates=[
      [[98,89],[104,80],[111,78],[118,85],[113,93],[105,99],[99,99]],
      [[103,80],[112,72],[120,70],[129,79],[124,88],[114,95],[112,87]],
      [[114,72],[124,64],[132,63],[140,73],[136,82],[126,88],[125,80]],
      [[125,65],[137,57],[145,57],[153,67],[147,77],[137,83],[137,74]]
    ];
    for(const p of plates) {
      poly("#8e5260",p.map(([x,y])=>[x,y+2]));
      poly("#e67b70",p);
      poly("#fba17d",[p[0],p[1],p[2],[p[3][0]-3,p[3][1]],[(p[0][0]+p[3][0])>>1,p[0][1]+3]]);
      line("#ffd09a",[p[0],p[1],p[2]],2);
      line("#bf6266",[p[2],p[3],p[4]]);
    }
    poly("#924d5a",[[139,58],[149,52],[159,53],[166,56],[169,60],[182,60],[173,66],[164,68],[156,77],[148,80],[146,73]]);
    poly("#f08a75",[[138,58],[148,52],[159,53],[164,57],[167,61],[182,59],[171,65],[161,67],[154,74],[147,76],[146,68]]);
    poly("#ffb88a",[[138,58],[149,52],[159,53],[162,56],[152,56],[143,63]]);
    line("#ffdbab",[[140,58],[148,54],[155,54]],2);
    line("#ce6665",[[147,65],[149,71],[154,73]]);
    box("#4a3746",159,54,5,5);box("#212d3a",160,54,4,4);box("#fff0be",160,54,2,2);
    line("#efa47e",[[160,67],[168,71],[177,71],[181,68]]);
    line("#e48c7c",[[156,70],[164,77],[171,77],[177,74]]);
    for(const [x,y,s] of [[178,49,3],[185,36,4],[179,29,2],[69,73,2],[63,66,3],[224,93,2],[231,81,3],[211,103,2]]) {
      box("#72a8a7",x+1,y,s-1,1);box("#72a8a7",x,y+1,1,s-1);box("#527f8a",x+s,y+1,1,s-1);box("#527f8a",x+1,y+s,s-1,1);box("#a9cdba",x+1,y,1,1);
    }
    ridge("#102d3e",143,12,11);
    for(const x of [0,9,24,46,247,260,275,285]) kelp(x,168,22+Math.floor(random()*26),"#123a43",random()*5);
    for(const x of [4,17,37,254,270,283]) kelp(x,170,25+Math.floor(random()*20),"#245857",random()*5);
    ridge("#0c2936",155,9,15);
    for(const [x,y,s] of [[19,157,1],[42,162,1],[249,160,1],[267,155,2],[3,159,2]]) {
      const coral="#ab686a",hi="#df8c78";
      const branch=(pts)=>line(coral,pts.map(([a,b])=>[x+a*s,y+b*s]),2*s);
      branch([[0,3],[0,-5],[-3,-8],[-3,-14]]);
      branch([[0,-3],[4,-6],[4,-11],[6,-13]]);
      branch([[-3,-7],[-7,-9],[-7,-12]]);
      box(hi,x-3*s,y-14*s,2*s,s);box(hi,x+6*s,y-13*s,2*s,s);
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded",drawOcean,{once:true});
  else drawOcean();
})();
