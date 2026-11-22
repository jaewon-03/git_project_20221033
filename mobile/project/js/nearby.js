/* 내 주변 가게 찾기 (발표 피드백: "추첨 결과에서 별점·리뷰를 볼 수 있으면 좋겠다")
   - 별점·리뷰는 메뉴가 아니라 가게마다 다르므로, 고른 메뉴를 파는 내 주변 가게 목록을 보여 주고
     가게마다 카카오맵 상세 페이지(별점·리뷰)로 연결합니다.
   - 카카오맵 JavaScript SDK의 장소 검색을 브라우저에서 바로 씁니다. 서버·DB가 필요 없습니다.
   - 위치를 허용하지 않으면 학교(장안대학교) 근처로 찾습니다.
   - PC는 GPS가 없어 와이파이로 위치를 짐작하므로 오차가 클 수 있습니다. 그래서 가게를 찾을 때마다 위치를 새로 받고,
     오차를 보여 주고, 지도를 눌러 내 위치를 바로잡을 수 있게 했습니다. 거리는 직선거리입니다.
   - 키가 없거나 카카오에 연결하지 못하면(파일로 연 경우 등) 지도 사이트에서 찾는 링크로 대신 안내합니다. */

/* 카카오 개발자 사이트 → 내 애플리케이션 → 앱 키 → JavaScript 키
   (웹페이지 코드에 공개로 들어가는 키라 괜찮습니다. JavaScript SDK 도메인에 등록한 사이트 주소에서만 동작합니다.
    REST API 키·Admin 키는 절대 넣지 마세요.) */
const KAKAO_JS_KEY = '18f2046589d96c0ced5df45b745c471a';

const NEARBY_RADII = [500, 1000, 3000]; // 찾는 범위 (m)
const NEARBY_DEFAULT_RADIUS = 1000;
const NEARBY_ROUGH_ACCURACY = 300;      // 위치 오차가 이보다 크면(m) "위치가 틀릴 수 있어요" 안내
const NEARBY_PICK_KEY = 'wte-nearby-pick';      // 직접 고른 기준 위치 (지도 누르기·위치 입력) — 30분 기억
const NEARBY_PICK_MAX_AGE = 30 * 60 * 1000;
const NEARBY_RADIUS_KEY = 'wte-nearby-radius';  // 마지막으로 고른 반경

/* 직접 고른 위치는 이번 방문 동안(30분) 기억해서, 창을 다시 열어도 또 고치지 않아도 되게 */
function savePickedOrigin(o) {
  try { sessionStorage.setItem(NEARBY_PICK_KEY, JSON.stringify({ lat: o.lat, lng: o.lng, label: o.label || '', time: Date.now() })); } catch (e) { /* 기억 못 해도 지금은 동작 */ }
}

function loadPickedOrigin() {
  try {
    const p = JSON.parse(sessionStorage.getItem(NEARBY_PICK_KEY));
    if (p && Date.now() - p.time < NEARBY_PICK_MAX_AGE) return p;
  } catch (e) { /* 없으면 새로 */ }
  return null;
}

function clearPickedOrigin() {
  try { sessionStorage.removeItem(NEARBY_PICK_KEY); } catch (e) { /* 무시 */ }
}

function loadRadius() {
  let r = 0;
  try { r = Number(sessionStorage.getItem(NEARBY_RADIUS_KEY)); } catch (e) { /* 기본값 */ }
  return NEARBY_RADII.includes(r) ? r : NEARBY_DEFAULT_RADIUS;
}

function saveRadius(r) {
  try { sessionStorage.setItem(NEARBY_RADIUS_KEY, String(r)); } catch (e) { /* 무시 */ }
}

let kakaoSdkPromise = null;

/* 카카오맵 SDK를 처음 필요할 때 한 번만 불러옴 */
function loadKakaoSdk() {
  if (kakaoSdkPromise) return kakaoSdkPromise;
  kakaoSdkPromise = new Promise((resolve, reject) => {
    if (!KAKAO_JS_KEY) {
      reject(new Error('no-key'));
      return;
    }
    if (location.protocol === 'file:') {
      reject(new Error('file'));
      return;
    }
    const timer = setTimeout(() => reject(new Error('timeout')), 8000);
    const script = document.createElement('script');
    script.src = 'https://dapi.kakao.com/v2/maps/sdk.js?appkey=' + encodeURIComponent(KAKAO_JS_KEY) + '&libraries=services&autoload=false';
    script.onload = () => {
      if (!window.kakao || !kakao.maps) {
        clearTimeout(timer);
        reject(new Error('sdk'));
        return;
      }
      kakao.maps.load(() => {
        clearTimeout(timer);
        resolve(window.kakao);
      });
    };
    script.onerror = () => {
      clearTimeout(timer);
      reject(new Error('sdk'));
    };
    document.head.appendChild(script);
  }).catch((err) => {
    kakaoSdkPromise = null; // 다음에 다시 시도할 수 있게
    throw err;
  });
  return kakaoSdkPromise;
}

/* 가게를 찾을 때는 기억해 둔 위치 대신 매번 새로, 최대한 정확하게 받음
   (받은 위치는 날씨 추천도 같이 쓰도록 저장). 오래 걸려 실패하면 최근 위치라도 씀 */
function getFreshPosition(onSuccess, onError) {
  if (!navigator.geolocation) {
    onError('이 브라우저는 위치 기능을 지원하지 않아요.');
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const p = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy, time: Date.now() };
      try { sessionStorage.setItem(POSITION_KEY, JSON.stringify(p)); } catch (e) { /* 기억 못 해도 사용은 가능 */ }
      onSuccess(p);
    },
    (err) => {
      const cached = getCachedPosition();
      if (cached && err.code !== 1) onSuccess(cached);
      else onError(positionErrorMessage(err));
    },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
  );
}

/* 메뉴 → 검색할 말 (편의점 메뉴는 '편의점'으로, 나머지는 음식점(FD6) 안에서 메뉴 이름으로)
   place: 화면에 쓰는 이름 ("김치찌개 가게", "편의점", "'학교 앞 김밥천국'") */
function nearbyTargetFromMenu(menu) {
  const isStore = menu.category === '편의점';
  return {
    place: isStore ? '편의점' : menu.name + ' 가게',
    keyword: isStore ? '편의점' : menu.name,
    group: isStore ? 'CS2' : 'FD6',
    emoji: menu.emoji
  };
}

/* 돌림판 결과처럼 메뉴 목록에 없는 말 (예: 학교 앞 김밥천국) */
function nearbyTargetFromText(text) {
  const menu = findMenu(text);
  return menu ? nearbyTargetFromMenu(menu) : { place: "'" + text + "'", keyword: text, group: '', emoji: '📍' };
}

/* "'학교 앞 김밥천국'" + 을/를: 따옴표 앞 글자로 판단 */
function placeWithObject(place) {
  const inner = place.replace(/'$/, '');
  const withJosa = josa(inner, '을', '를');
  return place + withJosa.slice(inner.length);
}

function formatDistance(m) {
  const n = Number(m);
  if (!Number.isFinite(n)) return '';
  return n < 1000 ? Math.round(n) + 'm' : (n / 1000).toFixed(1).replace(/\.0$/, '') + 'km';
}

function formatRadius(m) {
  return m < 1000 ? m + 'm' : m / 1000 + 'km';
}

/* ---------- 창 (한 번 만들어서 계속 씀. 탭을 옮겨도 body는 그대로라 사라지지 않음) ---------- */
const nearby = {
  el: null,
  target: null,
  origin: null,     // { lat, lng, kind: 'gps' | 'school' | 'manual', accuracy, note, label, remembered }
  radius: NEARBY_DEFAULT_RADIUS,
  token: 0,         // 이전 검색 결과가 늦게 와서 덮어쓰지 않게
  places: [],
  pagination: null,
  map: null,
  overlays: [],     // 지도 위 표시(내 위치, 범위 원, 가게 번호)
  pins: [],         // 가게 번호 버튼 (목록과 연결)
  opener: null
};

function buildNearbySheet() {
  const wrap = document.createElement('div');
  wrap.className = 'nearby-backdrop';
  wrap.id = 'nearbySheet';
  wrap.hidden = true;
  wrap.innerHTML =
    '<section class="nearby-sheet" role="dialog" aria-modal="true" aria-labelledby="nearbyTitle">' +
    '<header class="nearby-head">' +
    '<div class="nearby-head-text"><h2 id="nearbyTitle"></h2><p class="nearby-where" id="nearbyWhere"></p></div>' +
    '<button type="button" class="nearby-close" data-nearby-close aria-label="닫기">✕</button>' +
    '</header>' +
    '<div class="nearby-tools">' +
    '<div class="nearby-radius" role="group" aria-label="찾는 범위">' +
    NEARBY_RADII.map((r) => '<button type="button" class="chip" data-radius="' + r + '">' + formatRadius(r) + '</button>').join('') +
    '</div>' +
    '<button type="button" class="text-btn nearby-type-btn" data-nearby-type aria-expanded="false" aria-controls="nearbyLocateForm">✏️ 위치 직접 입력</button>' +
    '<form class="nearby-locate-form" id="nearbyLocateForm" hidden>' +
    '<label for="nearbyLocateInput" class="sr-only">기준으로 삼을 장소나 주소</label>' +
    '<input type="search" id="nearbyLocateInput" maxlength="40" autocomplete="off" placeholder="예: 수원역, 봉담읍, 장안대학교">' +
    '<button type="submit" class="action-btn small primary-soft">이 위치로</button>' +
    '</form>' +
    '<p class="nearby-locate-msg" id="nearbyLocateMsg" role="status"></p>' +
    '</div>' +
    '<div class="nearby-scroll">' +
    '<div class="nearby-map-wrap" id="nearbyMapWrap" hidden>' +
    '<div class="nearby-map" id="nearbyMap"></div>' +
    '<p class="nearby-map-hint">🗺️ 파란 점이 실제 내 위치와 다르면 <strong>지도에서 내 위치를 눌러</strong> 주세요. 그 자리 기준으로 다시 찾아요.</p>' +
    '</div>' +
    '<div class="nearby-body" id="nearbyBody" aria-live="polite"></div>' +
    '</div>' +
    '<footer class="nearby-foot">가게 정보·별점·리뷰 제공: <a href="https://map.kakao.com" target="_blank" rel="noopener">카카오맵</a></footer>' +
    '</section>';
  document.body.appendChild(wrap);

  wrap.addEventListener('click', (e) => {
    if (e.target === wrap || e.target.closest('[data-nearby-close]')) {
      closeNearby();
      return;
    }
    const radiusBtn = e.target.closest('[data-radius]');
    if (radiusBtn) {
      nearby.radius = Number(radiusBtn.dataset.radius);
      saveRadius(nearby.radius);
      searchNearby();
      return;
    }
    if (e.target.closest('[data-nearby-relocate]')) {
      clearPickedOrigin(); // 직접 고른 위치는 잊고 다시 내 위치로
      locateAndSearch();
      return;
    }
    const typeBtn = e.target.closest('[data-nearby-type]');
    if (typeBtn) {
      toggleLocateForm(wrap.querySelector('#nearbyLocateForm').hidden);
      return;
    }
    const focusBtn = e.target.closest('[data-nearby-focus]');
    if (focusBtn) {
      focusNearbyPlace(Number(focusBtn.dataset.nearbyFocus), 'list');
      return;
    }
    if (e.target.closest('[data-nearby-more]') && nearby.pagination && nearby.pagination.hasNextPage) {
      e.target.closest('[data-nearby-more]').disabled = true;
      nearby.pagination.nextPage();
    }
  });
  wrap.addEventListener('submit', (e) => {
    if (e.target.id !== 'nearbyLocateForm') return;
    e.preventDefault();
    findOriginByText(wrap.querySelector('#nearbyLocateInput').value.trim());
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !wrap.hidden) closeNearby();
  });
  return wrap;
}

function toggleLocateForm(open) {
  const form = nearby.el.querySelector('#nearbyLocateForm');
  form.hidden = !open;
  nearby.el.querySelector('[data-nearby-type]').setAttribute('aria-expanded', open ? 'true' : 'false');
  setLocateMessage('');
  if (open) form.querySelector('input').focus();
}

function setLocateMessage(text) {
  nearby.el.querySelector('#nearbyLocateMsg').textContent = text;
}

/* "수원역", "봉담읍 와우안길 17"처럼 입력한 장소·주소를 기준 위치로 (장소 이름 → 안 되면 주소로 찾기) */
function findOriginByText(query) {
  if (!query) {
    setLocateMessage('장소 이름이나 주소를 입력해 주세요.');
    return;
  }
  setLocateMessage('🔎 위치를 찾는 중이에요…');
  loadKakaoSdk().then((kakaoApi) => {
    const services = kakaoApi.maps.services;
    const use = (lat, lng, label) => {
      const origin = { lat: lat, lng: lng, kind: 'manual', accuracy: 0, note: '', label: label };
      savePickedOrigin(origin);
      nearby.origin = origin;
      nearby.el.querySelector('#nearbyLocateInput').value = '';
      toggleLocateForm(false);
      searchNearby();
    };
    new services.Places().keywordSearch(query, (data, status) => {
      if (status === services.Status.OK && data.length) {
        use(Number(data[0].y), Number(data[0].x), data[0].place_name);
        return;
      }
      new services.Geocoder().addressSearch(query, (result, st) => {
        if (st === services.Status.OK && result.length) use(Number(result[0].y), Number(result[0].x), result[0].address_name);
        else setLocateMessage(placeWithObject("'" + query + "'") + ' 찾지 못했어요. 역 이름, 학교, 동 이름처럼 다르게 입력해 보세요.');
      });
    });
  }).catch(() => setLocateMessage('카카오맵에 연결하지 못해서 위치를 찾을 수 없어요.'));
}

function openNearby(target, opener) {
  if (!nearby.el) nearby.el = buildNearbySheet();
  nearby.target = target;
  nearby.radius = loadRadius();
  nearby.opener = opener || document.activeElement;
  nearby.el.querySelector('#nearbyTitle').textContent = target.emoji + ' 내 주변 ' + target.place;
  nearby.el.hidden = false;
  document.body.classList.add('nearby-open');
  toggleLocateForm(false);
  nearby.el.querySelector('.nearby-close').focus();

  // 30분 안에 직접 고른 위치가 있으면 PC 위치 대신 그 위치로
  const picked = loadPickedOrigin();
  if (picked) {
    nearby.origin = { lat: picked.lat, lng: picked.lng, kind: 'manual', accuracy: 0, note: '', label: picked.label, remembered: true };
    searchNearby();
  } else {
    locateAndSearch();
  }
}

/* 내 위치를 새로 받아서 찾기 (못 받으면 학교 근처) */
function locateAndSearch() {
  setNearbyBody('<p class="nearby-status">📍 현재 위치를 확인하는 중이에요…</p>');
  setNearbyWhere('');
  hideNearbyMap();

  const token = ++nearby.token;
  getFreshPosition(
    (p) => {
      if (token !== nearby.token) return;
      nearby.origin = { lat: p.lat, lng: p.lng, kind: 'gps', accuracy: p.accuracy || 0, note: '' };
      searchNearby();
    },
    (message) => {
      if (token !== nearby.token) return;
      nearby.origin = { lat: SCHOOL_COORDS.lat, lng: SCHOOL_COORDS.lng, kind: 'school', accuracy: 0, note: message };
      searchNearby();
    }
  );
}

function closeNearby() {
  if (!nearby.el || nearby.el.hidden) return;
  nearby.token++; // 진행 중인 검색 결과는 무시
  nearby.el.hidden = true;
  document.body.classList.remove('nearby-open');
  if (nearby.opener && document.contains(nearby.opener)) nearby.opener.focus();
}

function setNearbyBody(html) {
  nearby.el.querySelector('#nearbyBody').innerHTML = html;
}

function setNearbyWhere(html) {
  nearby.el.querySelector('#nearbyWhere').innerHTML = html;
}

function syncRadiusChips() {
  nearby.el.querySelectorAll('.nearby-radius [data-radius]').forEach((btn) => {
    btn.setAttribute('aria-pressed', Number(btn.dataset.radius) === nearby.radius ? 'true' : 'false');
  });
}

function hideNearbyMap() {
  nearby.el.querySelector('#nearbyMapWrap').hidden = true;
}

/* 지도 사이트에서 직접 찾는 링크 (카카오에 연결하지 못했을 때, 결과가 없을 때) */
function nearbyFallbackLinks() {
  const t = nearby.target;
  const o = nearby.origin || SCHOOL_COORDS;
  return '<div class="nearby-fallback-links">' +
    '<a class="action-btn small" href="' + escapeHtml(kakaoMapUrl(t.keyword)) + '" target="_blank" rel="noopener">카카오맵에서 찾기</a>' +
    '<a class="action-btn small" href="' + escapeHtml(googleMapsNearUrl(t.keyword, o.lat, o.lng)) + '" target="_blank" rel="noopener">구글 지도에서 근처 찾기</a>' +
    '</div>';
}

/* 제목 아래: 무엇을 기준으로 찾았는지 + 위치 오차 안내 */
function renderNearbyWhere() {
  const o = nearby.origin;
  let base;
  if (o.kind === 'manual') base = '📌 ' + (o.label ? escapeHtml(o.label) : '지도에서 고른 위치');
  else if (o.kind === 'school') base = '🏫 장안대학교 근처';
  else base = '📍 현재 위치' + (o.accuracy ? ' (오차 약 ±' + formatDistance(o.accuracy) + ')' : '');

  let note = '';
  if (o.kind === 'school' && o.note) {
    note = escapeHtml(o.note) + ' 그래서 학교 근처로 찾았어요.';
  } else if (o.kind === 'gps' && o.accuracy > NEARBY_ROUGH_ACCURACY) {
    note = 'PC는 GPS가 없어서 와이파이로 위치를 짐작해요. 실제 위치와 다르면 지도에서 내 위치를 누르거나 위치를 직접 입력해 주세요.';
  } else if (o.kind === 'manual' && o.remembered) {
    note = '조금 전에 직접 고른 위치예요.';
  }
  const relocate = o.kind === 'manual'
    ? ' <button type="button" class="text-btn nearby-relocate" data-nearby-relocate>📍 내 위치로 다시 찾기</button>' : '';

  setNearbyWhere(base + ' 기준 · 반경 ' + formatRadius(nearby.radius) + ' · 가까운 순' + relocate +
    (note ? '<span class="nearby-note">' + note + '</span>' : ''));
}

function searchNearby() {
  if (!nearby.origin) return;
  const token = ++nearby.token;
  syncRadiusChips();
  renderNearbyWhere();
  setNearbyBody('<p class="nearby-status">🔎 가게를 찾는 중이에요…</p>');
  nearby.places = [];
  nearby.pagination = null;

  loadKakaoSdk().then((kakaoApi) => {
    if (token !== nearby.token) return;
    const places = new kakaoApi.maps.services.Places();
    const options = {
      location: new kakaoApi.maps.LatLng(nearby.origin.lat, nearby.origin.lng),
      radius: nearby.radius,
      sort: kakaoApi.maps.services.SortBy.DISTANCE,
      size: 15
    };
    if (nearby.target.group) options.category_group_code = nearby.target.group;

    places.keywordSearch(nearby.target.keyword, (data, status, pagination) => {
      if (token !== nearby.token) return;
      if (status === kakaoApi.maps.services.Status.ERROR) {
        renderNearbyError('카카오맵에 연결하지 못했어요.');
        return;
      }
      const list = status === kakaoApi.maps.services.Status.OK ? data : [];
      // '더 보기'로 다음 쪽을 받으면 이어 붙임
      nearby.places = pagination && pagination.current > 1 ? nearby.places.concat(list) : list;
      nearby.pagination = pagination || null;
      renderNearbyList(kakaoApi);
    }, options);
  }).catch((err) => {
    if (token !== nearby.token) return;
    const reason = err.message === 'file'
      ? '파일을 직접 열면 카카오맵을 쓸 수 없어요. VS Code의 Live Server로 열어 주세요.'
      : err.message === 'no-key'
        ? '가게 목록 서비스를 준비하고 있어요.'
        : '카카오맵에 연결하지 못했어요. 인터넷 연결을 확인해 주세요.';
    renderNearbyError(reason);
  });
}

function renderNearbyError(reason) {
  hideNearbyMap();
  setNearbyBody(
    '<div class="nearby-empty"><strong>가게 목록을 불러오지 못했어요</strong><p>' + escapeHtml(reason) + '</p>' +
    '<p>아래에서 지도 사이트로 바로 찾아볼 수 있어요.</p>' + nearbyFallbackLinks() + '</div>');
}

function renderNearbyList(kakaoApi) {
  const places = nearby.places;
  if (!places.length) {
    const wider = NEARBY_RADII.find((r) => r > nearby.radius);
    setNearbyBody(
      '<div class="nearby-empty"><strong>반경 ' + formatRadius(nearby.radius) + ' 안에서 ' + escapeHtml(placeWithObject(nearby.target.place)) + ' 찾지 못했어요</strong>' +
      (wider ? '<p><button type="button" class="action-btn small primary-soft" data-radius="' + wider + '">' + formatRadius(wider) + '까지 넓혀서 찾기</button></p>' : '') +
      '<p>지도 사이트에서 더 넓게 찾아볼 수도 있어요.</p>' + nearbyFallbackLinks() + '</div>');
    drawNearbyMap(kakaoApi); // 결과가 없어도 지도를 보여 줘서 내 위치를 바로잡을 수 있게
    return;
  }

  const total = nearby.pagination ? nearby.pagination.totalCount : places.length;
  const items = places.map((p, i) => {
    const category = (p.category_name || '').split(' > ').slice(-1)[0];
    const placeUrl = (p.place_url || '').replace(/^http:/, 'https:');
    const routeUrl = 'https://map.kakao.com/link/to/' + encodeURIComponent(p.place_name) + ',' + p.y + ',' + p.x;
    return '<li class="nearby-item" data-index="' + i + '">' +
      '<button type="button" class="nearby-num" data-nearby-focus="' + i + '" aria-label="' + (i + 1) + '번 ' + escapeHtml(p.place_name) + ' 지도에서 보기">' + (i + 1) + '</button>' +
      '<div class="nearby-info">' +
      '<button type="button" class="nearby-name" data-nearby-focus="' + i + '" title="지도에서 위치 보기">' + escapeHtml(p.place_name) + '</button>' +
      '<span class="nearby-meta">' + [p.distance !== undefined && p.distance !== '' ? '직선 ' + formatDistance(p.distance) : '', escapeHtml(category)].filter(Boolean).join(' · ') + '</span>' +
      '<span class="nearby-addr">' + escapeHtml(p.road_address_name || p.address_name || '') + '</span>' +
      '<div class="nearby-links">' +
      (placeUrl ? '<a class="action-btn small primary-soft" href="' + escapeHtml(placeUrl) + '" target="_blank" rel="noopener">⭐ 별점·리뷰</a>' : '') +
      (p.phone ? '<a class="action-btn small" href="tel:' + escapeHtml(p.phone.replace(/[^0-9+]/g, '')) + '">📞 전화</a>' : '') +
      '<a class="action-btn small" href="' + escapeHtml(routeUrl) + '" target="_blank" rel="noopener">🧭 길찾기</a>' +
      '</div></div></li>';
  }).join('');

  const more = nearby.pagination && nearby.pagination.hasNextPage
    ? '<button type="button" class="action-btn nearby-more" data-nearby-more>가게 더 보기</button>' : '';
  setNearbyBody('<p class="nearby-count">가게 <strong>' + total.toLocaleString('ko-KR') + '</strong>곳 · 거리는 직선거리예요 · 이름을 누르면 지도에서 위치를 보여 줘요</p>' +
    '<ol class="nearby-list">' + items + '</ol>' + more);
  drawNearbyMap(kakaoApi);
}

/* 지도: 내 위치(파란 점, 오차 원), 찾는 범위(점선 원), 가게 번호. 지도를 누르면 그 자리를 기준으로 다시 찾음 */
function drawNearbyMap(kakaoApi) {
  const maps = kakaoApi.maps;
  nearby.el.querySelector('#nearbyMapWrap').hidden = false;
  const center = new maps.LatLng(nearby.origin.lat, nearby.origin.lng);
  if (!nearby.map) {
    nearby.map = new maps.Map(nearby.el.querySelector('#nearbyMap'), { center: center, level: 5 });
    maps.event.addListener(nearby.map, 'click', (mouseEvent) => {
      const ll = mouseEvent.latLng;
      nearby.origin = { lat: ll.getLat(), lng: ll.getLng(), kind: 'manual', accuracy: 0, note: '', label: '' };
      savePickedOrigin(nearby.origin);
      searchNearby();
    });
  }
  nearby.map.relayout();
  nearby.overlays.forEach((o) => o.setMap(null));
  nearby.overlays = [];
  nearby.pins = [];

  // 찾는 범위
  nearby.overlays.push(new maps.Circle({
    map: nearby.map, center: center, radius: nearby.radius,
    strokeWeight: 2, strokeColor: '#c2410c', strokeOpacity: 0.7, strokeStyle: 'dash',
    fillColor: '#c2410c', fillOpacity: 0.03
  }));
  // 위치 오차 (현재 위치를 받았을 때만)
  if (nearby.origin.kind === 'gps' && nearby.origin.accuracy > 30) {
    nearby.overlays.push(new maps.Circle({
      map: nearby.map, center: center, radius: Math.min(nearby.origin.accuracy, 5000),
      strokeWeight: 1, strokeColor: '#2f6fed', strokeOpacity: 0.5, fillColor: '#2f6fed', fillOpacity: 0.1
    }));
  }
  nearby.overlays.push(new maps.CustomOverlay({
    map: nearby.map,
    position: center,
    content: '<span class="nearby-me" title="' + (nearby.origin.kind === 'school' ? '장안대학교' : nearby.origin.kind === 'manual' ? '지도에서 고른 위치' : '현재 위치') + '"></span>'
  }));

  const bounds = new maps.LatLngBounds();
  bounds.extend(center);
  nearby.places.forEach((p, i) => {
    const pos = new maps.LatLng(Number(p.y), Number(p.x));
    bounds.extend(pos);
    const pin = document.createElement('button');
    pin.type = 'button';
    pin.className = 'nearby-pin';
    pin.textContent = i + 1;
    pin.setAttribute('aria-label', (i + 1) + '번 ' + p.place_name + ' 목록에서 보기');
    pin.addEventListener('click', (e) => {
      e.stopPropagation(); // 지도 클릭(위치 바꾸기)으로 넘어가지 않게
      focusNearbyPlace(i, 'map');
    });
    nearby.pins.push({ el: pin, pos: pos });
    nearby.overlays.push(new maps.CustomOverlay({ map: nearby.map, position: pos, content: pin, yAnchor: 1, clickable: true }));
  });

  if (nearby.places.length) {
    nearby.map.setBounds(bounds);
  } else {
    nearby.map.setCenter(center);
    nearby.map.setLevel(nearby.radius <= 500 ? 4 : nearby.radius <= 1000 ? 5 : 7);
  }
}

/* 목록의 가게 ↔ 지도의 번호를 같이 강조 */
function focusNearbyPlace(index, from) {
  const pin = nearby.pins[index];
  const item = nearby.el.querySelector('.nearby-item[data-index="' + index + '"]');
  nearby.pins.forEach((p, i) => p.el.classList.toggle('is-active', i === index));
  nearby.el.querySelectorAll('.nearby-item').forEach((li) => li.classList.toggle('is-active', li === item));
  if (from === 'list' && pin && nearby.map) {
    nearby.map.panTo(pin.pos);
    nearby.el.querySelector('.nearby-scroll').scrollTo({ top: 0, behavior: 'smooth' }); // 지도가 보이게
  }
  if (from === 'map' && item) item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}
