/* 메뉴 월드컵 페이지 기능 */

/* 탭을 열 때마다 router.js가 실행합니다. 돌려주는 함수는 다른 탭으로 갈 때 정리용으로 실행됩니다. */
function initWorldcupPage() {
  const wcEl = {
    setupScreen: document.getElementById('setupScreen'),
    matchScreen: document.getElementById('matchScreen'),
    winnerScreen: document.getElementById('winnerScreen'),
    sourceList: document.getElementById('sourceList'),
    setupInfo: document.getElementById('setupInfo'),
    startBtn: document.getElementById('startBtn'),
    roundTitle: document.getElementById('roundTitle'),
    roundProgress: document.getElementById('roundProgress'),
    progressFill: document.getElementById('progressFill'),
    leftCard: document.getElementById('leftCard'),
    rightCard: document.getElementById('rightCard'),
    quitBtn: document.getElementById('quitBtn'),
    winnerCard: document.getElementById('winnerCard'),
    winnerPhoto: document.getElementById('winnerPhoto'),
    winnerName: document.getElementById('winnerName'),
    winnerMeta: document.getElementById('winnerMeta'),
    winnerTags: document.getElementById('winnerTags'),
    winnerPath: document.getElementById('winnerPath'),
    winnerActions: document.getElementById('winnerActions'),
    winnerDecide: document.getElementById('winnerDecide'),
    againBtn: document.getElementById('againBtn')
  };

  const wc = {
    source: 'all',
    size: 0,          // 처음 대진 크기 (16, 8, 4)
    current: [],      // 이번 라운드에 남은 메뉴
    next: [],         // 다음 라운드로 올라간 메뉴
    matchIndex: 0,    // 이번 라운드에서 몇 번째 경기인지
    played: 0,        // 지금까지 치른 경기 수
    finalOpponent: null,
    winner: null,
    locked: false     // 고른 직후 애니메이션 중에는 다시 못 누르게
  };

  /* ---------- 후보 고르기 ---------- */
  function describeSavedFilters(filters) {
    const parts = [];
    if (filters.categories.length) parts.push(filters.categories.join('·'));
    if (filters.budgetIndex > 0) parts.push(BUDGETS[filters.budgetIndex].label);
    filters.tags.forEach((tag) => parts.push('#' + tag));
    return parts.length ? parts.join(' · ') : '고른 조건이 없어요 (전체 메뉴)';
  }

  function getSources() {
    const blocked = loadData(STORAGE_KEYS.blocked, []);
    const favorites = loadData(STORAGE_KEYS.favorites, []);
    const filters = getSavedFilters();
    const notBlocked = MENUS.filter((menu) => !blocked.includes(menu.name));

    return [
      { id: 'all', emoji: '🍽️', title: '전체 메뉴', desc: '모든 메뉴 중에서 무작위로', pool: notBlocked },
      { id: 'filters', emoji: '🎯', title: '추첨 화면 조건', desc: describeSavedFilters(filters), pool: notBlocked.filter((menu) => matchesSavedFilters(menu, filters)) },
      { id: 'favorites', emoji: '⭐', title: '즐겨찾기 메뉴', desc: '도감에서 ⭐ 표시한 메뉴만', pool: notBlocked.filter((menu) => favorites.includes(menu.name)) }
    ];
  }

  /* 후보 수에 맞춰 가장 큰 대진 크기 (4개 미만이면 0) */
  function bracketSize(count) {
    if (count >= 16) return 16;
    if (count >= 8) return 8;
    if (count >= 4) return 4;
    return 0;
  }

  function roundName(remaining) {
    return remaining === 2 ? '결승' : remaining + '강';
  }

  function renderSetup() {
    const sources = getSources();
    // 고른 후보가 4개 미만이면 쓸 수 있는 첫 번째 후보로
    if (!bracketSize(sources.find((s) => s.id === wc.source).pool.length)) wc.source = 'all';

    wcEl.sourceList.innerHTML = '';
    sources.forEach((source) => {
      const size = bracketSize(source.pool.length);
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'source-card';
      card.setAttribute('role', 'radio');
      card.setAttribute('aria-checked', source.id === wc.source ? 'true' : 'false');
      card.disabled = size === 0;
      card.innerHTML =
        '<span class="source-emoji">' + source.emoji + '</span>' +
        '<span class="source-text"><strong>' + source.title + '</strong><span>' + source.desc + '</span></span>' +
        '<span class="source-count">' + (size ? '후보 ' + source.pool.length + '개 · ' + size + '강' : '후보 ' + source.pool.length + '개 · 4개 이상 필요') + '</span>';
      card.addEventListener('click', () => {
        wc.source = source.id;
        renderSetup();
      });
      wcEl.sourceList.appendChild(card);
    });

    const selected = sources.find((s) => s.id === wc.source);
    const size = bracketSize(selected.pool.length);
    wcEl.startBtn.disabled = size === 0;
    if (size === 0) {
      wcEl.setupInfo.textContent = '대결할 메뉴가 4개 이상 필요해요. 도감에서 🚫 표시를 줄여 보세요.';
      return;
    }
    wcEl.setupInfo.textContent = selected.pool.length > size
      ? '후보 ' + selected.pool.length + '개 중 ' + size + '개를 무작위로 뽑아 ' + size + '강으로 진행해요.'
      : size + '강으로 진행해요.';
  }

  /* ---------- 화면 전환 ---------- */
  function showScreen(name) {
    wcEl.setupScreen.hidden = name !== 'setup';
    wcEl.matchScreen.hidden = name !== 'match';
    wcEl.winnerScreen.hidden = name !== 'winner';
    window.scrollTo({ top: 0 });
  }

  /* ---------- 대결 진행 ---------- */
  function startWorldcup() {
    const pool = getSources().find((s) => s.id === wc.source).pool;
    wc.size = bracketSize(pool.length);
    if (!wc.size) return;

    wc.current = shuffle(pool).slice(0, wc.size);
    preloadMenuImages(wc.current); // 대진에 오른 메뉴 사진을 미리 받아 둠
    wc.next = [];
    wc.matchIndex = 0;
    wc.played = 0;
    wc.finalOpponent = null;
    wc.winner = null;
    showScreen('match');
    renderMatch();
  }

  function fillMatchCard(card, menu) {
    card.className = 'match-card';
    card.style.setProperty('--card-bg', CATEGORY_COLORS[menu.category]);
    card.innerHTML =
      '<span class="match-photo">' + menuPhotoHtml(menu, false) + '</span>' +
      '<strong class="match-name">' + menu.name + '</strong>' +
      '<span class="match-meta">' + menu.category + ' · ' + formatPrice(menu.price) + '</span>';
    card.setAttribute('aria-label', menu.name + ' 선택');
  }

  function renderMatch() {
    const remaining = wc.current.length;
    const matchesInRound = remaining / 2;
    wcEl.roundTitle.textContent = roundName(remaining);
    wcEl.roundProgress.textContent = remaining === 2 ? '마지막 경기!' : (wc.matchIndex + 1) + ' / ' + matchesInRound + ' 경기';
    wcEl.progressFill.style.width = Math.round(wc.played / (wc.size - 1) * 100) + '%';

    fillMatchCard(wcEl.leftCard, wc.current[wc.matchIndex * 2]);
    fillMatchCard(wcEl.rightCard, wc.current[wc.matchIndex * 2 + 1]);
    wc.locked = false;
  }

  function choose(side) {
    if (wc.locked || wcEl.matchScreen.hidden) return;
    wc.locked = true;

    const left = wc.current[wc.matchIndex * 2];
    const right = wc.current[wc.matchIndex * 2 + 1];
    const winner = side === 'left' ? left : right;
    const loser = side === 'left' ? right : left;

    (side === 'left' ? wcEl.leftCard : wcEl.rightCard).classList.add('chosen');
    (side === 'left' ? wcEl.rightCard : wcEl.leftCard).classList.add('lost');

    wc.next.push(winner);
    wc.played++;
    if (wc.current.length === 2) wc.finalOpponent = loser;

    setTimeout(() => {
      wc.matchIndex++;
      // 이번 라운드가 끝났으면 다음 라운드로
      if (wc.matchIndex * 2 >= wc.current.length) {
        wc.current = wc.next;
        wc.next = [];
        wc.matchIndex = 0;
      }
      if (wc.current.length === 1) showWinner(wc.current[0]);
      else renderMatch();
    }, 420);
  }

  /* ---------- 우승 ---------- */
  function showWinner(menu) {
    wc.winner = menu;
    wcEl.winnerPhoto.innerHTML = menuPhotoHtml(menu, false);
    wcEl.winnerName.textContent = menu.name;
    wcEl.winnerMeta.textContent = menu.category + ' · ' + formatPrice(menu.price);
    wcEl.winnerTags.innerHTML = menu.tags.map((t) => '<span class="tag">#' + t + '</span>').join('');
    wcEl.winnerCard.style.setProperty('--card-bg', CATEGORY_COLORS[menu.category]);
    wcEl.winnerPath.textContent = wc.size + '강부터 ' + Math.log2(wc.size) + '번 이겨서 우승했어요 · 결승 상대: ' +
      wc.finalOpponent.name;
    updateWinnerActions(menu); // 지도·문자·메일 링크를 우승 메뉴로
    wcEl.winnerDecide.disabled = false;
    wcEl.winnerDecide.textContent = '✅ 이걸로 결정';
    showScreen('winner');
    wcEl.winnerCard.classList.remove('pop');
    void wcEl.winnerCard.offsetWidth;
    wcEl.winnerCard.classList.add('pop');
  }

  /* ---------- 시작 ---------- */
  const updateWinnerActions = setupMenuActions(wcEl.winnerActions, '메뉴 월드컵 우승은');

  // 위쪽 하위 메뉴에서 들어온 경우 그 후보를 골라 둠 (worldcup.html?source=favorites)
  const startSource = new URLSearchParams(location.search).get('source');
  if (getSources().some((s) => s.id === startSource)) wc.source = startSource;
  renderSetup();
  if (startSource && startSource !== 'all' && wc.source === 'all') {
    showToast('후보가 4개보다 적어서 전체 메뉴로 골라 뒀어요.');
  }

  wcEl.startBtn.addEventListener('click', startWorldcup);
  wcEl.leftCard.addEventListener('click', () => choose('left'));
  wcEl.rightCard.addEventListener('click', () => choose('right'));
  wcEl.quitBtn.addEventListener('click', () => {
    renderSetup();
    showScreen('setup');
  });
  wcEl.againBtn.addEventListener('click', () => {
    renderSetup();
    showScreen('setup');
  });
  wcEl.winnerDecide.addEventListener('click', () => {
    if (!wc.winner || wcEl.winnerDecide.disabled) return;
    saveDecision(wc.winner);
    wcEl.winnerDecide.disabled = true;
    wcEl.winnerDecide.textContent = '✔ 기록했어요';
    showToast('오늘은 ' + wc.winner.name + '! 맛있게 드세요 😋');
  });

  // 키보드 ← → 로 고르기
  function onKeydown(e) {
    if (e.key === 'ArrowLeft') choose('left');
    if (e.key === 'ArrowRight') choose('right');
  }
  document.addEventListener('keydown', onKeydown);

  // 다른 탭으로 갈 때: 키보드 감시 중지
  return function cleanup() {
    document.removeEventListener('keydown', onKeydown);
  };
}
