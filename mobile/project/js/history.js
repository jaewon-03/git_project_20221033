/* 기록 페이지 기능 */

/* 탭을 열 때마다 router.js가 실행합니다. 돌려주는 함수는 다른 탭으로 갈 때 정리용으로 실행됩니다. */
function initHistoryPage() {
  const histEl = {
    empty: document.getElementById('historyEmpty'),
    content: document.getElementById('historyContent'),
    demoBtn: document.getElementById('demoBtn'),
    statWeek: document.getElementById('statWeek'),
    statTop: document.getElementById('statTop'),
    statCategory: document.getElementById('statCategory'),
    topList: document.getElementById('topList'),
    categoryChart: document.getElementById('categoryChart'),
    historyList: document.getElementById('historyList'),
    clearAllBtn: document.getElementById('clearAllBtn')
  };

  const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

  /* 예전 기록에 종류 정보가 없으면 메뉴 데이터에서 찾아 채움 */
  function getHistory() {
    return loadData(STORAGE_KEYS.history, []).map((item) => {
      const menu = findMenu(item.name);
      return Object.assign({ category: menu ? menu.category : '기타', emoji: menu ? menu.emoji : '🍽️' }, item);
    });
  }

  /* 이름별/종류별 횟수 세기 → 많은 순으로 정렬 */
  function countBy(list, key) {
    const counts = {};
    list.forEach((item) => {
      counts[item[key]] = (counts[item[key]] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }

  function startOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /* 날짜 → '오늘', '어제', '10월 3일 (금)' */
  function dateLabel(date) {
    const diff = Math.round((startOfDay(new Date()) - startOfDay(date)) / DAY_MS);
    if (diff === 0) return '오늘';
    if (diff === 1) return '어제';
    return (date.getMonth() + 1) + '월 ' + date.getDate() + '일 (' + WEEKDAYS[date.getDay()] + ')';
  }

  function timeLabel(date) {
    const h = date.getHours();
    const m = String(date.getMinutes()).padStart(2, '0');
    return (h < 12 ? '오전 ' : '오후 ') + (h % 12 === 0 ? 12 : h % 12) + ':' + m;
  }

  /* ---------- 화면 그리기 ---------- */
  function renderStats(history) {
    // 최근 7일(오늘 포함) 동안 결정한 끼니 수
    const weekStart = new Date(startOfDay(new Date()).getTime() - 6 * DAY_MS);
    const weekCount = history.filter((item) => new Date(item.date) >= weekStart).length;
    histEl.statWeek.textContent = weekCount + '끼';

    const byName = countBy(history, 'name');
    histEl.statTop.textContent = byName[0][0];

    const byCategory = countBy(history, 'category');
    histEl.statCategory.textContent = byCategory[0][0];

    // TOP 3
    const medals = ['🥇', '🥈', '🥉'];
    histEl.topList.innerHTML = byName.slice(0, 3).map(([name, count], i) => {
      const menu = findMenu(name);
      return '<li><span class="medal">' + medals[i] + '</span>' +
        (menu ? '<span class="thumb small">' + menuPhotoHtml(menu, true) + '</span>' : '') +
        '<span class="top-name">' + name + '</span>' +
        '<span class="top-count">' + count + '번</span></li>';
    }).join('');

    // 종류별 막대 그래프 (가장 많은 종류를 100%로)
    const max = byCategory[0][1];
    histEl.categoryChart.innerHTML = byCategory.map(([category, count]) =>
      '<div class="bar-row">' +
      '<span class="bar-label">' + category + '</span>' +
      '<span class="bar-track"><span class="bar-fill" style="width:' + Math.round(count / max * 100) + '%"></span></span>' +
      '<span class="bar-count">' + count + '</span>' +
      '</div>'
    ).join('');
  }

  function renderList(history) {
    // 날짜별로 묶기
    const groups = [];
    history.forEach((item, index) => {
      const date = new Date(item.date);
      const label = dateLabel(date);
      let group = groups[groups.length - 1];
      if (!group || group.label !== label) {
        group = { label: label, items: [] };
        groups.push(group);
      }
      group.items.push({ item: item, date: date, index: index });
    });

    histEl.historyList.innerHTML = groups.map((group) =>
      '<div class="day-group">' +
      '<h3 class="day-label">' + group.label + '</h3>' +
      '<ul class="day-items">' +
      group.items.map(({ item, date, index }) =>
        '<li class="history-item">' +
        '<span class="thumb" style="--card-bg:' + (CATEGORY_COLORS[item.category] || '#f3ece6') + '">' +
        (findMenu(item.name) ? menuPhotoHtml(findMenu(item.name), true) : '') + '</span>' +
        '<div class="history-info"><strong>' + item.name + '</strong><span>' + item.category + ' · ' + timeLabel(date) + '</span></div>' +
        '<button type="button" class="icon-btn small" data-index="' + index + '" title="이 기록 삭제">✕<span class="sr-only">' + item.name + ' 기록 삭제</span></button>' +
        '</li>'
      ).join('') +
      '</ul></div>'
    ).join('');

    histEl.historyList.querySelectorAll('[data-index]').forEach((btn) => {
      btn.addEventListener('click', () => deleteItem(Number(btn.dataset.index)));
    });
  }

  function render() {
    const history = getHistory();
    histEl.empty.hidden = history.length > 0;
    histEl.content.hidden = history.length === 0;
    if (history.length === 0) return;
    renderStats(history);
    renderList(history);
  }

  /* ---------- 삭제 ---------- */
  function deleteItem(index) {
    const history = loadData(STORAGE_KEYS.history, []);
    const removed = history.splice(index, 1)[0];
    saveData(STORAGE_KEYS.history, history);
    render();
    if (removed) showToast(removed.name + ' 기록을 삭제했어요');
  }

  function clearAll() {
    if (!confirm('기록을 모두 삭제할까요? 삭제한 기록은 되돌릴 수 없어요.')) return;
    saveData(STORAGE_KEYS.history, []);
    render();
    showToast('기록을 모두 삭제했어요');
  }

  /* ---------- 예시 기록 (발표·시연용) ----------
     최근 10일 동안 하루 1~2끼씩 무작위 메뉴를 넣어 줍니다. */
  function addDemoHistory() {
    const favorites = ['김치찌개', '돈까스', '마라탕', '김치찌개', '햄버거', '돈까스', '김치찌개'];
    const demo = [];
    for (let day = 9; day >= 0; day--) {
      const meals = day === 0 ? 1 : 1 + Math.floor(Math.random() * 2);
      for (let m = 0; m < meals; m++) {
        const date = startOfDay(new Date(Date.now() - day * DAY_MS));
        date.setHours(m === 0 ? 12 : 19, Math.floor(Math.random() * 50));
        if (date > new Date()) date.setTime(Date.now() - 60 * 1000);
        // 자주 먹는 메뉴가 보이도록 절반은 단골 메뉴에서 고름
        const menu = Math.random() < 0.5 ? findMenu(pickRandom(favorites)) : pickRandom(MENUS);
        demo.push({ name: menu.name, emoji: menu.emoji, category: menu.category, date: date.toISOString() });
      }
    }
    demo.sort((a, b) => new Date(b.date) - new Date(a.date));
    saveData(STORAGE_KEYS.history, demo);
    render();
    showToast('예시 기록을 넣었어요');
  }

  /* ---------- 시작 ---------- */
  render();
  histEl.demoBtn.addEventListener('click', addDemoHistory);
  histEl.clearAllBtn.addEventListener('click', clearAll);
}
