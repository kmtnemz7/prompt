
/*! Futuristic Background — DELUXE FAST (parallax smoothing + adaptive quality + half-res bloom) */
(function(){
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const BLOOM_SCALE = 0.5; // render bloom at half resolution for big perf win
  const PERF_TARGET_MS = 16.7; // 60 fps
  const PERF_LOW_MS    = 22.0; // ~45 fps threshold
  const PERF_BAD_MS    = 28.0; // ~35 fps threshold

  const state = {
    theme: 'net',            // 'net' | 'hex'
    speed: 0.22,
    density: 16000,          // area/density -> elements count
    linkDist: 140,
    nodeSize: 2.0,
    colors: [[78,201,255],[120,92,255],[0,255,210]],
    parallax: { mouse: 24, scroll: 20 },   // px offsets
    bloom: { strength: 0.55, blur: 12 },   // 0..1, px (applied on bloom layer)
    paused: false
  };

  // Canvas
  const canvas = document.createElement('canvas');
  canvas.id = 'bg-net';
  Object.assign(canvas.style, { position:'fixed', inset:'0', width:'100vw', height:'100vh', pointerEvents:'none', zIndex:'0' });
  document.body.insertBefore(canvas, document.body.firstChild || null);
  const ctx = canvas.getContext('2d');

  // Bloom offscreen at reduced resolution
  const bCanvas = document.createElement('canvas');
  const bCtx    = bCanvas.getContext('2d');

  let W=0, H=0, t=0, nodes=[], hexGrid=null, raf=0;
  let mouse = { x: window.innerWidth/2, y: window.innerHeight/2, active:false };
  let px = 0, py = 0, tx = 0, ty = 0; // parallax current vs target
  let fpsEMA = 16.7, quality = 1.0;   // adaptive quality [0.55..1]
  let lastTime = performance.now();

  function rgb(arr,a){ return `rgba(${arr[0]},${arr[1]},${arr[2]},${a})`; }
  function pick(a){ return a[(Math.random()*a.length)|0]; }
  function rand(min,max){ return Math.random()*(max-min)+min; }

  function resize(){
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.floor(W*dpr); canvas.height = Math.floor(H*dpr);
    canvas.style.width = W+'px'; canvas.style.height=H+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);

    bCanvas.width  = Math.floor(W*dpr*BLOOM_SCALE);
    bCanvas.height = Math.floor(H*dpr*BLOOM_SCALE);

    initTheme();
  }

  function effectiveDensity(){
    // lower quality -> higher density (=> fewer nodes)
    const q = Math.max(0.55, Math.min(1, quality));
    return state.density / q; // smaller q -> larger density -> fewer nodes
  }

  function initTheme(){
    if (state.theme==='net'){
      const target = Math.max(24, Math.min(260, Math.floor((W*H)/effectiveDensity())));
      nodes.length = 0;
      for(let i=0;i<target;i++){
        nodes.push({
          x: rand(0,W), y: rand(0,H),
          vx: rand(-state.speed, state.speed),
          vy: rand(-state.speed, state.speed),
          c: pick(state.colors)
        });
      }
    } else {
      const base = Math.sqrt(effectiveDensity())/2;
      const step = Math.max(16, base);
      const r = step/1.15;
      const h = Math.sin(Math.PI/3)*r;
      const cols = Math.ceil(W/(r*1.5))+2;
      const rows = Math.ceil(H/(h*2))+2;
      const pts = [];
      for(let row=0; row<rows; row++){
        for(let col=0; col<cols; col++){
          const x = col*(r*1.5)+((row%2)? r*0.75:0);
          const y = row*(h*2)+h;
          pts.push({ x, y, c: pick(state.colors), b: Math.random()*Math.PI*2 });
        }
      }
      hexGrid = { pts, r, h };
    }
  }

  function drawBackground(g){
    const grd = g.createLinearGradient(0,0,W,H);
    grd.addColorStop(0, 'rgba(10,12,20,0.75)');
    grd.addColorStop(1, 'rgba(8,10,18,0.75)');
    g.fillStyle = grd; g.fillRect(0,0,W,H);
  }

  function updateParallax(){
    const cx = W/2, cy = H/2;
    const nx = (mouse.x - cx) / Math.max(1, cx);
    const ny = (mouse.y - cy) / Math.max(1, cy);
    const scroll = window.scrollY || 0;
    const targetX = nx * state.parallax.mouse + (scroll / 1000) * state.parallax.scroll;
    const targetY = ny * state.parallax.mouse + (scroll / 1200) * state.parallax.scroll;

    // smooth towards target (LERP)
    const k = 0.10; // smoothing factor
    tx = targetX; ty = targetY;
    px += (tx - px) * k;
    py += (ty - py) * k;
  }

  function adaptiveQuality(frameMs){
    // Exponential moving average of frame time
    fpsEMA = fpsEMA*0.9 + frameMs*0.1;

    // If heavy -> drop quality; if light -> slowly restore
    if (fpsEMA > PERF_BAD_MS)      quality = Math.max(0.55, quality - 0.08);
    else if (fpsEMA > PERF_LOW_MS) quality = Math.max(0.70, quality - 0.04);
    else if (fpsEMA < PERF_TARGET_MS*0.95) quality = Math.min(1.0, quality + 0.02);
  }

  function step(now){
    if (state.paused) return;

    const dt = now - lastTime; lastTime = now;
    adaptiveQuality(dt);
    t += Math.min(0.032, dt/1000); // cap dt to keep animations stable

    // dynamic bloom softening during active mouse movement
    const activeBloom = mouse.active ? Math.max(0.3, state.bloom.strength*0.7) : state.bloom.strength;
    const activeBlur  = mouse.active ? Math.max(6, state.bloom.blur*0.75) : state.bloom.blur;
    mouse.active = false; // will be set true on next pointer event

    updateParallax();

    // Clear base and bloom layers
    ctx.clearRect(0,0,W,H);
    drawBackground(ctx);

    // Bloom ctx uses device pixels; map to CSS pixels by scaling when drawing
    bCtx.setTransform(1,0,0,1,0,0);
    bCtx.clearRect(0,0,bCanvas.width,bCanvas.height);
    bCtx.setTransform(dpr*BLOOM_SCALE,0,0,dpr*BLOOM_SCALE,0,0); // so we can draw in CSS px units
    bCtx.translate(px, py);

    ctx.save(); ctx.translate(px, py);

    if (state.theme==='net'){
      const linkDist2 = state.linkDist*state.linkDist;
      for(let i=0;i<nodes.length;i++){
        const a = nodes[i];
        a.x += a.vx; a.y += a.vy;
        if (a.x < -20) a.x = W+20; else if (a.x > W+20) a.x = -20;
        if (a.y < -20) a.y = H+20; else if (a.y > H+20) a.y = -20;
      }
      // Links
      ctx.lineWidth = 0.9;
      bCtx.lineWidth = 1.1;
      for(let i=0;i<nodes.length;i++){
        const a = nodes[i];
        for(let j=i+1;j<nodes.length;j++){
          const b = nodes[j];
          const dx=a.x-b.x, dy=a.y-b.y; const d2=dx*dx+dy*dy;
          if (d2 < linkDist2){
            const alpha = 1 - (d2/linkDist2);
            const baseCol = rgb(a.c, 0.22 + alpha*0.45);
            ctx.strokeStyle = baseCol;
            ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();

            // Bloom (lighter + blur)
            bCtx.save();
            bCtx.globalCompositeOperation='lighter';
            bCtx.strokeStyle = rgb(a.c, (0.25 + alpha*0.55)*activeBloom);
            bCtx.shadowColor = rgb(a.c, 0.9*activeBloom);
            bCtx.shadowBlur = activeBlur;
            bCtx.beginPath(); bCtx.moveTo(a.x,a.y); bCtx.lineTo(b.x,b.y); bCtx.stroke();
            bCtx.restore();
          }
        }
      }
      // Nodes
      for(let i=0;i<nodes.length;i++){
        const a = nodes[i];
        ctx.fillStyle = rgb(a.c, 0.9);
        ctx.beginPath(); ctx.arc(a.x,a.y,state.nodeSize,0,Math.PI*2); ctx.fill();

        bCtx.save();
        bCtx.globalCompositeOperation='lighter';
        bCtx.fillStyle = rgb(a.c, 0.8*activeBloom);
        bCtx.shadowColor = rgb(a.c, 0.9*activeBloom);
        bCtx.shadowBlur = activeBlur*0.9;
        bCtx.beginPath(); bCtx.arc(a.x,a.y,state.nodeSize*2.8,0,Math.PI*2); bCtx.fill();
        bCtx.restore();
      }
    } else {
      const { pts, r, h } = hexGrid;
      ctx.lineWidth = 0.85;
      bCtx.lineWidth = 1.0;
      for(let i=0;i<pts.length;i++){
        const p = pts[i];
        const pulse = 0.35 + 0.35*Math.sin(t*1.8 + p.b);
        const colBase = rgb(p.c, 0.25 + pulse*0.5);
        ctx.strokeStyle = colBase;

        let nx, ny;
        nx = p.x + (r*1.5); ny = p.y + 0;
        ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(nx,ny); ctx.stroke();
        nx = p.x + (r*0.75); ny = p.y + (h*2);
        ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(nx,ny); ctx.stroke();
        nx = p.x - (r*0.75); ny = p.y + (h*2);
        ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(nx,ny); ctx.stroke();

        bCtx.save();
        bCtx.globalCompositeOperation='lighter';
        bCtx.strokeStyle = rgb(p.c, (0.28 + pulse*0.6)*activeBloom);
        bCtx.shadowColor = rgb(p.c, 0.9*activeBloom);
        bCtx.shadowBlur = activeBlur;
        nx = p.x + (r*1.5); ny = p.y + 0;
        bCtx.beginPath(); bCtx.moveTo(p.x,p.y); bCtx.lineTo(nx,ny); bCtx.stroke();
        nx = p.x + (r*0.75); ny = p.y + (h*2);
        bCtx.beginPath(); bCtx.moveTo(p.x,p.y); bCtx.lineTo(nx,ny); bCtx.stroke();
        nx = p.x - (r*0.75); ny = p.y + (h*2);
        bCtx.beginPath(); bCtx.moveTo(p.x,p.y); bCtx.lineTo(nx,ny); bCtx.stroke();
        bCtx.restore();

        ctx.fillStyle = rgb(p.c, 0.9);
        ctx.beginPath(); ctx.arc(p.x,p.y,1.8 + pulse*0.8,0,Math.PI*2); ctx.fill();

        bCtx.save();
        bCtx.globalCompositeOperation='lighter';
        bCtx.fillStyle = rgb(p.c, 0.8*activeBloom);
        bCtx.shadowColor = rgb(p.c, 0.9*activeBloom);
        bCtx.shadowBlur = activeBlur*0.9;
        bCtx.beginPath(); bCtx.arc(p.x,p.y,3.2 + pulse*1.2,0,Math.PI*2); bCtx.fill();
        bCtx.restore();
      }
    }

    ctx.restore();

    // composite bloom at full size
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(bCanvas, 0, 0, bCanvas.width, bCanvas.height, 0, 0, W, H);
    ctx.restore();

    raf = requestAnimationFrame(step);
  }

  function start(){ if (state.paused) return; cancelAnimationFrame(raf); raf=requestAnimationFrame(step); }
  function pause(){ state.paused = true; cancelAnimationFrame(raf); }
  function resume(){ state.paused = false; start(); }
  function setTheme(v){ if(v!==state.theme){ state.theme=v; initTheme(); } }
  function setSpeed(v){ state.speed = Math.max(0, +v||0); initTheme(); }
  function setDensity(v){ state.density = Math.max(2000, +v||2000); initTheme(); }
  function setColors(arr){ if(Array.isArray(arr)&&arr.length) state.colors=arr; initTheme(); }
  function setParallax(mouse, scroll){ if(typeof mouse==='number') state.parallax.mouse=mouse; if(typeof scroll==='number') state.parallax.scroll=scroll; }
  function setBloom(strength, blur){ if(typeof strength==='number') state.bloom.strength=Math.max(0,Math.min(1,strength)); if(typeof blur==='number') state.bloom.blur=Math.max(0,blur); }

  // Smooth input: we only update target & mark active; step() lerps
  function onPointerMove(e){
    mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true;
  }

  // UI (gear minimal)
  function createUI(){
    const gear = document.createElement('button');
    gear.id='bg-gear';
    gear.innerHTML='⚙️';
    Object.assign(gear.style,{position:'fixed',right:'10px',bottom:'10px',zIndex:'60',width:'36px',height:'36px',borderRadius:'12px',fontSize:'16px',border:'1px solid #2a3042',background:'#121826',color:'#eaf0ff',boxShadow:'0 2px 10px rgba(0,0,0,.25)',cursor:'pointer'});
    const panel = document.createElement('div');
    panel.id='bg-panel';
    Object.assign(panel.style,{position:'fixed',right:'10px',bottom:'56px',zIndex:'60',width:'260px',padding:'12px',borderRadius:'14px',border:'1px solid #2a3042',background:'#0f1422',color:'#eaf0ff',boxShadow:'0 8px 28px rgba(0,0,0,.35)',display:'none'});
    panel.innerHTML = `
      <div style="display:grid;gap:10px;font:14px/1.4 system-ui,-apple-system,Segoe UI,Roboto,Arial">
        <label style="display:grid;gap:6px"><span>Theme</span><select id="bg-theme"><option value="net">Network</option><option value="hex">Hex Lattice</option></select></label>
        <label style="display:grid;gap:6px"><span>Speed</span><input id="bg-speed" type="range" min="0" max="0.8" step="0.02" value="${state.speed}"></label>
        <label style="display:grid;gap:6px"><span>Intensity</span><input id="bg-density" type="range" min="4000" max="40000" step="1000" value="${state.density}"><small style="opacity:.7">Left = viac, Right = menej</small></label>
        <label style="display:grid;gap:6px"><span>Parallax</span><input id="bg-parallax" type="range" min="0" max="40" step="1" value="${state.parallax.mouse}"></label>
        <label style="display:grid;gap:6px"><span>Bloom</span><input id="bg-bloom" type="range" min="0" max="1" step="0.05" value="${state.bloom.strength}"></label>
        <small id="bg-perf" style="opacity:.7">Quality: <b>1.00</b> · ms: <b>16.7</b></small>
      </div>`;
    document.body.appendChild(gear); document.body.appendChild(panel);
    function toggle(){ panel.style.display = panel.style.display==='none' ? 'block':'none'; }
    gear.addEventListener('click', (e)=>{ e.preventDefault(); e.stopPropagation(); toggle(); });
    document.addEventListener('click', (e)=>{ if(!panel.contains(e.target) && e.target!==gear) panel.style.display='none'; });

    panel.querySelector('#bg-theme').addEventListener('change', (e)=>{ setTheme(e.target.value); });
    panel.querySelector('#bg-speed').addEventListener('input', (e)=>{ setSpeed(parseFloat(e.target.value)); });
    panel.querySelector('#bg-density').addEventListener('input', (e)=>{ setDensity(parseInt(e.target.value,10)); });
    panel.querySelector('#bg-parallax').addEventListener('input', (e)=>{ setParallax(parseFloat(e.target.value), state.parallax.scroll); });
    panel.querySelector('#bg-bloom').addEventListener('input', (e)=>{ setBloom(parseFloat(e.target.value), state.bloom.blur); });
    // Update readout
    setInterval(()=>{
      const el = document.getElementById('bg-perf');
      if(el) el.innerHTML = `Quality: <b>${quality.toFixed(2)}</b> · ms: <b>${fpsEMA.toFixed(1)}</b>`;
    }, 500);
  }

  // Events
  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  document.addEventListener('visibilitychange', ()=>{ if(document.hidden) pause(); else resume(); });

  // API
  window.BGNET = { pause, resume, setTheme, setSpeed, setDensity, setColors, setParallax, setBloom, _state: state };

  // Boot
  resize(); initTheme();
  if (!prefersReduced) resume();
  createUI();
})();
