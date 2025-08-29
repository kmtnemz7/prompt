// ---- Config ----
const RECIPIENT = "C8X7hd8xD36kX3Ddh2qf3NNDYaFgQBrjtJVJpU5DHEAr";
const PRICES = { p0: 0.00, p1: 0.30, p2: 0.12, p3: 0.40, p4: 0.18, p5: 0.22, p6: 0.25 };
const DATA = [
  {id:'p0', title:'FREE: Idea Generator Prompt', cat:'Content', model:'Any', lang:'EN', price:PRICES.p0,
    full:'Act as a creative strategist. Generate 10 unique content ideas for (SUBJECT), each with a clear angle, target audience, and suggested format (tweet, short video, blog, or graphic). Ensure ideas are practical, engaging, and optimized for virality.',
    preview:'Generate 10 unique content ideas for (SUBJECT) with angle, audience, and format.'},
  {id:'p1', title:'Pro Graphic Design Prompt', cat:'Design', model:'Midjourney/GPT', lang:'EN', price:PRICES.p1,
    full:'You are an award-winning brand designer tasked with creating a complete professional logo design brief for (SUBJECT). The concept must reflect a futuristic yet minimal aesthetic, incorporating constraints such as scalability, brand adaptability, and commercial usability. Define the creative direction through mood boards, color palette specifications (with hex values), and typography guidelines (primary and secondary typefaces with usage rules). Outline the intended emotional response, design hierarchy, and visual balance. Deliver clear export specifications including vector-based formats (SVG/AI) and raster assets (PNG/JPG) optimized for both print and digital applications. Ensure the final outcome is versatile enough for logos, social media branding, and product packaging.',
    preview:'Generate a professional logo brief for (SUBJECT) with creative direction, color palette, typography, and export specs.'},
  {id:'p2', title:'Viral X Thread Prompt', cat:'Marketing', model:'Any', lang:'EN', price:PRICES.p2,
    full:'Act as a professional viral ghostwriter specializing in growth marketing. Write a 10-post X (Twitter) thread on (SUBJECT) designed to maximize reach, engagement, and conversions. Provide 3 alternative hook options optimized for curiosity, controversy, or authority positioning. Structure the pacing to maintain reader retention with varied sentence lengths, cliffhangers, and embedded value drops. Incorporate meme-worthy moments, relatable analogies, and shareable phrasing to increase repost potential. End with a clear, measurable call-to-action (CTA) aligned with the objective—whether driving followers, clicks, or conversions. Deliver the output in a polished format ready to post, with optional hashtags and suggested visuals.',
    preview:'Produce a viral-ready 10-post X thread on (SUBJECT) with strong hooks, engaging pacing, and a clear CTA.'},
  {id:'p3', title:'DeFi Whitepaper Outline', cat:'Crypto', model:'GPT', lang:'EN', price:PRICES.p3,
    full:'You are a professional DeFi strategist tasked with creating a rigorous whitepaper outline for (SUBJECT). The outline should include: problem statement, protocol design, tokenomics structure, governance model, risk analysis, key performance indicators (KPIs), and development roadmap. Ensure the framework is investor-ready, technically sound, and structured for both technical and non-technical audiences. The final output must provide clarity, credibility, and scalability potential for (SUBJECT) within the DeFi ecosystem.',
    preview:'Develop a complete DeFi whitepaper outline for (SUBJECT), covering problem, design, tokenomics, risks, KPIs, and roadmap.'},
  {id:'p4', title:'YouTube Script Prompt', cat:'Content', model:'GPT', lang:'EN', price:PRICES.p4,
    full:'You are a senior YouTube scriptwriter tasked with creating a high-retention 7-minute script on (SUBJECT). The script must include: a powerful opening hook, an open loop to sustain attention, three structured content segments that deliver value and engagement, and multiple call-to-action (CTA) variations tailored for subscriptions, comments, and shares. Ensure pacing is optimized for audience retention, with natural transitions, conversational tone, and storytelling techniques. Deliver the script in a polished, ready-to-record format suitable for professional YouTube content creation.',
    preview:'Create a 7-minute YouTube script on (SUBJECT) with a strong hook, open loop, structured segments, and CTA variations.'},
  {id:'p5', title:'Landing Page Copy Prompt', cat:'Marketing', model:'GPT', lang:'EN', price:PRICES.p5,
    full:'Act as a senior conversion copywriter tasked with writing high-performing landing page copy for (SUBJECT). Produce a complete framework including: a compelling hero section, clear value propositions, social proof elements, objection handling, and multiple call-to-action (CTA) variants. Provide tone sliders ranging from casual to professional, and A/B test-ready hook variations. Ensure the copy aligns with user psychology, emphasizes benefits over features, and is optimized for maximum conversion across desktop and mobile.',
    preview:'Write optimized landing page copy for (SUBJECT) with hero, value props, social proof, and CTA variants ready for A/B testing.'},
  {id:'p6', title:'Strategy: DeFi Growth Plan', cat:'Crypto', model:'GPT', lang:'EN', price:PRICES.p6,
    full:'You are a DeFi growth lead tasked with creating a comprehensive 30-day growth strategy for (SUBJECT). The plan must define clear objectives and measurable KPIs, identify acquisition and retention channels, and outline key marketing experiments. Include community growth tactics, influencer or partnership outreach, and user incentive structures. Provide a detailed reporting cadence for tracking performance, along with contingency adjustments based on early results. Ensure the plan balances short-term traction with long-term sustainability within the DeFi ecosystem.',
    preview:'Design a 30-day DeFi growth plan for (SUBJECT) with KPIs, channels, experiments, and reporting cadence.'}
];

let connection = null;
let provider = null;
let walletPubkey = null;
let currentRoute = '';

const $ = (s)=>document.querySelector(s);
const $$ = (s)=>Array.from(document.querySelectorAll(s));
const toast=(m)=>{const t=$('#toast'); t.textContent=m; t.setAttribute('role', 'alert'); t.style.display='block'; setTimeout(()=>t.classList.add('active'), 10); setTimeout(()=>{t.classList.remove('active'); setTimeout(()=>t.style.display='none', 300);}, 1800);};
const priceLabel=(n)=> (n<=0? 'FREE' : (Math.round(n*100)/100).toFixed(2)+' SOL');

// ---- Router ----
const routes = {
  '': 'home',
  'home': 'home',
  'explore': 'explore', 
  'creators': 'creators',
  'purchases': 'purchases'
};

function getRoute() {
  const hash = window.location.hash.slice(1) || '';
  const route = hash.split('/')[0];
  return routes[route] || routes[''];
}

function navigateTo(path) {
  if (path.startsWith('#')) path = path.slice(1);
  window.location.hash = '#' + path;
}

function hideAllSections() {
  const sectionsToHide = ['home', 'how', 'market', 'creators', 'purchases'];
  sectionsToHide.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });

  const heroBg = document.querySelector('.hero-bg');
  if (heroBg) heroBg.style.display = 'none';

  const filters = document.querySelector('.filters');
  if (filters) filters.style.display = 'none';
}

function showRoute(route) {
  hideAllSections();
  currentRoute = route;
  
  switch(route) {
    case 'home':
      showHome();
      break;
    case 'explore':
      showExplore(); 
      break;
    case 'creators':
      showCreators();
      break;
    case 'purchases':
      showPurchases();
      break;
    default:
      showHome();
      break;
  }
}

function showHome() {
  const heroSection = $('#home');
  const howSection = $('#how');
  if (heroSection) heroSection.style.display = 'block';
  if (howSection) howSection.style.display = 'block';
}

function showExplore() {
  const filtersSection = $('.filters');
  const marketSection = $('#market');
  
  if (filtersSection) filtersSection.style.display = 'block';
  if (marketSection) marketSection.style.display = 'block';
  
  renderGrid(DATA);
  applyFilters();
}

function showCreators() {
  const creatorsSection = $('#creators');
  if (creatorsSection) creatorsSection.style.display = 'block';
}

function showPurchases() {
  const purchasesSection = $('#purchases');
  if (purchasesSection) purchasesSection.style.display = 'block';
  renderPurchases();
}

// ---- Dropdown Menu ----
function initDropdownMenu() {
  const menuTrigger = $('#menu-trigger');
  const menuDropdown = $('#menu-dropdown');
  
  if (!menuTrigger || !menuDropdown) return;
  
  let isOpen = false;
  
  function openMenu() {
    if (isOpen) return;
    isOpen = true;
    menuDropdown.style.display = 'block';
    setTimeout(() => menuDropdown.classList.add('active'), 10);
    menuTrigger.setAttribute('aria-expanded', 'true');
    
    const firstItem = menuDropdown.querySelector('a');
    if (firstItem) firstItem.focus();
  }
  
  function closeMenu() {
    if (!isOpen) return;
    isOpen = false;
    menuDropdown.classList.remove('active');
    setTimeout(() => menuDropdown.style.display = 'none', 300);
    menuTrigger.setAttribute('aria-expanded', 'false');
    menuTrigger.focus();
  }
  
  menuTrigger.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOpen) closeMenu();
    else openMenu();
  });
  
  menuDropdown.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') {
      e.preventDefault();
      const href = e.target.getAttribute('href');
      if (href && href.startsWith('#')) {
        navigateTo(href.slice(1));
      }
      closeMenu();
    }
  });
  
  document.addEventListener('click', (e) => {
    if (isOpen && !menuTrigger.contains(e.target) && !menuDropdown.contains(e.target)) {
      closeMenu();
    }
  });
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) {
      e.preventDefault();
      closeMenu();
    }
  });
  
  menuDropdown.addEventListener('keydown', (e) => {
    const items = Array.from(menuDropdown.querySelectorAll('a'));
    const currentIndex = items.indexOf(document.activeElement);
    
    switch(e.key) {
      case 'ArrowDown':
        e.preventDefault();
        const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        items[nextIndex].focus();
        break;
      case 'ArrowUp':
        e.preventDefault(); 
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        items[prevIndex].focus();
        break;
      case 'Tab':
        if (e.shiftKey && currentIndex === 0) {
          closeMenu();
        } else if (!e.shiftKey && currentIndex === items.length - 1) {
          closeMenu();
        }
        break;
    }
  });
}

// ---- Card and Grid Functions ----
const card=(p)=>`
  <article class="card prompt-card" style="display: flex; flex-direction: column;">
    <div style="height:160px;border-bottom:1px solid var(--b);background:
      radial-gradient(80px 80px at 20% 30%, rgba(168,85,247,.25), transparent 60%),
      radial-gradient(80px 80px at 80% 40%, rgba(6,182,212,.25), transparent 60%);"></div>
    <div class="card-body" style="display: flex; flex-direction: column; flex: 1;">
      <div class="kv"><div><strong>${p.title}</strong><div class="muted">${p.cat} • ${p.model} • ${p.lang}</div></div><span class="badge">${priceLabel(p.price)}</span></div>
      <p class="muted" style="margin-top:8px;min-height:44px;flex:1">${p.preview}</p>
      <div style="display:flex;gap:8px;margin-top:10px">
        <button class="btn" data-view="${p.id}">Personalize</button>
        <button class="btn glow" data-buy="${p.id}">${p.price<=0?'Get Free':'Buy'}</button>
      </div>
    </div>
  </article>`;

function renderGrid(list){
  const grid = $('#grid'); 
  if (!grid) return;
  
  const skeleton = $('#skeleton');
  if (skeleton) skeleton.style.display = 'none';
  
  grid.innerHTML = list.map(card).join('');
  $$('[data-view]').forEach(b=>b.addEventListener('click', ()=>openModal(b.getAttribute('data-view'))));
  $$('[data-buy]').forEach(b=>b.addEventListener('click', ()=>buyPrompt(b.getAttribute('data-buy'))));
}

function applyFilters(){
  const q = $('#q');
  const catVal = $('#cat_val');
  const sortVal = $('#sort_val');
  
  if (!q || !catVal || !sortVal) return;
  
  const query = q.value.toLowerCase().trim();
  const cat = catVal.dataset.value || '';
  const sort = sortVal.dataset.value || 'default';
  
  let list = DATA.filter(p => {
    const hay = (p.title+' '+p.cat).toLowerCase();
    if (cat && p.cat!==cat) return false;
    return !query || hay.includes(query);
  });
  
  if (sort === 'priceAsc') list.sort((a,b)=>a.price-b.price);
  if (sort === 'priceDesc') list.sort((a,b)=>b.price-a.price);
  if (sort === 'alpha') list.sort((a,b)=>a.title.localeCompare(b.title));
  renderGrid(list);
}

// ---- FIXED DROPDOWN FUNCTION ----
function dropdown(rootId, items){
  const root = document.getElementById(rootId);
  if (!root) return;
  
  const summary = root.querySelector('summary');
  const val = root.querySelector('.value');
  const menu = root.querySelector('.menu');
  if (!val || !menu || !summary) return;
  
  menu.innerHTML = items.map(([key, text])=>`<button data-k="${key}">${text}</button>`).join('');
  
  summary.addEventListener('click', (e) => {
    e.preventDefault();
    if (root.hasAttribute('open')) {
      root.removeAttribute('open');
    } else {
      root.setAttribute('open', '');
    }
  });
  
  menu.addEventListener('click', (e) => {
    const k = e.target?.dataset?.k;
    if (!k) return;
    
    val.dataset.value = k === '__all' ? '' : k;
    val.textContent = items.find(x => x[0] === k)?.[1] || items[0][1];
    
    root.removeAttribute('open');
    
    applyFilters();
  });
  
  document.addEventListener('click', (e) => {
    if (!root.contains(e.target)) {
      root.removeAttribute('open');
    }
  });
  
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      root.removeAttribute('open');
      summary.focus();
    }
  });
  
  menu.addEventListener('keydown', (e) => {
    const buttons = Array.from(menu.querySelectorAll('button'));
    const currentIndex = buttons.indexOf(e.target);
    
    switch(e.key) {
      case 'ArrowDown':
        e.preventDefault();
        const nextIndex = currentIndex < buttons.length - 1 ? currentIndex + 1 : 0;
        buttons[nextIndex].focus();
        break;
      case 'ArrowUp':
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : buttons.length - 1;
        buttons[prevIndex].focus();
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        e.target.click();
        break;
    }
  });
}

// ---- Modal Functions ----
function openModal(id, unlocked=false, sig=null){
  const p = DATA.find(x=>x.id===id); if(!p) return;
  const mTitle = $('#mTitle');
  const mMeta = $('#mMeta');
  const mText = $('#mText');
  const copyBtn = $('#copyBtn');
  const txLink = $('#txLink');
  const modal = $('#modal');
  
  if (!mTitle || !mMeta || !mText || !modal) return;
  
  mTitle.textContent = p.title + (unlocked ? ' — Unlocked' : ' — Preview');
  mMeta.textContent = `${p.cat} • ${p.model} • ${p.lang} — ${priceLabel(p.price)}`;
  
  const owned = localStorage.getItem('pf_owned_'+id)==='1' || unlocked;
  const brief = $('#uBrief')?.value?.trim() || '';
  
  mText.textContent = owned ? p.full : (brief ? (`Preview with your brief: `+brief.slice(0,160)+'…') : p.preview);
  
  if (copyBtn) copyBtn.classList.toggle('hidden', !owned);
  if (txLink) {
    if (sig) {
      txLink.href = 'https://solscan.io/tx/'+sig;
      txLink.classList.remove('hidden');
    } else {
      txLink.classList.add('hidden');
    }
  }
  
  modal.style.display = 'flex';
  setTimeout(() => modal.classList.add('active'), 10);
  
  const buyNow = $('#buyNow');
  if (buyNow) {
    buyNow.textContent = p.price<=0? 'Get Free' : 'Buy & Unlock';
    buyNow.onclick = ()=>buyPrompt(id);
  }
}

window.closeModal = () => { 
  const modal = $('#modal');
  if (modal) {
    modal.classList.remove('active');
    setTimeout(() => modal.style.display = 'none', 400);
  }
};

// ---- Purchase Functions ----
function savePurchase(id, sig, brief, contact){
  const now = new Date().toISOString();
  const rec = { id, sig, at: now, brief, contact };
  const list = JSON.parse(localStorage.getItem('pf_purchases')||'[]');
  list.unshift(rec);
  localStorage.setItem('pf_purchases', JSON.stringify(list));
  localStorage.setItem('pf_owned_'+id, '1');
  renderPurchases();
}

function renderPurchases(){
  const box = $('#purchasesList');
  if (!box) return;
  
  const list = JSON.parse(localStorage.getItem('pf_purchases')||'[]');
  if (!list.length) { box.textContent = 'No purchases yet.'; return; }
  
  box.innerHTML = list.map(r => {
    const p = DATA.find(x=>x.id===r.id);
    const title = p? p.title : r.id;
    const linkA = r.sig && r.sig!=='FREE' ? `<a class="underline" href="https://solscan.io/tx/${r.sig}" target="_blank">Solscan</a>` : '<span class="muted">Free</span>';
    const brief = r.brief ? `<div class="muted" style="margin-top:4px">Brief: ${r.brief.slice(0,140)}</div>` : '';
    const contact = r.contact ? `<div class="muted">Contact: ${r.contact}</div>` : '';
    return `<div class="kv" style="padding:12px 0;border-bottom:1px solid var(--b)">
        <div><div><strong>${title}</strong></div>
        <div class="muted">${new Date(r.at).toLocaleString()}</div>${brief}${contact}</div>
        <div style="display:flex;gap:8px">
          ${linkA}<button class="btn" data-reopen="${r.id}">View</button>
        </div>
      </div>`;
  }).join('');
  
  $$('[data-reopen]').forEach(b=>b.addEventListener('click', ()=>openModal(b.getAttribute('data-reopen'), true)));
}

// ---- Wallet Functions ----
async function getProvider(){
  return window.solana ?? window.phantom?.solana ?? null;
}

async function connectWallet(){
  try {
    provider = await getProvider();
    if (!provider || !provider.isPhantom) { toast('Phantom not found. Install Phantom.'); return; }
    const resp = await provider.connect();
    walletPubkey = resp.publicKey;
    const addr = $('#addr');
    const walletBtn = $('#walletBtn');
    if (addr) addr.textContent = 'Wallet: ' + walletPubkey.toBase58().slice(0,4)+'…'+walletPubkey.toBase58().slice(-4);
    if (walletBtn) walletBtn.textContent = 'Disconnect Wallet';
    toast('Wallet connected');
  } catch(e) {
    console.error('Wallet connection failed:', e);
    toast('Wallet connection failed');
  }
}

async function disconnectWallet(){
  try { 
    if (provider) await provider.disconnect(); 
  } catch(e){
    console.error('Wallet disconnect failed:', e);
  }
  walletPubkey = null;
  const addr = $('#addr');
  const walletBtn = $('#walletBtn');
  if (addr) addr.textContent = 'Wallet: not connected';
  if (walletBtn) walletBtn.textContent = 'Connect Wallet';
  toast('Wallet disconnected');
}

async function toggleWallet(){ 
  if (walletPubkey) return disconnectWallet(); 
  else return connectWallet(); 
}

// ---- Buy Function ----
async function buyPrompt(id){
  try {
    const p = DATA.find(x=>x.id===id);
    if (!p) return;
    
    const briefEl = $('#uBrief');
    const contactEl = $('#uContact');
    const brief = briefEl?.value?.trim() || '';
    const contact = contactEl?.value?.trim() || '';
    
    if (brief.length < 3) return toast('Please enter a short brief.');
    if (!contact) return toast('Add your contact (email or Telegram).');

    if (p.price <= 0) {
      savePurchase(id, 'FREE', brief, contact);
      openModal(id, true, null);
      toast('Unlocked (free) ✅');
      return;
    }

    if (!walletPubkey) { await connectWallet(); if(!walletPubkey) return; }
    
    const amount = p.price;
    toast('Preparing transaction…');
    const lamports = Math.round(amount * solanaWeb3.LAMPORTS_PER_SOL);
    const tx = new solanaWeb3.Transaction().add(
      solanaWeb3.SystemProgram.transfer({
        fromPubkey: walletPubkey,
        toPubkey: new solanaWeb3.PublicKey(RECIPIENT),
        lamports
      })
    );
    tx.feePayer = walletPubkey;
    const latest = await connection.getLatestBlockhash('finalized');
    tx.recentBlockhash = latest.blockhash;
    toast('Waiting for signature…');
    const signed = await provider.signTransaction(tx);
    const sig = await connection.sendRawTransaction(signed.serialize());
    toast('Confirming (finalized)…');
    await connection.confirmTransaction({ signature: sig }, 'finalized');
    savePurchase(id, sig, brief, contact);
    openModal(id, true, sig);
    toast('Unlocked ✅');
  } catch(e) {
    console.error('Payment error:', e);
    toast('Payment failed or cancelled');
  }
}

// ---- Event Handlers ----
function setupEventHandlers() {
  const copyBtn = $('#copyBtn');
  if (copyBtn) {
    copyBtn.onclick = () => { 
      const mText = $('#mText');
      if (mText && navigator.clipboard) {
        navigator.clipboard.writeText(mText.textContent); 
        toast('Copied'); 
      }
    };
  }
  
  window.closeModal = () => { 
    const modal = $('#modal');
    if (modal) {
      modal.classList.remove('active');
      setTimeout(() => modal.style.display = 'none', 400);
    }
  };
  
  const walletBtn = $('#walletBtn');
  if (walletBtn) walletBtn.onclick = toggleWallet;
  
  const searchInput = $('#q');
  if (searchInput) searchInput.addEventListener('input', applyFilters);
  
  document.addEventListener('click', (e) => {
    if (e.target.tagName === 'A' && e.target.getAttribute('href')?.startsWith('#')) {
      e.preventDefault();
      const href = e.target.getAttribute('href').slice(1);
      navigateTo(href);
    }
  });
  
  window.addEventListener('hashchange', () => {
    const route = getRoute();
    showRoute(route);
  });
}

// ---- Initialization ----
window.addEventListener('load', async () => {
  try { 
    if (window.solanaWeb3) {
      connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('mainnet-beta'), 'confirmed'); 
    }
  } catch(e){ 
    console.error('Solana connection failed:', e); 
    toast('Failed to init Solana SDK'); 
  }

  dropdown('cat', [['__all','All'], ['Design','Design'], ['Marketing','Marketing'], ['Crypto','Crypto'], ['Content','Content']]);
  dropdown('sort', [['default','Default'], ['priceAsc','Price ↑'], ['priceDesc','Price ↓'], ['alpha','A → Z']]);

  setupEventHandlers();
  initDropdownMenu();
  
  const initialRoute = getRoute();
  showRoute(initialRoute);
  
  renderPurchases();
});

// ---- Page Loader ----
(function () {
  const loader = document.getElementById('pageLoader');
  if (!loader) return;

  function hideLoader(){ loader.classList.add('is-hidden'); }
  function showLoader(ms=800){
    loader.classList.remove('is-hidden');
    return new Promise(res => setTimeout(() => { hideLoader(); res(); }, ms));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(hideLoader, 800));
  } else {
    setTimeout(hideLoader, 800);
  }

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;

    const href = a.getAttribute('href') || '';

    if (href.startsWith('#') || href.startsWith('/#')) {
      e.preventDefault();
      const hash = href.startsWith('/#') ? href.slice(1) : href;
      showLoader(800).then(() => {
        history.pushState(null, '', hash);
        const el = document.querySelector(hash);
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
      });
      return;
    }

    if (href.startsWith('/')) {
      e.preventDefault();
      showLoader(800).then(() => { window.location.href = href; });
    }
  });

  window.PFLoader = { show: showLoader, hide: hideLoader };
})();
