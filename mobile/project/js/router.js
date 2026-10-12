/* 탭 이동 (끊김 없는 BGM)
   - 탭을 누르면 페이지 전체를 새로 불러오지 않고 가운데 내용(<main>)만 바꿔 끼웁니다.
   - 헤더(BGM 버튼)와 음악 플레이어는 그대로 남아 있어서 음악이 끊기지 않습니다.
   - 주소창 주소와 뒤로가기/앞으로가기는 평소처럼 동작합니다.
   - 파일을 직접 열었거나(file://) 내용을 불러오지 못하면 평소처럼 페이지를 이동합니다. */

const PAGE_INITS = {
  home: initHomePage,
  worldcup: initWorldcupPage,
  menus: initDexPage,
  history: initHistoryPage,
  roulette: initRoulettePage,
  split: initSplitPage,
  credits: initCreditsPage
};

let pageCleanup = null;     // 지금 탭을 떠날 때 실행할 정리 함수
const pageCache = new Map(); // 한 번 불러온 페이지는 기억해서 다음엔 바로 보여줌

/* 지금 <main>에 맞는 페이지 기능 실행 */
function startPage() {
  if (typeof pageCleanup === 'function') pageCleanup();
  pageCleanup = null;
  const main = document.querySelector('main[data-page]');
  const init = main && PAGE_INITS[main.dataset.page];
  if (init) pageCleanup = init() || null;
}

/* 이 사이트 안의 다른 탭으로 가는 링크인지 */
function getInternalUrl(link) {
  if (!link || link.target === '_blank' || link.hasAttribute('download')) return null;
  const url = new URL(link.getAttribute('href'), location.href);
  if (url.origin !== location.origin || !/\.html$/.test(url.pathname)) return null;
  return url;
}

function fetchPage(url) {
  if (!pageCache.has(url)) {
    pageCache.set(url, fetch(url).then((res) => {
      if (!res.ok) throw new Error('page ' + res.status);
      return res.text();
    }).catch((err) => {
      pageCache.delete(url);
      throw err;
    }));
  }
  return pageCache.get(url);
}

async function goTo(url, addToHistory) {
  try {
    const html = await fetchPage(url);
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const newMain = doc.querySelector('main[data-page]');
    if (!newMain) throw new Error('no main');

    // 가운데 내용과 메뉴(현재 탭 표시)만 교체
    document.querySelector('main[data-page]').replaceWith(newMain);
    const newNav = doc.querySelector('.main-nav');
    if (newNav) document.querySelector('.main-nav').replaceWith(newNav);
    document.title = doc.title;

    if (addToHistory) history.pushState({}, '', url);
    window.scrollTo(0, 0);
    startPage();

    // 화면 낭독기 사용자를 위해 새 내용으로 초점 이동
    newMain.setAttribute('tabindex', '-1');
    newMain.focus({ preventScroll: true });
  } catch (e) {
    window.location.href = url; // 실패하면 평소처럼 이동
  }
}

document.addEventListener('DOMContentLoaded', () => {
  startPage();

  // 파일을 직접 연 경우는 브라우저가 내용 불러오기를 막아서 평소처럼 이동
  if (location.protocol === 'file:') return;

  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    const url = getInternalUrl(e.target.closest('a[href]'));
    if (!url) return;
    e.preventDefault();
    if (url.href === location.href) {
      window.scrollTo({ top: 0, behavior: 'smooth' }); // 지금 탭을 다시 누르면 맨 위로
      return;
    }
    goTo(url.href, true);
  });

  // 링크에 마우스를 올리거나 손가락을 대면 미리 불러와서 더 빠르게
  ['mouseover', 'touchstart'].forEach((type) => {
    document.addEventListener(type, (e) => {
      const url = getInternalUrl(e.target.closest && e.target.closest('a[href]'));
      if (url && url.href !== location.href) fetchPage(url.href).catch(() => {});
    }, { passive: true });
  });

  // 뒤로가기 / 앞으로가기
  window.addEventListener('popstate', () => goTo(location.href, false));
});
