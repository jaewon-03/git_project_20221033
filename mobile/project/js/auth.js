/* 회원 기능 (회원가입 · 로그인 · 로그아웃)
   - 화면(account.js)과 다른 기능은 이 파일의 Auth 함수만 부릅니다.
   - 지금은 회원 정보를 이 브라우저(localStorage)에 저장합니다.
     서버·DB로 바꿀 때는 이 파일 안쪽만 바꾸면 됩니다. (함수 이름과 돌려주는 값은 그대로)
   - 서버와 주고받는 방식처럼 결과를 기다리는 모양(async)으로 만들어 두었습니다.
   - 비밀번호는 그대로 저장하지 않고, 사람마다 다른 소금값(salt)을 붙여 SHA-256으로 여러 번 암호화(해시)한 값만 저장합니다. */

const AUTH_KEYS = {
  users: 'wte-users',     // 가입한 회원 목록
  session: 'wte-session', // 지금 로그인한 회원 (로그인 상태 유지면 localStorage, 아니면 sessionStorage)
  withdrawn: 'wte-withdrawn' // 탈퇴한 아이디 (다른 사람이 같은 아이디로 가입해서 옛 글의 주인이 되지 않게 다시 쓸 수 없음)
};

/* 입력 규칙 (회원가입 화면의 실시간 안내와 가입 처리에서 같이 씀) */
const AUTH_RULES = {
  idPattern: /^[a-z][a-z0-9]{3,15}$/, // 영문 소문자로 시작, 영문 소문자·숫자 4~16자
  nicknameMin: 2,
  nicknameMax: 10,
  passwordMin: 8,
  passwordMax: 20
};

/* 입력값 검사: 문제가 있으면 안내 문구, 없으면 빈 문자열 */
function checkAuthField(field, value, extra) {
  if (field === 'id') {
    if (!value) return '아이디를 입력해 주세요.';
    if (!AUTH_RULES.idPattern.test(value)) return '영문 소문자로 시작하는 영문 소문자·숫자 4~16자로 입력해 주세요.';
  }
  if (field === 'nickname') {
    const name = value.trim();
    if (!name) return '닉네임을 입력해 주세요.';
    if (name.length < AUTH_RULES.nicknameMin || name.length > AUTH_RULES.nicknameMax) {
      return '닉네임은 ' + AUTH_RULES.nicknameMin + '~' + AUTH_RULES.nicknameMax + '자로 입력해 주세요.';
    }
    if (/[<>"'&]/.test(name)) return '닉네임에는 < > " \' & 기호를 쓸 수 없어요.';
  }
  if (field === 'password') {
    if (!value) return '비밀번호를 입력해 주세요.';
    if (value.length < AUTH_RULES.passwordMin || value.length > AUTH_RULES.passwordMax) {
      return '비밀번호는 ' + AUTH_RULES.passwordMin + '~' + AUTH_RULES.passwordMax + '자로 입력해 주세요.';
    }
    if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) return '영문과 숫자를 모두 넣어 주세요.';
    if (/\s/.test(value)) return '비밀번호에는 띄어쓰기를 쓸 수 없어요.';
    if (extra && value.includes(extra)) return '비밀번호에 아이디를 넣을 수 없어요.';
  }
  if (field === 'passwordConfirm') {
    if (!value) return '비밀번호를 한 번 더 입력해 주세요.';
    if (value !== extra) return '비밀번호가 서로 달라요.';
  }
  return '';
}

/* ---------- SHA-256 (브라우저 기본 암호화 기능은 파일로 열면 막혀 있어서 직접 구현) ---------- */
const SHA256_K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
]);

function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const total = Math.ceil((data.length + 9) / 64) * 64;
  const buf = new Uint8Array(total);
  buf.set(data);
  buf[data.length] = 0x80;
  const view = new DataView(buf.buffer);
  const bitLength = data.length * 8;
  view.setUint32(total - 8, Math.floor(bitLength / 0x100000000));
  view.setUint32(total - 4, bitLength >>> 0);

  const H = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
  const W = new Uint32Array(64);
  const rotr = (x, n) => (x >>> n) | (x << (32 - n));

  for (let offset = 0; offset < total; offset += 64) {
    for (let i = 0; i < 16; i++) W[i] = view.getUint32(offset + i * 4);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(W[i - 15], 7) ^ rotr(W[i - 15], 18) ^ (W[i - 15] >>> 3);
      const s1 = rotr(W[i - 2], 17) ^ rotr(W[i - 2], 19) ^ (W[i - 2] >>> 10);
      W[i] = W[i - 16] + s0 + W[i - 7] + s1;
    }
    let [a, b, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      const t1 = (h + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + SHA256_K[i] + W[i]) | 0;
      const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0;
      d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    H[0] += a; H[1] += b; H[2] += c; H[3] += d;
    H[4] += e; H[5] += f; H[6] += g; H[7] += h;
  }
  return Array.from(H, (x) => x.toString(16).padStart(8, '0')).join('');
}

/* 비밀번호 + 소금값 → 1,000번 반복 해시 (같은 비밀번호라도 사람마다 다른 값이 됨) */
function hashPassword(password, salt) {
  let hash = sha256Hex(salt + ':' + password);
  for (let i = 1; i < 1000; i++) hash = sha256Hex(hash + salt);
  return hash;
}

function makeSalt() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/* ---------- 저장소 (서버로 바꿀 때 이 부분이 서버 요청으로 바뀜) ---------- */
function readUsers() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEYS.users)) || []; } catch (e) { return []; }
}

function readWithdrawn() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEYS.withdrawn)) || []; } catch (e) { return []; }
}

/* 가입한 회원이거나 탈퇴한 아이디면 쓸 수 없음 */
function idUnavailable(id) {
  return readUsers().some((u) => u.id === id) || readWithdrawn().includes(id);
}

function writeUsers(users) {
  try {
    localStorage.setItem(AUTH_KEYS.users, JSON.stringify(users));
    return true;
  } catch (e) {
    return false;
  }
}

function readSession() {
  for (const store of [sessionStorage, localStorage]) {
    try {
      const session = JSON.parse(store.getItem(AUTH_KEYS.session));
      if (session && session.id) return session;
    } catch (e) { /* 다음 저장소 확인 */ }
  }
  return null;
}

function writeSession(user, keepLoggedIn) {
  const session = JSON.stringify({ id: user.id, nickname: user.nickname, since: Date.now() });
  clearSession();
  try { (keepLoggedIn ? localStorage : sessionStorage).setItem(AUTH_KEYS.session, session); } catch (e) { /* 저장 못 하면 로그인 유지 안 됨 */ }
}

function clearSession() {
  try { localStorage.removeItem(AUTH_KEYS.session); } catch (e) { /* 무시 */ }
  try { sessionStorage.removeItem(AUTH_KEYS.session); } catch (e) { /* 무시 */ }
}

/* 서버 응답을 기다리는 것처럼 아주 잠깐 쉬었다가 결과를 줌 (버튼 '처리 중' 표시가 보이게) */
function authDelay(value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), 250));
}

/* ---------- 화면에서 부르는 함수 ---------- */
const Auth = {
  /* 지금 로그인한 회원 { id, nickname } 또는 null */
  getCurrentUser() {
    const session = readSession();
    if (!session) return null;
    const user = readUsers().find((u) => u.id === session.id);
    return user ? { id: user.id, nickname: user.nickname } : null;
  },

  /* 아직 가입되어 있는 회원인지 (게시판에서 탈퇴한 회원 글 표시용) */
  userExists(id) {
    return readUsers().some((u) => u.id === id);
  },

  /* 이미 쓰고 있는 아이디인지 */
  async isIdTaken(id) {
    return authDelay(idUnavailable(id));
  },

  /* 회원가입: 성공하면 바로 로그인까지 */
  async signUp({ id, nickname, password }) {
    const errors = [
      ['id', checkAuthField('id', id)],
      ['nickname', checkAuthField('nickname', nickname)],
      ['password', checkAuthField('password', password, id)]
    ].filter(([, message]) => message);
    if (errors.length) return authDelay({ ok: false, field: errors[0][0], message: errors[0][1] });

    const users = readUsers();
    if (idUnavailable(id)) return authDelay({ ok: false, field: 'id', message: '이미 사용 중이거나 탈퇴한 아이디예요.' });

    const salt = makeSalt();
    const user = { id: id, nickname: nickname.trim(), salt: salt, hash: hashPassword(password, salt), joinedAt: Date.now() };
    users.push(user);
    if (!writeUsers(users)) return authDelay({ ok: false, field: '', message: '저장 공간이 부족해서 가입하지 못했어요.' });

    writeSession(user, false);
    return authDelay({ ok: true, user: { id: user.id, nickname: user.nickname } });
  },

  /* 로그인: 아이디·비밀번호 중 무엇이 틀렸는지는 알려주지 않음 (다른 사람이 아이디를 알아내지 못하게) */
  async logIn(id, password, keepLoggedIn) {
    const user = readUsers().find((u) => u.id === id);
    if (!user || hashPassword(password, user.salt) !== user.hash) {
      return authDelay({ ok: false, message: '아이디 또는 비밀번호가 맞지 않아요.' });
    }
    writeSession(user, keepLoggedIn);
    return authDelay({ ok: true, user: { id: user.id, nickname: user.nickname } });
  },

  async logOut() {
    clearSession();
    return authDelay({ ok: true });
  },

  /* 회원 탈퇴: 지금 로그인한 회원 정보를 지우고 로그아웃 */
  async deleteAccount() {
    const session = readSession();
    if (!session) return authDelay({ ok: false, message: '로그인한 다음에 탈퇴할 수 있어요.' });
    const users = readUsers().filter((u) => u.id !== session.id);
    if (!writeUsers(users)) return authDelay({ ok: false, message: '탈퇴를 처리하지 못했어요. 다시 시도해 주세요.' });
    try { localStorage.setItem(AUTH_KEYS.withdrawn, JSON.stringify(readWithdrawn().concat(session.id))); } catch (e) { /* 기록 못 해도 탈퇴는 됨 */ }
    clearSession();
    return authDelay({ ok: true });
  }
};
