/* 메뉴 도감 페이지 기능 */

/* 탭을 열 때마다 router.js가 실행합니다. 돌려주는 함수는 다른 탭으로 갈 때 정리용으로 실행됩니다. */
function initDexPage() {
  const dexState = {
    keyword: '',
    category: '전체',
    favOnly: false,
    sort: 'default'
  };

  const dexEl = {
    searchInput: document.getElementById('searchInput'),
    categoryTabs: document.getElementById('categoryTabs'),
    favOnly: document.getElementById('favOnly'),
    sortSelect: document.getElementById('sortSelect'),
    dexCount: document.getElementById('dexCount'),
    menuGrid: document.getElementById('menuGrid'),
    dexEmpty: document.getElementById('dexEmpty'),
    dexEmptyTitle: document.getElementById('dexEmptyTitle'),
    dexEmptyDesc: document.getElementById('dexEmptyDesc')
  };

  /* ---------- 종류 탭 ---------- */
  function renderCategoryTabs() {
    ['전체', ...CATEGORIES].forEach((cat) => {
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'chip';
      tab.textContent = cat;
      tab.addEventListener('click', () => {
        dexState.category = cat;
        renderDex();
      });
      dexEl.categoryTabs.appendChild(tab);
    });
  }

  /* ---------- 조건에 맞는 메뉴 ---------- */
  function getVisibleMenus() {
    const favorites = loadData(STORAGE_KEYS.favorites, []);
    const keyword = dexState.keyword.trim().replace(/\s/g, '');

    let list = MENUS.filter((menu) => {
      if (dexState.category !== '전체' && menu.category !== dexState.category) return false;
      if (dexState.favOnly && !favorites.includes(menu.name)) return false;
      if (keyword && !menu.name.replace(/\s/g, '').includes(keyword)) return false;
      return true;
    });

    if (dexState.sort === 'priceAsc') list = list.slice().sort((a, b) => a.price - b.price);
    if (dexState.sort === 'priceDesc') list = list.slice().sort((a, b) => b.price - a.price);
    return list;
  }

  /* ---------- 카드 하나 만들기 ---------- */
  function createMenuCard(menu, isFav, isBlocked) {
    const card = document.createElement('article');
    card.className = 'menu-card' + (isBlocked ? ' blocked' : '');
    card.innerHTML =
      '<div class="menu-card-top" style="--card-bg:' + CATEGORY_COLORS[menu.category] + '">' +
      menuPhotoHtml(menu, true) +
      (isBlocked ? '<span class="blocked-badge">안 먹어요</span>' : '') +
      '</div>' +
      '<div class="menu-card-body">' +
      '  <h3>' + menu.name + '</h3>' +
      '  <p class="menu-card-meta">' + menu.category + ' · ' + formatPrice(menu.price) + '</p>' +
      '  <div class="menu-card-tags">' + menu.tags.map((t) => '<span>#' + t + '</span>').join('') + '</div>' +
      '</div>' +
      '<div class="menu-card-actions">' +
      '  <button type="button" class="icon-btn fav" aria-pressed="' + isFav + '" title="즐겨찾기">' + (isFav ? '⭐' : '☆') + '<span class="sr-only">즐겨찾기</span></button>' +
      '  <button type="button" class="icon-btn block" aria-pressed="' + isBlocked + '" title="안 먹는 메뉴">🚫<span class="sr-only">안 먹는 메뉴</span></button>' +
      '  <a class="icon-btn map" href="' + naverMapUrl(menu.name) + '" target="_blank" rel="noopener" title="네이버 지도에서 찾기">📍<span class="sr-only">지도에서 찾기</span></a>' +
      '</div>';

    card.querySelector('.fav').addEventListener('click', () => {
      const added = toggleListItem(STORAGE_KEYS.favorites, menu.name);
      showToast(added ? '⭐ ' + josa(menu.name, '을', '를') + ' 즐겨찾기에 추가했어요' : menu.name + ' 즐겨찾기를 해제했어요');
      renderDex();
    });

    card.querySelector('.block').addEventListener('click', () => {
      const added = toggleListItem(STORAGE_KEYS.blocked, menu.name);
      showToast(added ? '🚫 ' + josa(menu.name, '은', '는') + ' 이제 추첨에서 빠져요' : josa(menu.name, '을', '를') + ' 다시 추첨에 넣었어요');
      renderDex();
    });

    return card;
  }

  /* ---------- 화면 그리기 ---------- */
  function renderDex() {
    const favorites = loadData(STORAGE_KEYS.favorites, []);
    const blocked = loadData(STORAGE_KEYS.blocked, []);
    const list = getVisibleMenus();

    // 종류 탭 눌림 표시
    dexEl.categoryTabs.querySelectorAll('.chip').forEach((tab) => {
      tab.setAttribute('aria-pressed', tab.textContent === dexState.category ? 'true' : 'false');
    });

    dexEl.dexCount.innerHTML =
      '<strong>' + list.length + '</strong>개 메뉴 · ⭐ 즐겨찾기 ' + favorites.length + ' · 🚫 안 먹는 메뉴 ' + blocked.length;

    dexEl.menuGrid.innerHTML = '';
    list.forEach((menu) => {
      dexEl.menuGrid.appendChild(createMenuCard(menu, favorites.includes(menu.name), blocked.includes(menu.name)));
    });

    // 빈 화면 안내
    dexEl.dexEmpty.hidden = list.length > 0;
    if (list.length === 0) {
      if (dexState.favOnly && favorites.length === 0) {
        dexEl.dexEmptyTitle.textContent = '아직 즐겨찾기한 메뉴가 없어요';
        dexEl.dexEmptyDesc.textContent = '마음에 드는 메뉴의 ☆를 눌러 추가해 보세요.';
      } else {
        dexEl.dexEmptyTitle.textContent = '찾는 메뉴가 없어요';
        dexEl.dexEmptyDesc.textContent = '검색어나 종류를 바꿔 보세요.';
      }
    }
  }

  /* ---------- 종류별 요약표 ---------- */
  function roundPrice(won) {
    return Math.round(won / 100) * 100; // 백 원 단위로 반올림
  }

  function summarize(list) {
    const prices = list.map((m) => m.price);
    const cheapest = list.reduce((a, b) => (b.price < a.price ? b : a));
    return {
      count: list.length,
      avg: roundPrice(prices.reduce((a, b) => a + b, 0) / list.length),
      min: Math.min(...prices),
      max: Math.max(...prices),
      cheapest: cheapest
    };
  }

  function renderCategoryTable() {
    const tbody = document.getElementById('categoryTableBody');
    const tfoot = document.getElementById('categoryTableFoot');

    tbody.innerHTML = CATEGORIES.map((cat) => {
      const s = summarize(MENUS.filter((m) => m.category === cat));
      return '<tr>' +
        '<th scope="row"><button type="button" class="table-cat-btn" data-cat="' + cat + '" style="--card-bg:' + CATEGORY_COLORS[cat] + '">' + cat + '</button></th>' +
        '<td>' + s.count + '개</td>' +
        '<td>' + s.avg.toLocaleString('ko-KR') + '원</td>' +
        '<td class="col-range">' + s.min.toLocaleString('ko-KR') + ' ~ ' + s.max.toLocaleString('ko-KR') + '원</td>' +
        '<td>' + s.cheapest.name + ' <span class="table-sub">' + s.cheapest.price.toLocaleString('ko-KR') + '원</span></td>' +
        '</tr>';
    }).join('');

    const all = summarize(MENUS);
    tfoot.innerHTML = '<tr>' +
      '<th scope="row">전체</th>' +
      '<td>' + all.count + '개</td>' +
      '<td>' + all.avg.toLocaleString('ko-KR') + '원</td>' +
      '<td class="col-range">' + all.min.toLocaleString('ko-KR') + ' ~ ' + all.max.toLocaleString('ko-KR') + '원</td>' +
      '<td>' + all.cheapest.name + ' <span class="table-sub">' + all.cheapest.price.toLocaleString('ko-KR') + '원</span></td>' +
      '</tr>';

    // 종류 이름을 누르면 그 종류로 필터하고 카드 목록으로 이동
    tbody.querySelectorAll('.table-cat-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        dexState.category = btn.dataset.cat;
        renderDex();
        dexEl.menuGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  /* ---------- 시작 ---------- */
  renderCategoryTabs();
  renderCategoryTable();
  renderDex();

  dexEl.searchInput.addEventListener('input', () => {
    dexState.keyword = dexEl.searchInput.value;
    renderDex();
  });
  dexEl.favOnly.addEventListener('change', () => {
    dexState.favOnly = dexEl.favOnly.checked;
    renderDex();
  });
  dexEl.sortSelect.addEventListener('change', () => {
    dexState.sort = dexEl.sortSelect.value;
    renderDex();
  });
}
