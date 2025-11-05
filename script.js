// 간단한 로컬별 저장 시뮬레이션: 실제 서버 대신 브라우저 로컬에 다른사람 별 데이터 추가
const sky = document.getElementById('sky');
const moodSelect = document.getElementById('mood');
const info = document.getElementById('info');
const infoName = document.getElementById('infoName');
const infoMsg = document.getElementById('infoMsg');
const infoEmoji = document.getElementById('infoEmoji');
const infoBrightness = document.getElementById('infoBrightness');
const closeInfo = document.getElementById('closeInfo');
const editModal = document.getElementById('editModal');
const closeEdit = document.getElementById('closeEdit');
const entryMsg = document.getElementById('entryMsg');
const saveEntry = document.getElementById('saveEntry');
const cancelEntry = document.getElementById('cancelEntry');
const emojiButtons = Array.from(document.querySelectorAll('.emoji-btn'));

const customArea = document.getElementById('customArea');
const customEmotion = document.getElementById('customEmotion');
const customBrt = document.getElementById('customBrt');

function mapEmojiToBrt(emoji){
  if(emoji === '😆') return 3; // 변경: 😆는 밝기 3으로 맵핑
  if(emoji === '😐') return 2;
  if(emoji === '😢') return 1;
  return 2;
}

// daily star count key
const LS_DAILY_STAR_COUNT = 'stars_daily_count_v1';
function loadDailyStarCount(){ try{return JSON.parse(localStorage.getItem(LS_DAILY_STAR_COUNT) || '{}'); }catch(e){ return {} } }
function saveDailyStarCount(o){ localStorage.setItem(LS_DAILY_STAR_COUNT, JSON.stringify(o)); }
function canCreateStar(){
  const today = new Date().toISOString().slice(0,10);
  const cnts = loadDailyStarCount();
  const used = cnts[today] || 0;
  // check extra pass in inventory
  const owned = loadShop();
  const hasExtra = owned.includes('extra_star_pass');
  const limit = 5 + (hasExtra ? 1 : 0);
  return used < limit;
}
function incrementStarCount(){
  const today = new Date().toISOString().slice(0,10);
  const cnts = loadDailyStarCount();
  cnts[today] = (cnts[today] || 0) + 1;
  saveDailyStarCount(cnts);
}

// diary storage
const LS_DIARY = 'stars_diary_v1';
function loadDiary(){ try{return JSON.parse(localStorage.getItem(LS_DIARY) || '{"pages":{}}'); }catch(e){ return {pages:{}} } }
function saveDiary(v){ localStorage.setItem(LS_DIARY, JSON.stringify(v)); }

function attachStickerToDiary(page, stickerId){
  const owned = loadShop();
  const idx = owned.indexOf(stickerId);
  if(idx === -1){ alert('해당 스티커가 없습니다.'); return; }
  // remove one sticker from inventory
  owned.splice(idx,1); saveShop(owned);
  const diary = loadDiary(); if(!diary.pages) diary.pages = {};
  if(!diary.pages[page]) diary.pages[page] = {stickers:[], rewarded:false};
  diary.pages[page].stickers.push(stickerId);
  // if page has 3 stickers and not yet rewarded, give 20 gems
  if(diary.pages[page].stickers.length >= 3 && !diary.pages[page].rewarded){
    const gems = loadGems(); saveGems(gems + 20);
    diary.pages[page].rewarded = true;
    alert('다이어리 보상: 젬 20개 획득!');
  }
  saveDiary(diary);
  updateBackpackUI(); renderShop();
}

// selection / edit controls
const editStarBtn = document.getElementById('editStar');
const deleteStarBtn = document.getElementById('deleteStar');
let selectedStarEl = null;
let editingEntryId = null;

// 배낭/저장 관련 요소
const entryName = document.getElementById('entryName');
const openBackpack = document.getElementById('openBackpack');
const backpackModal = document.getElementById('backpackModal');
const closeBackpack = document.getElementById('closeBackpack');
const backpackList = document.getElementById('backpackList');
const badgeList = document.getElementById('badgeList');

// 로컬스토리지 키
const LS_ENTRIES = 'stars_entries_v1';
const LS_BADGES = 'stars_badges_v1';

// gems & shop
const LS_GEMS = 'stars_gems_v1';
const LS_SHOP = 'stars_shop_v1';
const LS_XP = 'stars_xp_v1';

function loadGems(){ try{ return parseInt(localStorage.getItem(LS_GEMS) || '0',10) || 0; }catch(e){ return 0 } }
function saveGems(v){ localStorage.setItem(LS_GEMS, String(v)); }
function loadShop(){ try{ return JSON.parse(localStorage.getItem(LS_SHOP) || '[]'); }catch(e){ return [] } }
function saveShop(list){ localStorage.setItem(LS_SHOP, JSON.stringify(list)); }
function loadXp(){ try{ return parseInt(localStorage.getItem(LS_XP) || '0',10) || 0; }catch(e){ return 0 } }
function saveXp(v){ localStorage.setItem(LS_XP, String(v)); }

function useXpPotion(){
  const owned = loadShop();
  const idx = owned.indexOf('xp_potion');
  if(idx === -1){ alert('경험치병이 없습니다.'); return; }
  // remove one potion
  owned.splice(idx,1); saveShop(owned);
  const item = CATALOG.find(c=> c.id === 'xp_potion');
  if(item && item.xp){ const cur = loadXp(); saveXp(cur + item.xp); alert(`경험치 ${item.xp} 획득!`); }
  updateBackpackUI(); renderShop();
}

const openShop = document.getElementById('openShop');
const shopModal = document.getElementById('shopModal');
const closeShop = document.getElementById('closeShop');
const gemCountEl = document.getElementById('gemCount');
const shopListEl = document.getElementById('shopList');
// donation elements
const openDonate = document.getElementById('openDonate');
const donateModal = document.getElementById('donateModal');
const closeDonate = document.getElementById('closeDonate');
const donateCountEl = document.getElementById('donateCount');
const donateAmountInput = document.getElementById('donateAmount');
const confirmDonateBtn = document.getElementById('confirmDonate');
const cancelDonateBtn = document.getElementById('cancelDonate');

const LS_DONATIONS = 'stars_donations_v1';
function loadDonations(){ try{ return JSON.parse(localStorage.getItem(LS_DONATIONS) || '[]'); }catch(e){ return [] } }
function saveDonations(list){ localStorage.setItem(LS_DONATIONS, JSON.stringify(list)); }

function renderDonateBalance(){ if(donateCountEl) donateCountEl.textContent = String(loadGems()); }

if(openDonate) openDonate.addEventListener('click', ()=>{
  renderDonateBalance();
  if(donateModal) donateModal.classList.remove('hidden');
});
if(closeDonate) closeDonate.addEventListener('click', ()=>{ if(donateModal) donateModal.classList.add('hidden'); });
if(cancelDonateBtn) cancelDonateBtn.addEventListener('click', ()=>{ if(donateModal) donateModal.classList.add('hidden'); });

if(confirmDonateBtn) confirmDonateBtn.addEventListener('click', ()=>{
  const amt = parseInt(donateAmountInput.value,10);
  if(!amt || amt <= 0){ alert('기부할 젬 수를 올바르게 입력하세요.'); return; }
  const cur = loadGems();
  if(amt > cur){ alert('보유한 젬보다 많은 금액은 기부할 수 없습니다.'); return; }
  if(!confirm(`${amt} 젬을 기부하시겠습니까?`)) return;
  // 차감 및 기록
  saveGems(cur - amt);
  const don = loadDonations();
  don.push({amount: amt, date: (new Date()).toISOString()});
  saveDonations(don);
  alert('기부해주셔서 감사합니다!');
  if(donateModal) donateModal.classList.add('hidden');
  renderShop(); updateBackpackUI(); renderDonateBalance();
});

// Catalog: diary and stickers, extra star pass, xp potion
const CATALOG = [
  {id:'diary', name:'다이어리', price:100, consumable:false},
  {id:'comet_sticker', name:'혜성 스티커', price:30, consumable:true},
  {id:'star_sticker', name:'별 스티커', price:20, consumable:true},
  {id:'extra_star_pass', name:'추가 별 이용권', price:20, consumable:true},
  {id:'xp_potion', name:'경험치병', price:200, xp:30, consumable:true}
];

// shop daily stock key (object mapping id->count), reset per day
const LS_SHOP_STOCK = 'stars_shop_stock_v1';
function loadShopStock(){ try{ return JSON.parse(localStorage.getItem(LS_SHOP_STOCK) || '{}'); }catch(e){ return {} } }
function saveShopStock(s){ localStorage.setItem(LS_SHOP_STOCK, JSON.stringify(s)); }
function ensureShopStock(){
  const today = new Date().toISOString().slice(0,10);
  const stock = loadShopStock();
  if(stock._date !== today){
    const base = {};
    CATALOG.forEach(it => { base[it.id] = 3; });
    base._date = today;
    saveShopStock(base);
    return base;
  }
  return stock;
}

function getOwnedMultipler(){
  const owned = loadShop();
  if(!owned || owned.length===0) return 1;
  // Assumption: multipliers stack multiplicatively (product). If you prefer highest-tier only, we can change to Math.max.
  let m = 1;
  owned.forEach(id => {
    const it = CATALOG.find(c=> c.id === id);
    if(it && it.mult) m *= it.mult;
  });
  return m;
}

function renderShop(){
  if(gemCountEl) gemCountEl.textContent = String(loadGems());
  if(!shopListEl) return;
  const owned = loadShop();
  const stock = ensureShopStock();
  shopListEl.innerHTML = CATALOG.map(it => {
    const bought = owned.includes(it.id);
    const meta = it.mult ? `보상 배수 x${it.mult}` : (it.xp? `소비 시 ${it.xp} XP` : '');
    const remaining = stock[it.id] || 0;
    const disabled = remaining <= 0 ? 'disabled' : '';
    const action = (it.consumable) ? `<button data-id="${it.id}" data-price="${it.price}" class="buy-btn" ${disabled}>구매</button>` : (bought? '<span style="color:green">(구매됨)</span>' : `<button data-id="${it.id}" data-price="${it.price}" class="buy-btn" ${disabled}>구매</button>`);
    return `<div class="shop-item"><strong>${it.name}</strong> — 가격: ${it.price} 💎 — 재고: ${remaining}개 — ${meta} ${action}</div>`
  }).join('');
  Array.from(shopListEl.querySelectorAll('.buy-btn')).forEach(b=>{
    b.addEventListener('click', (e)=>{
      const id = b.dataset.id; const price = parseInt(b.dataset.price,10);
      attemptPurchase(id, price);
    });
  });
}

function attemptPurchase(itemId, price){
  let gems = loadGems();
  if(gems < price){ alert('젬이 부족합니다.'); return; }
  // check stock
  const stock = ensureShopStock();
  if(!stock[itemId] || stock[itemId] <= 0){ alert('오늘 이 상품의 재고가 소진되었습니다.'); return; }
  if(!confirm(`정말 ${price} 젬을 사용하여 구매하시겠습니까?`)) return;
  gems -= price; saveGems(gems);
  const owned = loadShop();
  // consumable items can be stored as multiple entries
  const item = CATALOG.find(c => c.id === itemId);
  if(item && item.consumable){
    // store consumables as repeated ids
    owned.push(itemId);
  } else {
    if(!owned.includes(itemId)) owned.push(itemId);
  }
  saveShop(owned);
  // decrement stock and save
  const s = ensureShopStock(); s[itemId] = (s[itemId]||0) - 1; saveShopStock(s);
  alert('구매 완료되었습니다.');
  renderShop(); updateBackpackUI();
}

if(openShop) openShop.addEventListener('click', ()=>{ renderShop(); if(shopModal) shopModal.classList.remove('hidden'); });
if(closeShop) closeShop.addEventListener('click', ()=>{ if(shopModal) shopModal.classList.add('hidden'); });

// --- Attendance: storage and UI handlers (re-added) ---
const LS_ATTEND = 'stars_attend_v1';
const LS_VISIT = 'stars_visit_v1';
const openAttend = document.getElementById('openAttend');
const attendModal = document.getElementById('attendModal');
const closeAttend = document.getElementById('closeAttend');
const markAttendBtn = document.getElementById('markAttend');

function loadAttend(){ try{return JSON.parse(localStorage.getItem(LS_ATTEND) || '[]');}catch(e){return []} }
function saveAttend(val){ localStorage.setItem(LS_ATTEND, JSON.stringify(val)); }

if(openAttend) openAttend.addEventListener('click', ()=>{ renderWeeklyAttend(); if(attendModal) attendModal.classList.remove('hidden'); });
if(closeAttend) closeAttend.addEventListener('click', ()=>{ if(attendModal) attendModal.classList.add('hidden'); });
if(markAttendBtn) markAttendBtn.addEventListener('click', ()=>{ markTodayAttend(); });

function renderWeeklyAttend(){
  const list = loadAttend();
  const today = new Date();
  const day = today.getDay();
  const diffToMon = (day === 0) ? -6 : (1 - day);
  const mon = new Date(today);
  mon.setDate(today.getDate() + diffToMon);
  const days = [];
  for(let i=0;i<7;i++){
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    const key = d.toISOString().slice(0,10);
    days.push({label:['월','화','수','목','금','토','일'][i], date:key, checked: list.includes(key)});
  }
  const el = document.getElementById('attendList');
  if(el) el.innerHTML = days.map(d=> `<div class="att-row"><strong>${d.label}</strong> ${d.date} - ${d.checked? '✅ 출석':'—'}</div>`).join('');
}

function markTodayAttend(){
  const list = loadAttend();
  const today = new Date().toISOString().slice(0,10);
  if(list.includes(today)){ alert('이미 출석했습니다'); return; }
  list.push(today); saveAttend(list);
  const rewardKey = 'reward_attend_' + today;
  if(!localStorage.getItem(rewardKey)){
    const base = 5; const mult = getOwnedMultipler(); const total = base * mult;
    const gems = loadGems(); saveGems(gems + total);
    localStorage.setItem(rewardKey,'1');
    alert(`출석 보상으로 젬 ${total}개를 받았습니다! (배수 x${mult})`);
  }
  // also grant daily visit XP (if not already granted today)
  grantDailyXpIfNeeded();
  renderWeeklyAttend(); updateBackpackUI();
}

// auto-attend on load (idempotent)
(function autoAttendOnLoad(){
  const list = loadAttend(); const today = new Date().toISOString().slice(0,10);
  if(!list.includes(today)){
    list.push(today); saveAttend(list);
    const rewardKey = 'reward_attend_' + today;
    if(!localStorage.getItem(rewardKey)){
      const base = 5; const mult = getOwnedMultipler(); const total = base * mult;
      const gems = loadGems(); saveGems(gems + total);
      localStorage.setItem(rewardKey,'1');
    }
  }
})();

// Visit tracking and daily XP
function loadVisits(){ try{return JSON.parse(localStorage.getItem(LS_VISIT) || '[]'); }catch(e){ return [] } }
function saveVisits(v){ localStorage.setItem(LS_VISIT, JSON.stringify(v)); }

function grantDailyXpIfNeeded(){
  const visits = loadVisits();
  const today = new Date().toISOString().slice(0,10);
  if(!visits.includes(today)){
    visits.push(today); saveVisits(visits);
    // grant daily 5 XP
    const cur = loadXp(); saveXp(cur + 5);
    // check 7-day consecutive streak
    const streak = calcVisitStreak(visits);
    if(streak >= 7){
      // grant 20 XP once for this 7-day achievement using key
      const key7 = 'reward_7day_' + today;
      if(!localStorage.getItem(key7)){
        const cur2 = loadXp(); saveXp(cur2 + 20);
        localStorage.setItem(key7,'1');
      }
    }
    updateBackpackUI();
  }
}

function calcVisitStreak(visits){
  const set = new Set(visits);
  let streak = 0;
  for(let i=0;i<30;i++){
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0,10);
    if(set.has(key)) streak++; else break;
  }
  return streak;
}

// call daily XP grant on load
grantDailyXpIfNeeded();

// Initialize default gems for new users (set to 1000 if not present)
(function ensureDefaultGems(){
  try{
    const cur = parseInt(localStorage.getItem(LS_GEMS) || '0',10) || 0;
    if(cur <= 0){ localStorage.setItem(LS_GEMS, String(1000)); }
  }catch(e){}
})();

let entries = []; // 저장된 별들
let badges = [];

let pendingStarEl = null; // 방금 생성되어 저장 대기중인 별
let pendingMeta = {emoji:'😐'}

// 사용자 이름(예: 로컬에서 임의 지정). 가운데 글자 마스킹은 정보 표시시 처리
const myName = '나';

// 다른사람 별 예시 데이터 (좌표는 퍼센트)
// 예시 다른사람 별 제거: 저장된 항목만 표시하도록 변경

function createStarElement({id,x,y,name,msg,brt,own=false,emoji=''}){
  const el = document.createElement('div');
  el.className = `star brt-${brt} ${own? 'own': 'other'}`;
  el.style.left = x + '%';
  el.style.top = y + '%';
  el.dataset.id = id;
  el.dataset.name = name;
  el.dataset.msg = msg;
  el.dataset.brt = brt;
  if(arguments[0] && arguments[0].createdDate) el.dataset.createdDate = arguments[0].createdDate;
  if(arguments[0] && arguments[0].editedDate) el.dataset.editedDate = arguments[0].editedDate;
  if(emoji) el.dataset.emoji = emoji;

  // label (다른 사람의 별에는 이름 라벨을 보이게)
  const label = document.createElement('div');
  label.className = 'label';
  label.textContent = own ? (emoji ? (emoji + ' 나의 별') : '나의 별') : name;
  el.appendChild(label);

  // 클릭시 정보표시 (다른사람은 가운데 글자 마스킹)
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    showInfoForStar(el);
  });

  return el;
}

function maskMiddle(s){
  if(!s) return s;
  const t = s.trim();
  if(t.length <=2) return t[0] + '*';
  if(t.length === 4) return t.slice(0,2) + '*' + t.slice(3);
  if(t.length === 5) return t.slice(0,2) + '**' + t.slice(4);
  const mid = Math.floor(t.length/2);
  return t.slice(0,mid) + '*' + t.slice(mid+1);
}

function showInfoForStar(el){
  const name = el.dataset.name;
  const msg = el.dataset.msg;
  const brt = el.dataset.brt;
  const emoji = el.dataset.emoji || '';

  // 소유별/다른사람 모두 마스킹 규칙: 다른사람의 가운데 글자 '*' 처리
  if(el.classList.contains('own')){
    infoName.textContent = name || '나';
  } else {
    infoName.textContent = maskMiddle(name || '익명');
  }
  infoEmoji.textContent = emoji ? ('이모지: ' + emoji) : '이모지: -';

  infoMsg.textContent = msg || '(메시지 없음)';
  infoBrightness.textContent = '밝기: ' + brt;
  // show created/edited dates when available
  const infoDates = document.getElementById('infoDates');
  if(infoDates){
    const cd = el.dataset.createdDate ? new Date(el.dataset.createdDate) : null;
    const ed = el.dataset.editedDate ? new Date(el.dataset.editedDate) : null;
    let txt = '';
    if(cd) txt += `${cd.getFullYear()}년 ${cd.getMonth()+1}월 ${cd.getDate()}일`;
    if(ed) txt += `, 수정: ${ed.getFullYear()}년 ${ed.getMonth()+1}월 ${ed.getDate()}일`;
    infoDates.textContent = txt;
  }
  // 다른사람 별이면 왼쪽 위 구석에 안내 문구 표시
  const infoNote = document.getElementById('infoNote');
  if(infoNote){
    if(!el.classList.contains('own')){
      infoNote.textContent = '다른사람의 감정별은?✨🌈❓';
      infoNote.style.position = 'absolute';
      infoNote.style.left = '8px';
      infoNote.style.top = '6px';
      infoNote.style.fontSize = '12px';
      infoNote.style.color = '#ffd';
    } else {
      infoNote.textContent = '';
    }
  }
  info.classList.remove('hidden');
  // 선택 표시
  if(selectedStarEl && selectedStarEl !== el) selectedStarEl.classList.remove('selected');
  selectedStarEl = el;
  selectedStarEl.classList.add('selected');
}

closeInfo.addEventListener('click', ()=> info.classList.add('hidden'));
// 바깥 클릭으로도 닫기
info.addEventListener('click', (e)=>{ if(e.target===info) info.classList.add('hidden')});

// 편집 버튼: 정보 모달에서 선택된 별을 편집
editStarBtn.addEventListener('click', ()=>{
  if(!selectedStarEl) return;
  // 채우기
  const name = selectedStarEl.dataset.name || '';
  const msg = selectedStarEl.dataset.msg || '';
  const emoji = selectedStarEl.dataset.emoji || '😐';
  // do not reveal masked name; leave blank for user to enter
  entryName.value = '';
  entryMsg.value = msg;
  pendingMeta.emoji = emoji;
  // 선택 이모지 버튼 표시
  emojiButtons.forEach(b=> b.classList.toggle('selected', b.dataset.emoji === emoji));
  // custom area visibility
  if(emoji === '🫥'){
    if(customArea) customArea.classList.remove('hidden');
    if(customBrt) customBrt.value = selectedStarEl.dataset.brt || '2';
    if(customEmotion) customEmotion.value = msg || '';
  } else {
    if(customArea) customArea.classList.add('hidden');
  }
  // 편집 모드 id 설정
  editingEntryId = selectedStarEl.dataset.id;
  // 열기
  editModal.classList.remove('hidden');
  info.classList.add('hidden');
});

// 삭제 버튼
deleteStarBtn.addEventListener('click', ()=>{
  if(!selectedStarEl) return;
  if(!confirm('이 별을 삭제하시겠습니까?')) return;
  const id = selectedStarEl.dataset.id;
  // DOM 제거
  const wasOwn = selectedStarEl.classList.contains('own');
  if(selectedStarEl.parentNode) selectedStarEl.parentNode.removeChild(selectedStarEl);
  selectedStarEl = null;
  // entries에서 제거
  loadEntries();
  entries = entries.filter(en => en.id !== id);
  localStorage.setItem(LS_ENTRIES, JSON.stringify(entries));
  // (global total counter removed in favor of daily limit)
  updateBackpackUI();
  info.classList.add('hidden');
});

// 화면 클릭으로 별 생성
sky.addEventListener('click', (e) => {
  if(!canCreateStar()){
    alert('오늘은 더 이상 별을 만들 수 없습니다. 추가 별 이용권을 구매하거나 내일 다시 시도하세요.');
    return;
  }
  const rect = sky.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 100;
  const y = ((e.clientY - rect.top) / rect.height) * 100;
  const brt = parseInt(moodSelect.value,10);
  const id = 's' + Date.now();
  const star = {id,x: x, y: y, name: myName, msg: '', brt, own:true, emoji: '😐'};
  const el = createStarElement(star);
  // 임시로 추가하고 편집 모달 열기
  sky.appendChild(el);
  pendingStarEl = el;
  pendingMeta = {emoji: '😐'};
  entryMsg.value = '';
  // emoji 버튼 초기화
  emojiButtons.forEach(b => b.classList.remove('selected'));
  // open modal
  editModal.classList.remove('hidden');
});

// emoji 버튼 선택 처리
emojiButtons.forEach(btn => {
  btn.addEventListener('click', ()=>{
    emojiButtons.forEach(b=>b.classList.remove('selected'));
    btn.classList.add('selected');
    pendingMeta.emoji = btn.dataset.emoji;
    if(pendingMeta.emoji === '🫥'){
      // show custom inputs
      if(customArea) customArea.classList.remove('hidden');
    } else {
      if(customArea) customArea.classList.add('hidden');
      pendingMeta.brt = mapEmojiToBrt(pendingMeta.emoji);
      // if there is a pending star element (newly created and not yet saved), update its brt
      if(pendingStarEl) pendingStarEl.dataset.brt = String(pendingMeta.brt);
    }
  });
});

// 저장: 메타데이터를 별에 붙이고 모달 닫기
saveEntry.addEventListener('click', ()=>{
  // 두 경우: 새로 생성한 별(pendingStarEl) 저장 OR 편집 모드에서 기존 항목 업데이트(editingEntryId)
  const rawName = entryName.value.trim() || '';
  let msg = entryMsg.value.trim() || '(메시지 없음)';
  const emoji = pendingMeta.emoji || '😐';
  // if custom emoji selected, prefer customEmotion and customBrt
  if(emoji === '🫥' && customEmotion){
    const ce = customEmotion.value.trim();
    if(ce) msg = ce;
  }
  const masked = maskForBackpack(rawName || myName);

  if(editingEntryId){
    // 편집 모드: entries 업데이트
    loadEntries();
    const idx = entries.findIndex(en => en.id === editingEntryId);
    if(idx !== -1){
      entries[idx].name = masked;
  entries[idx].msg = msg;
  entries[idx].emoji = emoji;
  entries[idx].brt = (emoji === '🫥' && customBrt) ? parseInt(customBrt.value,10) : (pendingStarEl ? parseInt(pendingStarEl.dataset.brt,10) : entries[idx].brt);
  // keep createdDate, set editedDate
  entries[idx].editedDate = (new Date()).toISOString();
      localStorage.setItem(LS_ENTRIES, JSON.stringify(entries));
      // update DOM label and data
      if(selectedStarEl){
        selectedStarEl.dataset.name = masked;
        selectedStarEl.dataset.msg = msg;
        selectedStarEl.dataset.emoji = emoji;
        const lb = selectedStarEl.querySelector('.label'); if(lb) lb.textContent = emoji + ' 나의 별';
      }
    }
    editingEntryId = null;
  } else {
    if(!pendingStarEl) return;
    pendingStarEl.dataset.msg = msg;
    pendingStarEl.dataset.emoji = emoji;
    pendingStarEl.dataset.name = masked;
    // set brightness from customBrt when custom
    if(emoji === '🫥' && customBrt){
      pendingStarEl.dataset.brt = customBrt.value;
    }
    const label = pendingStarEl.querySelector('.label');
    if(label) label.textContent = emoji + ' 나의 별';

    // 위치 계산 (퍼센트)
    const rect = pendingStarEl.getBoundingClientRect();
    const skyRect = sky.getBoundingClientRect();
    const relX = ((rect.left + rect.width/2) - skyRect.left) / skyRect.width * 100;
    const relY = ((rect.top + rect.height/2) - skyRect.top) / skyRect.height * 100;
    const now = (new Date()).toISOString();
    const entry = {
      id: pendingStarEl.dataset.id,
      x: relX,
      y: relY,
      brt: pendingStarEl.dataset.brt,
      emoji,
      name: masked,
      msg,
      createdDate: now
    };
    entries.push(entry);
    localStorage.setItem(LS_ENTRIES, JSON.stringify(entries));
    updateBackpackUI();
    // grant 10 gems for creating a star
    const gems = loadGems(); saveGems(gems + 10);
    // increment daily star count and if exceeding 3 and extra pass present, consume one pass
    incrementStarCount();
    const cnts = loadDailyStarCount(); const today = new Date().toISOString().slice(0,10);
    const used = cnts[today] || 0;
    if(used > 3){
      // consume one extra_star_pass if present
      const owned = loadShop(); const idx = owned.indexOf('extra_star_pass');
      if(idx !== -1){ owned.splice(idx,1); saveShop(owned); alert('추가 별 이용권이 사용되었습니다.'); }
    }
    pendingStarEl = null;
    updateBadges();
  }

  editModal.classList.add('hidden');
});

// 취소: 생성된 별 제거
cancelEntry.addEventListener('click', ()=>{
  if(pendingStarEl && pendingStarEl.parentNode) pendingStarEl.parentNode.removeChild(pendingStarEl);
  pendingStarEl = null;
  editModal.classList.add('hidden');
});

closeEdit.addEventListener('click', ()=>{
  if(pendingStarEl && pendingStarEl.parentNode) pendingStarEl.parentNode.removeChild(pendingStarEl);
  pendingStarEl = null;
  editModal.classList.add('hidden');
});

// 초기 다른사람 별 렌더링
// 저장된 별 로드/렌더 함수
function loadEntries(){
  try{ entries = JSON.parse(localStorage.getItem(LS_ENTRIES) || '[]'); }catch(e){ entries = []; }
  // migrate old 'date' -> createdDate
  let changed = false;
  entries = entries.map(en => {
    if(!en) return en;
    if(!en.createdDate && en.date){ en.createdDate = en.date; delete en.date; changed = true; }
    return en;
  });
  if(changed) localStorage.setItem(LS_ENTRIES, JSON.stringify(entries));
}

function renderSavedStars(){
  loadEntries();
  entries.forEach(en => {
    const el = createStarElement({id:en.id,x:en.x,y:en.y,name:en.name,msg:en.msg,brt:en.brt,own:true,emoji:en.emoji});
    sky.appendChild(el);
  });
}

renderSavedStars();

// 백팩 UI handlers
openBackpack.addEventListener('click', ()=>{
  loadEntries();
  if(!entries || entries.length === 0){
    alert('빈배낭 입니다');
    return;
  }
  updateBackpackUI();
  backpackModal.classList.remove('hidden');
});
closeBackpack.addEventListener('click', ()=> backpackModal.classList.add('hidden'));

function updateBackpackUI(){
  loadEntries();
  if(entries.length === 0) backpackList.textContent = '(저장된 별 없음)';
  else backpackList.innerHTML = entries.map(en => {
    const created = en.createdDate ? new Date(en.createdDate) : null;
    const edited = en.editedDate ? new Date(en.editedDate) : null;
    const dateText = created ? `${created.getFullYear()}년 ${created.getMonth()+1}월 ${created.getDate()}일` : '';
    const editText = edited ? `, 수정: ${edited.getFullYear()}년 ${edited.getMonth()+1}월 ${edited.getDate()}일` : '';
    return `<div class="bp-item">${en.emoji} <strong>${en.name}</strong> — ${en.msg} <div class="small">(${dateText}${editText})</div></div>`
  }).join('');
  loadBadges();
  badgeList.textContent = badges.length ? badges.map(b=> b.type==='certificate'? '상장' : `뱃지`).join(', ') : '-';
  // 별나무 관련 UI는 제거됨
  // XP display
  const xp = loadXp();
  const xpEl = document.getElementById('xpCount'); if(xpEl) xpEl.textContent = String(xp);
  // owned items summary
  const owned = loadShop();
  const shopSummary = document.getElementById('shopSummary');
  if(shopSummary) {
    // show counts per item excluding gems
    const counts = owned.reduce((acc,id)=>{ acc[id]=(acc[id]||0)+1; return acc; }, {});
    const list = Object.keys(counts).map(k=> `${k} x${counts[k]}`);
    shopSummary.textContent = list.length ? `구매한 아이템: ${list.join(', ')}` : '구매한 아이템: 없음';
  }
  // diary render (page 1)
  const diaryArea = document.getElementById('diaryArea');
  if(diaryArea){
    const diary = loadDiary();
    const page = diary.pages && diary.pages['1'] ? diary.pages['1'] : {stickers:[], rewarded:false};
    const stickersHtml = (page.stickers || []).map(s=> `<span style="margin-right:6px">${s}</span>`).join('');
    // show attach buttons for owned sticker types
    const ownedCounts = owned.reduce((acc,id)=>{ acc[id]=(acc[id]||0)+1; return acc; }, {});
    const attachBtns = [];
    if((ownedCounts['comet_sticker']||0) > 0) attachBtns.push(`<button id="attachComet">혜성 붙이기</button>`);
    if((ownedCounts['star_sticker']||0) > 0) attachBtns.push(`<button id="attachStar">별 붙이기</button>`);
    diaryArea.innerHTML = `<div><strong>다이어리(1쪽)</strong> 스티커: ${stickersHtml}</div><div style="margin-top:6px">${attachBtns.join(' ')}</div>`;
    // attach handlers
    const ac = document.getElementById('attachComet'); if(ac) ac.addEventListener('click', ()=> attachStickerToDiary('1','comet_sticker'));
    const as = document.getElementById('attachStar'); if(as) as.addEventListener('click', ()=> attachStickerToDiary('1','star_sticker'));
  }
}

// badges
function loadBadges(){ try{ badges = JSON.parse(localStorage.getItem(LS_BADGES) || '[]'); }catch(e){ badges = []; } }
function saveBadges(){ localStorage.setItem(LS_BADGES, JSON.stringify(badges)); }


// Startup: remove any existing 'certificate' badges for all users
(function sanitizeCertificates(){
  loadBadges();
  const hadCert = badges.some(b => b.type === 'certificate');
  if(hadCert){
    badges = badges.filter(b => b.type !== 'certificate');
    saveBadges();
    try{ updateBackpackUI(); }catch(e){ /* UI may not be ready yet */ }
  }
})();

function maskForBackpack(s){
  if(!s) return '익명';
  const t = s.trim();
  if(t.length === 1) return '*';
  if(t.length === 2) return t[0] + '*' + t[1];
  return t[0] + '*' + t[t.length-1];
}

function updateBadges(){
  loadEntries(); loadBadges();
  const today = new Date().toISOString().slice(0,10);
  // some entries may have createdDate instead of date; use createdDate safely
  const countToday = entries.filter(en=> {
    const d = en.createdDate || en.date || '';
    return (d && d.slice(0,10) === today);
  }).length;
  if(countToday >= 3 && !badges.find(b=> b.type==='daily' && b.date===today)){
    badges.push({type:'daily', date: today});
  }
  // certificate awards have been disabled — only save existing badge changes
  saveBadges();
  updateBackpackUI();
}

// 키보드로 기분 변경 테스트
window.addEventListener('keydown',(e)=>{
  if(e.key === '1') moodSelect.value='1';
  if(e.key === '2') moodSelect.value='2';
  if(e.key === '3') moodSelect.value='3';
});
