// 별빛시네마 기능: 바닐라 자바스크립트만 사용합니다. (외부 라이브러리 없음, 저장 기능 없음)
// ----- 영화 자료 (모두 실습용으로 지어낸 영화입니다) -----
const movies = [ // 영화 한 편마다 이름, 장르, 등급, 색 등을 적어 둔 목록입니다.
  { id: 1, title: "별을 삼킨 소년", genre: "판타지", age: "12", runtime: 118, bookingRate: 32.4, score: 9.1, icon: "🌠", color1: "#4b3a9a", color2: "#111a3d", status: "now", summary: "떨어진 별을 삼킨 소년이 밤하늘을 되찾기 위해 떠나는 모험." }, // 현재 상영작 1입니다.
  { id: 2, title: "한강 대작전", genre: "액션", age: "15", runtime: 126, bookingRate: 24.8, score: 8.6, icon: "🚤", color1: "#c0392b", color2: "#2c0e12", status: "now", summary: "한강 다리 위, 멈춘 열차 안에서 벌어지는 2시간의 추격전." }, // 현재 상영작 2입니다.
  { id: 3, title: "고양이 탐정 냥냥", genre: "애니메이션", age: "ALL", runtime: 95, bookingRate: 15.2, score: 9.4, icon: "🐈", color1: "#f39c12", color2: "#6b3a07", status: "now", summary: "사라진 생선 가게 열쇠를 찾아 나선 고양이 탐정의 첫 사건." }, // 현재 상영작 3입니다.
  { id: 4, title: "마지막 열차 07:40", genre: "스릴러", age: "19", runtime: 112, bookingRate: 11.7, score: 8.2, icon: "🚆", color1: "#2d3436", color2: "#0a0a0a", status: "now", summary: "매일 같은 시각, 같은 승객. 오늘은 한 명이 모자란다." }, // 현재 상영작 4입니다.
  { id: 5, title: "여름의 끝에서", genre: "로맨스", age: "12", runtime: 108, bookingRate: 8.9, score: 8.8, icon: "🌻", color1: "#00a8a8", color2: "#063b3b", status: "now", summary: "바닷가 마을에서 보낸 마지막 여름, 그리고 남겨진 편지 한 장." }, // 현재 상영작 5입니다.
  { id: 6, title: "서울 2099", genre: "SF", age: "15", runtime: 131, openDate: "12.03", icon: "🤖", color1: "#0984e3", color2: "#0b1b3a", status: "soon", summary: "로봇이 시장이 된 미래 서울, 단 한 명의 인간 공무원." }, // 상영 예정작 1입니다.
  { id: 7, title: "심해의 노래", genre: "다큐멘터리", age: "ALL", runtime: 88, openDate: "12.10", icon: "🐋", color1: "#1e6f8f", color2: "#04202b", status: "soon", summary: "바다 4,000m 아래에서 들려온 고래의 노래를 따라가다." }, // 상영 예정작 2입니다.
  { id: 8, title: "용의 계곡", genre: "어드벤처", age: "12", runtime: 124, openDate: "12.17", icon: "🐉", color1: "#27ae60", color2: "#0c2b17", status: "soon", summary: "전설 속 계곡에 들어간 세 친구의 겨울 방학." }, // 상영 예정작 3입니다.
  { id: 9, title: "웃음 배달부", genre: "코미디", age: "ALL", runtime: 101, openDate: "12.24", icon: "📦", color1: "#e84393", color2: "#3d0b24", status: "soon", summary: "크리스마스 이브, 택배 대신 웃음을 배달하게 된 신입 기사." }, // 상영 예정작 4입니다.
  { id: 10, title: "레드 라인", genre: "범죄", age: "19", runtime: 119, openDate: "12.31", icon: "🔴", color1: "#8e1b1b", color2: "#1a0606", status: "soon", summary: "넘으면 안 되는 선, 그 선 위에 선 두 형사." } // 상영 예정작 5입니다.
]; // 영화 목록을 마칩니다.
const SHOW_TIMES = ["10:30", "13:00", "15:40", "18:20", "21:00"]; // 하루 상영 시간 목록입니다.
const SEAT_ROWS = ["A", "B", "C", "D", "E", "F", "G", "H"]; // 좌석 줄 이름(8줄)입니다.
const SEATS_PER_ROW = 10; // 한 줄의 좌석 수입니다.
const TICKET_PRICE = 14000; // 영화표 한 장 가격(원)입니다.
const MAX_SEATS = 8; // 한 번에 고를 수 있는 최대 좌석 수입니다.
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"]; // 요일 이름입니다. (getDay() 번호 0~6 순서)

// ----- 화면 요소 -----
const menuButton = document.getElementById("menuButton"); // 햄버거 메뉴 버튼을 가져옵니다.
const mainMenu = document.getElementById("mainMenu"); // 메뉴 목록을 가져옵니다.
const heroSlides = document.getElementById("heroSlides"); // 배너 슬라이드를 넣을 곳을 가져옵니다.
const heroDots = document.getElementById("heroDots"); // 배너 점을 넣을 곳을 가져옵니다.
const movieList = document.getElementById("movieList"); // 영화 카드를 넣을 곳을 가져옵니다.
const tabButtons = document.querySelectorAll(".tab"); // 현재 상영작 / 상영 예정작 탭 버튼들을 가져옵니다.
const movieSelect = document.getElementById("movieSelect"); // 예매할 영화 선택 목록을 가져옵니다.
const dateList = document.getElementById("dateList"); // 날짜 버튼을 넣을 곳을 가져옵니다.
const timeList = document.getElementById("timeList"); // 시간 버튼을 넣을 곳을 가져옵니다.
const seatMap = document.getElementById("seatMap"); // 좌석 버튼을 넣을 곳을 가져옵니다.
const summaryText = document.getElementById("summaryText"); // 고른 내용을 보여 줄 글을 가져옵니다.
const totalPrice = document.getElementById("totalPrice"); // 총 금액을 보여 줄 곳을 가져옵니다.
const bookButton = document.getElementById("bookButton"); // 예매하기 버튼을 가져옵니다.
const toast = document.getElementById("toast"); // 알림 상자를 가져옵니다.

// ----- 예매 상태 -----
let selectedDate = null; // 고른 날짜(Date)입니다. 아직 안 골랐으면 null입니다.
let selectedTime = null; // 고른 상영 시간("13:00" 같은 글자)입니다.
let selectedSeats = []; // 고른 좌석 이름 목록입니다. (예: ["E5", "E6"])
const bookedSeats = {}; // 이번 방문에서 예매를 끝낸 좌석을 '영화|날짜|시간' 별로 모아 둡니다. (새로고침하면 사라집니다)
let currentSlide = 0; // 지금 보이는 배너 번호입니다.
let slideTimer = null; // 배너 자동 넘김 타이머입니다.

// 관람 등급 표시: 등급 글자로 색이 들어간 작은 표시(HTML)를 만듭니다.
function makeAgeBadge(age) { // age는 "ALL", "12", "15", "19" 중 하나입니다.
  const className = age === "ALL" ? "age-all" : `age-${age}`; // 등급에 맞는 색 class 이름을 정합니다.
  return `<span class="badge ${className}">${age}</span>`; // 등급 표시 HTML을 돌려줍니다.
} // 등급 표시 함수를 마칩니다.

// 메뉴 열고 닫기: 태블릿·폰에서 햄버거 버튼을 누르면 메뉴 판을 펼치거나 접습니다.
function toggleMenu() { // 버튼을 누를 때마다 실행됩니다.
  const isOpen = mainMenu.classList.toggle("open"); // open class를 붙였다 뗐다 하고, 지금 열렸는지 받아 둡니다.
  menuButton.textContent = isOpen ? "✕" : "☰"; // 열렸으면 닫기(✕), 닫혔으면 햄버거(☰) 모양으로 바꿉니다.
  menuButton.setAttribute("aria-expanded", String(isOpen)); // 스크린 리더에 메뉴가 열렸는지 알려 줍니다.
  menuButton.setAttribute("aria-label", isOpen ? "메뉴 닫기" : "메뉴 열기"); // 버튼 설명도 상태에 맞게 바꿉니다.
} // 메뉴 열고 닫기 함수를 마칩니다.

// 메뉴 닫기: 메뉴에서 항목을 누르면 판을 접습니다.
function closeMenu() { // 메뉴 링크를 누를 때 실행됩니다.
  if (mainMenu.classList.contains("open")) toggleMenu(); // 열려 있을 때만 닫습니다.
} // 메뉴 닫기 함수를 마칩니다.

// 배너 만들기: 예매율 상위 3편의 현재 상영작으로 배너 슬라이드와 점을 만듭니다.
function renderHero() { // 페이지가 열릴 때 한 번 실행합니다.
  const heroMovies = movies.filter((movie) => movie.status === "now").slice(0, 3); // 현재 상영작 중 앞의 3편을 고릅니다.
  heroMovies.forEach((movie, index) => { // 3편을 하나씩 배너로 만듭니다.
    const slide = document.createElement("div"); // 배너 한 장을 만듭니다.
    slide.className = "hero-slide"; // 배너 모양 class를 붙입니다.
    slide.style.setProperty("--color1", movie.color1); // 영화의 첫 번째 색을 CSS 변수로 넘깁니다.
    slide.style.setProperty("--color2", movie.color2); // 영화의 두 번째 색을 CSS 변수로 넘깁니다.
    slide.innerHTML = `<div class="hero-text">${makeAgeBadge(movie.age)}<h2>${movie.title}</h2><p>${movie.summary}</p><button class="primary-button" type="button" data-movie-id="${movie.id}">예매하기</button></div>`; // 등급, 제목, 소개, 예매 버튼을 넣습니다.
    heroSlides.append(slide); // 배너를 화면에 붙입니다.
    const dot = document.createElement("button"); // 배너 점 버튼을 만듭니다.
    dot.className = "hero-dot"; // 점 모양 class를 붙입니다.
    dot.type = "button"; // 일반 버튼으로 만듭니다.
    dot.setAttribute("aria-label", `${index + 1}번째 배너 보기`); // 스크린 리더용 설명을 붙입니다.
    dot.addEventListener("click", () => { showSlide(index); restartAutoSlide(); }); // 점을 누르면 그 배너로 가고 자동 넘김을 다시 시작합니다.
    heroDots.append(dot); // 점을 화면에 붙입니다.
  }); // 배너 만들기를 마칩니다.
  showSlide(0); // 첫 번째 배너를 보여 줍니다.
} // 배너 만들기 함수를 마칩니다.

// 배너 보여 주기: index 번째 배너와 점만 active로 표시합니다.
function showSlide(index) { // index는 보여 줄 배너 번호입니다.
  const slides = heroSlides.querySelectorAll(".hero-slide"); // 배너 목록을 가져옵니다.
  const dots = heroDots.querySelectorAll(".hero-dot"); // 점 목록을 가져옵니다.
  currentSlide = (index + slides.length) % slides.length; // 끝에서 다음은 처음으로, 처음에서 이전은 끝으로 돌아가게 번호를 맞춥니다.
  slides.forEach((slide, slideIndex) => slide.classList.toggle("active", slideIndex === currentSlide)); // 지금 번호 배너만 보이게 합니다.
  dots.forEach((dot, dotIndex) => dot.classList.toggle("active", dotIndex === currentSlide)); // 지금 번호 점만 강조합니다.
} // 배너 보여 주기 함수를 마칩니다.

// 배너 자동 넘김: 5초마다 다음 배너로 넘깁니다. 버튼을 누르면 시간을 처음부터 다시 셉니다.
function restartAutoSlide() { // 처음 열 때와 배너를 직접 넘길 때 실행합니다.
  clearInterval(slideTimer); // 이전 타이머를 멈춥니다.
  slideTimer = setInterval(() => showSlide(currentSlide + 1), 5000); // 5초(5000ms)마다 다음 배너를 보여 줍니다.
} // 자동 넘김 함수를 마칩니다.

// 영화 목록 그리기: 고른 탭(현재 상영작 now / 상영 예정작 soon)의 영화를 카드로 보여 줍니다.
function renderMovies(status) { // status는 "now" 또는 "soon"입니다.
  const shownMovies = movies.filter((movie) => movie.status === status); // 탭에 맞는 영화만 고릅니다.
  movieList.innerHTML = shownMovies.map((movie, index) => { // 영화마다 카드 HTML을 만들어 이어 붙입니다.
    const infoText = status === "now" ? `예매율 ${movie.bookingRate}% · ★ ${movie.score}` : `${movie.openDate} 개봉 예정`; // 상영작은 예매율·평점, 예정작은 개봉일을 보여 줍니다.
    const buttonText = status === "now" ? "예매하기" : "개봉 알림"; // 상영작은 예매, 예정작은 알림 버튼으로 씁니다.
    return `<article class="movie-card"> <!-- 영화 카드 하나를 시작합니다. -->
      <div class="poster" style="--color1:${movie.color1}; --color2:${movie.color2}"> <!-- 영화 색 두 가지로 포스터를 칠합니다. -->
        <span class="rank">${index + 1}</span><span class="poster-icon" aria-hidden="true">${movie.icon}</span><span class="poster-title">${movie.title}</span> <!-- 순위, 그림 아이콘, 제목을 포스터 위에 놓습니다. -->
      </div> <!-- 포스터를 마칩니다. -->
      <p class="movie-name">${makeAgeBadge(movie.age)}${movie.title}</p> <!-- 관람 등급과 영화 이름입니다. -->
      <p class="movie-info">${movie.genre} · ${movie.runtime}분</p> <!-- 장르와 상영 시간입니다. -->
      <p class="movie-info">${infoText}</p> <!-- 예매율·평점 또는 개봉 예정일입니다. -->
      <button class="card-button" type="button" data-movie-id="${movie.id}" data-status="${status}">${buttonText}</button> <!-- 예매하기 또는 개봉 알림 버튼입니다. -->
    </article>`; // 영화 카드를 마치고 HTML 글자로 돌려줍니다.
  }).join(""); // 카드 HTML들을 하나로 합쳐 화면에 넣습니다.
} // 영화 목록 그리기 함수를 마칩니다.

// 탭 바꾸기: 누른 탭을 강조하고 그 탭의 영화 목록을 보여 줍니다.
function changeTab(event) { // event는 탭 클릭 정보입니다.
  const clickedTab = event.currentTarget; // 누른 탭 버튼입니다.
  tabButtons.forEach((tab) => { // 모든 탭을 하나씩 확인합니다.
    const isActive = tab === clickedTab; // 누른 탭인지 확인합니다.
    tab.classList.toggle("active", isActive); // 누른 탭만 강조합니다.
    tab.setAttribute("aria-selected", String(isActive)); // 스크린 리더에 고른 탭을 알려 줍니다.
  }); // 탭 확인을 마칩니다.
  renderMovies(clickedTab.dataset.status); // 누른 탭의 영화 목록을 그립니다.
} // 탭 바꾸기 함수를 마칩니다.

// 예매 버튼 처리: 배너나 카드의 '예매하기'를 누르면 그 영화를 골라 둔 채 예매 영역으로 내려갑니다.
function handleBookingShortcut(event) { // event는 클릭 정보입니다.
  const button = event.target.closest("[data-movie-id]"); // 누른 곳에서 영화 번호가 있는 버튼을 찾습니다.
  if (button === null) return; // 버튼이 아니면 아무것도 하지 않습니다.
  if (button.dataset.status === "soon") { // 상영 예정작의 '개봉 알림' 버튼이면
    showToast("개봉하면 알려 드릴게요! 🔔"); // 알림 신청 안내를 띄웁니다.
    return; // 예매 영역으로는 가지 않습니다.
  } // 예정작 처리를 마칩니다.
  movieSelect.value = button.dataset.movieId; // 예매 영화 목록에서 그 영화를 고릅니다.
  resetSeats(); // 영화가 바뀌었으니 좌석을 새로 그립니다.
  document.getElementById("booking").scrollIntoView(); // 예매 영역으로 화면을 옮깁니다.
} // 예매 버튼 처리 함수를 마칩니다.

// 영화 선택 목록 만들기: 현재 상영작만 예매 목록에 넣습니다.
function renderMovieOptions() { // 페이지가 열릴 때 한 번 실행합니다.
  const nowMovies = movies.filter((movie) => movie.status === "now"); // 현재 상영작만 고릅니다.
  movieSelect.innerHTML = nowMovies.map((movie) => `<option value="${movie.id}">[${movie.age}] ${movie.title}</option>`).join(""); // 영화마다 선택 항목을 만듭니다.
} // 영화 선택 목록 함수를 마칩니다.

// 날짜 버튼 만들기: 오늘부터 7일 동안의 날짜 버튼을 만듭니다.
function renderDates() { // 페이지가 열릴 때 한 번 실행합니다.
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) { // 오늘(0)부터 6일 뒤까지 반복합니다.
    const date = new Date(); // 오늘 날짜를 만듭니다.
    date.setDate(date.getDate() + dayOffset); // dayOffset일 뒤 날짜로 바꿉니다.
    const button = document.createElement("button"); // 날짜 버튼을 만듭니다.
    button.type = "button"; // 일반 버튼으로 만듭니다.
    button.className = "choice"; // 선택 버튼 모양 class를 붙입니다.
    if (date.getDay() === 0) button.classList.add("sunday"); // 일요일이면 빨간 글자 class를 붙입니다.
    if (date.getDay() === 6) button.classList.add("saturday"); // 토요일이면 파란 글자 class를 붙입니다.
    const dayName = dayOffset === 0 ? "오늘" : WEEKDAYS[date.getDay()]; // 첫날은 '오늘', 나머지는 요일 이름을 씁니다.
    button.textContent = `${date.getMonth() + 1}.${date.getDate()} ${dayName}`; // 예: "11.16 오늘" (월은 0부터 세므로 1을 더합니다)
    button.addEventListener("click", () => selectDate(date, button)); // 누르면 이 날짜를 고릅니다.
    dateList.append(button); // 날짜 버튼을 화면에 붙입니다.
  } // 날짜 반복을 마칩니다.
} // 날짜 버튼 함수를 마칩니다.

// 날짜 고르기: 누른 날짜를 강조하고, 그 날짜의 시간 버튼을 다시 그립니다.
function selectDate(date, clickedButton) { // date는 고른 날짜, clickedButton은 누른 버튼입니다.
  selectedDate = date; // 고른 날짜를 기억합니다.
  selectedTime = null; // 날짜가 바뀌면 시간은 다시 고르게 합니다.
  dateList.querySelectorAll(".choice").forEach((button) => button.classList.toggle("selected", button === clickedButton)); // 누른 날짜 버튼만 강조합니다.
  renderTimes(); // 시간 버튼을 다시 그립니다.
  resetSeats(); // 좌석도 새로 그립니다.
} // 날짜 고르기 함수를 마칩니다.

// 시간 버튼 만들기: 상영 시간 버튼을 만들고, 오늘 이미 지난 시간은 누를 수 없게 합니다.
function renderTimes() { // 날짜를 고를 때마다 실행합니다.
  timeList.innerHTML = ""; // 이전 시간 버튼을 지웁니다.
  if (selectedDate === null) { // 아직 날짜를 안 골랐으면
    timeList.innerHTML = `<p class="movie-info">날짜를 먼저 골라 주세요.</p>`; // 안내 글을 보여 줍니다.
    return; // 시간 버튼은 만들지 않습니다.
  } // 날짜 확인을 마칩니다.
  const now = new Date(); // 지금 시각입니다.
  const isToday = selectedDate.toDateString() === now.toDateString(); // 고른 날짜가 오늘인지 확인합니다.
  SHOW_TIMES.forEach((time) => { // 상영 시간을 하나씩 버튼으로 만듭니다.
    const [hour, minute] = time.split(":").map(Number); // "13:00"을 시(13)와 분(0) 숫자로 나눕니다.
    const button = document.createElement("button"); // 시간 버튼을 만듭니다.
    button.type = "button"; // 일반 버튼으로 만듭니다.
    button.className = "choice"; // 선택 버튼 모양 class를 붙입니다.
    button.textContent = time; // 버튼에 시간을 씁니다.
    button.disabled = isToday && (hour < now.getHours() || (hour === now.getHours() && minute <= now.getMinutes())); // 오늘 이미 시작한 시간은 누를 수 없게 합니다.
    button.addEventListener("click", () => selectTime(time, button)); // 누르면 이 시간을 고릅니다.
    timeList.append(button); // 시간 버튼을 화면에 붙입니다.
  }); // 시간 버튼 만들기를 마칩니다.
} // 시간 버튼 함수를 마칩니다.

// 시간 고르기: 누른 시간을 강조하고 좌석을 새로 그립니다.
function selectTime(time, clickedButton) { // time은 고른 시간, clickedButton은 누른 버튼입니다.
  selectedTime = time; // 고른 시간을 기억합니다.
  timeList.querySelectorAll(".choice").forEach((button) => button.classList.toggle("selected", button === clickedButton)); // 누른 시간 버튼만 강조합니다.
  resetSeats(); // 좌석을 새로 그립니다.
} // 시간 고르기 함수를 마칩니다.

// 상영 이름표: 영화·날짜·시간을 합쳐 '1|11.16|13:00' 같은 이름을 만듭니다. (예매된 좌석을 구분할 때 씁니다)
function getShowKey() { // 지금 고른 상영의 이름표를 돌려줍니다.
  return `${movieSelect.value}|${selectedDate ? selectedDate.toDateString() : ""}|${selectedTime}`; // 세 값을 | 로 이어 붙입니다.
} // 상영 이름표 함수를 마칩니다.

// 이미 팔린 좌석인지 확인: 정해진 계산식으로 몇 자리를 '예매 완료'로 만들고, 이번에 예매한 좌석도 포함합니다.
function isSeatTaken(seatName, rowIndex, seatNumber) { // 좌석 이름, 줄 번호, 좌석 번호를 받습니다.
  const showNumber = Number(movieSelect.value) + SHOW_TIMES.indexOf(selectedTime) + (selectedDate ? selectedDate.getDate() : 0); // 상영마다 다른 숫자를 만듭니다.
  const soldBefore = (rowIndex * 7 + seatNumber * 3 + showNumber) % 9 === 0; // 이 숫자로 상영마다 다른 자리가 팔린 것처럼 보이게 합니다.
  const bookedNow = (bookedSeats[getShowKey()] || []).includes(seatName); // 이번 방문에서 예매한 자리인지 확인합니다.
  return soldBefore || bookedNow; // 둘 중 하나라도 맞으면 팔린 좌석입니다.
} // 팔린 좌석 확인 함수를 마칩니다.

// 좌석 다시 그리기: 고른 좌석을 비우고 좌석표를 새로 그립니다.
function resetSeats() { // 영화·날짜·시간이 바뀌거나 예매가 끝나면 실행합니다.
  selectedSeats = []; // 고른 좌석을 비웁니다.
  seatMap.innerHTML = ""; // 이전 좌석표를 지웁니다.
  SEAT_ROWS.forEach((rowName, rowIndex) => { // 줄(A~H)마다 반복합니다.
    const rowLabel = document.createElement("span"); // 줄 이름 칸을 만듭니다.
    rowLabel.className = "row-name"; // 줄 이름 모양 class를 붙입니다.
    rowLabel.textContent = rowName; // 줄 이름(A, B…)을 씁니다.
    seatMap.append(rowLabel); // 줄 이름을 좌석표 맨 앞에 붙입니다.
    for (let seatNumber = 1; seatNumber <= SEATS_PER_ROW; seatNumber++) { // 그 줄의 좌석 1~10번을 만듭니다.
      const seatName = `${rowName}${seatNumber}`; // 좌석 이름을 만듭니다. (예: E5)
      const seat = document.createElement("button"); // 좌석 버튼을 만듭니다.
      seat.type = "button"; // 일반 버튼으로 만듭니다.
      seat.className = "seat"; // 좌석 모양 class를 붙입니다.
      seat.textContent = seatNumber; // 좌석 번호를 씁니다.
      seat.setAttribute("aria-label", `${rowName}열 ${seatNumber}번 좌석`); // 스크린 리더용 좌석 이름입니다.
      seat.disabled = selectedTime === null || isSeatTaken(seatName, rowIndex, seatNumber); // 시간을 안 골랐거나 팔린 좌석이면 누를 수 없게 합니다.
      seat.addEventListener("click", () => toggleSeat(seatName, seat)); // 누르면 좌석을 고르거나 취소합니다.
      seatMap.append(seat); // 좌석을 좌석표에 붙입니다.
    } // 좌석 반복을 마칩니다.
  }); // 줄 반복을 마칩니다.
  updateSummary(); // 요약과 금액을 다시 씁니다.
} // 좌석 다시 그리기 함수를 마칩니다.

// 좌석 고르기/취소: 누른 좌석을 목록에 넣거나 뺍니다. 최대 8석까지 고를 수 있습니다.
function toggleSeat(seatName, seat) { // seatName은 좌석 이름, seat은 누른 버튼입니다.
  if (selectedSeats.includes(seatName)) { // 이미 고른 좌석이면
    selectedSeats = selectedSeats.filter((name) => name !== seatName); // 목록에서 뺍니다.
    seat.classList.remove("picked"); // 선택 색을 없앱니다.
  } else if (selectedSeats.length >= MAX_SEATS) { // 이미 8석을 골랐으면
    showToast(`좌석은 최대 ${MAX_SEATS}석까지 고를 수 있어요.`); // 안내를 띄웁니다.
  } else { // 새로 고르는 좌석이면
    selectedSeats.push(seatName); // 목록에 넣습니다.
    seat.classList.add("picked"); // 선택 색을 칠합니다.
  } // 좌석 고르기를 마칩니다.
  updateSummary(); // 요약과 금액을 다시 씁니다.
} // 좌석 고르기 함수를 마칩니다.

// 요약 쓰기: 고른 영화·날짜·시간·좌석과 총 금액을 보여 주고, 다 골랐을 때만 예매 버튼을 켭니다.
function updateSummary() { // 무엇이든 고를 때마다 실행합니다.
  const movie = movies.find((item) => String(item.id) === movieSelect.value); // 고른 영화 정보를 찾습니다.
  if (selectedDate === null || selectedTime === null) { // 날짜나 시간을 아직 안 골랐으면
    summaryText.textContent = `${movie.title} · 날짜와 시간을 골라 주세요.`; // 다음에 할 일을 안내합니다.
  } else { // 날짜와 시간을 골랐으면
    const dateText = `${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일(${WEEKDAYS[selectedDate.getDay()]})`; // 날짜를 "11월 16일(월)"처럼 씁니다.
    const seatText = selectedSeats.length ? selectedSeats.join(", ") : "좌석을 골라 주세요"; // 고른 좌석 이름을 이어 쓰거나 안내합니다.
    summaryText.textContent = `${movie.title} · ${dateText} ${selectedTime} · ${seatText}`; // 고른 내용을 한 줄로 보여 줍니다.
  } // 요약 글 쓰기를 마칩니다.
  totalPrice.textContent = (selectedSeats.length * TICKET_PRICE).toLocaleString("ko-KR"); // 좌석 수 × 가격을 1,000 단위 쉼표와 함께 씁니다.
  bookButton.disabled = selectedSeats.length === 0; // 좌석을 하나도 안 골랐으면 예매 버튼을 끕니다.
} // 요약 쓰기 함수를 마칩니다.

// 예매하기: 고른 좌석을 예매 완료로 바꾸고 완료 알림을 띄웁니다. (실제 결제는 하지 않습니다)
function completeBooking() { // 예매하기 버튼을 누르면 실행합니다.
  const showKey = getShowKey(); // 지금 상영의 이름표를 만듭니다.
  bookedSeats[showKey] = (bookedSeats[showKey] || []).concat(selectedSeats); // 이 상영의 예매 완료 좌석에 고른 좌석을 더합니다.
  const price = totalPrice.textContent; // 알림에 쓸 총 금액 글자를 받아 둡니다.
  showToast(`🎬 ${selectedSeats.join(", ")} 좌석 예매 완료! (${price}원)`); // 예매 완료 알림을 띄웁니다.
  resetSeats(); // 좌석표를 새로 그려 방금 예매한 좌석을 '예매 완료'로 보여 줍니다.
} // 예매하기 함수를 마칩니다.

// 알림 띄우기: 화면 아래에 짧은 글을 2.5초 동안 보여 줍니다.
function showToast(message) { // message는 보여 줄 글입니다.
  toast.textContent = message; // 알림 글을 씁니다.
  toast.classList.add("show"); // 알림을 보이게 합니다.
  clearTimeout(toast.hideTimer); // 이전에 걸어 둔 숨김 타이머가 있으면 멈춥니다.
  toast.hideTimer = setTimeout(() => toast.classList.remove("show"), 2500); // 2.5초 뒤에 알림을 숨깁니다.
} // 알림 띄우기 함수를 마칩니다.

// ----- 이벤트 연결 -----
menuButton.addEventListener("click", toggleMenu); // 햄버거 버튼을 누르면 메뉴를 열고 닫습니다.
mainMenu.addEventListener("click", closeMenu); // 메뉴 항목을 누르면 메뉴를 닫습니다.
document.getElementById("heroPrev").addEventListener("click", () => { showSlide(currentSlide - 1); restartAutoSlide(); }); // 이전 화살표를 누르면 이전 배너를 보여 줍니다.
document.getElementById("heroNext").addEventListener("click", () => { showSlide(currentSlide + 1); restartAutoSlide(); }); // 다음 화살표를 누르면 다음 배너를 보여 줍니다.
heroSlides.addEventListener("click", handleBookingShortcut); // 배너의 예매하기 버튼을 처리합니다.
movieList.addEventListener("click", handleBookingShortcut); // 영화 카드의 예매하기·개봉 알림 버튼을 처리합니다.
tabButtons.forEach((tab) => tab.addEventListener("click", changeTab)); // 탭을 누르면 목록을 바꿉니다.
movieSelect.addEventListener("change", resetSeats); // 예매 영화를 바꾸면 좌석을 새로 그립니다.
bookButton.addEventListener("click", completeBooking); // 예매하기 버튼을 누르면 예매를 끝냅니다.

// ----- 처음 화면 그리기 -----
renderHero(); // 배너를 만듭니다.
restartAutoSlide(); // 배너 자동 넘김을 시작합니다.
renderMovies("now"); // 처음에는 현재 상영작 목록을 보여 줍니다.
renderMovieOptions(); // 예매 영화 목록을 만듭니다.
renderDates(); // 날짜 버튼을 만듭니다.
renderTimes(); // 시간 영역에 '날짜를 먼저 골라 주세요' 안내를 보여 줍니다.
resetSeats(); // 빈 좌석표와 요약을 그립니다.
