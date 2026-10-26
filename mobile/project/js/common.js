/* 여러 페이지에서 같이 쓰는 기능 모음 */

/* ---------- localStorage 저장/불러오기 ----------
   시크릿 창 등 저장소를 못 쓰는 환경에서도 오류 없이 동작하도록 try/catch로 감쌉니다.
   로그인하면 회원마다 따로 저장합니다. (예: wte-history@jaewon) 로그인 전에는 이 브라우저 공용 저장 */
const STORAGE_KEYS = {
  history: 'wte-history',     // 결정한 메뉴 기록
  favorites: 'wte-favorites', // 즐겨찾기
  blocked: 'wte-blocked',     // 안 먹는 메뉴
  filters: 'wte-filters',     // 추첨 화면에서 고른 조건 (월드컵에서도 사용)
  settings: 'wte-settings',   // 설정 (최근 먹은 메뉴 빼기, 날씨 지역 등)
  roulette: 'wte-roulette'    // 돌림판 후보
};

const RECENT_DAYS = 3; // '최근 먹은 메뉴'로 볼 기간(일)
const DAY_MS = 24 * 60 * 60 * 1000;

/* 지금 로그인한 회원의 저장 이름 */
function userStorageKey(key, userId) {
  const id = userId !== undefined ? userId : (typeof Auth !== 'undefined' && Auth.getCurrentUser() || {}).id;
  return id ? key + '@' + id : key;
}

/* 회원가입할 때: 로그인 전에 쓰던 기록·즐겨찾기를 새 계정으로 옮김 (로그인 전 저장 칸은 비움) */
function moveGuestDataTo(userId) {
  Object.values(STORAGE_KEYS).forEach((key) => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return;
      localStorage.setItem(userStorageKey(key, userId), raw);
      localStorage.removeItem(key);
    } catch (e) { /* 옮기지 못해도 가입은 됨 */ }
  });
}

function loadData(key, fallback) {
  try {
    const raw = localStorage.getItem(userStorageKey(key));
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function saveData(key, value) {
  try {
    localStorage.setItem(userStorageKey(key), JSON.stringify(value));
    return true;
  } catch (e) {
    return false;
  }
}

function getSettings() {
  return Object.assign({ excludeRecent: true, weatherRegion: null }, loadData(STORAGE_KEYS.settings, {}));
}

function updateSettings(changes) {
  saveData(STORAGE_KEYS.settings, Object.assign(getSettings(), changes));
}

/* 사용자가 입력한 글자를 화면에 넣기 전에 HTML 기호를 바꿔서 안전하게 (닉네임, 게시글 등) */
function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

/* ---------- 메뉴 관련 ---------- */
function findMenu(name) {
  return MENUS.find((menu) => menu.name === name);
}

/* 메뉴 사진 주소 */
function menuImageUrl(menu) {
  return 'img/menus/' + MENU_IMAGES[menu.name] + '.jpg';
}

/* 메뉴 사진 <img> 태그. lazy: 화면에 보일 때 불러오기 (목록처럼 사진이 많을 때) */
function menuPhotoHtml(menu, lazy) {
  return '<img class="menu-photo" src="' + menuImageUrl(menu) + '" alt="' + menu.name + '" data-emoji="' + menu.emoji + '"' +
    (lazy ? ' loading="lazy"' : '') + ' decoding="async">';
}

/* 곧 보여줄 사진을 미리 받아 두기 (추첨 결과·월드컵 대진) */
function preloadMenuImages(menus) {
  menus.forEach((menu) => {
    const img = new Image();
    img.src = menuImageUrl(menu);
  });
}

/* 사진을 못 불러오면(onerror) 깨진 아이콘 대신 그 메뉴의 이모지를 대체 이미지로 보여줌 */
document.addEventListener('error', (e) => {
  const img = e.target;
  if (!(img instanceof HTMLImageElement) || !img.classList.contains('menu-photo')) return;
  if (!img.dataset.emoji) {
    img.classList.add('broken'); // 이모지 정보가 없으면 빈 배경만
    return;
  }
  const fallback = document.createElement('span');
  fallback.className = 'menu-photo menu-photo-fallback';
  fallback.setAttribute('role', 'img');
  fallback.setAttribute('aria-label', img.alt);
  fallback.innerHTML = '<span>' + img.dataset.emoji + '</span>';
  img.replaceWith(fallback);
}, true);

/* 즐겨찾기/안 먹는 메뉴 목록에 넣었다 뺐다 하기. 넣었으면 true를 돌려줌 */
function toggleListItem(key, name) {
  const list = loadData(key, []);
  const index = list.indexOf(name);
  if (index >= 0) list.splice(index, 1);
  else list.push(name);
  saveData(key, list);
  return index < 0;
}

/* 최근 RECENT_DAYS일 안에 '이걸로 결정'한 메뉴 이름 목록 */
function getRecentMenuNames() {
  const limit = Date.now() - RECENT_DAYS * DAY_MS;
  const names = loadData(STORAGE_KEYS.history, [])
    .filter((item) => new Date(item.date).getTime() >= limit)
    .map((item) => item.name);
  return [...new Set(names)];
}

/* 사용자 설정 때문에 후보에서 빠지는 메뉴 (안 먹는 메뉴, 최근 먹은 메뉴) */
function getPreferenceExclusions() {
  const blocked = loadData(STORAGE_KEYS.blocked, []);
  const recent = getSettings().excludeRecent ? getRecentMenuNames() : [];
  return { blocked: blocked, recent: recent.filter((name) => !blocked.includes(name)) };
}

/* 추첨 화면에서 고른 조건에 맞는지 (월드컵에서 '추첨 조건 적용'에 사용) */
function getSavedFilters() {
  return Object.assign({ categories: [], budgetIndex: 0, tags: [] }, loadData(STORAGE_KEYS.filters, {}));
}

function matchesSavedFilters(menu, filters) {
  if (filters.categories.length > 0 && !filters.categories.includes(menu.category)) return false;
  if (menu.price > BUDGETS[filters.budgetIndex].max) return false;
  return filters.tags.every((tag) => menu.tags.includes(tag));
}

/* '이걸로 결정' → 기록에 저장 */
function saveDecision(menu) {
  const history = loadData(STORAGE_KEYS.history, []);
  history.unshift({
    name: menu.name,
    emoji: menu.emoji,
    category: menu.category,
    date: new Date().toISOString()
  });
  saveData(STORAGE_KEYS.history, history.slice(0, 300));
}

/* 공유할 문장 */
function shareText(menu, intro) {
  return (intro || '오늘 메뉴는') + ' ' + menu.emoji + ' ' + menu.name + '! (오늘 뭐 먹지?에서 골랐어요)';
}

/* 공유하기: 휴대폰은 공유창, PC는 클립보드 복사 */
async function shareMenu(menu, intro) {
  return shareRawText(shareText(menu, intro));
}

/* 아무 문장이나 공유 (돌림판의 '누가 계산?' 결과처럼 메뉴가 아닌 경우) */
async function shareRawText(text) {

  if (navigator.share) {
    try {
      await navigator.share({ text: text });
      return;
    } catch (e) {
      if (e.name === 'AbortError') return; // 사용자가 공유창을 닫은 경우
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    showToast('결과를 복사했어요. 단톡방에 붙여넣기 해 보세요!');
  } catch (e) {
    showToast('복사에 실패했어요: ' + text);
  }
}

/* ---------- 공통 유틸 ---------- */

/* 받침에 맞는 조사 붙이기: josa('김치찌개', '을', '를') → '김치찌개를', josa('삼겹살', '은', '는') → '삼겹살은' */
function josa(word, withBatchim, withoutBatchim) {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  if (code < 0 || code > 11171) return word + withBatchim + '(' + withoutBatchim + ')'; // 한글이 아니면 둘 다 표시
  return word + (code % 28 ? withBatchim : withoutBatchim);
}

function formatPrice(won) {
  return '약 ' + won.toLocaleString('ko-KR') + '원';
}

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

/* 배열 순서를 무작위로 섞기 (피셔-예이츠 셔플) */
function shuffle(list) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function naverMapUrl(keyword) {
  return 'https://map.naver.com/p/search/' + encodeURIComponent(keyword);
}

function kakaoMapUrl(keyword) {
  return 'https://map.kakao.com/?q=' + encodeURIComponent(keyword);
}

/* 위도·경도 근처에서 검색하는 지도 주소 */
const SCHOOL_COORDS = { lat: 37.215, lng: 126.976425 }; // 장안대학교 (학교 실습의 위성좌표 링크와 같은 위치)

function googleMapsNearUrl(keyword, lat, lng) {
  return 'https://www.google.com/maps/search/' + encodeURIComponent(keyword) + '/@' + lat + ',' + lng + ',16z';
}

/* 문자 / 메일 앱을 여는 링크 (내용이 미리 채워짐) */
function smsUrl(text) {
  return 'sms:?&body=' + encodeURIComponent(text); // 안드로이드·아이폰 모두 동작하는 형식
}

function mailUrl(subject, text) {
  return 'mailto:?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(text);
}

/* ---------- 현재 위치 ----------
   받은 위치는 10분 동안 기억해서 (날씨 추천과 같이 사용) 다시 물어보지 않습니다. */
const POSITION_KEY = 'wte-position';
const POSITION_MAX_AGE = 10 * 60 * 1000;

function getCachedPosition() {
  try {
    const p = JSON.parse(sessionStorage.getItem(POSITION_KEY));
    if (p && Date.now() - p.time < POSITION_MAX_AGE) return p;
  } catch (e) { /* 없으면 새로 받음 */ }
  return null;
}

/* 위치를 받아서 callback({lat, lng})을 실행. 실패하면 onError(안내 문구) */
function requestPosition(callback, onError) {
  const cached = getCachedPosition();
  if (cached) {
    callback(cached);
    return;
  }
  if (!navigator.geolocation) {
    onError('이 브라우저는 위치 기능을 지원하지 않아요.');
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const p = { lat: pos.coords.latitude, lng: pos.coords.longitude, time: Date.now() };
      try { sessionStorage.setItem(POSITION_KEY, JSON.stringify(p)); } catch (e) { /* 기억 못 해도 사용은 가능 */ }
      callback(p);
    },
    (err) => {
      // 파일을 더블클릭해서 연 경우(file://)는 브라우저가 위치 기능을 막는 경우가 많음
      if (location.protocol === 'file:') onError('파일을 직접 열면 위치 기능이 막힐 수 있어요. VS Code의 Live Server로 열어 주세요.');
      else if (err.code === 1) onError('위치 권한이 꺼져 있어요. 주소창 왼쪽 아이콘을 눌러 위치를 허용해 주세요.');
      else onError('위치를 찾지 못했어요. PC라면 Windows 설정의 위치 서비스가 켜져 있는지 확인해 주세요.');
    },
    { timeout: 10000, maximumAge: POSITION_MAX_AGE }
  );
}

/* 📍 내 주변에서 찾기
   위치 허용 창이 지금 화면에 보이도록, 위치를 먼저 받고 나서 지도를 새 탭으로 엽니다. */
function openNearMe(keyword) {
  if (!getCachedPosition()) showToast('📍 현재 위치를 확인하는 중이에요…');
  requestPosition(
    (p) => {
      const win = window.open(googleMapsNearUrl(keyword, p.lat, p.lng), '_blank');
      // 위치를 묻는 사이에 시간이 지나 브라우저가 팝업을 막은 경우
      if (!win) showToast('위치를 확인했어요! 📍 내 주변을 한 번 더 누르면 지도가 열려요.');
    },
    (message) => showToast(message)
  );
}

/* 결과 카드의 '식당 찾기 / 친구에게 알리기' 버튼 묶음
   container 안의 [data-link], [data-action] 버튼을 지금 메뉴에 맞게 채웁니다.
   돌려주는 함수에 메뉴를 넘기면 링크가 바뀝니다. */
function setupMenuActions(container, shareIntro) {
  let current = null;

  container.querySelector('[data-action="near"]').addEventListener('click', () => {
    if (current) openNearMe(current.name);
  });
  container.querySelector('[data-action="share"]').addEventListener('click', () => {
    if (current) shareMenu(current, shareIntro);
  });

  return function update(menu) {
    current = menu;
    const text = shareText(menu, shareIntro);
    container.querySelector('[data-link="naver"]').href = naverMapUrl(menu.name);
    container.querySelector('[data-link="kakao"]').href = kakaoMapUrl(menu.name);
    container.querySelector('[data-link="school"]').href = googleMapsNearUrl(menu.name, SCHOOL_COORDS.lat, SCHOOL_COORDS.lng);
    container.querySelector('[data-link="sms"]').href = smsUrl(text);
    container.querySelector('[data-link="mail"]').href = mailUrl('[오늘 뭐 먹지?] ' + menu.name, text);
  };
}

/* 지금 시간에 맞는 인사말 */
function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 10) return { title: '좋은 아침이에요 ☀️', sub: '든든하게 하루를 시작해 볼까요?' };
  if (hour >= 10 && hour < 14) return { title: '점심 뭐 먹지? 🍽️', sub: '고민은 3초면 충분해요. 조건만 고르면 나머지는 운에 맡겨요.' };
  if (hour >= 14 && hour < 17) return { title: '출출한 오후네요 ☕', sub: '가볍게 먹을 만한 걸 찾아볼까요?' };
  if (hour >= 17 && hour < 21) return { title: '오늘 하루 수고했어요 🌆', sub: '저녁은 뭘로 할지 같이 정해요.' };
  return { title: '야식 땡기는 시간이네요 🌙', sub: '오늘 밤은 뭐로 달래 볼까요?' };
}

/* ---------- 배경음악 (BGM) ----------
   - ▶ 재생 / ⏸ 정지 버튼으로 켜고 끕니다.
   - 다른 탭(페이지)으로 이동해도 이어서 나오도록 재생 상태와 위치를 sessionStorage에 기억합니다.
   - 브라우저는 사용자가 누르기 전에는 소리 자동 재생을 막기 때문에,
     이어서 재생이 막히면 화면을 처음 누르는 순간 다시 재생합니다. */
function initBgm() {
  const audio = document.getElementById('bgmAudio');
  const control = document.getElementById('bgmControl');
  const playBtn = document.getElementById('bgmPlay');
  const stopBtn = document.getElementById('bgmStop');
  if (!audio || !playBtn || !stopBtn) return;

  const KEY = 'wte-bgm';
  audio.volume = 0.4;

  function loadState() {
    try { return JSON.parse(sessionStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }
  function saveState(playing) {
    try { sessionStorage.setItem(KEY, JSON.stringify({ playing: playing, time: audio.currentTime || 0 })); } catch (e) { /* 저장 못 해도 재생은 됨 */ }
  }
  function render() {
    const playing = !audio.paused;
    control.classList.toggle('playing', playing);
    playBtn.setAttribute('aria-pressed', playing ? 'true' : 'false');
    stopBtn.setAttribute('aria-pressed', playing ? 'false' : 'true');
  }

  function resumeOnFirstClick(e) {
    if (e.target.closest('#bgmControl')) return; // 버튼을 직접 누른 경우는 버튼이 처리
    document.removeEventListener('click', resumeOnFirstClick, true);
    play();
  }

  function play() {
    audio.play().then(() => saveState(true)).catch(() => {});
  }

  function stop() {
    document.removeEventListener('click', resumeOnFirstClick, true);
    audio.pause();
    saveState(false);
  }

  playBtn.addEventListener('click', play);
  stopBtn.addEventListener('click', stop);
  audio.addEventListener('play', render);
  audio.addEventListener('pause', render);

  // 페이지를 떠날 때 지금 위치를 기억
  window.addEventListener('pagehide', () => saveState(!audio.paused));

  // 이전 페이지에서 재생 중이었다면 이어서 재생
  const saved = loadState();
  if (saved.playing) {
    // 음악 정보(길이)를 불러온 다음에 위치를 맞춰야 정확함
    audio.addEventListener('loadedmetadata', () => {
      audio.currentTime = Math.min(saved.time || 0, audio.duration || 0);
      audio.play().catch(() => {
        document.addEventListener('click', resumeOnFirstClick, true);
      });
    }, { once: true });
    audio.preload = 'auto';
    audio.load();
  }
  render();
}

document.addEventListener('DOMContentLoaded', initBgm);

/* ---------- 방문자 수 (푸터) ----------
   서버가 없어서 이 브라우저에서 사이트를 연 횟수를 셉니다. (회원·게시판과 같은 localStorage 방식)
   탭을 옮기거나 새로고침해도, 브라우저를 열어 둔 동안의 한 번 방문은 1번만 셉니다(sessionStorage).
   회원마다 나누지 않는 사이트 전체 숫자라서 STORAGE_KEYS에는 넣지 않습니다(가입할 때 옮겨지지 않게).
   나중에 서버를 쓰게 되면 countVisit() 안쪽만 바꾸면 됩니다. */
const VISIT_KEY = 'wte-visits';
const VISIT_SESSION_KEY = 'wte-visit-counted';

function countVisit() {
  const now = new Date();
  const today = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate();
  let saved;
  try { saved = JSON.parse(localStorage.getItem(VISIT_KEY)) || {}; } catch (e) { saved = {}; }
  const visits = {
    total: saved.total || 0,
    date: today,
    today: saved.date === today ? saved.today || 0 : 0 // 날짜가 바뀌면 오늘 방문은 0부터
  };

  let counted = false;
  try { counted = sessionStorage.getItem(VISIT_SESSION_KEY) === '1'; } catch (e) { /* 못 읽으면 새 방문으로 봄 */ }
  if (!counted) {
    visits.total += 1;
    visits.today += 1;
    try {
      localStorage.setItem(VISIT_KEY, JSON.stringify(visits));
      sessionStorage.setItem(VISIT_SESSION_KEY, '1');
    } catch (e) { /* 저장 못 해도 화면에는 보여 줌 */ }
  }
  return visits;
}

function initVisitCount() {
  const box = document.getElementById('visitCount');
  const visits = countVisit();
  if (!box) return;
  box.textContent = '오늘 방문 ' + visits.today.toLocaleString('ko-KR') + ' · 전체 방문 ' + visits.total.toLocaleString('ko-KR');
}

document.addEventListener('DOMContentLoaded', initVisitCount);

/* ---------- 햄버거 메뉴 (좁은 화면) ----------
   ☰ 버튼을 누르면 메뉴가 펼쳐지고, 메뉴를 고르거나 바깥을 누르거나 Esc를 누르면 닫힙니다. */
function initMenuToggle() {
  const header = document.querySelector('.site-header');
  const button = document.getElementById('menuToggle');
  if (!header || !button) return;

  function setOpen(open) {
    header.classList.toggle('nav-open', open);
    document.body.classList.toggle('nav-open', open);
    button.setAttribute('aria-expanded', open ? 'true' : 'false');
    button.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
  }

  button.addEventListener('click', () => setOpen(!header.classList.contains('nav-open')));

  document.addEventListener('click', (e) => {
    if (!header.classList.contains('nav-open')) return;
    // 메뉴 안의 링크를 누르면 닫힘 / 헤더 바깥을 누르면 닫힘
    if (e.target.closest('.main-nav a') || !e.target.closest('.site-header')) setOpen(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && header.classList.contains('nav-open')) {
      setOpen(false);
      button.focus();
    }
  });

  // 창을 넓히면 (위쪽 메뉴가 다시 보이면) 자동으로 닫힘
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024 && header.classList.contains('nav-open')) setOpen(false);
  });
}

document.addEventListener('DOMContentLoaded', initMenuToggle);

/* ---------- 메뉴 드롭다운 (하위 메뉴) ----------
   - PC: 메뉴에 마우스를 올리면(mouseover) 배경색이 바뀌고 하위 메뉴가 열림, 떼면(mouseout) 닫힘
   - 햄버거 메뉴(1023px 이하): 메뉴 옆 ▾ 버튼을 누르면 하위 메뉴가 펼쳐짐
   - 탭을 옮기면 메뉴가 새것으로 바뀌므로, 버튼마다가 아니라 document에 이벤트를 걸어 둠 */
function initNavDropdown() {
  const wideScreen = window.matchMedia('(min-width: 1024px)');
  const wideMouse = window.matchMedia('(min-width: 1024px) and (hover: hover)');
  let closeTimer = null;
  let skipFocusOpen = false;

  function setItemOpen(item, open) {
    item.classList.toggle('open', open);
    const toggle = item.querySelector('.sub-toggle');
    if (toggle) toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  // except만 남기고 열린 하위 메뉴 모두 닫기
  function closeAll(except) {
    document.querySelectorAll('.main-nav .nav-item.open').forEach((item) => {
      if (item !== except) setItemOpen(item, false);
    });
  }

  // 마우스를 올렸을 때: 배경색 바꾸고 하위 메뉴 열기
  document.addEventListener('mouseover', (e) => {
    if (!wideMouse.matches) return;
    const item = e.target.closest('.main-nav .nav-item');
    if (!item) return;
    clearTimeout(closeTimer);
    closeAll(item);
    item.classList.add('hover');
    setItemOpen(item, true);
  });

  // 마우스를 뗐을 때: 배경색 되돌리고 하위 메뉴 닫기 (하위 메뉴로 옮겨 가는 동안은 유지)
  document.addEventListener('mouseout', (e) => {
    if (!wideMouse.matches) return;
    const item = e.target.closest('.main-nav .nav-item');
    if (!item || item.contains(e.relatedTarget)) return;
    item.classList.remove('hover');
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => setItemOpen(item, false), 150);
  });

  document.addEventListener('click', (e) => {
    // ▾ 버튼: 하위 메뉴 열기/닫기 (다른 하위 메뉴는 닫음)
    const toggle = e.target.closest('.main-nav .sub-toggle');
    if (toggle) {
      const item = toggle.closest('.nav-item');
      const open = !item.classList.contains('open');
      closeAll(item);
      setItemOpen(item, open);
      return;
    }
    // 하위 메뉴를 골랐거나 메뉴 바깥을 누르면 닫기
    if (e.target.closest('.main-nav .dropdown-menu a') || !e.target.closest('.main-nav .nav-item')) closeAll(null);
  });

  // 키보드(Tab)로 메뉴에 들어가면 PC에서도 하위 메뉴가 열림
  document.addEventListener('focusin', (e) => {
    if (!wideScreen.matches || skipFocusOpen) return;
    const item = e.target.closest('.main-nav .nav-item');
    closeAll(item);
    if (item) setItemOpen(item, true);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const openItem = document.querySelector('.main-nav .nav-item.open');
    if (!openItem) return;
    closeAll(null);
    if (wideScreen.matches && openItem.contains(document.activeElement)) {
      skipFocusOpen = true; // 메뉴로 초점을 되돌릴 때 하위 메뉴가 다시 열리지 않게
      openItem.querySelector('.nav-link').focus();
      skipFocusOpen = false;
    }
  });

  // PC ↔ 햄버거 메뉴로 바뀌면 열려 있던 하위 메뉴는 닫아 둠
  wideScreen.addEventListener('change', () => {
    closeAll(null);
    document.querySelectorAll('.main-nav .nav-item.hover').forEach((item) => item.classList.remove('hover'));
  });
}

document.addEventListener('DOMContentLoaded', initNavDropdown);

/* ---------- 화면 아래 잠깐 뜨는 알림(토스트) ---------- */
let toastTimer = null;

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  // 긴 안내 문구는 읽을 시간이 더 필요하니 글자 수에 맞춰 오래 보여줌
  toastTimer = setTimeout(() => toast.classList.remove('show'), Math.max(2400, message.length * 90));
}
