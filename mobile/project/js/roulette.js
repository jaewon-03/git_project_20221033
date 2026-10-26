/* 돌림판 페이지 기능 */

/* 탭을 열 때마다 router.js가 실행합니다. 돌려주는 함수는 다른 탭으로 갈 때 정리용으로 실행됩니다. */
function initRoulettePage() {
  const STORE_KEY = STORAGE_KEYS.roulette;
  const MIN = 2;
  const MAX = 12;
  const COLORS = ['#ffd6c2', '#ffe9a8', '#ffcfd8', '#d9f0d2', '#d6e6fb', '#ffe1bd', '#eadcf8', '#fff1c9'];

  const rEl = {
    canvas: document.getElementById('wheelCanvas'),
    spinBtn: document.getElementById('spinBtn'),
    resultText: document.getElementById('wheelResultText'),
    resultActions: document.getElementById('wheelResultActions'),
    mapLink: document.getElementById('wheelMapLink'),
    smsLink: document.getElementById('wheelSmsLink'),
    shareBtn: document.getElementById('wheelShareBtn'),
    removeBtn: document.getElementById('wheelRemoveBtn'),
    decideBtn: document.getElementById('wheelDecideBtn'),
    resultPhoto: document.getElementById('wheelResultPhoto'),
    optionCount: document.getElementById('optionCount'),
    form: document.getElementById('optionForm'),
    input: document.getElementById('optionInput'),
    list: document.getElementById('optionList'),
    fillButtons: document.querySelectorAll('[data-fill]')
  };

  // 후보 목록과 '누가 계산?' 모드 여부를 기억
  const saved = loadData(STORE_KEY, null);
  const wheel = {
    options: saved && Array.isArray(saved.options) ? saved.options.slice(0, MAX) : ['김치찌개', '돈까스', '짜장면', '햄버거', '쌀국수', '떡볶이'],
    peopleMode: saved ? !!saved.peopleMode : false,
    rotation: 0,       // 지금 돌아간 각도 (라디안)
    spinning: false,
    frame: null,       // 애니메이션 번호 (탭을 떠날 때 멈추기 위해)
    result: null
  };

  function save() {
    saveData(STORE_KEY, { options: wheel.options, peopleMode: wheel.peopleMode });
  }

  /* ---------- 원판 그리기 (canvas) ---------- */
  const ctx = rEl.canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const SIZE = 440;
  rEl.canvas.width = SIZE * dpr;
  rEl.canvas.height = SIZE * dpr;
  ctx.scale(dpr, dpr);

  function drawWheel() {
    const n = wheel.options.length;
    const cx = SIZE / 2;
    const cy = SIZE / 2;
    const r = SIZE / 2 - 6;
    ctx.clearRect(0, 0, SIZE, SIZE);

    // 바깥 테두리
    ctx.beginPath();
    ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
    ctx.fillStyle = '#f25c1f';
    ctx.fill();

    if (n < MIN) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = '#fff8f1';
      ctx.fill();
      ctx.fillStyle = '#7a6a5f';
      ctx.font = '600 18px Pretendard, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('후보를 2개 이상 넣어 주세요', cx, cy - 70);
      return;
    }

    const seg = (Math.PI * 2) / n;
    const start = -Math.PI / 2 + wheel.rotation; // 12시 방향부터 시작
    const fontSize = n > 8 ? 15 : 17;
    const maxChars = n > 8 ? 6 : 8;

    for (let i = 0; i < n; i++) {
      const a0 = start + i * seg;
      const a1 = a0 + seg;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, a0, a1);
      ctx.closePath();
      // 색이 같은 칸이 붙지 않도록 (칸 수가 색 수보다 하나 많은 경우 등)
      let color = COLORS[i % COLORS.length];
      if (i === n - 1 && i % COLORS.length === 0 && n > 1) color = COLORS[3];
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 글자: 칸 가운데 방향으로 회전해서 바깥쪽에 씀
      const label = wheel.options[i].length > maxChars ? wheel.options[i].slice(0, maxChars - 1) + '…' : wheel.options[i];
      const mid = a0 + seg / 2;
      const leftSide = Math.cos(mid) < 0; // 원판 왼쪽 절반은 글자가 뒤집히므로 반대로 돌려서 씀
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(leftSide ? mid + Math.PI : mid);
      ctx.textAlign = leftSide ? 'left' : 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#2a1e17';
      ctx.font = '700 ' + fontSize + 'px Pretendard, "Malgun Gothic", sans-serif';
      ctx.fillText(label, leftSide ? -(r - 18) : r - 18, 0);
      ctx.restore();
    }
  }

  /* 12시(화살표) 아래에 있는 칸 번호 */
  function indexAtPointer() {
    const n = wheel.options.length;
    const seg = (Math.PI * 2) / n;
    const rel = ((-wheel.rotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    return Math.floor(rel / seg) % n;
  }

  /* ---------- 돌리기 ---------- */
  function spin() {
    const n = wheel.options.length;
    if (wheel.spinning || n < MIN) return;

    const seg = (Math.PI * 2) / n;
    const target = Math.floor(Math.random() * n);
    const jitter = (Math.random() - 0.5) * seg * 0.7; // 칸 정가운데만 걸리지 않게
    const TAU = Math.PI * 2;
    const targetMod = ((TAU - ((target + 0.5) * seg + jitter)) % TAU + TAU) % TAU;
    const currentMod = ((wheel.rotation % TAU) + TAU) % TAU;
    const delta = (targetMod - currentMod + TAU) % TAU;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const from = wheel.rotation;
    const to = from + (reduceMotion ? 1 : 6) * TAU + delta;
    const duration = reduceMotion ? 600 : 4200;
    const startTime = performance.now();

    wheel.spinning = true;
    setSpinning(true);
    // 도는 동안에는 이전 결과와 버튼을 숨김
    rEl.resultActions.hidden = true;
    rEl.resultPhoto.hidden = true;
    rEl.resultText.textContent = '두구두구… 🎡';

    function step(now) {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 4); // 처음엔 빠르게, 끝으로 갈수록 천천히
      wheel.rotation = from + (to - from) * eased;
      drawWheel();
      if (t < 1) {
        wheel.frame = requestAnimationFrame(step);
      } else {
        wheel.spinning = false;
        wheel.frame = null;
        setSpinning(false);
        showResult(wheel.options[indexAtPointer()]);
      }
    }
    wheel.frame = requestAnimationFrame(step);
  }

  function setSpinning(on) {
    rEl.spinBtn.disabled = on || wheel.options.length < MIN;
    rEl.spinBtn.textContent = on ? '…' : '돌리기';
    rEl.removeBtn.disabled = on;
  }

  /* 결과를 친구에게 보낼 문장 */
  function resultShareText(text) {
    if (wheel.peopleMode) return '[오늘 뭐 먹지? 돌림판] 오늘 계산은 ' + text + '! 🎡';
    const menu = findMenu(text);
    return menu ? shareText(menu, '돌림판 결과는') : '[오늘 뭐 먹지? 돌림판] 결과는 ' + text + '! 🎡';
  }

  function showResult(text) {
    wheel.result = text;
    // 메뉴 목록에 있는 메뉴인지 ('누가 계산?' 모드에서는 메뉴로 보지 않음)
    const menu = wheel.peopleMode ? null : findMenu(text);
    wheel.resultMenu = menu;

    rEl.resultText.textContent = wheel.peopleMode ? '🎉 ' + text + ' 당첨!' : '🎉 ' + text + '!';
    rEl.resultActions.hidden = false;

    rEl.resultPhoto.hidden = !menu;
    rEl.resultPhoto.innerHTML = menu ? menuPhotoHtml(menu, false) : '';
    if (menu) rEl.resultPhoto.style.setProperty('--card-bg', CATEGORY_COLORS[menu.category]);

    // '누가 계산?' 모드에서는 지도 버튼이 필요 없음
    rEl.mapLink.hidden = wheel.peopleMode;
    rEl.mapLink.href = naverMapUrl(text);
    rEl.smsLink.href = smsUrl(resultShareText(text));

    // 메뉴일 때만 기록에 남길 수 있음
    rEl.decideBtn.hidden = !menu;
    rEl.decideBtn.disabled = false;
    rEl.decideBtn.textContent = '✅ 이걸로 결정';
    rEl.resultText.parentElement.classList.remove('pop');
    void rEl.resultText.parentElement.offsetWidth;
    rEl.resultText.parentElement.classList.add('pop');
  }

  function clearResult() {
    wheel.result = null;
    wheel.resultMenu = null;
    rEl.resultText.textContent = '돌림판을 돌려 보세요!';
    rEl.resultActions.hidden = true;
    rEl.resultPhoto.hidden = true;
    rEl.resultPhoto.innerHTML = '';
  }

  /* ---------- 후보 목록 ---------- */
  function renderOptions() {
    rEl.list.innerHTML = '';
    wheel.options.forEach((name, i) => {
      const li = document.createElement('li');
      li.className = 'option-item';
      li.style.setProperty('--card-bg', COLORS[i % COLORS.length]);
      const span = document.createElement('span');
      span.textContent = name;
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'option-del';
      del.setAttribute('aria-label', name + ' 빼기');
      del.textContent = '✕';
      del.addEventListener('click', () => removeOption(i));
      li.append(span, del);
      rEl.list.appendChild(li);
    });
    rEl.optionCount.textContent = wheel.options.length + ' / ' + MAX;
    rEl.spinBtn.disabled = wheel.spinning || wheel.options.length < MIN;
    drawWheel();
  }

  function setOptions(list, peopleMode) {
    if (wheel.spinning) return;
    wheel.options = list.slice(0, MAX);
    wheel.peopleMode = peopleMode;
    save();
    clearResult();
    renderOptions();
  }

  function addOption(name) {
    const value = name.trim();
    if (!value) return;
    if (wheel.options.length >= MAX) {
      showToast('후보는 ' + MAX + '개까지 넣을 수 있어요');
      return;
    }
    if (wheel.options.includes(value)) {
      showToast('이미 있는 후보예요');
      return;
    }
    wheel.options.push(value);
    save();
    renderOptions();
  }

  function removeOption(index) {
    if (wheel.spinning) return;
    wheel.options.splice(index, 1);
    save();
    clearResult();
    renderOptions();
  }

  /* ---------- 한 번에 채우기 ---------- */
  function fill(type) {
    const blocked = loadData(STORAGE_KEYS.blocked, []);
    if (type === 'random') {
      const pool = MENUS.filter((m) => !blocked.includes(m.name));
      setOptions(shuffle(pool).slice(0, 8).map((m) => m.name), false);
    } else if (type === 'favorites') {
      const favs = loadData(STORAGE_KEYS.favorites, []).filter((n) => !blocked.includes(n));
      if (favs.length < MIN) {
        showToast('즐겨찾기한 메뉴가 2개 이상 필요해요. 도감에서 ☆를 눌러 추가해 보세요.');
        return;
      }
      setOptions(shuffle(favs), false);
    } else if (type === 'people') {
      setOptions(['사람 1', '사람 2', '사람 3', '사람 4'], true);
      showToast('✕로 지우고 실제 이름을 추가해 보세요');
    } else if (type === 'clear') {
      setOptions([], false);
    }
  }

  /* ---------- 시작 ---------- */
  renderOptions();
  clearResult();

  rEl.spinBtn.addEventListener('click', spin);
  rEl.form.addEventListener('submit', (e) => {
    e.preventDefault();
    addOption(rEl.input.value);
    rEl.input.value = '';
    rEl.input.focus();
  });
  rEl.removeBtn.addEventListener('click', () => {
    const i = wheel.options.indexOf(wheel.result);
    if (i < 0) return;
    if (wheel.options.length - 1 < MIN) {
      showToast('후보가 2개 이상 남아야 다시 돌릴 수 있어요');
      return;
    }
    removeOption(i);
    spin();
  });
  rEl.fillButtons.forEach((btn) => btn.addEventListener('click', () => fill(btn.dataset.fill)));
  rEl.shareBtn.addEventListener('click', () => {
    if (wheel.result) shareRawText(resultShareText(wheel.result));
  });
  rEl.decideBtn.addEventListener('click', () => {
    if (!wheel.resultMenu || rEl.decideBtn.disabled) return;
    saveDecision(wheel.resultMenu);
    rEl.decideBtn.disabled = true;
    rEl.decideBtn.textContent = '✔ 기록했어요';
    showToast('오늘은 ' + wheel.resultMenu.name + '! 맛있게 드세요 😋');
  });

  // 글꼴을 불러온 뒤 한 번 더 그려서 글자 모양을 맞춤
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawWheel);

  // 다른 탭으로 갈 때: 돌아가던 애니메이션 멈춤
  return function cleanup() {
    if (wheel.frame) cancelAnimationFrame(wheel.frame);
  };
}
