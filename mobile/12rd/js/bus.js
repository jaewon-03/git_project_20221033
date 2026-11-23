// ===== 경기 버스 도착 정보 =====
// 경기도 버스도착정보 조회 API로 정류소에 곧 도착하는 버스를, 경기도 정류소 조회 API로 정류소 검색·내 주변 정류소를 보여 줍니다.
// API 키는 js/config.js의 BUS_API_KEY에 있습니다. (GitHub에는 올라가지 않는 파일)

// ===== 바뀌지 않는 값 =====
const ARRIVAL_URL = "https://apis.data.go.kr/6410000/busarrivalservice/v2/getBusArrivalListv2"; // 정류소의 버스 도착 목록을 주는 API 주소입니다.
const STATION_URL = "https://apis.data.go.kr/6410000/busstationservice/v2"; // 정류소 검색·주변 정류소를 주는 API 주소입니다.
const REFRESH_SECONDS = 30; // 몇 초마다 자동으로 새로 불러올지 정합니다.
const RING_LENGTH = 100.53; // 새로고침 원의 둘레입니다. (CSS의 stroke-dasharray와 같은 값)
const MAX_RESULTS = 50; // 검색 결과를 최대 몇 개까지 보여 줄지 정합니다.

// 정류소 검색 API를 아직 신청하지 않았을 때 보여 줄 안내입니다.
const STATION_API_GUIDE = '정류소 이름·번호 검색은 공공데이터포털에서 <a href="https://www.data.go.kr/data/15080666/openapi.do" target="_blank" rel="noopener">경기도_정류소 조회</a>를 활용 신청(자동 승인)하면 같은 키로 바로 쓸 수 있어요. 지금은 자주 쓰는 정류소와 9자리 정류소 ID로 찾을 수 있어요.'; // 링크가 들어 있는 안내 문구입니다.

// 자주 쓰는 정류소: 학교(장안대) 앞 정류소 4곳입니다. (정류소 ID는 경기버스정보에서 확인)
const STOPS = [ // 정류소 목록입니다.
  { id: "233000788", name: "장안대학", number: "36113", way: "수원역·사당역 방면" }, // 학교 앞, 수원 쪽으로 가는 정류소입니다.
  { id: "233000833", name: "장안대학", number: "36111", way: "향남·안중 방면" }, // 학교 앞 건너편, 향남 쪽으로 가는 정류소입니다.
  { id: "233002757", name: "장안대후문", number: "55641", way: "수원역·금정역 방면" }, // 후문, 수원역 쪽으로 가는 정류소입니다.
  { id: "233001997", name: "장안대후문", number: "37967", way: "수원대·협성대 방면" } // 후문 건너편, 수원대 쪽으로 가는 정류소입니다.
]; // 정류소 목록을 마칩니다.

// 노선 종류 코드(routeTypeCd)별 이름과 색입니다.
const ROUTE_TYPES = { // 코드 → 정보 표입니다.
  11: { name: "직행좌석", color: "#d92b2f" }, // 빨간 직행좌석 버스입니다.
  12: { name: "좌석", color: "#1565d8" }, // 파란 좌석 버스입니다.
  13: { name: "일반", color: "#178a4c" }, // 초록 일반 버스입니다.
  14: { name: "광역급행", color: "#5b3cc4" }, // 광역급행(M버스)입니다.
  15: { name: "따복", color: "#00838f" }, // 따복 버스입니다.
  16: { name: "경기순환", color: "#d9640b" }, // 경기순환 버스입니다.
  21: { name: "농어촌직행", color: "#d92b2f" }, // 농어촌 직행좌석 버스입니다.
  22: { name: "농어촌좌석", color: "#1565d8" }, // 농어촌 좌석 버스입니다.
  23: { name: "농어촌", color: "#178a4c" }, // 농어촌 일반 버스입니다.
  30: { name: "마을", color: "#a87400" }, // 마을버스입니다.
  41: { name: "고속", color: "#5b6472" }, // 고속버스입니다.
  42: { name: "시외좌석", color: "#5b6472" }, // 시외 좌석 버스입니다.
  43: { name: "시외일반", color: "#5b6472" }, // 시외 일반 버스입니다.
  51: { name: "공항리무진", color: "#5b6472" }, // 공항 리무진입니다.
  52: { name: "공항좌석", color: "#5b6472" }, // 공항 좌석 버스입니다.
  53: { name: "공항일반", color: "#5b6472" } // 공항 일반 버스입니다.
}; // 노선 종류 표를 마칩니다.

const SEAT_TYPES = [11, 12, 14, 16, 21, 22, 41, 42, 51, 52]; // 빈자리 수를 알려 주는 좌석형 노선 코드입니다.

const CROWDED = { // 차내 혼잡도 코드(crowded)별 글자와 색 class입니다.
  1: { text: "여유", level: "good" }, // 1은 여유입니다.
  2: { text: "보통", level: "normal" }, // 2는 보통입니다.
  3: { text: "혼잡", level: "busy" }, // 3은 혼잡입니다.
  4: { text: "매우 혼잡", level: "busy" } // 4는 매우 혼잡입니다.
}; // 혼잡도 표를 마칩니다.

const FLAG_TEXT = { STOP: "운행 종료", WAIT: "회차지 대기" }; // 도착 정보가 없을 때 운행 상태(flag) 글자입니다.

// ===== 화면 요소 찾기 =====
const picker = document.querySelector(".picker"); // 정류소 찾기 카드입니다.
const searchForm = document.querySelector("#searchForm"); // 정류소 검색 폼입니다.
const searchInput = document.querySelector("#searchInput"); // 정류소 검색 입력칸입니다.
const formMessage = document.querySelector("#formMessage"); // 입력 오류 안내 자리입니다.
const nearbyButton = document.querySelector("#nearbyButton"); // 내 주변 정류소 버튼입니다.
const searchArea = document.querySelector("#searchArea"); // 검색 결과 자리입니다.
const searchTitle = document.querySelector("#searchTitle"); // 검색 결과 제목입니다.
const searchNotice = document.querySelector("#searchNotice"); // 검색 안내 문구 자리입니다.
const searchResults = document.querySelector("#searchResults"); // 검색된 정류소 버튼 자리입니다.
const clearSearch = document.querySelector("#clearSearch"); // 검색 결과 닫기 버튼입니다.
const stopList = document.querySelector("#stopList"); // 자주 쓰는 정류소 버튼 자리입니다.
const board = document.querySelector("#board"); // 도착 정보 카드입니다.
const stationName = document.querySelector("#stationName"); // 정류소 이름 제목입니다.
const stationInfo = document.querySelector("#stationInfo"); // 정류소 번호·방면 설명입니다.
const refreshButton = document.querySelector("#refreshButton"); // 새로고침 버튼입니다.
const ringBar = document.querySelector("#ringBar"); // 남은 시간 원 테두리입니다.
const routeFilter = document.querySelector("#routeFilter"); // 노선 번호 찾기 칸 묶음입니다.
const routeInput = document.querySelector("#routeInput"); // 노선 번호 찾기 입력칸입니다.
const summary = document.querySelector("#summary"); // 요약 글자 자리입니다.
const updatedTime = document.querySelector("#updatedTime"); // 갱신 시각 자리입니다.
const statusBox = document.querySelector("#statusBox"); // 불러오는 중·오류 안내 자리입니다.
const busList = document.querySelector("#busList"); // 버스 목록 자리입니다.

// ===== 지금 상태 =====
let currentStation = null; // 지금 보고 있는 정류소입니다. (처음엔 없음)
let searchStops = []; // 지금 화면에 있는 검색 결과 정류소들입니다.
let secondsLeft = REFRESH_SECONDS; // 다음 자동 새로고침까지 남은 초입니다.
let countdownTimer = null; // 1초마다 도는 타이머 번호입니다.
let requestNumber = 0; // 도착 정보 요청 번호입니다. (늦게 온 예전 응답을 무시하는 데 씀)
let searchNumber = 0; // 정류소 검색 요청 번호입니다. (같은 이유)
let loadedAt = 0; // 도착 정보를 마지막으로 받은 시각(밀리초)입니다.
let lastError = ""; // 자동 새로고침이 실패했을 때의 안내 문구입니다. (성공하면 빈 글자)

// ===== 작은 도우미 함수 =====
// API에서 받은 글자를 화면에 넣기 전에 <, > 같은 특수 문자를 바꿔서 안전하게 만듭니다.
function escapeHtml(text) { // text는 바꿀 글자입니다.
  return String(text).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]); // 특수 문자를 HTML 표현으로 바꿔 돌려줍니다.
} // 글자 안전하게 만들기 함수를 마칩니다.

// 빈 글자("")나 없는 값이면 null, 숫자면 숫자로 바꿉니다. (API는 정보가 없으면 빈 글자를 줌)
function toNumber(value) { // value는 API에서 받은 값입니다.
  if (value === "" || value === null || value === undefined) return null; // 값이 없으면 null을 돌려줍니다.
  const number = Number(value); // 숫자로 바꿉니다.
  return Number.isNaN(number) ? null : number; // 숫자가 아니면 null, 맞으면 숫자를 돌려줍니다.
} // 숫자 바꾸기 함수를 마칩니다.

function hasApiKey() { // API 키가 들어 있는지 확인합니다.
  return typeof BUS_API_KEY !== "undefined" && BUS_API_KEY !== ""; // config.js가 있고 키가 비어 있지 않으면 true입니다.
} // 키 확인 함수를 마칩니다.

function formatDistance(meters) { // 거리(m)를 "120m", "1.2km"처럼 바꿉니다.
  return meters < 1000 ? `${Math.round(meters)}m` : `${(meters / 1000).toFixed(1)}km`; // 1km 미만은 m, 이상은 km로 씁니다.
} // 거리 글자 함수를 마칩니다.

function makeError(message, status) { // 화면에 보여 줄 문구와 HTTP 상태 번호를 담은 오류를 만듭니다.
  const error = new Error(message); // 문구를 담은 오류를 만듭니다.
  error.status = status; // 상태 번호(403 등)를 붙입니다.
  return error; // 만든 오류를 돌려줍니다.
} // 오류 만들기 함수를 마칩니다.

function errorText(error) { // 오류를 사람이 읽을 문구로 바꿉니다.
  return error instanceof TypeError ? "인터넷 연결을 확인해 주세요." : error.message; // fetch 자체가 실패(TypeError)면 인터넷 안내, 아니면 만든 문구입니다.
} // 오류 문구 함수를 마칩니다.

// ===== API 요청 공통 함수 =====
// 주소로 요청을 보내고, 정상이면 응답의 response 부분을 돌려줍니다. 문제가 있으면 안내 문구가 담긴 오류를 던집니다.
async function callApi(url) { // url은 인증키까지 붙은 요청 주소입니다.
  const response = await fetch(url); // API에 요청을 보내고 응답을 기다립니다.
  if (response.status === 429) throw makeError("오늘 조회할 수 있는 횟수를 다 썼어요. 내일 다시 시도해 주세요.", 429); // 하루 사용량을 넘기면 안내합니다.
  if (response.status === 401 || response.status === 403) throw makeError("인증키가 올바르지 않거나 이 API의 사용 승인이 나지 않았어요.", 403); // 키가 틀리거나 신청하지 않은 API면 403이 옵니다.
  if (!response.ok) throw makeError(`서버에 연결하지 못했어요. (오류 ${response.status})`, response.status); // 그 밖의 서버 오류입니다.
  const data = await response.json(); // 받은 JSON을 읽습니다.
  if (data.OpenAPI_ServiceResponse) { // 공공데이터포털 공통 오류 모양이면
    const header = data.OpenAPI_ServiceResponse.cmmMsgHeader || {}; // 오류 내용이 들어 있는 부분입니다.
    throw makeError(`인증키를 확인해 주세요. (${header.returnAuthMsg || header.errMsg || "알 수 없는 오류"})`, 403); // 인증 오류로 처리합니다.
  } // 공통 오류 확인을 마칩니다.
  return data.response || {}; // 정상 응답 부분을 돌려줍니다.
} // API 요청 함수를 마칩니다.

// 응답에서 목록(listName)만 꺼내 배열로 돌려줍니다.
function readList(result, listName) { // result는 response 부분, listName은 목록 이름입니다.
  const header = result.msgHeader || {}; // 결과 코드가 들어 있는 부분입니다.
  if (header.resultCode === 4) return []; // 4는 "결과가 존재하지 않습니다"라서 빈 목록입니다.
  if (header.resultCode !== 0) throw makeError(header.resultMessage || "정보를 불러오지 못했어요.", 0); // 0(정상)이 아니면 서버 문구로 알려 줍니다.
  const list = result.msgBody ? result.msgBody[listName] : null; // 목록을 꺼냅니다.
  if (!list) return []; // 목록이 없으면 빈 배열입니다.
  return Array.isArray(list) ? list : [list]; // 1개뿐이면 객체로 올 수 있어서 배열로 맞춥니다.
} // 목록 꺼내기 함수를 마칩니다.

// ===== 정류소 버튼 =====
function makeStopButton(stop) { // stop은 정류소 정보입니다. 버튼 HTML을 돌려줍니다.
  return [ // 버튼 HTML 조각을 배열로 모읍니다.
    `<button type="button" class="stop-button" data-id="${escapeHtml(stop.id)}" aria-pressed="false">`, // 버튼 시작입니다. (data-id에 정류소 ID)
    '<span class="stop-pin" aria-hidden="true">🚏</span>', // 왼쪽 정류소 그림입니다.
    `<span class="stop-text"><span class="stop-name">${escapeHtml(stop.name)}`, // 정류소 이름입니다.
    stop.number ? `<span class="stop-number">${escapeHtml(stop.number)}</span>` : "", // 정류소 번호가 있으면 이름 옆에 붙입니다.
    `</span><span class="stop-way">${escapeHtml(stop.way || "")}</span></span>`, // 방면(또는 지역) 설명입니다.
    stop.distance !== null && stop.distance !== undefined ? `<span class="stop-distance">${formatDistance(stop.distance)}</span>` : "", // 내 주변 검색이면 거리를 오른쪽에 보여 줍니다.
    "</button>" // 버튼 끝입니다.
  ].join(""); // 조각을 이어 붙여 돌려줍니다.
} // 정류소 버튼 함수를 마칩니다.

function renderStops() { // 자주 쓰는 정류소 버튼을 그립니다.
  stopList.innerHTML = STOPS.map(makeStopButton).join(""); // 정류소마다 버튼을 만들어 한 번에 넣습니다.
} // 자주 쓰는 정류소 그리기를 마칩니다.

function markActiveStop() { // 지금 고른 정류소 버튼에만 active 표시를 붙입니다.
  picker.querySelectorAll(".stop-button").forEach((button) => { // 검색 결과와 자주 쓰는 정류소 버튼을 모두 확인합니다.
    const isActive = currentStation !== null && button.dataset.id === currentStation.id; // 지금 정류소 버튼인지 확인합니다.
    button.classList.toggle("active", isActive); // 맞으면 active class를 붙이고, 아니면 뗍니다.
    button.setAttribute("aria-pressed", String(isActive)); // 화면 읽기 프로그램에도 눌림 상태를 알려 줍니다.
  }); // 버튼 확인을 마칩니다.
} // active 표시 함수를 마칩니다.

// API의 정류소 정보를 이 페이지의 정류소 모양으로 바꿉니다.
function toStop(item) { // item은 정류소 조회 API의 정류소 하나입니다.
  const id = String(item.stationId); // 정류소 ID를 글자로 바꿉니다.
  const distance = toNumber(item.distance); // 내 주변 검색이면 거리(m)가 있습니다.
  const preset = STOPS.find((stop) => stop.id === id); // 자주 쓰는 정류소면 방면 정보를 그대로 씁니다.
  if (preset) return { ...preset, distance: distance }; // 자주 쓰는 정류소 정보에 거리만 더해 돌려줍니다.
  const number = String(item.mobileNo ?? "").trim(); // 정류소 번호입니다. (API가 " 03026"처럼 앞에 빈칸을 붙여 줘서 빈칸을 지움)
  return { // 새 정류소 정보를 돌려줍니다.
    id: id, // 정류소 ID입니다.
    name: item.stationName || `정류소 ${id}`, // 정류소 이름입니다.
    number: /^0*$/.test(number) ? "" : number, // 정류소 번호입니다. (번호가 없거나 "00000"인 정류소는 빈 글자)
    way: item.regionName || "", // 방면 대신 지역 이름(예: 화성)을 씁니다.
    distance: distance // 거리입니다. (이름 검색이면 null)
  }; // 정류소 정보를 마칩니다.
} // 정류소 모양 바꾸기 함수를 마칩니다.

// ===== 정류소 고르기 =====
function selectStation(station, fromUser) { // station은 고른 정류소, fromUser는 사용자가 직접 눌렀는지 여부입니다.
  currentStation = station; // 지금 정류소로 기억합니다.
  markActiveStop(); // 버튼 표시를 바꿉니다.
  stationName.textContent = station.name; // 제목에 정류소 이름을 넣습니다.
  const label = station.number ? `정류소 번호 ${station.number}` : `정류소 ID ${station.id}`; // 번호가 있으면 번호, 없으면 ID를 씁니다.
  stationInfo.textContent = station.way ? `${label} · ${station.way}` : label; // 방면(지역)이 있으면 함께 보여 줍니다.
  refreshButton.disabled = false; // 새로고침 버튼을 쓸 수 있게 합니다.
  saveStationToUrl(station); // 주소에 정류소를 남깁니다.
  routeInput.value = ""; // 노선 찾기 칸을 비웁니다.
  routeFilter.hidden = true; // 목록이 오기 전까지 노선 찾기 칸을 숨깁니다.
  busList.innerHTML = ""; // 이전 정류소 목록을 지웁니다.
  summary.textContent = ""; // 이전 요약을 지웁니다.
  updatedTime.textContent = ""; // 이전 갱신 시각을 지웁니다.
  loadedAt = 0; // 받은 시각을 초기화합니다.
  lastError = ""; // 이전 오류를 지웁니다.
  loadArrivals(true); // 도착 정보를 불러옵니다. (true: 불러오는 동안 뼈대 화면을 보여 줌)
  if (fromUser && window.matchMedia("(max-width: 899px)").matches) board.scrollIntoView({ behavior: "smooth", block: "start" }); // 폰에서는 도착 정보 카드로 화면을 내려 줍니다.
} // 정류소 고르기 함수를 마칩니다.

// 주소에 ?station=ID&name=이름…을 남겨서 새로고침·공유해도 같은 정류소가 열리게 합니다.
function saveStationToUrl(station) { // station은 지금 정류소입니다.
  const params = new URLSearchParams({ station: station.id }); // 정류소 ID를 넣습니다.
  if (!STOPS.some((stop) => stop.id === station.id)) { // 자주 쓰는 정류소가 아니면 이름 등도 함께 남깁니다.
    params.set("name", station.name); // 정류소 이름입니다.
    if (station.number) params.set("no", station.number); // 정류소 번호입니다.
    if (station.way) params.set("way", station.way); // 지역 이름입니다.
  } // 추가 정보 넣기를 마칩니다.
  try { history.replaceState(null, "", `?${params}`); } catch (error) { /* 주소를 못 바꾸는 환경이면 그냥 넘어갑니다. */ } // 주소를 바꿉니다. (페이지는 다시 열리지 않음)
} // 주소 저장 함수를 마칩니다.

// ===== 정류소 검색 =====
function showSearchResults(stops, title, noticeHtml) { // stops는 결과 정류소, title은 제목, noticeHtml은 안내 문구(HTML)입니다.
  searchArea.hidden = false; // 결과 자리를 보여 줍니다.
  searchTitle.textContent = stops.length > 0 ? `${title} ${stops.length}곳` : title; // 결과가 있으면 개수를 붙입니다.
  searchNotice.hidden = !noticeHtml; // 안내 문구가 있을 때만 보여 줍니다.
  searchNotice.innerHTML = noticeHtml || ""; // 안내 문구를 넣습니다.
  searchStops = stops.slice(0, MAX_RESULTS); // 최대 50개까지만 기억합니다.
  searchResults.innerHTML = searchStops.map(makeStopButton).join(""); // 결과 정류소 버튼을 그립니다.
  markActiveStop(); // 지금 정류소가 결과에 있으면 표시합니다.
} // 검색 결과 보여 주기를 마칩니다.

function showSearchLoading(title) { // 검색하는 동안 보여 줄 화면입니다.
  searchArea.hidden = false; // 결과 자리를 보여 줍니다.
  searchTitle.textContent = title; // "검색 중…" 제목을 넣습니다.
  searchNotice.hidden = true; // 안내 문구를 숨깁니다.
  searchResults.innerHTML = '<div class="skeleton small"></div>'.repeat(3); // 회색 막대 3개를 보여 줍니다.
} // 검색 중 화면을 마칩니다.

function closeSearch() { // 검색 결과를 닫습니다.
  searchNumber += 1; // 진행 중인 검색 응답은 무시하게 합니다.
  searchArea.hidden = true; // 결과 자리를 숨깁니다.
  searchResults.innerHTML = ""; // 결과 버튼을 지웁니다.
  searchStops = []; // 결과 정류소를 비웁니다.
  nearbyButton.disabled = false; // 내 주변 버튼을 다시 쓸 수 있게 합니다.
} // 검색 닫기를 마칩니다.

// 정류소 이름이나 번호로 검색합니다.
async function searchStations(query) { // query는 검색어입니다.
  const mySearch = ++searchNumber; // 이번 검색 번호입니다.
  const title = `‘${query}’ 검색 결과`; // 결과 제목입니다.
  const localMatches = STOPS.filter((stop) => stop.name.includes(query) || stop.number === query); // 자주 쓰는 정류소 중에 맞는 것을 먼저 찾아 둡니다.
  showSearchLoading(`‘${query}’ 검색 중…`); // 검색 중 화면을 보여 줍니다.
  try { // 오류가 나도 페이지가 멈추지 않게 합니다.
    const result = await callApi(`${STATION_URL}/getBusStationListv2?serviceKey=${encodeURIComponent(BUS_API_KEY)}&keyword=${encodeURIComponent(query)}&format=json`); // 정류소 이름·번호 검색 API에 요청합니다.
    if (mySearch !== searchNumber) return; // 그 사이 다른 검색을 했으면 무시합니다.
    const stops = readList(result, "busStationList").map(toStop); // 결과를 정류소 모양으로 바꿉니다.
    const rank = (stop) => (stop.name === query ? 0 : stop.name.startsWith(query) ? 1 : stop.name.includes(query) ? 2 : 3); // 이름이 똑같으면 0, 검색어로 시작하면 1, 들어 있으면 2, 그 밖(번호로 찾음)은 3입니다.
    stops.sort((a, b) => rank(a) - rank(b)); // 검색어와 가까운 이름부터 보여 줍니다. (같은 순위는 원래 순서 그대로)
    showSearchResults(stops, title, stops.length > 0 ? "" : "검색 결과가 없어요. 정류소 이름을 줄여서(예: ‘수원역’) 다시 검색해 보세요."); // 결과를 보여 줍니다.
  } catch (error) { // 오류가 나면
    if (mySearch !== searchNumber) return; // 예전 검색의 오류면 무시합니다.
    if (error.status === 403) showSearchResults(localMatches, title, STATION_API_GUIDE); // 정류소 API를 아직 신청하지 않았으면 자주 쓰는 정류소 결과와 신청 안내를 보여 줍니다.
    else showSearchResults(localMatches, title, escapeHtml(errorText(error))); // 그 밖의 오류는 문구로 알려 줍니다.
  } // 오류 처리를 마칩니다.
} // 정류소 검색 함수를 마칩니다.

// 내 위치 근처 정류소를 찾습니다.
function findNearbyStations() { // 내 주변 버튼을 누르면 실행합니다.
  const title = "내 주변 정류소"; // 결과 제목입니다.
  if (!navigator.geolocation) { // 위치 기능이 없는 브라우저면
    showSearchResults([], title, "이 브라우저는 위치 기능을 지원하지 않아요."); // 안내하고 끝냅니다.
    return; // 끝냅니다.
  } // 위치 기능 확인을 마칩니다.
  const mySearch = ++searchNumber; // 이번 검색 번호입니다.
  nearbyButton.disabled = true; // 찾는 동안 버튼을 다시 누르지 못하게 합니다.
  showSearchLoading("📍 현재 위치를 확인하는 중…"); // 위치 확인 중 화면을 보여 줍니다.
  navigator.geolocation.getCurrentPosition(async (position) => { // 위치를 받으면
    if (mySearch !== searchNumber) return; // 그 사이 다른 검색을 했으면 무시합니다.
    searchTitle.textContent = "주변 정류소를 찾는 중…"; // 제목을 바꿉니다.
    try { // 오류가 나도 페이지가 멈추지 않게 합니다.
      const { longitude, latitude } = position.coords; // 경도(x)와 위도(y)를 꺼냅니다.
      const result = await callApi(`${STATION_URL}/getBusStationAroundListv2?serviceKey=${encodeURIComponent(BUS_API_KEY)}&x=${longitude}&y=${latitude}&format=json`); // 주변 정류소 API에 요청합니다.
      if (mySearch !== searchNumber) return; // 그 사이 다른 검색을 했으면 무시합니다.
      const stops = readList(result, "busStationAroundList").map(toStop); // 결과를 정류소 모양으로 바꿉니다.
      stops.sort((a, b) => (a.distance ?? 99999) - (b.distance ?? 99999)); // 가까운 정류소부터 줄 세웁니다.
      showSearchResults(stops, title, stops.length > 0 ? "" : "근처에서 경기도 버스 정류소를 찾지 못했어요."); // 결과를 보여 줍니다.
    } catch (error) { // 오류가 나면
      if (mySearch !== searchNumber) return; // 예전 검색의 오류면 무시합니다.
      showSearchResults([], title, error.status === 403 ? STATION_API_GUIDE.replace("정류소 이름·번호 검색은", "내 주변 정류소 찾기는") : escapeHtml(errorText(error))); // 신청 안내나 오류 문구를 보여 줍니다.
    } finally { // 끝나면
      if (mySearch === searchNumber) nearbyButton.disabled = false; // 버튼을 다시 쓸 수 있게 합니다.
    } // 마무리를 마칩니다.
  }, (error) => { // 위치를 받지 못하면
    if (mySearch !== searchNumber) return; // 예전 요청이면 무시합니다.
    nearbyButton.disabled = false; // 버튼을 다시 쓸 수 있게 합니다.
    const messages = { 1: "위치 권한이 꺼져 있어요. 주소창 왼쪽 아이콘에서 위치를 허용해 주세요.", 2: "현재 위치를 찾지 못했어요. 잠시 후 다시 시도해 주세요.", 3: "위치 확인이 너무 오래 걸렸어요. 다시 시도해 주세요." }; // 오류 번호별 안내입니다.
    showSearchResults([], title, messages[error.code] || "현재 위치를 확인하지 못했어요."); // 안내를 보여 줍니다.
  }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }); // 정확한 위치로, 10초까지 기다리고, 1분 안의 위치는 다시 씁니다.
} // 내 주변 정류소 함수를 마칩니다.

// ===== 도착 정보 안내 상자 =====
function showStatus(emoji, message, isError) { // emoji는 그림, message는 문구(HTML), isError는 오류인지 여부입니다.
  statusBox.hidden = false; // 안내 상자를 보여 줍니다.
  statusBox.classList.toggle("error", Boolean(isError)); // 오류면 빨간 글자로 바꿉니다.
  statusBox.innerHTML = `<span class="status-emoji">${emoji}</span><p>${message}</p>`; // 그림과 문구를 넣습니다.
} // 안내 상자 함수를 마칩니다.

function showSkeleton() { // 불러오는 동안 회색 막대(뼈대)를 보여 줍니다.
  statusBox.hidden = true; // 안내 상자는 숨깁니다.
  busList.innerHTML = '<li class="skeleton"></li>'.repeat(5); // 회색 막대 5개를 넣습니다.
} // 뼈대 함수를 마칩니다.

// ===== 도착 정보 불러오기 =====
async function loadArrivals(isFirstLoad) { // isFirstLoad가 true면 뼈대를 보여 주고, false면(자동 새로고침) 지금 목록을 둔 채 바꿉니다.
  if (!currentStation) return; // 고른 정류소가 없으면 아무것도 하지 않습니다.
  if (!hasApiKey()) { // API 키 파일이 없거나 키가 비어 있으면
    busList.innerHTML = ""; // 목록을 비웁니다.
    showStatus("🔑", "API 키가 없어요.<br>js/config.example.js를 복사해 js/config.js로 이름을 바꾸고 인증키를 넣어 주세요.", true); // 키 넣는 방법을 안내합니다.
    return; // 요청하지 않고 끝냅니다.
  } // 키 확인을 마칩니다.

  const myRequest = ++requestNumber; // 이번 요청 번호를 정합니다.
  const stationId = currentStation.id; // 요청하는 정류소 ID입니다.
  stopCountdown(); // 불러오는 동안은 자동 새로고침 시간을 멈춥니다.
  refreshButton.classList.add("loading"); // 새로고침 화살표를 돌립니다.
  if (isFirstLoad) showSkeleton(); // 처음 불러올 때는 뼈대 화면을 보여 줍니다.

  try { // 오류가 나도 페이지가 멈추지 않게 합니다.
    const result = await callApi(`${ARRIVAL_URL}?serviceKey=${encodeURIComponent(BUS_API_KEY)}&stationId=${stationId}&format=json`); // 도착 정보 API에 요청합니다.
    if (myRequest !== requestNumber) return; // 그 사이 다른 정류소를 골랐으면 이 응답은 버립니다.
    loadedAt = Date.now(); // 받은 시각을 기억합니다. (실시간 남은 시간 계산에 씀)
    lastError = ""; // 성공했으니 오류를 지웁니다.
    renderBusList(readList(result, "busArrivalList"), isFirstLoad); // 목록을 화면에 그립니다.
  } catch (error) { // 오류가 나면
    if (myRequest !== requestNumber) return; // 예전 요청의 오류면 무시합니다.
    const message = errorText(error); // 보여 줄 문구입니다.
    if (!isFirstLoad && busList.querySelector(".bus-item")) { // 자동 새로고침이 실패했는데 이전 목록이 있으면
      lastError = message; // 목록은 그대로 두고 실패만 알려 줍니다.
    } else { // 처음 불러오기가 실패했으면
      busList.innerHTML = ""; // 뼈대를 지웁니다.
      summary.textContent = ""; // 요약을 지웁니다.
      routeFilter.hidden = true; // 노선 찾기 칸을 숨깁니다.
      showStatus("⚠️", escapeHtml(message), true); // 오류 안내를 보여 줍니다.
    } // 오류 화면 처리를 마칩니다.
  } finally { // 성공하든 실패하든 마지막에
    if (myRequest === requestNumber) { // 가장 최근 요청일 때만
      refreshButton.classList.remove("loading"); // 화살표 돌리기를 멈춥니다.
      updateLiveTexts(); // 남은 시간과 갱신 시각을 바로 맞춥니다.
      startCountdown(); // 다음 자동 새로고침 시간을 다시 셉니다.
    } // 최근 요청 확인을 마칩니다.
  } // 마무리를 마칩니다.
} // 도착 정보 불러오기 함수를 마칩니다.

// ===== 도착 목록 그리기 =====
function getSeconds(bus) { // 첫 번째 버스가 몇 초 뒤에 오는지 구합니다. (모르면 null)
  const seconds = toNumber(bus.predictTimeSec1); // 초 단위 예상 시간입니다.
  if (seconds !== null) return seconds; // 있으면 그대로 씁니다.
  const minutes = toNumber(bus.predictTime1); // 없으면 분 단위 예상 시간을 봅니다.
  return minutes === null ? null : minutes * 60; // 분을 초로 바꿔 돌려줍니다.
} // 초 구하기 함수를 마칩니다.

function formatArrival(seconds) { // 남은 초를 화면 글자로 바꿉니다.
  if (seconds <= 60) return '<span class="soon-dot" aria-hidden="true"></span>곧 도착'; // 1분 이내면 "곧 도착"입니다.
  const minutes = Math.floor(seconds / 60); // 분입니다.
  if (seconds < 180) return `${minutes}<small>분</small> ${String(seconds % 60).padStart(2, "0")}<small>초</small>`; // 3분 미만은 "2분 05초"처럼 초까지 보여 줍니다.
  return `${minutes}<small>분</small>`; // 그 밖에는 "7분"입니다.
} // 도착 글자 함수를 마칩니다.

function renderBusList(buses, animate) { // buses는 버스 노선 배열, animate는 나타나는 효과를 줄지 여부입니다.
  busList.classList.toggle("animate", animate); // 처음 불러올 때만 줄이 올라오는 효과를 줍니다. (30초마다 깜빡이지 않게)
  if (buses.length === 0) { // 버스가 하나도 없으면
    busList.innerHTML = ""; // 목록을 비웁니다.
    routeFilter.hidden = true; // 노선 찾기 칸을 숨깁니다.
    summary.textContent = "도착 예정 버스 없음"; // 요약에 알려 줍니다.
    showStatus("🌙", "지금 이 정류소에 도착 예정인 버스가 없어요.<br>운행이 끝났거나 정류소 ID가 맞지 않을 수 있어요.", false); // 결과 없음 안내를 보여 줍니다.
    return; // 그리기를 끝냅니다.
  } // 결과 없음 처리를 마칩니다.

  statusBox.hidden = true; // 안내 상자를 숨깁니다.
  routeFilter.hidden = false; // 노선 찾기 칸을 보여 줍니다.
  const coming = buses.filter((bus) => getSeconds(bus) !== null); // 도착 시간을 아는 노선만 고릅니다.
  const waiting = buses.filter((bus) => getSeconds(bus) === null); // 도착 정보가 없는 노선만 고릅니다.
  coming.sort((a, b) => getSeconds(a) - getSeconds(b)); // 빨리 오는 버스부터 줄 세웁니다.
  waiting.sort((a, b) => String(a.routeName).localeCompare(String(b.routeName), "ko", { numeric: true })); // 정보 없는 노선은 번호 순으로 줄 세웁니다.

  const soonCount = coming.filter((bus) => getSeconds(bus) <= 300).length; // 5분 안에 오는 버스 수를 셉니다.
  summary.textContent = `노선 ${buses.length}개 · 5분 안에 ${soonCount}대 도착`; // 요약을 보여 줍니다.

  let html = coming.map((bus, index) => makeBusItem(bus, index)).join(""); // 도착 예정 노선 줄을 만듭니다.
  if (waiting.length > 0) { // 정보 없는 노선이 있으면
    html += `<li class="list-divider">지금 도착 정보가 없는 노선 ${waiting.length}개</li>`; // 구분 제목을 넣고
    html += waiting.map((bus, index) => makeBusItem(bus, coming.length + index)).join(""); // 그 아래에 정보 없는 노선 줄을 붙입니다.
  } // 정보 없는 노선 처리를 마칩니다.
  busList.innerHTML = html; // 만든 목록을 한 번에 화면에 넣습니다.
  applyRouteFilter(); // 노선 찾기 칸에 글자가 있으면 다시 걸러 줍니다.
} // 목록 그리기 함수를 마칩니다.

function makeBusItem(bus, index) { // bus는 노선 하나의 도착 정보, index는 몇 번째 줄인지입니다.
  const type = ROUTE_TYPES[bus.routeTypeCd] || { name: "기타", color: "#5b6472" }; // 노선 종류 이름과 색입니다. (모르는 코드는 기타)
  const seconds = getSeconds(bus); // 첫 번째 버스가 몇 초 뒤 오는지입니다.
  const stopsAway = toNumber(bus.locationNo1); // 첫 번째 버스가 몇 정류장 전에 있는지입니다.
  const itemClass = seconds === null ? "bus-item no-info" : seconds <= 180 ? "bus-item soon" : "bus-item"; // 줄 모양 class입니다. (3분 안이면 강조)
  const routeKey = String(bus.routeName).toLowerCase().replace(/\s/g, ""); // 노선 찾기에 쓸 노선 번호(소문자, 공백 없음)입니다.

  const timeHtml = seconds === null // 도착 시간 부분입니다.
    ? `<span class="arrival-time">${FLAG_TEXT[bus.flag] || "도착 정보 없음"}</span>` // 정보가 없으면 운행 상태 글자를 씁니다.
    : `<span class="arrival-time" data-sec="${seconds}">${formatArrival(seconds)}</span>`; // 있으면 남은 초를 data-sec에 넣어 1초마다 줄여 보여 줍니다.

  const whereHtml = stopsAway !== null ? `<span class="arrival-where"${bus.stationNm1 ? ` title="지금 위치: ${escapeHtml(bus.stationNm1)}"` : ""}>${stopsAway}정류장 전</span>` : ""; // "3정류장 전"(마우스를 올리면 지금 위치)입니다.
  const nextMinutes = toNumber(bus.predictTime2); // 두 번째 버스 도착까지 남은 분입니다.
  const nextStops = toNumber(bus.locationNo2); // 두 번째 버스가 몇 정류장 전인지입니다.
  const nextHtml = nextMinutes !== null ? `<span class="arrival-next">다음 <b>${nextMinutes}분</b>${nextStops !== null ? ` · ${nextStops}정류장 전` : ""}</span>` : ""; // 두 번째 버스 정보입니다.

  return [ // 노선 줄 HTML 조각을 배열로 모읍니다.
    `<li class="${itemClass}" data-route="${escapeHtml(routeKey)}" style="--type-color: ${type.color}; --i: ${Math.min(index, 12)}">`, // 줄 시작입니다. (노선 색과 나타나는 순서를 CSS 변수로 넘김)
    '<div class="route"><div class="route-top">', // 왼쪽 노선 정보 묶음을 엽니다.
    `<span class="route-type">${type.name}</span>`, // 노선 종류 배지(직행좌석·일반 등)입니다.
    `<span class="route-name">${escapeHtml(bus.routeName)}</span></div>`, // 노선 번호입니다.
    `<p class="route-dest">${escapeHtml(bus.routeDestName)} 방면</p>`, // 방면입니다.
    `<div class="tags">${seconds !== null ? makeTags(bus) : ""}</div></div>`, // 빈자리·혼잡도·저상 표시입니다. (도착 정보가 있을 때만)
    `<div class="arrival">${timeHtml}${whereHtml}${nextHtml}</div>`, // 오른쪽 도착 시간·위치·다음 버스입니다.
    "</li>" // 줄 끝입니다.
  ].join(""); // 조각을 이어 붙여 돌려줍니다.
} // 노선 한 줄 만들기 함수를 마칩니다.

function makeTags(bus) { // 빈자리·혼잡도·저상버스 표시(작은 알약)를 만듭니다.
  const tags = []; // 표시를 모을 배열입니다.
  const seats = toNumber(bus.remainSeatCnt1); // 첫 번째 버스의 빈자리 수입니다. (-1은 정보 없음)
  const crowded = CROWDED[bus.crowded1]; // 첫 번째 버스의 혼잡도 정보입니다.
  if (SEAT_TYPES.includes(Number(bus.routeTypeCd)) && seats !== null && seats >= 0) { // 좌석형 버스이고 빈자리 정보가 있으면
    const level = seats === 0 ? "busy" : seats <= 5 ? "normal" : "good"; // 0석은 빨강, 5석 이하는 노랑, 그 이상은 초록입니다.
    tags.push(`<span class="tag ${level}">${seats === 0 ? "만석" : `빈자리 ${seats}석`}</span>`); // 빈자리 표시를 넣습니다.
  } else if (crowded) { // 좌석형이 아니고 혼잡도 정보가 있으면
    tags.push(`<span class="tag ${crowded.level}">${crowded.text}</span>`); // 혼잡도 표시를 넣습니다.
  } // 빈자리·혼잡도 처리를 마칩니다.
  if (Number(bus.lowPlate1) === 1) tags.push('<span class="tag">♿ 저상</span>'); // 저상버스면 표시합니다.
  if (Number(bus.lowPlate1) === 2) tags.push('<span class="tag">2층</span>'); // 2층 버스면 표시합니다.
  return tags.join(""); // 표시들을 이어서 돌려줍니다.
} // 표시 만들기 함수를 마칩니다.

// ===== 노선 번호 찾기 =====
function applyRouteFilter() { // 노선 찾기 칸에 쓴 번호가 들어간 노선만 보여 줍니다.
  const text = routeInput.value.toLowerCase().replace(/\s/g, ""); // 입력한 글자(소문자, 공백 없음)입니다.
  let shownCount = 0; // 보이는 노선 수입니다.
  let shownWaiting = 0; // 보이는 "정보 없는" 노선 수입니다.
  busList.querySelectorAll(".bus-item").forEach((item) => { // 노선 줄을 하나씩 확인합니다.
    const isMatch = text === "" || item.dataset.route.includes(text); // 글자가 없거나 번호에 들어 있으면 보여 줍니다.
    item.hidden = !isMatch; // 맞지 않으면 숨깁니다.
    if (isMatch) shownCount += 1; // 보이는 수를 셉니다.
    if (isMatch && item.classList.contains("no-info")) shownWaiting += 1; // 보이는 "정보 없는" 노선 수를 셉니다.
  }); // 노선 확인을 마칩니다.
  const divider = busList.querySelector(".list-divider"); // "정보 없는 노선" 구분 제목입니다.
  if (divider) divider.hidden = shownWaiting === 0; // 아래에 보이는 노선이 없으면 구분 제목도 숨깁니다.
  const oldEmpty = busList.querySelector(".filter-empty"); // 이전 "없어요" 안내입니다.
  if (oldEmpty) oldEmpty.remove(); // 있으면 지웁니다.
  if (text !== "" && shownCount === 0) busList.insertAdjacentHTML("beforeend", `<li class="filter-empty">‘${escapeHtml(routeInput.value.trim())}’ 노선은 이 정류소에 오지 않아요.</li>`); // 맞는 노선이 없으면 안내합니다.
} // 노선 찾기 함수를 마칩니다.

// ===== 1초마다 바뀌는 글자 (남은 시간, 갱신 시각) =====
function updateLiveTexts() { // 1초마다 실행해서 남은 시간을 줄이고 "몇 초 전 갱신"을 바꿉니다.
  if (!loadedAt) return; // 아직 받은 정보가 없으면 할 일이 없습니다.
  const elapsed = Math.floor((Date.now() - loadedAt) / 1000); // 정보를 받은 뒤 지난 초입니다.
  busList.querySelectorAll("[data-sec]").forEach((timeBox) => { // 남은 시간이 있는 칸을 하나씩 봅니다.
    const left = Math.max(0, Number(timeBox.dataset.sec) - elapsed); // 지금 남은 초입니다. (0보다 작아지지 않게)
    const html = formatArrival(left); // 보여 줄 글자입니다.
    if (timeBox.dataset.shown !== html) { // 글자가 바뀔 때만 (깜빡이는 점이 계속 처음부터 시작하지 않게)
      timeBox.innerHTML = html; // 글자를 바꿉니다.
      timeBox.dataset.shown = html; // 지금 글자를 기억합니다.
    } // 글자 바꾸기를 마칩니다.
    timeBox.closest(".bus-item").classList.toggle("soon", left <= 180); // 3분 안으로 들어오면 강조합니다.
  }); // 남은 시간 칸 확인을 마칩니다.
  if (lastError) { // 자동 새로고침이 실패한 상태면
    updatedTime.textContent = `⚠️ 새로고침 실패 · ${lastError}`; // 실패를 알려 줍니다.
    return; // 끝냅니다.
  } // 실패 표시를 마칩니다.
  const agoText = elapsed < 5 ? "방금 갱신" : elapsed < 60 ? `${elapsed}초 전 갱신` : `${Math.floor(elapsed / 60)}분 전 갱신`; // "방금 / 12초 전 / 2분 전 갱신"입니다.
  updatedTime.innerHTML = `<span class="live-dot" aria-hidden="true"></span>${agoText}`; // 초록 점과 함께 보여 줍니다.
  updatedTime.title = `${new Date(loadedAt).toLocaleTimeString("ko-KR")} 기준`; // 마우스를 올리면 정확한 시각을 보여 줍니다.
} // 1초 글자 함수를 마칩니다.

// ===== 자동 새로고침(30초) =====
function startCountdown() { // 다음 새로고침까지 시간을 다시 셉니다.
  stopCountdown(); // 이미 돌던 타이머는 멈춥니다.
  secondsLeft = REFRESH_SECONDS; // 남은 시간을 30초로 되돌립니다.
  drawRing(); // 원을 꽉 찬 모양으로 그립니다.
  countdownTimer = setInterval(tick, 1000); // 1초마다 tick을 실행합니다.
} // 시간 세기 시작 함수를 마칩니다.

function stopCountdown() { // 시간 세기를 멈춥니다.
  clearInterval(countdownTimer); // 타이머를 멈춥니다.
  countdownTimer = null; // 타이머 번호를 비웁니다.
} // 멈추기 함수를 마칩니다.

function tick() { // 1초마다 실행됩니다.
  if (document.hidden) return; // 다른 탭을 보고 있으면 시간을 세지 않습니다. (API 사용량 아끼기)
  secondsLeft -= 1; // 남은 시간을 1초 줄입니다.
  drawRing(); // 원을 다시 그립니다.
  updateLiveTexts(); // 남은 시간과 갱신 시각을 바꿉니다.
  if (secondsLeft <= 0) loadArrivals(false); // 0초가 되면 목록을 그대로 둔 채 새로 불러옵니다.
} // 1초 함수를 마칩니다.

function drawRing() { // 남은 시간만큼 원 테두리를 그립니다.
  const used = (REFRESH_SECONDS - secondsLeft) / REFRESH_SECONDS; // 지나간 시간 비율(0~1)입니다.
  ringBar.style.strokeDashoffset = String(RING_LENGTH * used); // 지나간 만큼 테두리를 지웁니다.
  refreshButton.title = `${secondsLeft}초 뒤 자동 새로고침 · 누르면 지금 새로고침`; // 마우스를 올리면 남은 시간을 알려 줍니다.
} // 원 그리기 함수를 마칩니다.

// ===== 이벤트 연결 =====
picker.addEventListener("click", (event) => { // 정류소 찾기 카드 안을 누르면
  const button = event.target.closest(".stop-button"); // 누른 곳에서 가장 가까운 정류소 버튼을 찾습니다.
  if (!button) return; // 정류소 버튼이 아니면 무시합니다.
  const stop = searchStops.find((item) => item.id === button.dataset.id) || STOPS.find((item) => item.id === button.dataset.id); // 검색 결과나 자주 쓰는 정류소에서 정보를 찾습니다.
  if (stop) selectStation(stop, true); // 그 정류소를 고릅니다.
}); // 정류소 버튼 이벤트를 마칩니다.

searchForm.addEventListener("submit", (event) => { // 검색어를 넣고 검색을 누르면
  event.preventDefault(); // 페이지가 새로 열리지 않게 막습니다.
  const query = searchInput.value.trim(); // 입력한 글자의 앞뒤 공백을 지웁니다.
  if (query.length < 2 && !/^\d+$/.test(query)) { // 글자가 너무 짧으면 (숫자는 예외)
    formMessage.textContent = query ? "정류소 이름을 2글자 이상 입력해 주세요." : "정류소 이름이나 번호를 입력해 주세요."; // 안내합니다.
    searchInput.focus(); // 다시 입력하기 쉽게 입력칸으로 갑니다.
    return; // 검색하지 않습니다.
  } // 입력 확인을 마칩니다.
  formMessage.textContent = ""; // 안내 문구를 지웁니다.
  searchInput.blur(); // 폰 키보드를 내립니다.
  if (/^\d{9}$/.test(query)) { // 숫자 9자리면 정류소 ID로 바로 엽니다.
    closeSearch(); // 검색 결과는 닫습니다.
    selectStation(STOPS.find((stop) => stop.id === query) || { id: query, name: `정류소 ${query}`, number: "", way: "" }, true); // 그 정류소를 엽니다.
    return; // 끝냅니다.
  } // 정류소 ID 처리를 마칩니다.
  if (!hasApiKey()) { // 키가 없으면
    showSearchResults(STOPS.filter((stop) => stop.name.includes(query) || stop.number === query), `‘${query}’ 검색 결과`, "API 키가 없어서 자주 쓰는 정류소에서만 찾았어요."); // 자주 쓰는 정류소에서만 찾습니다.
    return; // 끝냅니다.
  } // 키 확인을 마칩니다.
  searchStations(query); // 이름·번호로 검색합니다.
}); // 검색 폼 이벤트를 마칩니다.

searchInput.addEventListener("input", () => { formMessage.textContent = ""; }); // 다시 쓰기 시작하면 안내 문구를 지웁니다.
nearbyButton.addEventListener("click", findNearbyStations); // 내 주변 버튼을 누르면 주변 정류소를 찾습니다.
clearSearch.addEventListener("click", closeSearch); // 닫기를 누르면 검색 결과를 닫습니다.
routeInput.addEventListener("input", applyRouteFilter); // 노선 번호를 쓸 때마다 목록을 걸러 줍니다.
refreshButton.addEventListener("click", () => loadArrivals(false)); // 새로고침 버튼을 누르면 바로 다시 불러옵니다.

document.addEventListener("visibilitychange", () => { // 다른 탭에 갔다가 돌아오면
  if (!document.hidden && currentStation && countdownTimer && Date.now() - loadedAt > REFRESH_SECONDS * 1000) loadArrivals(false); // 30초 넘게 지난 정보면 바로 새로 불러옵니다.
}); // 탭 이동 이벤트를 마칩니다.

// ===== 처음 시작 =====
renderStops(); // 자주 쓰는 정류소 버튼을 그립니다.
const startParams = new URLSearchParams(location.search); // 주소의 ?station=… 부분을 읽습니다.
const startId = startParams.get("station"); // 주소에 있는 정류소 ID입니다.
if (startId && /^\d{9}$/.test(startId)) { // 올바른 정류소 ID가 있으면
  const preset = STOPS.find((stop) => stop.id === startId); // 자주 쓰는 정류소인지 봅니다.
  selectStation(preset || { id: startId, name: startParams.get("name") || `정류소 ${startId}`, number: startParams.get("no") || "", way: startParams.get("way") || "" }, false); // 그 정류소를 바로 엽니다.
} else { // 주소에 정류소가 없으면
  selectStation(STOPS[0], false); // 첫 번째 정류소(장안대학, 수원 방면)를 바로 보여 줍니다.
} // 처음 시작을 마칩니다.
