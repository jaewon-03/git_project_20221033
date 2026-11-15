/* 내 주변 가게 찾기 (발표 피드백: "추첨 결과에서 별점·리뷰를 볼 수 있으면 좋겠다")
   - 별점·리뷰는 메뉴가 아니라 가게마다 다르므로, 고른 메뉴를 파는 내 주변 가게 목록을 보여 주고
     가게마다 카카오맵 상세 페이지(별점·리뷰)로 연결합니다.
   - 카카오맵 JavaScript SDK의 장소 검색을 브라우저에서 바로 씁니다. 서버·DB가 필요 없습니다.
   - 위치를 허용하지 않으면 학교(장안대학교) 근처로 찾습니다.
   - 키가 없거나 카카오에 연결하지 못하면(파일로 연 경우 등) 지도 사이트에서 찾는 링크로 대신 안내합니다. */

/* 카카오 개발자 사이트 → 내 애플리케이션 → 앱 키 → JavaScript 키
   (웹페이지 코드에 공개로 들어가는 키라 괜찮습니다. 플랫폼 → Web에 등록한 사이트 주소에서만 동작합니다.
    REST API 키·Admin 키는 절대 넣지 마세요.) */
const KAKAO_JS_KEY = '18f2046589d96c0ced5df45b745c471a';

const NEARBY_RADII = [500, 1000, 3000]; // 찾는 범위 (m)
const NEARBY_DEFAULT_RADIUS = 1000;

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

/* 메뉴 → 검색할 말 (편의점 메뉴는 '편의점'으로, 나머지는 음식점(FD6) 안에서 메뉴 이름으로) */
/* place: 화면에 쓰는 이름 ("김치찌개 가게", "편의점", "'학교 앞 김밥천국'") */
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
  origin: null,     // { lat, lng, isSchool, note }
  radius: NEARBY_DEFAULT_RADIUS,
  token: 0,         // 이전 검색 결과가 늦게 와서 덮어쓰지 않게
  places: [],
  pagination: null,
  map: null,
  overlays: [],
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
    '<div class="nearby-radius" role="group" aria-label="찾는 범위">' +
    NEARBY_RADII.map((r) => '<button type="button" class="chip" data-radius="' + r + '">' + formatRadius(r) + '</button>').join('') +
    '</div>' +
    '<div class="nearby-scroll">' +
    '<div class="nearby-map" id="nearbyMap" hidden></div>' +
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
      searchNearby();
      return;
    }
    if (e.target.closest('[data-nearby-more]') && nearby.pagination && nearby.pagination.hasNextPage) {
      e.target.closest('[data-nearby-more]').disabled = true;
      nearby.pagination.nextPage();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !wrap.hidden) closeNearby();
  });
  return wrap;
}

function openNearby(target, opener) {
  if (!nearby.el) nearby.el = buildNearbySheet();
  nearby.target = target;
  nearby.radius = NEARBY_DEFAULT_RADIUS;
  nearby.opener = opener || document.activeElement;
  nearby.el.querySelector('#nearbyTitle').textContent = target.emoji + ' 내 주변 ' + target.place;
  nearby.el.hidden = false;
  document.body.classList.add('nearby-open');
  nearby.el.querySelector('.nearby-close').focus();

  setNearbyBody('<p class="nearby-status">📍 현재 위치를 확인하는 중이에요…</p>');
  setNearbyWhere('');
  hideNearbyMap();

  const token = ++nearby.token;
  requestPosition(
    (p) => {
      if (token !== nearby.token) return;
      nearby.origin = { lat: p.lat, lng: p.lng, isSchool: false, note: '' };
      searchNearby();
    },
    (message) => {
      if (token !== nearby.token) return;
      nearby.origin = { lat: SCHOOL_COORDS.lat, lng: SCHOOL_COORDS.lng, isSchool: true, note: message };
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
  nearby.el.querySelectorAll('[data-radius]').forEach((btn) => {
    btn.setAttribute('aria-pressed', Number(btn.dataset.radius) === nearby.radius ? 'true' : 'false');
  });
}

function hideNearbyMap() {
  nearby.el.querySelector('#nearbyMap').hidden = true;
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

function renderNearbyWhere() {
  const o = nearby.origin;
  const base = o.isSchool ? '🏫 장안대학교 근처' : '📍 현재 위치';
  setNearbyWhere(base + ' 기준 · 반경 ' + formatRadius(nearby.radius) + ' · 가까운 순' +
    (o.isSchool && o.note ? '<span class="nearby-note">' + escapeHtml(o.note) + ' 그래서 학교 근처로 찾았어요.</span>' : ''));
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
    hideNearbyMap();
    const wider = NEARBY_RADII.find((r) => r > nearby.radius);
    setNearbyBody(
      '<div class="nearby-empty"><strong>반경 ' + formatRadius(nearby.radius) + ' 안에서 ' + escapeHtml(placeWithObject(nearby.target.place)) + ' 찾지 못했어요</strong>' +
      (wider ? '<p><button type="button" class="action-btn small primary-soft" data-radius="' + wider + '">' + formatRadius(wider) + '까지 넓혀서 찾기</button></p>' : '') +
      '<p>지도 사이트에서 더 넓게 찾아볼 수도 있어요.</p>' + nearbyFallbackLinks() + '</div>');
    return;
  }

  const total = nearby.pagination ? nearby.pagination.totalCount : places.length;
  const items = places.map((p, i) => {
    const category = (p.category_name || '').split(' > ').slice(-1)[0];
    const placeUrl = (p.place_url || '').replace(/^http:/, 'https:');
    const routeUrl = 'https://map.kakao.com/link/to/' + encodeURIComponent(p.place_name) + ',' + p.y + ',' + p.x;
    return '<li class="nearby-item">' +
      '<span class="nearby-num" aria-hidden="true">' + (i + 1) + '</span>' +
      '<div class="nearby-info">' +
      '<strong class="nearby-name">' + escapeHtml(p.place_name) + '</strong>' +
      '<span class="nearby-meta">' + [formatDistance(p.distance), escapeHtml(category)].filter(Boolean).join(' · ') + '</span>' +
      '<span class="nearby-addr">' + escapeHtml(p.road_address_name || p.address_name || '') + '</span>' +
      '<div class="nearby-links">' +
      (placeUrl ? '<a class="action-btn small primary-soft" href="' + escapeHtml(placeUrl) + '" target="_blank" rel="noopener">⭐ 별점·리뷰</a>' : '') +
      (p.phone ? '<a class="action-btn small" href="tel:' + escapeHtml(p.phone.replace(/[^0-9+]/g, '')) + '">📞 전화</a>' : '') +
      '<a class="action-btn small" href="' + escapeHtml(routeUrl) + '" target="_blank" rel="noopener">🧭 길찾기</a>' +
      '</div></div></li>';
  }).join('');

  const more = nearby.pagination && nearby.pagination.hasNextPage
    ? '<button type="button" class="action-btn nearby-more" data-nearby-more>가게 더 보기</button>' : '';
  setNearbyBody('<p class="nearby-count">가게 <strong>' + total.toLocaleString('ko-KR') + '</strong>곳 · ⭐를 누르면 카카오맵에서 별점과 리뷰를 볼 수 있어요</p>' +
    '<ol class="nearby-list">' + items + '</ol>' + more);
  drawNearbyMap(kakaoApi);
}

/* 지도에 내 위치와 가게 번호 표시 */
function drawNearbyMap(kakaoApi) {
  const box = nearby.el.querySelector('#nearbyMap');
  box.hidden = false;
  const center = new kakaoApi.maps.LatLng(nearby.origin.lat, nearby.origin.lng);
  if (!nearby.map) {
    nearby.map = new kakaoApi.maps.Map(box, { center: center, level: 5 });
  }
  nearby.map.relayout();
  nearby.overlays.forEach((o) => o.setMap(null));
  nearby.overlays = [];

  const bounds = new kakaoApi.maps.LatLngBounds();
  bounds.extend(center);
  nearby.overlays.push(new kakaoApi.maps.CustomOverlay({
    map: nearby.map,
    position: center,
    content: '<span class="nearby-me" title="' + (nearby.origin.isSchool ? '장안대학교' : '현재 위치') + '"></span>'
  }));
  nearby.places.forEach((p, i) => {
    const pos = new kakaoApi.maps.LatLng(Number(p.y), Number(p.x));
    bounds.extend(pos);
    nearby.overlays.push(new kakaoApi.maps.CustomOverlay({
      map: nearby.map,
      position: pos,
      content: '<span class="nearby-pin">' + (i + 1) + '</span>',
      yAnchor: 1
    }));
  });
  nearby.map.setBounds(bounds);
}
