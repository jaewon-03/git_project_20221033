/* 게시판 화면: 목록(board.html) · 글쓰기/수정(board-write.html) · 글 보기(board-view.html)
   실제 저장은 board-store.js의 BoardStore가 맡고, 이 파일은 화면만 다룹니다. */

const BOARD_LIST_KEY = 'wte-board-list'; // 마지막으로 본 목록 주소 (글 보기에서 '목록으로' 누르면 그 페이지로)

/* 날짜: 오늘 글은 시:분, 올해 글은 월.일, 그 전은 연.월.일 */
function formatBoardDate(ts) {
  const d = new Date(ts);
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  if (d.toDateString() === now.toDateString()) return pad(d.getHours()) + ':' + pad(d.getMinutes());
  if (d.getFullYear() === now.getFullYear()) return pad(d.getMonth() + 1) + '.' + pad(d.getDate());
  return String(d.getFullYear()).slice(2) + '.' + pad(d.getMonth() + 1) + '.' + pad(d.getDate());
}

function formatBoardDateTime(ts) {
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '.' + pad(d.getMonth() + 1) + '.' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}

function isNewPost(ts) {
  return Date.now() - ts < DAY_MS;
}

function boardListUrl({ category = 'all', field = 'title', query = '', page = 1 }) {
  const params = new URLSearchParams();
  if (category !== 'all') params.set('cat', category);
  if (query) {
    params.set('field', field);
    params.set('q', query);
  }
  if (page > 1) params.set('page', page);
  const qs = params.toString();
  return 'board.html' + (qs ? '?' + qs : '');
}

function goBoard(url) {
  if (typeof navigateTo === 'function') navigateTo(url);
  else location.href = url;
}

/* 로그인이 필요한 기능: 로그인 화면으로 보냈다가 다 하면 next 페이지로 돌아옴 */
function goLoginFor(next, message) {
  showToast(message);
  goBoard('login.html?next=' + encodeURIComponent(next));
}

function lastBoardListUrl() {
  try { return sessionStorage.getItem(BOARD_LIST_KEY) || 'board.html'; } catch (e) { return 'board.html'; }
}

/* ---------- 목록 ---------- */
function initBoardPage() {
  const params = new URLSearchParams(location.search);
  const state = {
    category: BOARD_CATEGORIES.some((c) => c.key === params.get('cat') && c.writable) ? params.get('cat') : 'all',
    field: ['title', 'all', 'author'].includes(params.get('field')) ? params.get('field') : 'title',
    query: (params.get('q') || '').slice(0, 30),
    page: Math.max(1, parseInt(params.get('page'), 10) || 1)
  };
  try { sessionStorage.setItem(BOARD_LIST_KEY, boardListUrl(state)); } catch (e) { /* 무시 */ }

  const el = {
    tabs: document.getElementById('boardTabs'),
    form: document.getElementById('boardSearch'),
    field: document.getElementById('searchField'),
    query: document.getElementById('searchQuery'),
    summary: document.getElementById('boardSummary'),
    body: document.getElementById('boardBody'),
    tableWrap: document.getElementById('boardTableWrap'),
    empty: document.getElementById('boardEmpty'),
    emptyTitle: document.getElementById('boardEmptyTitle'),
    emptyDesc: document.getElementById('boardEmptyDesc'),
    pages: document.getElementById('boardPages'),
    writeBtn: document.getElementById('writeBtn')
  };
  let alive = true;

  // 말머리 탭
  [{ key: 'all', label: '전체', icon: '' }].concat(BOARD_CATEGORIES.filter((c) => c.writable)).forEach((cat) => {
    const a = document.createElement('a');
    a.className = 'chip';
    a.href = boardListUrl({ category: cat.key, field: state.field, query: state.query });
    a.textContent = (cat.icon ? cat.icon + ' ' : '') + cat.label;
    if (cat.key === state.category) a.setAttribute('aria-current', 'page');
    el.tabs.appendChild(a);
  });

  el.field.value = state.field;
  el.query.value = state.query;
  el.form.addEventListener('submit', (e) => {
    e.preventDefault();
    goBoard(boardListUrl({ category: state.category, field: el.field.value, query: el.query.value.trim().slice(0, 30) }));
  });

  // 글쓰기: 로그인 안 했으면 로그인 화면으로
  el.writeBtn.addEventListener('click', (e) => {
    if (Auth.getCurrentUser()) return;
    e.preventDefault();
    goLoginFor('board-write.html', '글을 쓰려면 로그인해 주세요.');
  });

  function rowHtml(post, number) {
    const cat = boardCategory(post.category);
    const href = 'board-view.html?id=' + post.id;
    return '<tr' + (post.isNotice ? ' class="is-notice"' : '') + '>' +
      '<td class="col-no">' + (post.isNotice ? '<span class="notice-badge">공지</span>' : number) + '</td>' +
      '<td class="col-cat"><span class="cat-tag cat-' + cat.key + '">' + cat.icon + ' ' + cat.label + '</span></td>' +
      '<td class="col-title"><a href="' + href + '">' + escapeHtml(post.title) + '</a>' +
      (post.commentCount ? ' <span class="comment-count" aria-label="댓글 ' + post.commentCount + '개">[' + post.commentCount + ']</span>' : '') +
      (isNewPost(post.createdAt) ? ' <span class="new-badge" aria-label="새 글">N</span>' : '') + '</td>' +
      '<td class="col-author">' + escapeHtml(post.authorName) + '</td>' +
      '<td class="col-date"><time datetime="' + new Date(post.createdAt).toISOString() + '">' + formatBoardDate(post.createdAt) + '</time></td>' +
      '<td class="col-num" data-label="조회">' + post.views.toLocaleString('ko-KR') + '</td>' +
      '<td class="col-num" data-label="추천">' + post.likeCount.toLocaleString('ko-KR') + '</td>' +
      '</tr>';
  }

  function pagesHtml(page, pages) {
    if (pages <= 1) return '';
    const link = (p, label, aria, cls) => '<a href="' + boardListUrl({ category: state.category, field: state.field, query: state.query, page: p }) + '" class="' + (cls || '') + '" aria-label="' + aria + '">' + label + '</a>';
    const first = Math.max(1, Math.min(page - 2, pages - 4));
    const last = Math.min(pages, first + 4);
    let html = page > 1 ? link(page - 1, '‹', '이전 페이지', 'page-step') : '<span class="page-step disabled" aria-hidden="true">‹</span>';
    if (first > 1) html += link(1, '1', '1페이지') + (first > 2 ? '<span class="page-gap" aria-hidden="true">…</span>' : '');
    for (let p = first; p <= last; p++) {
      html += p === page ? '<span class="page-current" aria-current="page">' + p + '</span>' : link(p, String(p), p + '페이지');
    }
    if (last < pages) html += (last < pages - 1 ? '<span class="page-gap" aria-hidden="true">…</span>' : '') + link(pages, String(pages), pages + '페이지');
    html += page < pages ? link(page + 1, '›', '다음 페이지', 'page-step') : '<span class="page-step disabled" aria-hidden="true">›</span>';
    return html;
  }

  BoardStore.list(state).then((result) => {
    if (!alive) return;
    const catLabel = state.category === 'all' ? '전체' : boardCategory(state.category).label;
    if (state.query) {
      el.summary.innerHTML = '<strong>' + escapeHtml(catLabel) + '</strong>에서 "' + escapeHtml(state.query) + '" 검색 결과 <strong>' + result.total + '</strong>개 · ' +
        '<a href="' + boardListUrl({ category: state.category }) + '">검색 지우기</a>';
    } else {
      el.summary.innerHTML = '<strong>' + escapeHtml(catLabel) + '</strong> 글 <strong>' + result.total + '</strong>개';
    }

    const rows = result.notices.map((p) => rowHtml(p)).concat(result.posts.map((p, i) => rowHtml(p, result.startNumber - i)));
    el.body.innerHTML = rows.join('');

    const noPosts = result.posts.length === 0;
    el.empty.hidden = !noPosts;
    if (noPosts) {
      el.emptyTitle.textContent = state.query ? '찾는 글이 없어요' : '아직 글이 없어요';
      el.emptyDesc.textContent = state.query ? '다른 검색어나 말머리로 찾아보세요.' : '첫 글을 남겨서 게시판을 열어 주세요!';
    }
    el.tableWrap.hidden = rows.length === 0;
    el.pages.innerHTML = pagesHtml(result.page, result.pages);
  });

  return function cleanup() { alive = false; };
}

/* ---------- 글쓰기 / 수정 ---------- */
function initBoardWritePage() {
  const editId = parseInt(new URLSearchParams(location.search).get('edit'), 10) || 0;
  const el = {
    heading: document.getElementById('writeHeading'),
    desc: document.getElementById('writeDesc'),
    login: document.getElementById('writeLogin'),
    loginLink: document.getElementById('writeLoginLink'),
    form: document.getElementById('writeForm'),
    cats: document.getElementById('catChips'),
    catMsg: document.getElementById('writeCatMsg'),
    title: document.getElementById('writeTitleInput'),
    titleCount: document.getElementById('titleCounter'),
    content: document.getElementById('writeContent'),
    contentCount: document.getElementById('contentCounter'),
    error: document.getElementById('writeError'),
    submit: document.getElementById('writeSubmit'),
    cancel: document.getElementById('writeCancel')
  };
  let alive = true;
  const here = 'board-write.html' + (editId ? '?edit=' + editId : '');

  if (!Auth.getCurrentUser()) {
    el.form.hidden = true;
    el.login.hidden = false;
    el.loginLink.href = 'login.html?next=' + encodeURIComponent(here);
    return null;
  }

  // 말머리 (공지는 빼고)
  el.cats.innerHTML = BOARD_CATEGORIES.filter((c) => c.writable).map((c) =>
    '<label class="chip-radio"><input type="radio" name="writeCat" value="' + c.key + '"><span>' + c.icon + ' ' + c.label + '</span></label>').join('');
  const catInputs = el.cats.querySelectorAll('input');

  function setCategory(key) {
    catInputs.forEach((input) => { input.checked = input.value === key; });
  }
  function selectedCategory() {
    const checked = el.cats.querySelector('input:checked');
    return checked ? checked.value : '';
  }

  function updateCounters() {
    el.titleCount.textContent = el.title.value.length + ' / ' + BOARD_LIMITS.titleMax;
    el.contentCount.textContent = el.content.value.length.toLocaleString('ko-KR') + ' / ' + BOARD_LIMITS.contentMax.toLocaleString('ko-KR');
  }
  el.title.maxLength = BOARD_LIMITS.titleMax;
  el.content.maxLength = BOARD_LIMITS.contentMax;
  el.title.addEventListener('input', () => { updateCounters(); setFieldMessage(el.title, '', false); el.error.textContent = ''; });
  el.content.addEventListener('input', () => { updateCounters(); setFieldMessage(el.content, '', false); el.error.textContent = ''; });
  el.cats.addEventListener('change', () => { el.catMsg.textContent = ''; el.cats.closest('.form-row').classList.remove('has-error'); });

  // 새 글: 목록에서 고른 말머리를 미리 골라 둠
  const listCat = new URLSearchParams(lastBoardListUrl().split('?')[1] || '').get('cat');
  setCategory(BOARD_CATEGORIES.some((c) => c.key === listCat && c.writable) ? listCat : 'food');
  el.cancel.href = lastBoardListUrl();
  updateCounters();

  if (editId) {
    el.heading.textContent = '글 수정 ✏️';
    el.desc.textContent = '고친 다음 저장하면 글에 "수정됨"이 표시돼요.';
    el.submit.textContent = '저장';
    el.cancel.href = 'board-view.html?id=' + editId;
    el.form.classList.add('is-loading');
    BoardStore.get(editId, false).then((result) => {
      if (!alive) return;
      el.form.classList.remove('is-loading');
      if (!result.ok || !result.post.isMine) {
        showToast(result.ok ? '내가 쓴 글만 고칠 수 있어요.' : result.message);
        goBoard(result.ok ? 'board-view.html?id=' + editId : 'board.html');
        return;
      }
      setCategory(result.post.category);
      el.title.value = result.post.title;
      el.content.value = result.post.content;
      updateCounters();
    });
  }

  el.form.addEventListener('submit', async (e) => {
    e.preventDefault();
    el.error.textContent = '';
    const fields = { category: selectedCategory(), title: el.title.value, content: el.content.value };
    el.submit.disabled = true;
    const result = editId ? await BoardStore.update(editId, fields) : await BoardStore.create(fields);
    el.submit.disabled = false;
    if (!alive) return;

    if (!result.ok) {
      if (result.field === 'category') {
        el.catMsg.textContent = result.message;
        el.cats.closest('.form-row').classList.add('has-error');
      } else if (result.field === 'title' || result.field === 'content') {
        const input = result.field === 'title' ? el.title : el.content;
        setFieldMessage(input, result.message, false);
        input.focus();
      } else {
        el.error.textContent = result.message;
      }
      return;
    }
    showToast(editId ? '글을 고쳤어요.' : '글을 올렸어요! 🎉');
    goBoard('board-view.html?id=' + result.id);
  });

  if (!editId) el.title.focus();
  return function cleanup() { alive = false; };
}

/* ---------- 글 보기 ---------- */
function initBoardViewPage() {
  const id = parseInt(new URLSearchParams(location.search).get('id'), 10) || 0;
  const here = 'board-view.html?id=' + id;
  const el = {
    post: document.getElementById('post'),
    missing: document.getElementById('postMissing'),
    cat: document.getElementById('postCat'),
    title: document.getElementById('postTitle'),
    meta: document.getElementById('postMeta'),
    body: document.getElementById('postBody'),
    likeBtn: document.getElementById('likeBtn'),
    likeCount: document.getElementById('likeCount'),
    tools: document.getElementById('postTools'),
    editLink: document.getElementById('editLink'),
    deleteBtn: document.getElementById('deleteBtn'),
    comments: document.getElementById('comments'),
    commentCount: document.getElementById('commentCount'),
    commentList: document.getElementById('commentList'),
    commentForm: document.getElementById('commentForm'),
    commentInput: document.getElementById('commentInput'),
    commentCounter: document.getElementById('commentCounter'),
    commentSubmit: document.getElementById('commentSubmit'),
    commentLogin: document.getElementById('commentLogin'),
    commentLoginLink: document.getElementById('commentLoginLink'),
    postNav: document.getElementById('postNav'),
    listLinks: document.querySelectorAll('[data-board-list]')
  };
  let alive = true;
  let post = null;

  el.listLinks.forEach((a) => { a.href = lastBoardListUrl(); });
  el.commentInput.maxLength = BOARD_LIMITS.commentMax;

  function renderComments() {
    el.commentCount.textContent = post.comments.length;
    el.commentList.innerHTML = post.comments.length
      ? post.comments.map((c) =>
        '<li class="comment">' +
        '<div class="comment-head"><strong>' + escapeHtml(c.authorName) + '</strong>' +
        (c.isPostAuthor ? '<span class="writer-badge">작성자</span>' : '') +
        '<time datetime="' + new Date(c.createdAt).toISOString() + '">' + formatBoardDateTime(c.createdAt) + '</time>' +
        (c.isMine ? '<button type="button" class="text-btn comment-del" data-comment="' + c.id + '">삭제</button>' : '') + '</div>' +
        '<p class="comment-body">' + escapeHtml(c.content) + '</p>' +
        '</li>').join('')
      : '<li class="comment-empty">첫 댓글을 남겨 보세요.</li>';
  }

  function renderLike() {
    el.likeBtn.setAttribute('aria-pressed', post.liked ? 'true' : 'false');
    el.likeBtn.classList.toggle('is-liked', post.liked);
    el.likeCount.textContent = post.likeCount;
  }

  function render(result) {
    post = result.post;
    const cat = boardCategory(post.category);
    el.cat.innerHTML = '<span class="cat-tag cat-' + cat.key + '">' + cat.icon + ' ' + cat.label + '</span>';
    el.title.textContent = post.title;
    document.title = post.title + ' - 오늘 뭐 먹지? 게시판';
    el.meta.innerHTML =
      '<span class="post-author">' + escapeHtml(post.authorName) + '</span>' +
      '<span><time datetime="' + new Date(post.createdAt).toISOString() + '">' + formatBoardDateTime(post.createdAt) + '</time>' +
      (post.updatedAt ? ' <span class="edited">(수정됨)</span>' : '') + '</span>' +
      '<span>조회 ' + post.views.toLocaleString('ko-KR') + '</span>';
    el.body.textContent = post.content;
    renderLike();
    el.tools.hidden = !post.isMine;
    el.editLink.href = 'board-write.html?edit=' + post.id;
    el.likeBtn.hidden = post.isNotice;
    renderComments();

    const user = Auth.getCurrentUser();
    el.commentForm.hidden = !user;
    el.commentLogin.hidden = Boolean(user);
    el.commentLoginLink.href = 'login.html?next=' + encodeURIComponent(here);

    const nav = [];
    if (result.next) nav.push('<a href="board-view.html?id=' + result.next.id + '"><span class="post-nav-label">다음글 ▲</span><span class="post-nav-title">' + escapeHtml(result.next.title) + '</span></a>');
    if (result.prev) nav.push('<a href="board-view.html?id=' + result.prev.id + '"><span class="post-nav-label">이전글 ▼</span><span class="post-nav-title">' + escapeHtml(result.prev.title) + '</span></a>');
    el.postNav.innerHTML = nav.join('');
    el.postNav.hidden = nav.length === 0;

    el.post.hidden = false;
    el.comments.hidden = false;
  }

  function reload() {
    return BoardStore.get(id, false).then((result) => {
      if (alive && result.ok) render(result);
    });
  }

  BoardStore.get(id, true).then((result) => {
    if (!alive) return;
    if (!result.ok) {
      el.missing.hidden = false;
      return;
    }
    render(result);
  });

  el.likeBtn.addEventListener('click', async () => {
    if (!Auth.getCurrentUser()) {
      goLoginFor(here, '추천하려면 로그인해 주세요.');
      return;
    }
    const result = await BoardStore.toggleLike(id);
    if (!alive) return;
    if (!result.ok) {
      showToast(result.message);
      return;
    }
    post.liked = result.liked;
    post.likeCount = result.likeCount;
    renderLike();
    showToast(result.liked ? '이 글을 추천했어요 👍' : '추천을 취소했어요.');
  });

  el.deleteBtn.addEventListener('click', async () => {
    if (!window.confirm('이 글을 지울까요?\n지운 글과 댓글은 되돌릴 수 없어요.')) return;
    const result = await BoardStore.remove(id);
    if (!alive) return;
    if (!result.ok) {
      showToast(result.message);
      return;
    }
    showToast('글을 지웠어요.');
    goBoard(lastBoardListUrl());
  });

  el.commentInput.addEventListener('input', () => {
    el.commentCounter.textContent = el.commentInput.value.length + ' / ' + BOARD_LIMITS.commentMax;
  });

  el.commentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!el.commentInput.value.trim()) {
      showToast('댓글 내용을 입력해 주세요.');
      el.commentInput.focus();
      return;
    }
    el.commentSubmit.disabled = true;
    const result = await BoardStore.addComment(id, el.commentInput.value);
    el.commentSubmit.disabled = false;
    if (!alive) return;
    if (!result.ok) {
      showToast(result.message);
      return;
    }
    el.commentInput.value = '';
    el.commentCounter.textContent = '0 / ' + BOARD_LIMITS.commentMax;
    await reload();
    showToast('댓글을 남겼어요.');
  });

  el.commentList.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-comment]');
    if (!btn || !window.confirm('이 댓글을 지울까요?')) return;
    const result = await BoardStore.removeComment(id, Number(btn.dataset.comment));
    if (!alive) return;
    if (!result.ok) {
      showToast(result.message);
      return;
    }
    await reload();
    showToast('댓글을 지웠어요.');
  });

  return function cleanup() { alive = false; };
}
