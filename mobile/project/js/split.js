/* N빵 계산기 페이지 기능 */

/* 탭을 열 때마다 router.js가 실행합니다. */
function initSplitPage() {
  const MIN_PEOPLE = 2;
  const MAX_PEOPLE = 30;

  const sEl = {
    total: document.getElementById('totalInput'),
    extra: document.getElementById('extraInput'),
    people: document.getElementById('peopleInput'),
    minus: document.getElementById('peopleMinus'),
    plus: document.getElementById('peoplePlus'),
    round: document.getElementById('roundSelect'),
    perPerson: document.getElementById('perPerson'),
    detail: document.getElementById('splitDetail'),
    smsLink: document.getElementById('splitSmsLink'),
    copyBtn: document.getElementById('splitCopyBtn'),
    resetBtn: document.getElementById('splitResetBtn'),
    quick: document.getElementById('splitQuick'),
    recentText: document.getElementById('recentMenuText'),
    fillBtn: document.getElementById('fillFromMenuBtn')
  };

  let lastText = ''; // 문자·복사에 쓸 문장

  function won(n) {
    return n.toLocaleString('ko-KR') + '원';
  }

  /* 입력칸 숫자 읽기 (비었거나 이상하면 0) */
  function readNumber(input) {
    const n = Math.floor(Number(input.value));
    return Number.isFinite(n) && n > 0 ? n : 0;
  }

  function readPeople() {
    const n = Math.floor(Number(sEl.people.value));
    if (!Number.isFinite(n)) return MIN_PEOPLE;
    return Math.min(MAX_PEOPLE, Math.max(MIN_PEOPLE, n));
  }

  /* ---------- 계산 ----------
     한 사람당 금액은 고른 단위로 '올림'해서, 다 모으면 총액보다 모자라지 않게 합니다.
     남는 돈은 계산한 사람(총무) 몫으로 안내합니다. */
  function calculate() {
    const total = readNumber(sEl.total) + readNumber(sEl.extra);
    const people = readPeople();
    const unit = Number(sEl.round.value) || 1;

    sEl.minus.disabled = people <= MIN_PEOPLE;
    sEl.plus.disabled = people >= MAX_PEOPLE;

    if (total === 0) {
      sEl.perPerson.textContent = '0원';
      sEl.detail.textContent = '총 금액을 입력해 주세요.';
      lastText = '';
      sEl.smsLink.removeAttribute('href');
      sEl.smsLink.classList.add('disabled');
      sEl.copyBtn.disabled = true;
      return;
    }

    const per = Math.ceil(total / people / unit) * unit;
    const collected = per * people;
    const left = collected - total;

    sEl.perPerson.textContent = won(per);
    sEl.detail.textContent = '총 ' + won(total) + ' ÷ ' + people + '명 · 다 모으면 ' + won(collected) +
      (left > 0 ? ' (' + won(left) + ' 남아요, 계산한 사람 몫)' : ' (딱 맞아요)');

    lastText = '[오늘 뭐 먹지? N빵] 총 ' + won(total) + ' ÷ ' + people + '명 = 1인당 ' + won(per);
    sEl.smsLink.href = smsUrl(lastText);
    sEl.smsLink.classList.remove('disabled');
    sEl.copyBtn.disabled = false;
  }

  function changePeople(diff) {
    sEl.people.value = Math.min(MAX_PEOPLE, Math.max(MIN_PEOPLE, readPeople() + diff));
    calculate();
  }

  /* ---------- 최근에 정한 메뉴로 채우기 ---------- */
  const recent = loadData(STORAGE_KEYS.history, [])[0];
  const recentMenu = recent ? findMenu(recent.name) : null;
  if (recentMenu) {
    sEl.quick.hidden = false;
    sEl.recentText.textContent = recentMenu.name + ' (' + formatPrice(recentMenu.price) + ')';
    sEl.fillBtn.addEventListener('click', () => {
      sEl.total.value = recentMenu.price * readPeople();
      calculate();
      showToast(recentMenu.name + ' ' + won(recentMenu.price) + ' × ' + readPeople() + '명으로 채웠어요');
    });
  }

  /* ---------- 시작 ---------- */
  [sEl.total, sEl.extra, sEl.people].forEach((input) => input.addEventListener('input', calculate));
  sEl.people.addEventListener('change', () => {
    sEl.people.value = readPeople(); // 범위를 벗어난 값은 고쳐서 보여줌
    calculate();
  });
  sEl.round.addEventListener('change', calculate);
  sEl.minus.addEventListener('click', () => changePeople(-1));
  sEl.plus.addEventListener('click', () => changePeople(1));
  sEl.copyBtn.addEventListener('click', async () => {
    if (!lastText) return;
    try {
      await navigator.clipboard.writeText(lastText);
      showToast('계산 결과를 복사했어요. 단톡방에 붙여넣기 해 보세요!');
    } catch (e) {
      showToast(lastText);
    }
  });
  sEl.smsLink.addEventListener('click', (e) => {
    if (!lastText) e.preventDefault();
  });
  sEl.resetBtn.addEventListener('click', () => {
    sEl.total.value = '';
    sEl.extra.value = '';
    sEl.people.value = 4;
    sEl.round.value = '100';
    calculate();
    sEl.total.focus();
  });
  calculate();
}
