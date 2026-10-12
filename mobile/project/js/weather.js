/* 날씨 맞춤 추천 (추첨 화면 상단 배너)
   - 내 서버 없이, 브라우저가 무료 날씨 서버(Open-Meteo)에 직접 물어봅니다. 가입·키 필요 없음.
   - 위치를 허용하면 현재 위치, 아니면 고른 지역의 날씨를 보여줍니다. */

const REGIONS = [
  { name: '서울', lat: 37.5665, lon: 126.978 },
  { name: '인천', lat: 37.4563, lon: 126.7052 },
  { name: '경기(수원)', lat: 37.2636, lon: 127.0286 },
  { name: '강원(춘천)', lat: 37.8813, lon: 127.7298 },
  { name: '대전', lat: 36.3504, lon: 127.3845 },
  { name: '세종', lat: 36.48, lon: 127.289 },
  { name: '충북(청주)', lat: 36.6424, lon: 127.489 },
  { name: '충남(천안)', lat: 36.8151, lon: 127.1139 },
  { name: '광주', lat: 35.1595, lon: 126.8526 },
  { name: '전북(전주)', lat: 35.8242, lon: 127.148 },
  { name: '전남(목포)', lat: 34.8118, lon: 126.3922 },
  { name: '대구', lat: 35.8714, lon: 128.6014 },
  { name: '경북(포항)', lat: 36.019, lon: 129.3435 },
  { name: '부산', lat: 35.1796, lon: 129.0756 },
  { name: '울산', lat: 35.5384, lon: 129.3114 },
  { name: '경남(창원)', lat: 35.228, lon: 128.6811 },
  { name: '제주', lat: 33.4996, lon: 126.5312 }
];

/* 날씨 코드 + 기온 → 화면에 보여줄 문구와 추천 조건
   (날씨 코드 표: https://open-meteo.com/en/docs 의 WMO Weather interpretation codes) */
function describeWeather(code, temp) {
  const isRain = (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95;
  const isSnow = (code >= 71 && code <= 77) || code === 85 || code === 86;

  if (isRain) return { icon: '🌧️', desc: '비가 와요', msg: '이런 날엔 뜨끈한 국물이 최고죠', tags: ['국물'] };
  if (isSnow) return { icon: '❄️', desc: '눈이 와요', msg: '따끈한 국물로 몸을 녹여 봐요', tags: ['국물'] };
  if (temp >= 28) return { icon: '🥵', desc: '무더워요', msg: '시원한 메뉴로 더위를 날려 봐요', tags: ['시원함'] };
  if (temp <= 3) return { icon: '🥶', desc: '추워요', msg: '뜨끈한 국물 한 그릇 어때요?', tags: ['국물'] };
  if (code === 45 || code === 48) return { icon: '🌫️', desc: '안개가 꼈어요', msg: '오늘은 뭐든 괜찮은 날이에요', tags: [] };
  if (code === 2 || code === 3) return { icon: '⛅', desc: '구름이 많아요', msg: '오늘은 뭐든 괜찮은 날이에요', tags: [] };
  return { icon: '☀️', desc: '맑아요', msg: '날씨 좋은 날, 뭐든 맛있겠네요', tags: [] };
}

async function fetchWeather(lat, lon) {
  const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon +
    '&current=temperature_2m,weather_code&timezone=auto';
  const res = await fetch(url);
  if (!res.ok) throw new Error('weather ' + res.status);
  const data = await res.json();
  return { temp: Math.round(data.current.temperature_2m), code: data.current.weather_code };
}

/* 현재 위치 (common.js의 requestPosition 사용: '내 주변 찾기'와 위치를 같이 씀) */
function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    requestPosition((p) => resolve({ lat: p.lat, lon: p.lng }), (message) => reject(new Error(message)));
  });
}

/* box: 배너가 들어갈 요소, onApply(tags): '추천 조건 적용'을 눌렀을 때 실행할 함수 */
function initWeather(box, onApply) {
  const regionOptions = REGIONS.map((r) => '<option value="' + r.name + '">' + r.name + '</option>').join('');

  function regionSelect() {
    return '<select class="weather-select" aria-label="날씨 지역 선택">' +
      '<option value="">지역 선택</option>' + regionOptions + '</select>';
  }

  function bindSelect(selected) {
    const select = box.querySelector('.weather-select');
    if (!select) return;
    if (selected) select.value = selected;
    select.addEventListener('change', () => {
      if (select.value) loadRegion(select.value);
    });
  }

  function showIdle() {
    box.className = 'weather-box';
    box.innerHTML =
      '<span class="weather-icon">🌤️</span>' +
      '<div class="weather-text"><strong>날씨에 맞는 메뉴를 추천받아 보세요</strong>' +
      '<span>위치를 허용하거나 지역을 고르면 지금 날씨를 확인해요</span></div>' +
      '<div class="weather-actions"><button type="button" class="weather-btn" data-action="locate">📍 내 위치로</button>' +
      regionSelect() + '</div>';
    box.querySelector('[data-action="locate"]').addEventListener('click', loadCurrent);
    bindSelect();
  }

  function showLoading() {
    box.className = 'weather-box loading';
    box.innerHTML = '<span class="weather-icon">⏳</span><div class="weather-text"><strong>날씨를 불러오는 중이에요…</strong></div>';
  }

  function showResult(placeName, weather, regionName, notice) {
    const info = describeWeather(weather.code, weather.temp);
    box.className = 'weather-box';
    box.innerHTML =
      '<span class="weather-icon">' + info.icon + '</span>' +
      '<div class="weather-text"><strong>' + placeName + ' · ' + weather.temp + '° · ' + info.desc + '</strong>' +
      '<span>' + (notice || info.msg) + '</span>' +
      // Open-Meteo 이용 조건: 날씨를 보여주는 곳 옆에 출처 링크 표시
      '<a class="weather-credit" href="https://open-meteo.com/" target="_blank" rel="noopener">Weather data by Open-Meteo.com</a></div>' +
      '<div class="weather-actions">' +
      (info.tags.length ? '<button type="button" class="weather-btn primary" data-action="apply">#' + info.tags.join(' #') + ' 메뉴 보기</button>' : '') +
      regionSelect() + '</div>';
    const applyBtn = box.querySelector('[data-action="apply"]');
    if (applyBtn) applyBtn.addEventListener('click', () => onApply(info.tags));
    bindSelect(regionName);
  }

  function showError() {
    box.className = 'weather-box';
    box.innerHTML =
      '<span class="weather-icon">🙈</span>' +
      '<div class="weather-text"><strong>날씨를 불러오지 못했어요</strong><span>인터넷 연결을 확인하거나 다른 지역을 골라 보세요</span></div>' +
      '<div class="weather-actions"><button type="button" class="weather-btn" data-action="retry">다시 시도</button>' + regionSelect() + '</div>';
    box.querySelector('[data-action="retry"]').addEventListener('click', start);
    bindSelect();
  }

  async function loadRegion(name, notice) {
    const region = REGIONS.find((r) => r.name === name) || REGIONS[0];
    updateSettings({ weatherRegion: region.name });
    showLoading();
    try {
      const weather = await fetchWeather(region.lat, region.lon);
      showResult(region.name, weather, region.name, notice);
    } catch (e) {
      showError();
    }
  }

  async function loadCurrent() {
    showLoading();
    try {
      const pos = await getCurrentPosition();
      updateSettings({ weatherRegion: 'current' });
      const weather = await fetchWeather(pos.lat, pos.lon);
      showResult('현재 위치', weather);
    } catch (e) {
      // 위치를 못 쓰면 서울 날씨로 대신 보여줌
      loadRegion('서울', '위치를 확인할 수 없어 서울 날씨를 보여드려요');
    }
  }

  function start() {
    const saved = getSettings().weatherRegion;
    if (saved === 'current') loadCurrent();
    else if (saved) loadRegion(saved);
    else showIdle();
  }

  start();
}
