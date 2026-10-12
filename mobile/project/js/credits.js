/* 출처 페이지 기능: 사진 출처 목록 그리기 (PHOTO_CREDITS는 js/photo-credits.js에 있음) */

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

/* 탭을 열 때마다 router.js가 실행합니다. */
function initCreditsPage() {
  document.getElementById('creditList').innerHTML = MENUS.map((menu) => {
    const c = PHOTO_CREDITS.find((item) => item.name === menu.name);
    if (!c) return '';
    const license = c.licenseUrl
      ? '<a href="' + c.licenseUrl + '" target="_blank" rel="noopener">' + escapeHtml(c.license) + '</a>'
      : escapeHtml(c.license);
    return '<li class="credit-item">' +
      '<span class="thumb">' + menuPhotoHtml(menu, true) + '</span>' +
      '<div class="credit-text"><strong>' + menu.name + '</strong>' +
      '<span>사진: ' + escapeHtml(c.artist || '작자 미상') + ' · ' + license +
      ' · <a href="' + c.source + '" target="_blank" rel="noopener">원본 보기</a></span></div>' +
      '</li>';
  }).join('');
}
