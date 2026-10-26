/* 게시판 데이터 (글 · 댓글 · 추천 저장과 불러오기)
   - 화면(board.js)은 이 파일의 BoardStore 함수만 부릅니다.
   - 지금은 이 브라우저(localStorage)에 저장합니다. 서버·DB로 바꿀 때는 이 파일 안쪽만 바꾸면 됩니다.
   - 서버처럼 결과를 기다리는 모양(async)이고, 누가 썼는지는 auth.js의 로그인 정보로 정합니다. */

const BOARD_KEY = 'wte-board';
const BOARD_VIEWED_KEY = 'wte-board-viewed'; // 이번 방문에서 이미 본 글 (새로고침할 때마다 조회수가 오르지 않게)
const BOARD_SYSTEM_ID = '__system__';        // 운영자 공지 (가입 아이디 규칙에 맞지 않아서 누구도 이 아이디로 가입할 수 없음)

/* 말머리: 공지는 운영자만 씀 */
const BOARD_CATEGORIES = [
  { key: 'notice', label: '공지', icon: '📢', writable: false },
  { key: 'food', label: '맛집 추천', icon: '🍜', writable: true },
  { key: 'pick', label: '메뉴 고민', icon: '🤔', writable: true },
  { key: 'free', label: '자유', icon: '💬', writable: true }
];

const BOARD_LIMITS = { titleMin: 2, titleMax: 50, contentMin: 5, contentMax: 2000, commentMax: 300, pageSize: 10 };

function boardCategory(key) {
  return BOARD_CATEGORIES.find((c) => c.key === key) || BOARD_CATEGORIES[3];
}

/* 처음 열었을 때 넣어 두는 이용 안내 공지 */
function boardSeed() {
  return {
    nextId: 2,
    nextCommentId: 1,
    posts: [{
      id: 1,
      category: 'notice',
      title: '게시판 이용 안내',
      content: '오늘 뭐 먹지? 게시판에 오신 걸 환영해요!\n\n' +
        '🍜 맛집 추천: 학교 앞 단골집, 가성비 좋은 식당을 알려 주세요.\n' +
        '🤔 메뉴 고민: 두 메뉴 사이에서 고민될 때 의견을 물어보세요.\n' +
        '💬 자유: 먹는 이야기라면 뭐든 좋아요.\n\n' +
        '글쓰기, 댓글, 추천은 로그인한 다음 할 수 있어요.\n' +
        '다른 사람을 불편하게 하는 글은 지워 주세요. 함께 즐겁게 이용해요 😋',
      authorId: BOARD_SYSTEM_ID,
      authorName: '운영자',
      createdAt: new Date(2026, 9, 15, 9, 0).getTime(),
      updatedAt: null,
      views: 0,
      likes: [],
      comments: []
    }]
  };
}

/* ---------- 저장소 (서버로 바꿀 때 이 부분이 서버 요청으로 바뀜) ---------- */
function readBoard() {
  try {
    const raw = localStorage.getItem(BOARD_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* 아래에서 새로 만듦 */ }
  const seed = boardSeed();
  writeBoard(seed);
  return seed;
}

function writeBoard(data) {
  try {
    localStorage.setItem(BOARD_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    return false;
  }
}

function boardDelay(value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), 120));
}

function boardFail(message, field) {
  return boardDelay({ ok: false, message: message, field: field || '' });
}

/* 화면에 넘길 때 쓰는 모양 (추천한 사람 목록 대신 개수와 내가 추천했는지) */
function publicPost(post, user, withComments) {
  const authorGone = post.authorId !== BOARD_SYSTEM_ID && typeof Auth !== 'undefined' && !Auth.userExists(post.authorId);
  const result = {
    id: post.id,
    category: post.category,
    title: post.title,
    content: post.content,
    authorName: authorGone ? '탈퇴한 회원' : post.authorName,
    isMine: Boolean(user) && post.authorId === user.id,
    isNotice: post.category === 'notice',
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    views: post.views,
    likeCount: post.likes.length,
    liked: Boolean(user) && post.likes.includes(user.id),
    commentCount: post.comments.length
  };
  if (withComments) {
    result.comments = post.comments.map((c) => ({
      id: c.id,
      content: c.content,
      authorName: typeof Auth !== 'undefined' && !Auth.userExists(c.authorId) ? '탈퇴한 회원' : c.authorName,
      isMine: Boolean(user) && c.authorId === user.id,
      isPostAuthor: c.authorId === post.authorId,
      createdAt: c.createdAt
    }));
  }
  return result;
}

function checkPostFields({ category, title, content }) {
  const cat = BOARD_CATEGORIES.find((c) => c.key === category);
  if (!cat || !cat.writable) return { field: 'category', message: '말머리를 골라 주세요.' };
  const t = (title || '').trim();
  if (t.length < BOARD_LIMITS.titleMin) return { field: 'title', message: '제목을 ' + BOARD_LIMITS.titleMin + '자 이상 입력해 주세요.' };
  if (t.length > BOARD_LIMITS.titleMax) return { field: 'title', message: '제목은 ' + BOARD_LIMITS.titleMax + '자까지 쓸 수 있어요.' };
  const c = (content || '').trim();
  if (c.length < BOARD_LIMITS.contentMin) return { field: 'content', message: '내용을 ' + BOARD_LIMITS.contentMin + '자 이상 입력해 주세요.' };
  if (c.length > BOARD_LIMITS.contentMax) return { field: 'content', message: '내용은 ' + BOARD_LIMITS.contentMax.toLocaleString('ko-KR') + '자까지 쓸 수 있어요.' };
  return null;
}

function currentBoardUser() {
  return typeof Auth !== 'undefined' ? Auth.getCurrentUser() : null;
}

/* ---------- 화면에서 부르는 함수 ---------- */
const BoardStore = {
  /* 글 목록: 공지는 따로(항상 맨 위), 나머지는 최신순 + 말머리·검색·페이지 */
  async list({ category = 'all', field = 'title', query = '', page = 1 } = {}) {
    const user = currentBoardUser();
    const posts = readBoard().posts;
    const keyword = query.trim().toLowerCase();

    const notices = posts.filter((p) => p.category === 'notice').sort((a, b) => b.id - a.id);
    let normal = posts.filter((p) => p.category !== 'notice');
    if (category !== 'all') normal = normal.filter((p) => p.category === category);
    if (keyword) {
      normal = normal.filter((p) => {
        if (field === 'author') return p.authorName.toLowerCase().includes(keyword);
        if (field === 'content') return p.content.toLowerCase().includes(keyword);
        return p.title.toLowerCase().includes(keyword) || (field === 'all' && p.content.toLowerCase().includes(keyword));
      });
    }
    normal.sort((a, b) => b.id - a.id);

    const total = normal.length;
    const pages = Math.max(1, Math.ceil(total / BOARD_LIMITS.pageSize));
    const current = Math.min(Math.max(1, page), pages);
    const start = (current - 1) * BOARD_LIMITS.pageSize;
    return boardDelay({
      ok: true,
      notices: category === 'all' && !keyword ? notices.map((p) => publicPost(p, user)) : [],
      posts: normal.slice(start, start + BOARD_LIMITS.pageSize).map((p) => publicPost(p, user)),
      total: total,
      page: current,
      pages: pages,
      startNumber: total - start // 목록 번호 (가장 최근 글이 가장 큰 번호)
    });
  },

  /* 글 하나 + 댓글 + 이전글·다음글. countView면 이번 방문에서 처음 볼 때만 조회수 +1 */
  async get(id, countView) {
    const data = readBoard();
    const post = data.posts.find((p) => p.id === id);
    if (!post) return boardFail('삭제되었거나 없는 글이에요.');

    if (countView) {
      let viewed = [];
      try { viewed = JSON.parse(sessionStorage.getItem(BOARD_VIEWED_KEY)) || []; } catch (e) { /* 처음 */ }
      if (!viewed.includes(id)) {
        post.views += 1;
        writeBoard(data);
        viewed.push(id);
        try { sessionStorage.setItem(BOARD_VIEWED_KEY, JSON.stringify(viewed)); } catch (e) { /* 기억 못 해도 괜찮음 */ }
      }
    }

    // 이전글·다음글 (공지 제외, 번호 순)
    const normal = data.posts.filter((p) => p.category !== 'notice').map((p) => p.id).sort((a, b) => a - b);
    const index = normal.indexOf(id);
    const pick = (pid) => {
      const p = data.posts.find((x) => x.id === pid);
      return p ? { id: p.id, title: p.title } : null;
    };
    return boardDelay({
      ok: true,
      post: publicPost(post, currentBoardUser(), true),
      prev: index > 0 ? pick(normal[index - 1]) : null,
      next: index >= 0 && index < normal.length - 1 ? pick(normal[index + 1]) : null
    });
  },

  async create(fields) {
    const user = currentBoardUser();
    if (!user) return boardFail('로그인한 다음에 글을 쓸 수 있어요.');
    const error = checkPostFields(fields);
    if (error) return boardFail(error.message, error.field);

    const data = readBoard();
    const post = {
      id: data.nextId++,
      category: fields.category,
      title: fields.title.trim(),
      content: fields.content.trim(),
      authorId: user.id,
      authorName: user.nickname,
      createdAt: Date.now(),
      updatedAt: null,
      views: 0,
      likes: [],
      comments: []
    };
    data.posts.push(post);
    if (!writeBoard(data)) return boardFail('저장 공간이 부족해서 글을 올리지 못했어요.');
    return boardDelay({ ok: true, id: post.id });
  },

  async update(id, fields) {
    const user = currentBoardUser();
    const data = readBoard();
    const post = data.posts.find((p) => p.id === id);
    if (!post) return boardFail('삭제되었거나 없는 글이에요.');
    if (!user || post.authorId !== user.id) return boardFail('내가 쓴 글만 고칠 수 있어요.');
    const error = checkPostFields(fields);
    if (error) return boardFail(error.message, error.field);

    post.category = fields.category;
    post.title = fields.title.trim();
    post.content = fields.content.trim();
    post.updatedAt = Date.now();
    if (!writeBoard(data)) return boardFail('저장하지 못했어요. 다시 시도해 주세요.');
    return boardDelay({ ok: true, id: post.id });
  },

  async remove(id) {
    const user = currentBoardUser();
    const data = readBoard();
    const post = data.posts.find((p) => p.id === id);
    if (!post) return boardFail('이미 삭제된 글이에요.');
    if (!user || post.authorId !== user.id) return boardFail('내가 쓴 글만 지울 수 있어요.');
    data.posts = data.posts.filter((p) => p.id !== id);
    writeBoard(data);
    return boardDelay({ ok: true });
  },

  /* 추천: 한 번 더 누르면 취소. 내 글은 추천할 수 없음 */
  async toggleLike(id) {
    const user = currentBoardUser();
    if (!user) return boardFail('로그인한 다음에 추천할 수 있어요.');
    const data = readBoard();
    const post = data.posts.find((p) => p.id === id);
    if (!post) return boardFail('삭제되었거나 없는 글이에요.');
    if (post.authorId === user.id) return boardFail('내 글은 추천할 수 없어요.');
    const liked = !post.likes.includes(user.id);
    post.likes = liked ? post.likes.concat(user.id) : post.likes.filter((u) => u !== user.id);
    writeBoard(data);
    return boardDelay({ ok: true, liked: liked, likeCount: post.likes.length });
  },

  async addComment(postId, content) {
    const user = currentBoardUser();
    if (!user) return boardFail('로그인한 다음에 댓글을 쓸 수 있어요.');
    const text = (content || '').trim();
    if (!text) return boardFail('댓글 내용을 입력해 주세요.');
    if (text.length > BOARD_LIMITS.commentMax) return boardFail('댓글은 ' + BOARD_LIMITS.commentMax + '자까지 쓸 수 있어요.');
    const data = readBoard();
    const post = data.posts.find((p) => p.id === postId);
    if (!post) return boardFail('삭제되었거나 없는 글이에요.');
    post.comments.push({ id: data.nextCommentId++, authorId: user.id, authorName: user.nickname, content: text, createdAt: Date.now() });
    writeBoard(data);
    return boardDelay({ ok: true });
  },

  async removeComment(postId, commentId) {
    const user = currentBoardUser();
    const data = readBoard();
    const post = data.posts.find((p) => p.id === postId);
    const comment = post && post.comments.find((c) => c.id === commentId);
    if (!comment) return boardFail('이미 삭제된 댓글이에요.');
    if (!user || comment.authorId !== user.id) return boardFail('내가 쓴 댓글만 지울 수 있어요.');
    post.comments = post.comments.filter((c) => c.id !== commentId);
    writeBoard(data);
    return boardDelay({ ok: true });
  }
};
