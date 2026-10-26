/* 추첨(홈) 페이지 기능 */

/* 탭을 열 때마다 router.js가 실행합니다. 돌려주는 함수는 다른 탭으로 갈 때 정리용으로 실행됩니다. */
function initHomePage() {
  /* ---------- 현재 선택 상태 ---------- */
  const state = {
    categories: new Set(), // 비어 있으면 '전체'
    budgetIndex: 0,        // BUDGETS 배열의 위치
    tags: new Set(),
    activeTheme: null,     // 선택된 테마 번호 (없으면 null)
    excluded: new Set(),   // '이거 말고'로 이번에 뺀 메뉴 이름
    current: null,         // 지금 화면에 나온 메뉴
    decided: false,        // 지금 메뉴를 이미 기록했는지 (연타 방지)
    spinning: false
  };

  /* ---------- 화면 요소 ---------- */
  const el = {
    greetingTitle: document.getElementById('greetingTitle'),
    greetingSub: document.getElementById('greetingSub'),
    themeList: document.getElementById('themeList'),
    categoryChips: document.getElementById('categoryChips'),
    budgetChips: document.getElementById('budgetChips'),
    tagChips: document.getElementById('tagChips'),
    excludeRecent: document.getElementById('excludeRecent'),
    candidateCount: document.getElementById('candidateCount'),
    exclusionNote: document.getElementById('exclusionNote'),
    resetFilters: document.getElementById('resetFilters'),
    resultCard: document.getElementById('resultCard'),
    resultPhoto: document.getElementById('resultPhoto'),
    resultName: document.getElementById('resultName'),
    resultMeta: document.getElementById('resultMeta'),
    resultTags: document.getElementById('resultTags'),
    drawBtn: document.getElementById('drawBtn'),
    resultActions: document.getElementById('resultActions'),
    skipBtn: document.getElementById('skipBtn'),
    decideBtn: document.getElementById('decideBtn'),
    excludedBox: document.getElementById('excludedBox'),
    excludedList: document.getElementById('excludedList'),
    clearExcluded: document.getElementById('clearExcluded'),
    weatherBox: document.getElementById('weatherBox'),
    quickDrawBtn: document.getElementById('quickDrawBtn')
  };

  /* ---------- 버튼 만들기 ---------- */
  function makeChip(label, onClick) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.textContent = label;
    chip.setAttribute('aria-pressed', 'false');
    chip.addEventListener('click', onClick);
    return chip;
  }

  function setPressed(button, pressed) {
    button.setAttribute('aria-pressed', pressed ? 'true' : 'false');
  }

  function toggleInSet(set, value) {
    if (set.has(value)) set.delete(value);
    else set.add(value);
  }

  /* 테마 조건에 맞는 메뉴 하나를 무작위로 (방금 보여준 메뉴는 빼고) */
  function pickThemeMenu(theme, exceptName) {
    const blocked = loadData(STORAGE_KEYS.blocked, []); // 안 먹는 메뉴는 예시로도 보여주지 않음
    const list = MENUS.filter((menu) =>
      menu.name !== exceptName &&
      !blocked.includes(menu.name) &&
      menu.price <= BUDGETS[theme.budgetIndex].max &&
      theme.tags.every((tag) => menu.tags.includes(tag)));
    return list.length ? pickRandom(list) : null;
  }

  function renderThemes() {
    // 마우스가 있는 기기에서만 사진 바꾸기 (폰은 누르는 순간 바로 테마가 적용되므로)
    const canHover = window.matchMedia('(hover: hover)').matches;

    THEMES.forEach((theme, index) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'theme-card';
      card.setAttribute('aria-pressed', 'false');
      card.innerHTML =
        '<span class="theme-visual">' +
        '<span class="theme-emoji">' + theme.emoji + '</span>' +
        '<img class="theme-photo" alt="">' +
        '</span>' +
        '<span class="theme-title">' + theme.title + '</span>' +
        '<span class="theme-desc">' + theme.desc + '</span>';
      card.addEventListener('click', () => applyTheme(index));
      el.themeList.appendChild(card);
      if (canHover) setupThemePhoto(card, theme);
    });
  }

  /* 테마 카드에 마우스를 올리면(mouseover) 이모지가 그 테마에 맞는 메뉴 사진으로 바뀌고,
     떼면(mouseout) 원래 이모지로 돌아옴. 올릴 때마다 다른 메뉴 사진이 나옴 */
  function setupThemePhoto(card, theme) {
    const photo = card.querySelector('.theme-photo');
    const desc = card.querySelector('.theme-desc');
    let next = pickThemeMenu(theme, null);
    if (!next) return;

    // 다음에 보여줄 사진을 미리 받아 둠 (올리자마자 바로 보이게)
    function preloadNext() {
      next = pickThemeMenu(theme, photo.dataset.name) || next;
      preloadMenuImages([next]);
    }
    preloadMenuImages([next]);

    card.addEventListener('mouseover', () => {
      if (card.classList.contains('show-photo')) return; // 카드 안에서 움직일 때는 그대로
      photo.src = menuImageUrl(next);
      photo.dataset.name = next.name;
      desc.textContent = '예: ' + next.name;
      card.classList.add('show-photo');
      preloadNext();
    });

    card.addEventListener('mouseout', (e) => {
      if (card.contains(e.relatedTarget)) return; // 아직 카드 안
      card.classList.remove('show-photo');
      desc.textContent = theme.desc;
    });

    // 사진을 못 불러오면 이모지 그대로
    photo.addEventListener('error', () => card.classList.remove('show-photo'));
  }

  function renderChips() {
    // 종류: 여러 개 선택
    CATEGORIES.forEach((cat) => {
      el.categoryChips.appendChild(makeChip(cat, () => {
        toggleInSet(state.categories, cat);
        onManualChange();
      }));
    });

    // 예산: 하나만 선택
    BUDGETS.forEach((budget, index) => {
      el.budgetChips.appendChild(makeChip(budget.label, () => {
        state.budgetIndex = index;
        onManualChange();
      }));
    });

    // 상황: 여러 개 선택 (모두 만족)
    TAGS.forEach((tag) => {
      el.tagChips.appendChild(makeChip('#' + tag, () => {
        toggleInSet(state.tags, tag);
        onManualChange();
      }));
    });
  }

  /* 상태(state)에 맞게 모든 버튼의 눌림 표시를 다시 그림 */
  function syncButtons() {
    el.categoryChips.querySelectorAll('.chip').forEach((chip, i) => setPressed(chip, state.categories.has(CATEGORIES[i])));
    el.budgetChips.querySelectorAll('.chip').forEach((chip, i) => setPressed(chip, i === state.budgetIndex));
    el.tagChips.querySelectorAll('.chip').forEach((chip, i) => setPressed(chip, state.tags.has(TAGS[i])));
    el.themeList.querySelectorAll('.theme-card').forEach((card, i) => setPressed(card, i === state.activeTheme));
  }

  /* 칩을 직접 누르면 테마 선택은 풀림 */
  function onManualChange() {
    state.activeTheme = null;
    syncButtons();
    updateCandidates();
  }

  function clearFilters() {
    state.categories.clear();
    state.tags.clear();
    state.budgetIndex = 0;
    state.activeTheme = null;
  }

  function applyTheme(index) {
    // 이미 선택된 테마를 다시 누르면 해제
    if (state.activeTheme === index) {
      clearFilters();
    } else {
      const theme = THEMES[index];
      clearFilters();
      theme.tags.forEach((tag) => state.tags.add(tag));
      state.budgetIndex = theme.budgetIndex;
      state.activeTheme = index;
    }
    syncButtons();
    updateCandidates();
  }

  /* 날씨 배너의 '추천 조건 적용' */
  function applyWeatherTags(tags) {
    clearFilters();
    tags.forEach((tag) => state.tags.add(tag));
    // 같은 조건의 테마가 있으면 그 테마 카드도 선택 표시
    const sameTheme = THEMES.findIndex((t) => t.budgetIndex === 0 && t.tags.join() === tags.join());
    state.activeTheme = sameTheme >= 0 ? sameTheme : null;
    syncButtons();
    updateCandidates();
    showToast('#' + tags.join(' #') + ' 조건을 적용했어요');
  }

  /* 고른 조건 저장/복원 (다시 들어와도 유지, 월드컵에서도 사용) */
  function persistFilters() {
    saveData(STORAGE_KEYS.filters, {
      categories: [...state.categories],
      budgetIndex: state.budgetIndex,
      tags: [...state.tags],
      activeTheme: state.activeTheme
    });
  }

  function restoreFilters() {
    const saved = loadData(STORAGE_KEYS.filters, null);
    if (!saved) return;
    (saved.categories || []).filter((c) => CATEGORIES.includes(c)).forEach((c) => state.categories.add(c));
    (saved.tags || []).filter((t) => TAGS.includes(t)).forEach((t) => state.tags.add(t));
    state.budgetIndex = BUDGETS[saved.budgetIndex] ? saved.budgetIndex : 0;
    state.activeTheme = THEMES[saved.activeTheme] ? saved.activeTheme : null;
  }

  function resetFilters() {
    clearFilters();
    syncButtons();
    updateCandidates();
  }

  /* ---------- 조건에 맞는 후보 계산 ---------- */
  function matchesFilters(menu) {
    if (state.categories.size > 0 && !state.categories.has(menu.category)) return false;
    if (menu.price > BUDGETS[state.budgetIndex].max) return false;
    for (const tag of state.tags) {
      if (!menu.tags.includes(tag)) return false;
    }
    return !state.excluded.has(menu.name);
  }

  function getCandidates() {
    const { blocked, recent } = getPreferenceExclusions();
    return MENUS.filter((menu) =>
      matchesFilters(menu) && !blocked.includes(menu.name) && !recent.includes(menu.name)
    );
  }

  function updateCandidates() {
    const matched = MENUS.filter(matchesFilters);
    const { blocked, recent } = getPreferenceExclusions();
    const blockedCount = matched.filter((menu) => blocked.includes(menu.name)).length;
    const recentCount = matched.filter((menu) => recent.includes(menu.name)).length;
    const count = matched.length - blockedCount - recentCount;

    if (count === 0) {
      el.candidateCount.textContent = '조건에 맞는 메뉴가 없어요';
      el.candidateCount.classList.add('empty');
    } else {
      el.candidateCount.innerHTML = '후보 <strong>' + count + '</strong>개';
      el.candidateCount.classList.remove('empty');
    }

    // 사용자 설정 때문에 빠진 메뉴가 있으면 알려줌
    const notes = [];
    if (blockedCount > 0) notes.push('🚫 안 먹는 메뉴 ' + blockedCount + '개');
    if (recentCount > 0) notes.push('🕒 최근 먹은 메뉴 ' + recentCount + '개');
    el.exclusionNote.hidden = notes.length === 0;
    el.exclusionNote.textContent = notes.join(' · ') + ' 제외 중';

    el.drawBtn.disabled = count === 0 || state.spinning;
    el.quickDrawBtn.disabled = el.drawBtn.disabled;
    persistFilters();
  }

  /* ---------- 결과 카드 표시 ---------- */
  function showMenu(menu, isFinal) {
    el.resultName.textContent = menu.name;
    if (isFinal) {
      el.resultPhoto.classList.remove('placeholder');
      el.resultPhoto.innerHTML = menuPhotoHtml(menu, false);
      el.resultMeta.textContent = menu.category + ' · ' + formatPrice(menu.price);
      el.resultTags.innerHTML = menu.tags.map((t) => '<span class="tag">#' + t + '</span>').join('');
      el.resultCard.style.setProperty('--card-bg', CATEGORY_COLORS[menu.category]);
    } else {
      el.resultMeta.textContent = '두구두구…';
      el.resultTags.innerHTML = '';
    }
  }

  function setDecideButton(decided) {
    state.decided = decided;
    el.decideBtn.disabled = decided;
    el.decideBtn.textContent = decided ? '✔ 기록했어요' : '✅ 이걸로 결정';
  }

  function finishDraw(menu) {
    state.current = menu;
    state.spinning = false;
    showMenu(menu, true);

    el.resultCard.classList.remove('spinning');
    el.resultCard.classList.remove('pop');
    void el.resultCard.offsetWidth; // 애니메이션을 다시 시작하기 위한 트릭
    el.resultCard.classList.add('pop');

    updateMenuActions(menu); // 지도·문자·메일 링크를 이 메뉴로
    setDecideButton(false);
    el.resultActions.hidden = false;
    el.drawBtn.textContent = '🎲 다시 추첨하기';
    updateCandidates();
  }

  /* ---------- 룰렛 추첨 ----------
     메뉴 이름이 빠르게 바뀌다가 점점 느려지면서 멈춥니다. */
  function draw() {
    const candidates = getCandidates();
    if (candidates.length === 0 || state.spinning) return;

    const finalMenu = pickRandom(candidates);
    preloadMenuImages([finalMenu]); // 룰렛이 도는 동안 결과 사진을 미리 받아 둠

    // '동작 줄이기' 설정을 켠 사용자에게는 바로 결과를 보여줍니다.
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || candidates.length === 1) {
      finishDraw(finalMenu);
      return;
    }

    state.spinning = true;
    el.drawBtn.disabled = true;
    el.quickDrawBtn.disabled = true;
    el.resultActions.hidden = true;
    el.resultCard.style.removeProperty('--card-bg');
    el.resultCard.classList.add('spinning');
    el.resultPhoto.classList.add('placeholder');
    el.resultPhoto.innerHTML = '<span>?</span>';

    let delay = 50;
    let last = null;

    function tick() {
      if (delay > 320) {
        finishDraw(finalMenu);
        return;
      }
      let next = pickRandom(candidates);
      while (next === last) next = pickRandom(candidates); // 같은 메뉴 연속 방지
      last = next;
      showMenu(next, false);
      delay *= 1.15;
      setTimeout(tick, delay);
    }
    tick();
  }

  /* ---------- 결과 카드 버튼들 ---------- */
  function skipCurrent() {
    if (!state.current || state.spinning) return;
    state.excluded.add(state.current.name);
    renderExcluded();
    updateCandidates();

    if (getCandidates().length === 0) {
      showToast('남은 후보가 없어요. 뺀 메뉴를 되돌리거나 조건을 바꿔 보세요.');
      return;
    }
    draw();
  }

  function renderExcluded() {
    el.excludedBox.hidden = state.excluded.size === 0;
    el.excludedList.textContent = [...state.excluded].join(', ');
  }

  function clearExcluded() {
    state.excluded.clear();
    renderExcluded();
    updateCandidates();
  }

  function decideCurrent() {
    if (!state.current || state.decided) return;
    saveDecision(state.current);
    setDecideButton(true);
    updateCandidates();
    showToast('오늘은 ' + state.current.name + '! 맛있게 드세요 😋');
  }

  /* ---------- 시작 ---------- */
  const updateMenuActions = setupMenuActions(el.resultActions, '오늘 메뉴는');
  const greeting = getTimeGreeting();
  el.greetingTitle.textContent = greeting.title;
  const user = typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
  el.greetingSub.textContent = (user ? user.nickname + '님, ' : '') + greeting.sub;

  renderThemes();
  renderChips();
  restoreFilters();
  syncButtons();
  el.excludeRecent.checked = getSettings().excludeRecent;
  updateCandidates();
  initWeather(el.weatherBox, applyWeatherTags);

  /* 폰 화면: 원래 추첨 버튼이 화면 밖에 있으면 아래쪽에 '빠른 추첨' 버튼을 띄움 */
  let observer = null;
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver((entries) => {
      el.quickDrawBtn.classList.toggle('show', !entries[0].isIntersecting);
    });
    observer.observe(el.drawBtn);
  }

  el.quickDrawBtn.addEventListener('click', () => {
    el.resultCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    draw();
  });

  el.excludeRecent.addEventListener('change', () => {
    updateSettings({ excludeRecent: el.excludeRecent.checked });
    updateCandidates();
  });
  el.drawBtn.addEventListener('click', draw);
  el.resetFilters.addEventListener('click', resetFilters);
  el.skipBtn.addEventListener('click', skipCurrent);
  el.clearExcluded.addEventListener('click', clearExcluded);
  el.decideBtn.addEventListener('click', decideCurrent);

  // 다른 탭으로 갈 때: 화면 감시 중지
  return function cleanup() {
    if (observer) observer.disconnect();
  };
}
