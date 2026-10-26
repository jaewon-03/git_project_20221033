/* 회원 화면: 로그인 · 회원가입 페이지, 헤더의 로그인/내 계정 표시
   실제 저장과 확인은 auth.js의 Auth가 맡고, 이 파일은 화면만 다룹니다. */

/* 로그인 후 돌아갈 페이지 (이 사이트 안의 페이지만 허용) */
function safeNextUrl(next) {
  if (!next || !/^[a-z-]+\.html([?#][^\s]*)?$/.test(next) || /^(login|signup)\.html/.test(next)) return 'index.html';
  return next;
}

/* 지금 페이지 주소 (로그인 페이지에서는 원래 가려던 곳 그대로) */
function currentPageForNext() {
  const page = location.pathname.split('/').pop() || 'index.html';
  if (/^(login|signup)\.html$/.test(page)) return new URLSearchParams(location.search).get('next') || '';
  return page + location.search;
}

/* ---------- 헤더: 로그인 버튼 / 내 계정 메뉴 ----------
   PC는 헤더 오른쪽, 햄버거 메뉴(1023px 이하)는 메뉴 판 맨 위에 보여줌 */
function renderAccountUI() {
  if (typeof Auth === 'undefined') return;
  const user = Auth.getCurrentUser();
  const next = currentPageForNext();
  const loginHref = 'login.html' + (next ? '?next=' + encodeURIComponent(next) : '');
  const box = document.getElementById('accountBox');
  const navAccount = document.getElementById('navAccount');

  if (!user) {
    if (box) box.innerHTML = '<a href="' + loginHref + '" class="account-login">로그인</a>';
    if (navAccount) {
      navAccount.innerHTML =
        '<p class="nav-account-text">로그인하면 기록과 즐겨찾기를 내 계정에 모아 둘 수 있어요.</p>' +
        '<div class="nav-account-actions">' +
        '<a href="' + loginHref + '" class="action-btn small primary-soft">로그인</a>' +
        '<a href="signup.html" class="action-btn small">회원가입</a>' +
        '</div>';
    }
    return;
  }

  const name = escapeHtml(user.nickname);
  const initial = escapeHtml(Array.from(user.nickname)[0] || '?');
  if (box) {
    box.innerHTML =
      '<button type="button" class="account-btn" id="accountBtn" aria-expanded="false" aria-controls="accountMenu" aria-label="' + name + '님 계정 메뉴" title="' + name + '님">' +
      '<span class="avatar" aria-hidden="true">' + initial + '</span>' +
      '<span class="nav-caret" aria-hidden="true">▾</span>' +
      '</button>' +
      '<div class="account-menu" id="accountMenu" hidden>' +
      '<p class="account-menu-head"><strong>' + name + '</strong>님<small>@' + escapeHtml(user.id) + '</small></p>' +
      '<a href="history.html">📝 내 기록</a>' +
      '<a href="menus.html?fav=1">⭐ 내 즐겨찾기</a>' +
      '<button type="button" data-account="logout">🚪 로그아웃</button>' +
      '<button type="button" data-account="withdraw" class="account-withdraw">회원 탈퇴</button>' +
      '</div>';
  }
  if (navAccount) {
    navAccount.innerHTML =
      '<div class="nav-account-user">' +
      '<span class="avatar" aria-hidden="true">' + initial + '</span>' +
      '<p><strong>' + name + '</strong>님<small>@' + escapeHtml(user.id) + '</small></p>' +
      '</div>' +
      '<div class="nav-account-actions">' +
      '<button type="button" class="action-btn small" data-account="logout">로그아웃</button>' +
      '<button type="button" class="action-btn small" data-account="withdraw">회원 탈퇴</button>' +
      '</div>';
  }
}

function setAccountMenuOpen(open) {
  const btn = document.getElementById('accountBtn');
  const menu = document.getElementById('accountMenu');
  if (!btn || !menu) return;
  menu.hidden = !open;
  btn.setAttribute('aria-expanded', open ? 'true' : 'false');
}

/* 로그인 상태가 바뀌면: 헤더를 다시 그리고 지금 페이지를 새 계정의 기록으로 다시 보여줌 */
function afterAccountChange(message) {
  if (document.querySelector('.site-header.nav-open')) document.getElementById('menuToggle').click(); // 열린 햄버거 메뉴는 닫기
  renderAccountUI();
  if (typeof reloadCurrentPage === 'function') reloadCurrentPage();
  if (message) showToast(message);
}

async function handleLogout() {
  setAccountMenuOpen(false);
  const user = Auth.getCurrentUser();
  await Auth.logOut();
  afterAccountChange((user ? user.nickname + '님, ' : '') + '로그아웃했어요. 또 만나요!');
}

async function handleWithdraw() {
  setAccountMenuOpen(false);
  const user = Auth.getCurrentUser();
  if (!user) return;
  if (!window.confirm('정말 탈퇴할까요?\n' + user.nickname + '님의 기록과 즐겨찾기가 모두 지워지고 되돌릴 수 없어요.')) return;
  const result = await Auth.deleteAccount();
  if (!result.ok) {
    showToast(result.message);
    return;
  }
  // 이 계정에 저장된 기록·즐겨찾기도 함께 지움
  Object.values(STORAGE_KEYS).forEach((key) => {
    try { localStorage.removeItem(userStorageKey(key, user.id)); } catch (e) { /* 무시 */ }
  });
  afterAccountChange('탈퇴했어요. 그동안 이용해 주셔서 고마워요.');
}

document.addEventListener('DOMContentLoaded', () => {
  renderAccountUI();

  document.addEventListener('click', (e) => {
    if (e.target.closest('#accountBtn')) {
      setAccountMenuOpen(document.getElementById('accountMenu').hidden);
      return;
    }
    const action = e.target.closest('[data-account]');
    if (action) {
      if (action.dataset.account === 'logout') handleLogout();
      if (action.dataset.account === 'withdraw') handleWithdraw();
      return;
    }
    // 메뉴 안 링크를 눌렀거나 바깥을 누르면 닫기
    if (e.target.closest('.account-menu a') || !e.target.closest('.account-box')) setAccountMenuOpen(false);
  });

  document.addEventListener('keydown', (e) => {
    const menu = document.getElementById('accountMenu');
    if (e.key === 'Escape' && menu && !menu.hidden) {
      setAccountMenuOpen(false);
      document.getElementById('accountBtn').focus();
    }
  });

  // 다른 탭에서 로그인/로그아웃하면 이 탭도 맞춰서 바꿈
  window.addEventListener('storage', (e) => {
    if (e.key === AUTH_KEYS.session || e.key === AUTH_KEYS.users) afterAccountChange('');
  });
});

/* ---------- 입력칸 공통 ---------- */
function setFieldMessage(input, message, ok) {
  const msg = document.getElementById(input.id + 'Msg');
  input.setAttribute('aria-invalid', message && !ok ? 'true' : 'false');
  input.closest('.form-row').classList.toggle('has-error', Boolean(message) && !ok);
  input.closest('.form-row').classList.toggle('is-ok', Boolean(ok));
  if (msg) msg.textContent = message || '';
}

/* 비밀번호 보기/숨기기 버튼과 Caps Lock 안내 */
function setupPasswordField(input) {
  const row = input.closest('.form-row');
  const toggle = row.querySelector('.pw-toggle');
  const caps = row.querySelector('.caps-hint');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      toggle.textContent = show ? '숨기기' : '보기';
      toggle.setAttribute('aria-pressed', show ? 'true' : 'false');
      toggle.setAttribute('aria-label', show ? '비밀번호 숨기기' : '비밀번호 보기');
      input.focus();
    });
  }
  if (caps) {
    const check = (e) => { if (e.getModifierState) caps.hidden = !e.getModifierState('CapsLock'); };
    input.addEventListener('keydown', check);
    input.addEventListener('keyup', check);
    input.addEventListener('blur', () => { caps.hidden = true; });
  }
}

function setBusy(button, busy, busyText) {
  if (busy) {
    button.dataset.label = button.textContent;
    button.textContent = busyText;
  } else if (button.dataset.label) {
    button.textContent = button.dataset.label;
  }
  button.disabled = busy;
}

/* 이미 로그인한 상태로 로그인/회원가입 페이지에 오면 안내만 보여줌 */
function showAlreadyLoggedIn(form, user) {
  const box = document.getElementById('authAlready');
  form.hidden = true;
  document.querySelectorAll('.auth-switch').forEach((el) => { el.hidden = true; });
  box.hidden = false;
  box.querySelector('[data-name]').textContent = user.nickname;
  box.querySelector('[data-home]').setAttribute('href', safeNextUrl(new URLSearchParams(location.search).get('next')));
}

/* ---------- 로그인 페이지 ---------- */
function initLoginPage() {
  const form = document.getElementById('loginForm');
  const idInput = document.getElementById('loginId');
  const pwInput = document.getElementById('loginPw');
  const keep = document.getElementById('keepLogin');
  const error = document.getElementById('loginError');
  const submit = document.getElementById('loginBtn');
  const next = safeNextUrl(new URLSearchParams(location.search).get('next'));

  const signupLink = document.querySelector('.auth-switch a[href^="signup.html"]');
  if (signupLink && next !== 'index.html') signupLink.href = 'signup.html?next=' + encodeURIComponent(next);

  const user = Auth.getCurrentUser();
  if (user) {
    showAlreadyLoggedIn(form, user);
    return;
  }

  setupPasswordField(pwInput);
  idInput.addEventListener('input', () => { error.textContent = ''; });
  pwInput.addEventListener('input', () => { error.textContent = ''; });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = idInput.value.trim().toLowerCase();
    if (!id) { error.textContent = '아이디를 입력해 주세요.'; idInput.focus(); return; }
    if (!pwInput.value) { error.textContent = '비밀번호를 입력해 주세요.'; pwInput.focus(); return; }

    setBusy(submit, true, '로그인 중…');
    const result = await Auth.logIn(id, pwInput.value, keep.checked);
    setBusy(submit, false);

    if (!result.ok) {
      error.textContent = result.message;
      pwInput.value = '';
      pwInput.focus();
      return;
    }
    renderAccountUI();
    showToast(result.user.nickname + '님, 반가워요! 😋');
    if (typeof navigateTo === 'function') navigateTo(next);
    else location.href = next;
  });

  idInput.focus();
}

/* ---------- 회원가입 페이지 ---------- */
function initSignupPage() {
  const form = document.getElementById('signupForm');
  const inputs = {
    id: document.getElementById('signupId'),
    nickname: document.getElementById('signupNickname'),
    password: document.getElementById('signupPw'),
    passwordConfirm: document.getElementById('signupPwConfirm')
  };
  const agree = document.getElementById('agreeTerms');
  const error = document.getElementById('signupError');
  const submit = document.getElementById('signupBtn');
  const strength = document.getElementById('pwStrength');
  const next = safeNextUrl(new URLSearchParams(location.search).get('next'));

  const loginLink = document.querySelector('.auth-switch a[href^="login.html"]');
  if (loginLink && next !== 'index.html') loginLink.href = 'login.html?next=' + encodeURIComponent(next);

  const user = Auth.getCurrentUser();
  if (user) {
    showAlreadyLoggedIn(form, user);
    return;
  }

  const touched = new Set(); // 한 번 입력을 마친 칸만 실시간으로 안내 (처음부터 빨간 글씨가 뜨지 않게)
  let idCheckToken = 0;

  function valueOf(field) {
    const v = inputs[field].value;
    return field === 'id' ? v.trim().toLowerCase() : v;
  }

  function extraOf(field) {
    if (field === 'password') return valueOf('id');
    if (field === 'passwordConfirm') return valueOf('password');
    return undefined;
  }

  /* 칸 하나 검사. 아이디는 중복 확인까지 */
  async function validate(field, showOk) {
    const message = checkAuthField(field, valueOf(field), extraOf(field));
    if (message) {
      setFieldMessage(inputs[field], message, false);
      return false;
    }
    if (field === 'id') {
      const token = ++idCheckToken;
      const taken = await Auth.isIdTaken(valueOf('id'));
      if (token !== idCheckToken) return !taken; // 그사이 다시 입력했으면 이전 결과는 무시
      if (taken) {
        setFieldMessage(inputs.id, '이미 사용 중이거나 탈퇴한 아이디예요.', false);
        return false;
      }
      setFieldMessage(inputs.id, '사용할 수 있는 아이디예요.', true);
      return true;
    }
    setFieldMessage(inputs[field], showOk ? okMessage(field) : '', showOk);
    return true;
  }

  function okMessage(field) {
    if (field === 'nickname') return '멋진 닉네임이에요.';
    if (field === 'passwordConfirm') return '비밀번호가 일치해요.';
    return '사용할 수 있는 비밀번호예요.';
  }

  /* 비밀번호 안전도: 길이·문자 종류로 3단계 */
  function updateStrength() {
    const pw = inputs.password.value;
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Za-z]/.test(pw) && /[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
    const level = !pw ? 0 : score <= 2 ? 1 : score <= 3 ? 2 : 3;
    strength.dataset.level = level;
    strength.querySelector('span').textContent = ['', '약함', '보통', '강함'][level];
  }

  Object.keys(inputs).forEach((field) => {
    const input = inputs[field];
    input.addEventListener('blur', () => {
      if (!input.value && !touched.has(field)) return;
      touched.add(field);
      validate(field, true);
    });
    input.addEventListener('input', () => {
      error.textContent = '';
      if (touched.has(field)) validate(field, true);
      // 비밀번호를 고치면 확인 칸도 다시 검사
      if (field === 'password' && touched.has('passwordConfirm')) validate('passwordConfirm', true);
      if (field === 'id' && touched.has('password')) validate('password', true);
    });
  });
  inputs.password.addEventListener('input', updateStrength);
  setupPasswordField(inputs.password);
  setupPasswordField(inputs.passwordConfirm);
  agree.addEventListener('change', () => { if (agree.checked) error.textContent = ''; });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    error.textContent = '';
    setBusy(submit, true, '확인 중…');

    // 모든 칸 검사 → 처음 틀린 칸으로 이동
    let firstBad = null;
    for (const field of Object.keys(inputs)) {
      touched.add(field);
      const ok = await validate(field, true);
      if (!ok && !firstBad) firstBad = field;
    }
    if (firstBad) {
      setBusy(submit, false);
      inputs[firstBad].focus();
      return;
    }
    if (!agree.checked) {
      setBusy(submit, false);
      error.textContent = '약관에 동의해야 가입할 수 있어요.';
      agree.focus();
      return;
    }

    submit.textContent = '가입하는 중…';
    const result = await Auth.signUp({ id: valueOf('id'), nickname: valueOf('nickname'), password: valueOf('password') });
    setBusy(submit, false);
    if (!result.ok) {
      if (result.field && inputs[result.field]) {
        setFieldMessage(inputs[result.field], result.message, false);
        inputs[result.field].focus();
      } else {
        error.textContent = result.message;
      }
      return;
    }

    moveGuestDataTo(result.user.id); // 로그인 전에 쓰던 기록·즐겨찾기를 새 계정으로
    renderAccountUI();
    showToast(result.user.nickname + '님, 가입을 환영해요! 🎉');
    if (typeof navigateTo === 'function') navigateTo(next);
    else location.href = next;
  });

  inputs.id.focus();
}
