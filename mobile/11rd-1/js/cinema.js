// 별빛무비 기능: 바닐라 자바스크립트만 사용합니다. (외부 라이브러리 없음, 저장 기능 없음)
// ----- 자료 기준 날짜 -----
const CHART_DATE_TEXT = "2026년 11월 16일 CGV 무비차트 기준 (예매율·관람 등급)"; // 무비차트 숫자를 가져온 날짜와 출처입니다.
const BOX_OFFICE_DATE_TEXT = "2026년 11월 15일(일) 기준 · 영화진흥위원회 통합전산망(KOBIS)"; // 박스오피스 숫자를 가져온 날짜와 출처입니다.
const RECENT_DATE_TEXT = "2026년 8월 16일 ~ 11월 15일 기간별 박스오피스 기준 · 영화진흥위원회(KOBIS), 관객 많은 순"; // 최근 개봉작 숫자를 가져온 기간과 출처입니다.
const CGV_CHART_URL = "https://cgv.co.kr/cnm/cgvChart/movieChart"; // CGV 무비차트 주소입니다. (영화마다 예매 버튼이 있습니다)
const MEGABOX_SEARCH_URL = "https://www.megabox.co.kr/movie?searchText="; // 메가박스 영화 검색 주소입니다. 뒤에 영화 이름을 붙이면 그 영화가 나옵니다.
const WIKI_SUMMARY_URL = "https://ko.wikipedia.org/api/rest_v1/page/summary/"; // 위키백과 공개 API 주소입니다. (키·회원가입 없이 무료)
const EN_WIKI_API_URL = "https://en.wikipedia.org/w/api.php"; // 영어 위키백과 공개 API 주소입니다. (포스터 사진용, 키·회원가입 없이 무료)

// ----- 영화 자료 (숫자는 위 날짜 기준 실제 자료, 색·아이콘은 포스터 대신 직접 고른 것) -----
// status: now(현재 상영작) / soon(상영 예정작), rate: 예매율(%), audience: 누적 관객(명), openDate: 개봉일, wiki: 위키백과 문서 이름(없으면 null), enWiki: 영어 위키백과 문서 이름(포스터 사진용), posterUrl: KOBIS 영화정보의 포스터 주소(위키백과에 포스터가 없을 때)
const movies = [ // 영화 목록입니다.
  { id: 1, title: "폴2: 데드포인트", age: "15", status: "now", rate: 4.9, audience: 140037, openDate: "2026-11-11", icon: "🧗", color1: "#7a1f2b", color2: "#1a0b10", wiki: null, enWiki: "Fall 2: Deadpoint" }, // 현재 상영작입니다.
  { id: 2, title: "극장판 치이카와: 인어 섬의 비밀", age: "ALL", status: "now", rate: 4.7, audience: 2949096, openDate: "2026-09-30", icon: "🧜", color1: "#4fb3d9", color2: "#163e66", wiki: "극장판 치이카와: 인어 섬의 비밀", posterUrl: "https://www.kobis.or.kr/common/mast/movie/2026/08/thumb_x192/thn_9ea8c9b1c2c04a9dbd6c6d34e58456e8.jpg" }, // 현재 상영작입니다.
  { id: 3, title: "듄", age: "12", status: "now", rate: 4.3, audience: 1691824, openDate: "2026-11-11", reopen: true, icon: "🏜️", color1: "#c9822b", color2: "#3b1f08", wiki: "듄 (2021년 영화)" }, // 재개봉한 현재 상영작입니다.
  { id: 4, title: "명탐정 코난: 30호 살인 사건", age: "12", status: "now", rate: 2.3, audience: 173355, openDate: "2026-11-05", icon: "🔍", color1: "#2b4fa8", color2: "#0d1838", wiki: null, posterUrl: "https://www.kobis.or.kr/common/mast/movie/2026/10/thumb_x192/thn_3336b74f51a946babe62ed76c3f57a73.jpg" }, // 현재 상영작입니다.
  { id: 5, title: "최종면접", age: "15", status: "now", rate: 1.9, audience: 283290, openDate: "2026-11-04", icon: "💼", color1: "#4a4f5c", color2: "#14161b", wiki: null, enWiki: "Final Interview" }, // 현재 상영작입니다.
  { id: 6, title: "라라랜드", age: "12", status: "now", rate: 1.6, audience: 3861037, openDate: "2026-11-11", reopen: true, icon: "🎹", color1: "#6a3fb5", color2: "#1c1240", wiki: null, enWiki: "La La Land" }, // 재개봉한 현재 상영작입니다.
  { id: 7, title: "오디세이", age: "15", status: "now", rate: 0.9, audience: 12360000, openDate: null, icon: "⛵", color1: "#1f6f78", color2: "#071f24", wiki: "오디세이 (영화)" }, // 현재 상영작입니다. (개봉일 자료 없음)
  { id: 8, title: "하트 오브 비스트", age: "12", status: "now", rate: 0.8, audience: 452535, openDate: "2026-10-28", icon: "🐾", color1: "#3d6b35", color2: "#0f1f0c", wiki: "하트 오브 비스트", enWiki: "Heart of the Beast" }, // 현재 상영작입니다.
  { id: 9, title: "와일드 호스 나인", age: "15", status: "now", rate: 0.7, audience: 39000, openDate: "2026-11-04", icon: "🐎", color1: "#8a5a2b", color2: "#24150a", wiki: "와일드 호스 나인", enWiki: "Wild Horse Nine" }, // 현재 상영작입니다.
  { id: 10, title: "극장판 체인소 맨: 레제편", age: "15", status: "now", rate: 0.4, audience: 3471000, openDate: null, icon: "🪚", color1: "#b8461b", color2: "#2a0d05", wiki: "극장판 체인소 맨: 레제편" }, // 현재 상영작입니다. (개봉일 자료 없음)
  { id: 11, title: "극장판 마카앤로니: 기억탐험 대소동!", age: "ALL", status: "now", rate: 0.4, audience: 25481, openDate: "2026-11-14", icon: "🧸", color1: "#e88a3c", color2: "#5a2a0c", wiki: null, posterUrl: "https://www.kobis.or.kr/common/mast/movie/2026/10/thumb_x192/thn_334a56af5ecf4c5db6737765c4e42a74.jpg" }, // 현재 상영작입니다.
  { id: 12, title: "스크루지: 크리스마스 캐럴", age: "12", status: "now", rate: 0.3, audience: 19794, openDate: "2026-11-11", icon: "🎄", color1: "#1e6b46", color2: "#3a0d12", wiki: "스크루지: 크리스마스 캐럴 (2026년 영화)", enWiki: "Ebenezer (2026 film)" }, // 현재 상영작입니다.
  { id: 13, title: "프레셔", age: "12", status: "now", rate: 0.3, audience: 21000, openDate: "2026-11-11", icon: "⏱️", color1: "#3a3f8f", color2: "#0e1030", wiki: null, enWiki: "Pressure (2026 film)" }, // 현재 상영작입니다.
  { id: 14, title: "임영웅│아임 히어로 더 스타디움 2", age: "ALL", status: "soon", rate: 43.6, audience: 0, openDate: "2026-11-18", icon: "🎤", color1: "#2f7de1", color2: "#0b2350", wiki: null }, // 상영 예정작입니다.
  { id: 15, title: "폭설", age: "15", status: "soon", rate: 10.7, audience: 0, openDate: "2026-11-18", icon: "❄️", color1: "#8fb3d9", color2: "#1d2f4a", wiki: null }, // 상영 예정작입니다. (같은 이름 문서가 이 영화인지 확인되지 않아 연결하지 않음)
  { id: 16, title: "헝거게임: 50번째 추첨의 날", age: "15", status: "soon", rate: 6.1, audience: 0, openDate: "2026-11-18", icon: "🏹", color1: "#9c6b1e", color2: "#2a1a05", wiki: "헝거게임 50번째 추첨의 날", enWiki: "The Hunger Games: Sunrise on the Reaping" }, // 상영 예정작입니다.
  { id: 17, title: "아름다운 초저녁달", age: "12", status: "soon", rate: 2.3, audience: 0, openDate: "2026-11-18", icon: "🌙", color1: "#5d4a9c", color2: "#171030", wiki: null }, // 상영 예정작입니다.
  { id: 18, title: "슬픈 열대", age: "19", status: "soon", rate: 1.6, audience: 0, openDate: "2026-11-25", icon: "🌴", color1: "#2e7d4f", color2: "#08200f", wiki: "슬픈 열대 (영화)", enWiki: "Tristes Tropiques (film)" }, // 상영 예정작입니다.
  { id: 19, title: "원스", age: "ALL", status: "soon", rate: 0.7, audience: 0, openDate: "2026-11-18", reopen: true, icon: "🎸", color1: "#b5653a", color2: "#2b140a", wiki: "원스 (영화)" }, // 재개봉 예정작입니다.
  { id: 20, title: "암살자(들)", age: null, status: "recent", rate: null, audience: 3487292, openDate: "2026-09-23", icon: "🎬", color1: "#5b3f8f", color2: "#16102a", wiki: null, enWiki: "The Assassin(s)" }, // 최근 3개월 개봉작입니다. (KOBIS 기간별 박스오피스)
  { id: 21, title: "스파이더맨: 브랜드 뉴 데이", age: null, status: "recent", rate: null, audience: 9056980, openDate: "2026-07-29", icon: "🎬", color1: "#8f3f3f", color2: "#2a1010", wiki: null, enWiki: "Spider-Man: Brand New Day" }, // 최근 3개월 개봉작입니다. (KOBIS 기간별 박스오피스)
  { id: 22, title: "타짜: 벨제붑의 노래", age: "19", status: "recent", rate: null, audience: 2079144, openDate: "2026-09-23", icon: "🎬", color1: "#3f6f8f", color2: "#0f1f2a", wiki: null, enWiki: "Tazza: The Song of Beelzebub" }, // 최근 3개월 개봉작입니다. (KOBIS 기간별 박스오피스)
  { id: 23, title: "옵세션", age: null, status: "recent", rate: null, audience: 975796, openDate: "2026-09-02", icon: "🎬", color1: "#6f8f3f", color2: "#1c2a0f", wiki: null, enWiki: "Obsession (2025 film)" }, // 최근 3개월 개봉작입니다. (KOBIS 기간별 박스오피스)
  { id: 24, title: "인턴", age: null, status: "recent", rate: null, audience: 917470, openDate: "2026-09-16", icon: "🎬", color1: "#8f6f3f", color2: "#2a1f0f", wiki: null, enWiki: null }, // 최근 3개월 개봉작입니다. (KOBIS 기간별 박스오피스)
  { id: 25, title: "사랑의 하츄핑: 고래보석의 전설", age: null, status: "recent", rate: null, audience: 879015, openDate: "2026-08-05", icon: "🎬", color1: "#3f8f7a", color2: "#0f2a24", wiki: null, enWiki: null }, // 최근 3개월 개봉작입니다. (KOBIS 기간별 박스오피스)
  { id: 26, title: "명탐정 코난: 하이웨이의 타천사", age: null, status: "recent", rate: null, audience: 434941, openDate: "2026-08-12", icon: "🎬", color1: "#5b3f8f", color2: "#16102a", wiki: null, enWiki: "Detective Conan: Fallen Angel of the Highway" }, // 최근 3개월 개봉작입니다. (KOBIS 기간별 박스오피스)
  { id: 27, title: "오케이 마담2", age: null, status: "recent", rate: null, audience: 349024, openDate: "2026-08-12", icon: "🎬", color1: "#8f3f3f", color2: "#2a1010", wiki: null, enWiki: "Okay! Madam 2" }, // 최근 3개월 개봉작입니다. (KOBIS 기간별 박스오피스)
  { id: 28, title: "경주기행", age: null, status: "recent", rate: null, audience: 345517, openDate: "2026-08-26", icon: "🎬", color1: "#3f6f8f", color2: "#0f1f2a", wiki: null, enWiki: "The Journey to Gyeongju" }, // 최근 3개월 개봉작입니다. (KOBIS 기간별 박스오피스)
  { id: 29, title: "부활남: 더 레드", age: null, status: "recent", rate: null, audience: 335457, openDate: "2026-09-30", icon: "🎬", color1: "#6f8f3f", color2: "#1c2a0f", wiki: null, enWiki: null }, // 최근 3개월 개봉작입니다. (KOBIS 기간별 박스오피스)
  { id: 30, title: "가능한 사랑", age: null, status: "recent", rate: null, audience: 230477, openDate: "2026-09-23", icon: "🎬", color1: "#8f6f3f", color2: "#2a1f0f", wiki: null, enWiki: "Possible Love" }, // 최근 3개월 개봉작입니다. (KOBIS 기간별 박스오피스)
  { id: 31, title: "레지던트 이블: 0번째 밤", age: null, status: "recent", rate: null, audience: 223064, openDate: "2026-09-17", icon: "🎬", color1: "#3f8f7a", color2: "#0f2a24", wiki: null, enWiki: null }, // 최근 3개월 개봉작입니다. (KOBIS 기간별 박스오피스)
  { id: 32, title: "룩백", age: null, status: "recent", rate: null, audience: 167203, openDate: "2026-10-08", icon: "🎬", color1: "#5b3f8f", color2: "#16102a", wiki: null, enWiki: "Look Back (2026 film)" }, // 최근 3개월 개봉작입니다. (KOBIS 기간별 박스오피스)
  { id: 33, title: "실낙원", age: null, status: "recent", rate: null, audience: 160187, openDate: "2026-10-21", icon: "🎬", color1: "#8f3f3f", color2: "#2a1010", wiki: null, enWiki: "Paradise Lost (2026 film)" }, // 최근 3개월 개봉작입니다. (KOBIS 기간별 박스오피스)
  { id: 34, title: "인시디어스: 그들이 넘어왔다", age: null, status: "recent", rate: null, audience: 158936, openDate: "2026-08-20", icon: "🎬", color1: "#3f6f8f", color2: "#0f1f2a", wiki: null, enWiki: "Insidious: Out of the Further" }, // 최근 3개월 개봉작입니다. (KOBIS 기간별 박스오피스)
  { id: 35, title: "호프", age: null, status: "recent", rate: null, audience: 4600295, openDate: "2026-07-15", icon: "🎬", color1: "#6f8f3f", color2: "#1c2a0f", wiki: null, enWiki: "Hope (2026 film)" }, // 최근 3개월 개봉작입니다. (KOBIS 기간별 박스오피스)
  { id: 36, title: "오크 스트리트의 마지막 날", age: null, status: "recent", rate: null, audience: 136765, openDate: "2026-08-26", icon: "🎬", color1: "#8f6f3f", color2: "#2a1f0f", wiki: null, enWiki: null }, // 최근 3개월 개봉작입니다. (KOBIS 기간별 박스오피스)
  { id: 37, title: "클레이페이스", age: null, status: "recent", rate: null, audience: 126555, openDate: "2026-10-21", icon: "🎬", color1: "#3f8f7a", color2: "#0f2a24", wiki: null, enWiki: "Clayface (film)" }, // 최근 3개월 개봉작입니다. (KOBIS 기간별 박스오피스)
  { id: 38, title: "퍼피 구조대: 더 다이노 무비", age: null, status: "recent", rate: null, audience: 111755, openDate: "2026-08-13", icon: "🎬", color1: "#5b3f8f", color2: "#16102a", wiki: null, enWiki: "Paw Patrol: The Dino Movie" }, // 최근 3개월 개봉작입니다. (KOBIS 기간별 박스오피스)
  { id: 39, title: "수능, 출제의 비밀", age: null, status: "recent", rate: null, audience: 108926, openDate: "2026-10-28", icon: "🎬", color1: "#8f3f3f", color2: "#2a1010", wiki: null, enWiki: null }, // 최근 3개월 개봉작입니다. (KOBIS 기간별 박스오피스)
  { id: 40, title: "디거", age: null, status: "recent", rate: null, audience: 107518, openDate: "2026-10-03", icon: "🎬", color1: "#3f6f8f", color2: "#0f1f2a", wiki: null, enWiki: null }, // 최근 3개월 개봉작입니다. (KOBIS 기간별 박스오피스)
  { id: 41, title: "비광", age: null, status: "recent", rate: null, audience: 102947, openDate: "2026-09-02", icon: "🎬", color1: "#6f8f3f", color2: "#1c2a0f", wiki: null, enWiki: "Portrait of a Family (2026 film)" }, // 최근 3개월 개봉작입니다. (KOBIS 기간별 박스오피스)
  { id: 42, title: "더 드라마", age: null, status: "recent", rate: null, audience: 91491, openDate: "2026-09-09", icon: "🎬", color1: "#8f6f3f", color2: "#2a1f0f", wiki: null, enWiki: "The Drama (film)" }, // 최근 3개월 개봉작입니다. (KOBIS 기간별 박스오피스)
  { id: 43, title: "여전히 찬란하게", age: null, status: "recent", rate: null, audience: 76240, openDate: "2026-10-21", icon: "🎬", color1: "#3f8f7a", color2: "#0f2a24", wiki: null, enWiki: null }, // 최근 3개월 개봉작입니다. (KOBIS 기간별 박스오피스)
  { id: 44, title: "웨일폴: 고래에 먹힌 남자", age: null, status: "recent", rate: null, audience: 75491, openDate: "2026-10-14", icon: "🎬", color1: "#5b3f8f", color2: "#16102a", wiki: null, enWiki: "Whalefall (film)" }, // 최근 3개월 개봉작입니다. (KOBIS 기간별 박스오피스)
  { id: 45, title: "전자오락수호대", age: null, status: "recent", rate: null, audience: 75457, openDate: "2026-10-14", icon: "🎬", color1: "#8f3f3f", color2: "#2a1010", wiki: null, enWiki: null }, // 최근 3개월 개봉작입니다. (KOBIS 기간별 박스오피스)
  { id: 46, title: "극장판 마법소녀 마도카☆마기카〈발푸르기스의 회천〉", age: null, status: "recent", rate: null, audience: 68042, openDate: "2026-11-04", icon: "🎬", color1: "#3f6f8f", color2: "#0f1f2a", wiki: null, enWiki: null }, // 최근 3개월 개봉작입니다. (KOBIS 기간별 박스오피스)
  { id: 47, title: "모자 쓴 고양이", age: null, status: "recent", rate: null, audience: 52675, openDate: "2026-11-06", icon: "🎬", color1: "#6f8f3f", color2: "#1c2a0f", wiki: null, enWiki: "The Cat in the Hat (2026 film)" } // 최근 3개월 개봉작입니다. (KOBIS 기간별 박스오피스)
]; // 영화 목록을 마칩니다.

// ----- 박스오피스 자료 (KOBIS 2026-11-15 일별 박스오피스 1~10위) -----
// change: 전날보다 오른(+) / 내린(-) 순위, dayAudience: 그날 관객 수, share: 매출 점유율(%), movieId: 위 영화 목록의 번호(없으면 null)
const boxOffice = [ // 박스오피스 순위 목록입니다.
  { rank: 1, title: "극장판 치이카와: 인어 섬의 비밀", openDate: "2026-09-30", dayAudience: 46032, share: 19.6, totalAudience: 2949096, change: 0, movieId: 2 }, // 1위입니다.
  { rank: 2, title: "폴2: 데드포인트", openDate: "2026-11-11", dayAudience: 39938, share: 17.4, totalAudience: 140037, change: 0, movieId: 1 }, // 2위입니다.
  { rank: 3, title: "최종면접", openDate: "2026-11-04", dayAudience: 23894, share: 10.9, totalAudience: 283290, change: 0, movieId: 5 }, // 3위입니다.
  { rank: 4, title: "명탐정 코난: 30호 살인 사건", openDate: "2026-11-05", dayAudience: 13006, share: 5.7, totalAudience: 173355, change: 1, movieId: 4 }, // 4위입니다.
  { rank: 5, title: "극장판 마카앤로니: 기억탐험 대소동!", openDate: "2026-11-14", dayAudience: 12473, share: 4.9, totalAudience: 25481, change: 2, movieId: 11 }, // 5위입니다.
  { rank: 6, title: "라라랜드", openDate: "2016-12-07", dayAudience: 12361, share: 5.7, totalAudience: 3861037, change: 0, movieId: 6 }, // 6위입니다.
  { rank: 7, title: "하트 오브 비스트", openDate: "2026-10-28", dayAudience: 12028, share: 5.2, totalAudience: 452535, change: -3, movieId: 8 }, // 7위입니다.
  { rank: 8, title: "듄", openDate: "2021-10-20", dayAudience: 6030, share: 4.9, totalAudience: 1691824, change: 2, movieId: 3 }, // 8위입니다.
  { rank: 9, title: "모자 쓴 고양이", openDate: "2026-11-06", dayAudience: 6022, share: 2.4, totalAudience: 52675, change: 0, movieId: 47 }, // 9위입니다. (최근 개봉작 목록에 있음)
  { rank: 10, title: "스크루지: 크리스마스 캐럴", openDate: "2026-11-11", dayAudience: 4605, share: 2.0, totalAudience: 19794, change: 1, movieId: 12 } // 10위입니다.
]; // 박스오피스 목록을 마칩니다.

// ----- 화면 요소 -----
const menuButton = document.getElementById("menuButton"); // 햄버거 메뉴 버튼을 가져옵니다.
const mainMenu = document.getElementById("mainMenu"); // 메뉴 목록을 가져옵니다.
const heroSlides = document.getElementById("heroSlides"); // 배너 슬라이드를 넣을 곳을 가져옵니다.
const heroDots = document.getElementById("heroDots"); // 배너 점을 넣을 곳을 가져옵니다.
const tabButtons = document.querySelectorAll(".tab"); // 현재 상영작 / 상영 예정작 탭 버튼들을 가져옵니다.
const movieSearch = document.getElementById("movieSearch"); // 영화 이름 검색칸을 가져옵니다.
const sortSelect = document.getElementById("sortSelect"); // 정렬 선택 목록을 가져옵니다.
const ageFilter = document.getElementById("ageFilter"); // 등급 거르기 버튼 묶음을 가져옵니다.
const resultCount = document.getElementById("resultCount"); // 몇 편인지 보여 줄 곳을 가져옵니다.
const movieList = document.getElementById("movieList"); // 영화 카드를 넣을 곳을 가져옵니다.
const boxOfficeBody = document.getElementById("boxOfficeBody"); // 박스오피스 표 내용을 넣을 곳을 가져옵니다.
const movieDialog = document.getElementById("movieDialog"); // 영화 상세 정보 창을 가져옵니다.
const wikiText = document.getElementById("wikiText"); // 위키백과 소개 글을 넣을 곳을 가져옵니다.

// ----- 화면 상태 -----
let currentStatus = "now"; // 지금 고른 탭입니다. (now 또는 soon)
let currentAge = "all"; // 지금 고른 등급 거르기입니다. (all이면 모두)
const periodSelect = document.getElementById("periodSelect"); // 개봉 시기(전체·최근 1개월·최근 3개월) 선택 목록을 가져옵니다.

// 개봉 시기 확인: 고른 기간(오늘부터 30일·90일 전) 안에 개봉한 영화인지 확인합니다. (상영 예정작은 항상 통과)
function isInPeriod(movie) { // movie는 영화 정보입니다.
  const periodDays = Number(periodSelect.value); // 고른 기간(일 수)입니다. 0이면 전체입니다.
  if (periodDays === 0 || movie.status === "soon") return true; // 전체를 골랐거나 아직 개봉 전이면 통과입니다.
  if (!movie.openDate) return false; // 개봉일 자료가 없으면 기간 안인지 알 수 없어 뺍니다.
  const startDay = new Date(); // 오늘 날짜를 만듭니다.
  startDay.setDate(startDay.getDate() - periodDays); // 오늘에서 고른 일 수만큼 뺀 날짜를 기준일로 합니다.
  return new Date(`${movie.openDate}T00:00:00`) >= startDay; // 기준일 이후에 개봉했으면 통과입니다.
} // 개봉 시기 확인 함수를 마칩니다.
let currentSlide = 0; // 지금 보이는 배너 번호입니다.
let slideTimer = null; // 배너 자동 넘김 타이머입니다.
let openedMovieId = null; // 지금 상세 창에 열린 영화 번호입니다. (늦게 온 위키 글이 다른 영화 창에 들어가지 않게 씁니다)
const wikiCache = {}; // 한 번 불러온 위키백과 글을 기억해 두는 곳입니다. (같은 영화를 다시 열 때 다시 요청하지 않게)

// 등급 표시: 등급 글자로 색이 들어간 작은 표시(HTML)를 만듭니다.
function makeAgeBadge(age) { // age는 "ALL", "12", "15", "19" 중 하나입니다. (모르면 null)
  if (!age) return ""; // 등급 자료가 없는 영화는 표시를 넣지 않습니다.
  const className = age === "ALL" ? "age-all" : `age-${age}`; // 등급에 맞는 색 class 이름을 정합니다.
  const label = age === "ALL" ? "전체" : age; // 표시에 쓸 짧은 글자입니다.
  const fullName = { ALL: "전체 관람가", 12: "12세 관람가", 15: "15세 관람가", 19: "청소년 관람불가" }[age]; // 스크린 리더가 읽을 전체 이름입니다.
  return `<span class="badge ${className}" title="${fullName}" aria-label="${fullName}">${label}</span>`; // 등급 표시 HTML을 돌려줍니다.
} // 등급 표시 함수를 마칩니다.

// 관객 수 글자: 1만 명이 넘으면 '294.9만명', 아니면 '8,481명'처럼 줄여 씁니다.
function formatAudience(count) { // count는 관객 수(숫자)입니다.
  if (count >= 10000) return `${(count / 10000).toFixed(1).replace(/\.0$/, "")}만명`; // 1만 이상은 만 단위로 소수 첫째 자리까지 씁니다.
  return `${count.toLocaleString("ko-KR")}명`; // 1만 미만은 쉼표를 넣어 그대로 씁니다.
} // 관객 수 글자 함수를 마칩니다.

// 날짜 글자: "2026-11-18"을 "2026.11.18"로 바꿉니다.
function formatDate(dateText) { // dateText는 "연-월-일" 글자입니다.
  return dateText ? dateText.replaceAll("-", ".") : "정보 없음"; // 날짜가 없으면 '정보 없음'을 돌려줍니다.
} // 날짜 글자 함수를 마칩니다.

// 개봉까지 남은 날: 오늘과 개봉일을 비교해 "D-2", "D-DAY", 또는 지났으면 빈 글자를 돌려줍니다.
function getDday(dateText) { // dateText는 개봉일 글자입니다.
  if (!dateText) return ""; // 개봉일이 없으면 빈 글자입니다.
  const today = new Date(); // 오늘 날짜를 만듭니다.
  today.setHours(0, 0, 0, 0); // 시각은 빼고 날짜만 비교하도록 0시로 맞춥니다.
  const openDay = new Date(`${dateText}T00:00:00`); // 개봉일 0시를 만듭니다.
  const daysLeft = Math.round((openDay - today) / 86400000); // 남은 날 수를 계산합니다. (하루 = 86,400,000ms)
  if (daysLeft > 0) return `D-${daysLeft}`; // 아직 남았으면 D-숫자입니다.
  if (daysLeft === 0) return "D-DAY"; // 오늘이 개봉일이면 D-DAY입니다.
  return ""; // 이미 개봉했으면 빈 글자입니다.
} // 남은 날 함수를 마칩니다.

// 메가박스 검색 주소: 영화 이름 중 앞부분(콜론·세로줄 앞)으로 메가박스에서 찾는 주소를 만듭니다.
function makeMegaboxUrl(movie) { // movie는 영화 정보입니다.
  const searchWord = movie.title.split(/[:│]/)[0].trim(); // '폴2: 데드포인트' → '폴2'처럼 극장마다 다른 부제 표기를 빼고 찾습니다.
  return MEGABOX_SEARCH_URL + encodeURIComponent(searchWord); // 한글을 주소에 넣을 수 있게 바꿔 붙입니다.
} // 메가박스 주소 함수를 마칩니다.

// 포스터 HTML: 그림 대신 영화 색, 아이콘, 제목으로 포스터를 만듭니다.
function makePosterHtml(movie, rankText, extraClass = "", idText = "") { // movie는 영화 정보, rankText는 순위(없으면 빈 글자), extraClass·idText는 상세 창에서 쓸 class와 id입니다.
  const rankHtml = rankText ? `<span class="rank">${rankText}</span>` : ""; // 순위가 있을 때만 순위 숫자를 넣습니다.
  const imageClass = movie.imageUrl ? " has-image" : ""; // 위키백과 사진이 있으면 사진 포스터 class를 붙입니다.
  const imageStyle = movie.imageUrl ? ` --image:url('${movie.imageUrl}');` : ""; // 사진 주소를 CSS 변수로 넘깁니다.
  const idHtml = idText ? ` id="${idText}"` : ""; // id가 필요할 때만 넣습니다.
  return `<div class="poster ${extraClass}${imageClass}"${idHtml} data-poster="${movie.id}" style="--color1:${movie.color1}; --color2:${movie.color2};${imageStyle}">${rankHtml}<span class="poster-icon" aria-hidden="true">${movie.icon}</span><span class="poster-title">${movie.title}</span></div>`; // 포스터 HTML을 돌려줍니다.
} // 포스터 HTML 함수를 마칩니다.

// 위키백과 요약 가져오기: 문서 이름으로 공개 API에 요청하고, 한 번 받은 글은 기억해 둡니다.
async function fetchWikiSummary(wikiName) { // wikiName은 위키백과 문서 이름입니다.
  if (!wikiCache[wikiName]) { // 아직 불러온 적이 없으면
    const response = await fetch(WIKI_SUMMARY_URL + encodeURIComponent(wikiName)); // 위키백과 요약 API에 요청합니다.
    if (!response.ok) throw new Error(`위키백과 응답 오류 (${response.status})`); // 실패 응답이면 오류로 처리합니다.
    wikiCache[wikiName] = await response.json(); // 받은 글을 기억해 둡니다.
  } // 요청을 마칩니다.
  return wikiCache[wikiName]; // 기억해 둔 글을 돌려줍니다.
} // 위키백과 요약 가져오기 함수를 마칩니다.

// 포스터 사진 붙이기: 영화에 사진 주소를 기억하고, 이미 화면에 있는 그 영화 포스터를 사진으로 바꿉니다.
function applyPosterImage(movie, imageUrl) { // movie는 영화 정보, imageUrl은 사진 주소입니다.
  movie.imageUrl = imageUrl; // 사진 주소를 영화 정보에 기억합니다. (목록을 다시 그릴 때도 쓰게)
  document.querySelectorAll(`[data-poster="${movie.id}"]`).forEach((poster) => { // 화면에 있는 이 영화 포스터를 모두 찾습니다.
    poster.classList.add("has-image"); // 사진 포스터 class를 붙입니다.
    poster.style.setProperty("--image", `url('${imageUrl}')`); // 사진 주소를 CSS 변수로 넘깁니다.
  }); // 화면 포스터 바꾸기를 마칩니다.
} // 포스터 사진 붙이기 함수를 마칩니다.

// 포스터 사진 불러오기: 영어 위키백과(포스터가 더 많음)에서 한 번에 받고, 없으면 한국어 위키백과 사진을 씁니다. (없으면 색 포스터 그대로)
async function loadPosterImages() { // 페이지가 열릴 때 한 번 실행합니다.
  movies.filter((movie) => movie.posterUrl).forEach((movie) => applyPosterImage(movie, movie.posterUrl)); // 포스터 주소(KOBIS)를 직접 적어 둔 영화는 그 사진을 먼저 붙입니다.
  const englishMovies = movies.filter((movie) => movie.enWiki && !movie.imageUrl); // 아직 사진이 없고 영어 위키백과 문서 이름이 있는 영화만 고릅니다.
  try { // 실패해도 페이지가 멈추지 않게 합니다.
    const titles = englishMovies.map((movie) => movie.enWiki).join("|"); // 문서 이름들을 | 로 이어 한 번에 요청합니다.
    const response = await fetch(`${EN_WIKI_API_URL}?action=query&prop=pageimages&piprop=thumbnail&pithumbsize=400&pilicense=any&format=json&origin=*&titles=${encodeURIComponent(titles)}`); // 영어 위키백과 공개 API에 대표 사진을 요청합니다. (origin=*: 다른 사이트에서 부를 수 있게)
    const data = await response.json(); // 받은 자료를 읽습니다.
    Object.values(data.query.pages).forEach((page) => { // 문서마다 확인합니다.
      const movie = englishMovies.find((item) => item.enWiki === page.title); // 문서 이름으로 영화를 찾습니다.
      if (movie && page.thumbnail) applyPosterImage(movie, page.thumbnail.source); // 사진이 있으면 포스터를 사진으로 바꿉니다.
    }); // 문서 확인을 마칩니다.
  } catch (error) { // 요청이 실패하면
    console.error(error); // 개발자 도구에만 남기고 색 포스터를 그대로 둡니다.
  } // 오류 처리를 마칩니다.
  movies.filter((movie) => movie.wiki && !movie.imageUrl).forEach(async (movie) => { // 아직 사진이 없고 한국어 문서가 있는 영화만 하나씩 요청합니다.
    try { // 하나가 실패해도 다른 영화는 계속 불러오게 합니다.
      const summary = await fetchWikiSummary(movie.wiki); // 한국어 위키백과 요약을 받습니다.
      if (summary.thumbnail) applyPosterImage(movie, summary.thumbnail.source); // 사진이 있으면 포스터를 사진으로 바꿉니다.
    } catch (error) { // 요청이 실패하면
      console.error(error); // 개발자 도구에만 남기고 색 포스터를 그대로 둡니다.
    } // 오류 처리를 마칩니다.
  }); // 영화별 요청을 마칩니다.
} // 포스터 사진 불러오기 함수를 마칩니다.

// 예매율 순위: 같은 탭(현재/예정/최근) 안에서 몇 위인지 구합니다. 예매율이 같으면 누적 관객이 많은 영화가 앞서서 순위가 겹치지 않습니다.
function getRateRank(movie) { // movie는 영화 정보입니다.
  const sameTab = movies.filter((other) => other.status === movie.status); // 같은 탭의 영화만 고릅니다.
  sameTab.sort((a, b) => (b.rate || 0) - (a.rate || 0) || b.audience - a.audience || a.id - b.id); // 예매율 → 누적 관객 → 번호 순으로 줄 세웁니다. (최근 개봉작은 예매율이 없어 관객 순)
  return sameTab.indexOf(movie) + 1; // 줄에서 몇 번째인지가 내 순위입니다.
} // 예매율 순위 함수를 마칩니다.

// 메뉴 열고 닫기: 태블릿·폰에서 햄버거 버튼을 누르면 메뉴 판을 펼치거나 접습니다.
function toggleMenu() { // 버튼을 누를 때마다 실행됩니다.
  const isOpen = mainMenu.classList.toggle("open"); // open class를 붙였다 뗐다 하고, 지금 열렸는지 받아 둡니다.
  menuButton.textContent = isOpen ? "✕" : "☰"; // 열렸으면 닫기(✕), 닫혔으면 햄버거(☰) 모양으로 바꿉니다.
  menuButton.setAttribute("aria-expanded", String(isOpen)); // 스크린 리더에 메뉴가 열렸는지 알려 줍니다.
  menuButton.setAttribute("aria-label", isOpen ? "메뉴 닫기" : "메뉴 열기"); // 버튼 설명도 상태에 맞게 바꿉니다.
} // 메뉴 열고 닫기 함수를 마칩니다.

// 배너 만들기: 현재 상영작 예매율 1~3위로 배너 슬라이드와 점을 만듭니다.
function renderHero() { // 페이지가 열릴 때 한 번 실행합니다.
  const heroMovies = movies.filter((movie) => movie.status === "now").sort((first, second) => second.rate - first.rate).slice(0, 3); // 현재 상영작을 예매율 순으로 3편 고릅니다.
  heroMovies.forEach((movie, index) => { // 3편을 하나씩 배너로 만듭니다.
    const slide = document.createElement("div"); // 배너 한 장을 만듭니다.
    slide.className = "hero-slide"; // 배너 모양 class를 붙입니다.
    slide.style.setProperty("--color1", movie.color1); // 영화의 첫 번째 색을 CSS 변수로 넘깁니다.
    slide.style.setProperty("--color2", movie.color2); // 영화의 두 번째 색을 CSS 변수로 넘깁니다.
    slide.innerHTML = `<div class="hero-text"> <!-- 배너 글자 영역입니다. -->
      <p class="hero-rank">현재 상영작 예매율 ${index + 1}위</p> <!-- 몇 위인지 보여 줍니다. -->
      ${makeAgeBadge(movie.age)}<h2>${movie.title}</h2> <!-- 등급과 제목입니다. -->
      <ul class="hero-stats"><li>예매율 ${movie.rate}%</li><li>누적 ${formatAudience(movie.audience)}</li><li>${movie.reopen ? "재개봉" : "개봉"} ${formatDate(movie.openDate)}</li></ul> <!-- 예매율, 누적 관객, 개봉일 알약입니다. -->
      <div class="hero-buttons"><button class="button primary" type="button" data-detail="${movie.id}">상세정보</button><a class="button" href="${CGV_CHART_URL}" target="_blank" rel="noopener">CGV 예매 ↗</a><a class="button" href="${makeMegaboxUrl(movie)}" target="_blank" rel="noopener">메가박스 예매 ↗</a></div> <!-- 상세정보 버튼과 극장 예매 링크입니다. -->
    </div> <!-- 배너 글자 영역을 마칩니다. -->
    <div class="hero-poster" aria-hidden="true">${makePosterHtml(movie, "")}</div>`; // 오른쪽에 포스터를 넣고 배너 HTML을 마칩니다.
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

// 배너 자동 넘김: 6초마다 다음 배너로 넘깁니다. 버튼을 누르면 시간을 처음부터 다시 셉니다.
function restartAutoSlide() { // 처음 열 때와 배너를 직접 넘길 때 실행합니다.
  clearInterval(slideTimer); // 이전 타이머를 멈춥니다.
  slideTimer = setInterval(() => showSlide(currentSlide + 1), 6000); // 6초(6000ms)마다 다음 배너를 보여 줍니다.
} // 자동 넘김 함수를 마칩니다.

// 정렬 비교: 고른 정렬 방식에 맞게 두 영화의 앞뒤를 정합니다. (sort에 넘기는 함수)
function compareMovies(first, second) { // first, second는 비교할 두 영화입니다.
  const sortType = sortSelect.value; // 고른 정렬 방식입니다.
  if (sortType === "audience") return second.audience - first.audience; // 누적 관객이 많은 영화를 앞에 둡니다.
  if (sortType === "name") return first.title.localeCompare(second.title, "ko"); // 가나다 순서로 둡니다.
  if (sortType === "date") { // 개봉일순이면
    const firstDate = first.openDate || "0000"; // 개봉일이 없는 영화는 맨 뒤로 가게 아주 옛날로 칩니다.
    const secondDate = second.openDate || "0000"; // 두 번째 영화도 같은 방식으로 정합니다.
    return currentStatus === "now" ? secondDate.localeCompare(firstDate) : firstDate.localeCompare(secondDate); // 상영작은 최근 개봉 먼저, 예정작은 가까운 개봉 먼저입니다.
  } // 개봉일순을 마칩니다.
  if (currentStatus === "recent") return second.audience - first.audience; // 최근 개봉작은 예매율이 없으니 누적 관객순으로 둡니다.
  return getRateRank(first) - getRateRank(second); // 기본(예매율순)은 순위 숫자 순서대로 둡니다. (예매율이 같으면 관객 많은 영화 먼저)
} // 정렬 비교 함수를 마칩니다.

// 무비차트 그리기: 탭, 검색어, 등급, 정렬에 맞는 영화만 카드로 보여 줍니다.
function renderChart() { // 탭·검색·정렬·등급이 바뀔 때마다 실행합니다.
  const keyword = movieSearch.value.trim().replace(/\s/g, ""); // 검색어에서 띄어쓰기를 모두 뺍니다. ('라라 랜드'도 찾게)
  const shownMovies = movies.filter((movie) => { // 조건에 맞는 영화만 고릅니다.
    const matchStatus = movie.status === currentStatus; // 고른 탭의 영화인지 확인합니다.
    const matchAge = currentAge === "all" || movie.age === currentAge; // 고른 등급인지 확인합니다.
    const matchKeyword = movie.title.replace(/\s/g, "").includes(keyword); // 이름에 검색어가 들어 있는지 확인합니다.
    const matchPeriod = isInPeriod(movie); // 고른 개봉 시기(최근 1개월·3개월) 안에 개봉했는지 확인합니다.
    return matchStatus && matchAge && matchKeyword && matchPeriod; // 네 조건을 모두 만족해야 보여 줍니다.
  }).sort(compareMovies); // 고른 정렬 방식으로 줄을 세웁니다.
  resultCount.textContent = `${shownMovies.length}편`; // 몇 편인지 씁니다.
  if (shownMovies.length === 0) { // 맞는 영화가 없으면
    movieList.innerHTML = `<p class="empty-message">조건에 맞는 영화가 없어요. 검색어나 등급을 바꿔 보세요.</p>`; // 안내 글을 보여 줍니다.
    return; // 카드는 만들지 않습니다.
  } // 결과 없음 처리를 마칩니다.
  movieList.innerHTML = shownMovies.map((movie) => { // 영화마다 카드 HTML을 만들어 이어 붙입니다.
    const dday = getDday(movie.openDate); // 개봉까지 남은 날을 구합니다.
    let infoLine = `예매율 <strong>${movie.rate}%</strong> · 누적 <strong>${formatAudience(movie.audience)}</strong>`; // 현재 상영작은 예매율과 누적 관객을 씁니다.
    if (movie.status === "soon") infoLine = `예매율 <strong>${movie.rate}%</strong> · ${formatDate(movie.openDate)} ${movie.reopen ? "재개봉" : "개봉"} <span class="dday">${dday}</span>`; // 예정작은 예매율, 개봉일, D-day를 씁니다.
    if (movie.status === "recent") infoLine = `누적 <strong>${formatAudience(movie.audience)}</strong> · ${formatDate(movie.openDate)} 개봉`; // 최근 개봉작은 누적 관객과 개봉일을 씁니다.
    return `<article class="movie-card"> <!-- 영화 카드 하나를 시작합니다. -->
      <button class="poster-button" type="button" data-detail="${movie.id}" aria-label="${movie.title} 상세정보">${makePosterHtml(movie, getRateRank(movie))}</button> <!-- 포스터를 누르면 상세 창이 열립니다. -->
      <p class="movie-name">${makeAgeBadge(movie.age)}<span>${movie.title}</span></p> <!-- 관람 등급과 영화 이름입니다. -->
      <p class="movie-info">${infoLine}</p> <!-- 예매율·누적 관객·개봉일 정보 줄입니다. -->
      <div class="card-links"><a href="${CGV_CHART_URL}" target="_blank" rel="noopener">CGV ↗</a><a href="${makeMegaboxUrl(movie)}" target="_blank" rel="noopener">메가박스 ↗</a></div> <!-- 극장 예매 링크 두 개입니다. -->
    </article>`; // 영화 카드를 마치고 HTML 글자로 돌려줍니다.
  }).join(""); // 카드 HTML들을 하나로 합쳐 화면에 넣습니다.
} // 무비차트 그리기 함수를 마칩니다.

// 탭 바꾸기: 누른 탭을 강조하고 그 탭의 영화 목록을 보여 줍니다.
function changeTab(event) { // event는 탭 클릭 정보입니다.
  currentStatus = event.currentTarget.dataset.status; // 누른 탭의 종류(now/soon)를 기억합니다.
  tabButtons.forEach((tab) => { // 모든 탭을 하나씩 확인합니다.
    const isActive = tab === event.currentTarget; // 누른 탭인지 확인합니다.
    tab.classList.toggle("active", isActive); // 누른 탭만 강조합니다.
    tab.setAttribute("aria-selected", String(isActive)); // 스크린 리더에 고른 탭을 알려 줍니다.
  }); // 탭 확인을 마칩니다.
  document.getElementById("chartDate").textContent = currentStatus === "recent" ? RECENT_DATE_TEXT : CHART_DATE_TEXT; // 탭에 맞는 자료 기준 날짜를 씁니다.
  renderChart(); // 목록을 다시 그립니다.
} // 탭 바꾸기 함수를 마칩니다.

// 등급 거르기: 누른 등급 버튼을 강조하고 목록을 다시 그립니다.
function changeAge(event) { // event는 클릭 정보입니다.
  const chip = event.target.closest(".chip"); // 누른 곳에서 등급 버튼을 찾습니다.
  if (chip === null) return; // 버튼 사이 빈 곳을 누르면 아무것도 하지 않습니다.
  currentAge = chip.dataset.age; // 고른 등급을 기억합니다.
  ageFilter.querySelectorAll(".chip").forEach((button) => button.classList.toggle("active", button === chip)); // 누른 버튼만 강조합니다.
  renderChart(); // 목록을 다시 그립니다.
} // 등급 거르기 함수를 마칩니다.

// 박스오피스 표 그리기: 순위, 변동, 관객 수, 점유율 막대, 누적 관객을 표로 보여 줍니다.
function renderBoxOffice() { // 페이지가 열릴 때 한 번 실행합니다.
  const maxShare = Math.max(...boxOffice.map((item) => item.share)); // 가장 큰 점유율을 구합니다. (막대 길이의 기준)
  boxOfficeBody.innerHTML = boxOffice.map((item) => { // 순위마다 표 한 줄을 만듭니다.
    let changeHtml = `<span class="change same">-</span>`; // 기본은 변동 없음(-)입니다.
    if (item.change > 0) changeHtml = `<span class="change up">▲${item.change}</span>`; // 순위가 오르면 빨간 ▲입니다.
    if (item.change < 0) changeHtml = `<span class="change down">▼${-item.change}</span>`; // 순위가 내리면 파란 ▼입니다.
    const titleHtml = item.movieId ? `<button class="box-title" type="button" data-detail="${item.movieId}">${item.title}</button>` : `<strong>${item.title}</strong>`; // 상세 정보가 있는 영화만 누를 수 있는 버튼으로 만듭니다.
    return `<tr> <!-- 표 한 줄을 시작합니다. -->
      <td class="box-rank">${item.rank}${changeHtml}</td> <!-- 순위와 변동입니다. -->
      <td>${titleHtml}<span class="box-open">개봉 ${formatDate(item.openDate)}</span></td> <!-- 영화 이름과 개봉일입니다. -->
      <td data-label="관객">${item.dayAudience.toLocaleString("ko-KR")}명</td> <!-- 그날 관객 수입니다. -->
      <td data-label="점유율"><div class="share"><div class="share-bar"><span style="width:${(item.share / maxShare) * 100}%"></span></div>${item.share}%</div></td> <!-- 매출 점유율 막대와 숫자입니다. -->
      <td data-label="누적">${formatAudience(item.totalAudience)}</td> <!-- 누적 관객입니다. -->
    </tr>`; // 표 한 줄을 마치고 HTML 글자로 돌려줍니다.
  }).join(""); // 표 줄들을 하나로 합쳐 화면에 넣습니다.
} // 박스오피스 표 그리기 함수를 마칩니다.

// 상세 창 열기: 영화 번호로 정보를 찾아 상세 창을 채우고 엽니다.
function openMovieDialog(movieId) { // movieId는 영화 번호입니다.
  const movie = movies.find((item) => item.id === movieId); // 번호로 영화 정보를 찾습니다.
  if (!movie) return; // 없는 번호면 아무것도 하지 않습니다.
  openedMovieId = movieId; // 지금 열린 영화 번호를 기억합니다.
  const boxItem = boxOffice.find((item) => item.movieId === movieId); // 박스오피스 순위에 있는지 찾습니다.
  const dday = getDday(movie.openDate); // 개봉까지 남은 날을 구합니다.
  document.getElementById("dialogPoster").outerHTML = makePosterHtml(movie, "", "dialog-poster", "dialogPoster"); // 포스터를 이 영화 것으로 바꿉니다. (사진이 있으면 사진으로)
  const statusText = { now: "현재 상영중", soon: `상영 예정 <span class="dday">${dday}</span>`, recent: "최근 3개월 개봉작" }[movie.status]; // 상영 상태 글자를 고릅니다.
  document.getElementById("dialogBadge").innerHTML = `${makeAgeBadge(movie.age)}${statusText}`; // 등급과 상영 상태를 씁니다.
  document.getElementById("dialogTitle").textContent = movie.title; // 제목을 씁니다.
  const rows = [[movie.reopen ? "재개봉일" : "개봉일", formatDate(movie.openDate)]]; // 정보 표에 넣을 [이름, 값] 목록입니다. 먼저 개봉일 줄을 넣습니다.
  if (movie.rate !== null) rows.push(["예매율", `${movie.rate}% (${movie.status === "now" ? "현재 상영작" : "상영 예정작"} ${getRateRank(movie)}위)`]); // 예매율 자료가 있으면 예매율과 순위 줄을 더합니다.
  if (movie.status === "recent") rows.push(["관객 순위", `최근 3개월 개봉작 중 ${getRateRank(movie)}위`]); // 최근 개봉작은 관객 순위 줄을 더합니다.
  if (movie.audience > 0) rows.push(["누적 관객", formatAudience(movie.audience)]); // 관객 자료가 있으면 누적 관객 줄을 더합니다.
  if (boxItem) rows.push(["박스오피스", `${boxItem.rank}위 (하루 ${boxItem.dayAudience.toLocaleString("ko-KR")}명)`]); // 박스오피스에 있으면 순위 줄을 더합니다.
  document.getElementById("dialogTable").innerHTML = rows.map(([name, value]) => `<tr><th>${name}</th><td>${value}</td></tr>`).join(""); // 정보 표를 채웁니다.
  document.getElementById("dialogLinks").innerHTML = `<a class="button primary" href="${CGV_CHART_URL}" target="_blank" rel="noopener">CGV에서 예매 ↗</a><a class="button" href="${makeMegaboxUrl(movie)}" target="_blank" rel="noopener">메가박스에서 예매 ↗</a>`; // 극장 예매 링크를 넣습니다.
  loadWikiSummary(movie); // 위키백과 소개 글을 불러옵니다.
  movieDialog.showModal(); // 상세 창을 화면 가운데에 띄웁니다.
} // 상세 창 열기 함수를 마칩니다.

// 위키백과 소개 불러오기: 공개 API로 영화 문서의 첫 문단을 가져와 보여 줍니다. (키·회원가입 없음)
async function loadWikiSummary(movie) { // movie는 영화 정보입니다.
  if (!movie.wiki) { // 연결할 위키백과 문서가 없으면
    wikiText.textContent = "아직 위키백과에 이 영화 문서가 없어요. 극장 사이트에서 줄거리를 확인해 주세요."; // 안내 글을 보여 줍니다.
    return; // 요청하지 않고 마칩니다.
  } // 문서 없음 처리를 마칩니다.
  wikiText.textContent = "위키백과에서 소개를 불러오고 있어요…"; // 불러오는 중이라고 알려 줍니다.
  try { // 인터넷 오류가 나도 페이지가 멈추지 않게 합니다.
    const summary = await fetchWikiSummary(movie.wiki); // 위키백과 요약을 받습니다. (한 번 받은 글은 다시 요청하지 않음)
    if (openedMovieId !== movie.id) return; // 기다리는 동안 다른 영화 창을 열었으면 이 글은 쓰지 않습니다.
    wikiText.textContent = summary.extract || "소개 글이 비어 있어요."; // 첫 문단을 글자로만 넣습니다. (HTML이 섞여 들어오지 않게 textContent)
    const moreLink = document.createElement("a"); // '더 보기' 링크를 만듭니다.
    moreLink.href = summary.content_urls.desktop.page; // 위키백과 문서 주소를 넣습니다.
    moreLink.target = "_blank"; // 새 탭에서 엽니다.
    moreLink.rel = "noopener"; // 새 탭이 이 페이지를 건드리지 못하게 합니다.
    moreLink.textContent = " 위키백과에서 더 보기 ↗"; // 링크 글자입니다.
    wikiText.append(moreLink); // 소개 글 뒤에 링크를 붙입니다.
  } catch (error) { // 요청이 실패하면
    if (openedMovieId !== movie.id) return; // 다른 영화 창이면 아무것도 하지 않습니다.
    wikiText.textContent = "소개를 불러오지 못했어요. 인터넷 연결을 확인해 주세요."; // 실패 안내를 보여 줍니다.
    console.error(error); // 개발자 도구에 오류를 남깁니다.
  } // 오류 처리를 마칩니다.
} // 위키백과 소개 함수를 마칩니다.

// 상세 버튼 처리: data-detail이 붙은 곳(포스터, 배너 버튼, 표 제목)을 누르면 상세 창을 엽니다.
function handleDetailClick(event) { // event는 클릭 정보입니다.
  const detailButton = event.target.closest("[data-detail]"); // 누른 곳에서 영화 번호가 있는 요소를 찾습니다.
  if (detailButton) openMovieDialog(Number(detailButton.dataset.detail)); // 찾았으면 그 영화의 상세 창을 엽니다.
} // 상세 버튼 처리 함수를 마칩니다.

// ----- 이벤트 연결 -----
menuButton.addEventListener("click", toggleMenu); // 햄버거 버튼을 누르면 메뉴를 열고 닫습니다.
mainMenu.addEventListener("click", () => { if (mainMenu.classList.contains("open")) toggleMenu(); }); // 메뉴 항목을 누르면 열린 메뉴를 닫습니다.
document.getElementById("heroPrev").addEventListener("click", () => { showSlide(currentSlide - 1); restartAutoSlide(); }); // 이전 화살표를 누르면 이전 배너를 보여 줍니다.
document.getElementById("heroNext").addEventListener("click", () => { showSlide(currentSlide + 1); restartAutoSlide(); }); // 다음 화살표를 누르면 다음 배너를 보여 줍니다.
tabButtons.forEach((tab) => tab.addEventListener("click", changeTab)); // 탭을 누르면 목록을 바꿉니다.
movieSearch.addEventListener("input", renderChart); // 검색어를 칠 때마다 목록을 걸러 줍니다.
sortSelect.addEventListener("change", renderChart); // 정렬을 바꾸면 목록을 다시 세웁니다.
periodSelect.addEventListener("change", renderChart); // 개봉 시기를 바꾸면 목록을 다시 거릅니다.
ageFilter.addEventListener("click", changeAge); // 등급 버튼을 누르면 목록을 거릅니다.
document.addEventListener("click", handleDetailClick); // 페이지 어디서든 상세 버튼을 누르면 상세 창을 엽니다.
document.getElementById("dialogClose").addEventListener("click", () => movieDialog.close()); // 닫기 버튼을 누르면 상세 창을 닫습니다.
movieDialog.addEventListener("click", (event) => { if (event.target === movieDialog) movieDialog.close(); }); // 창 바깥 어두운 곳을 누르면 상세 창을 닫습니다.
movieDialog.addEventListener("close", () => { openedMovieId = null; }); // 창이 닫히면 열린 영화 번호를 지웁니다. (Esc 키로 닫아도 실행)

// ----- 처음 화면 그리기 -----
document.getElementById("chartDate").textContent = CHART_DATE_TEXT; // 무비차트 기준 날짜를 씁니다.
document.getElementById("boxOfficeDate").textContent = BOX_OFFICE_DATE_TEXT; // 박스오피스 기준 날짜를 씁니다.
renderHero(); // 배너를 만듭니다.
restartAutoSlide(); // 배너 자동 넘김을 시작합니다.
renderChart(); // 처음에는 현재 상영작을 예매율순으로 보여 줍니다.
renderBoxOffice(); // 박스오피스 표를 그립니다.
loadPosterImages(); // 위키백과에 사진이 있는 영화는 사진 포스터로 바꿉니다.
