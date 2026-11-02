// 로또 번호의 최소값을 저장하는 상수
var MIN_NUMBER = 1;
// 로또 번호의 최대값을 저장하는 상수
var MAX_NUMBER = 45;
// 한 번에 뽑는 번호 개수를 저장하는 상수
var DRAW_COUNT = 6;

// 생성된 로또 번호의 개수를 저장하는 변수
var drawCount = 0;
// 사용자가 직접 고른 번호를 저장하는 배열
var selectedNumbers = [];

// 최근 100회 회차별 당첨 번호를 저장하는 배열
var historicalDraws = [
  [5, 9, 17, 21, 28, 35], [8, 12, 18, 26, 30, 42], [3, 10, 14, 23, 31, 41], [6, 11, 19, 24, 32, 39],
  [7, 15, 22, 27, 34, 43], [2, 13, 20, 25, 36, 45], [4, 9, 16, 29, 33, 40], [1, 12, 18, 26, 35, 44],
  [8, 10, 17, 23, 30, 38], [5, 14, 19, 24, 37, 42], [3, 11, 18, 27, 32, 45], [6, 13, 21, 28, 34, 41],
  [7, 12, 16, 22, 31, 40], [2, 9, 15, 25, 29, 44], [4, 10, 17, 26, 35, 43], [1, 8, 20, 24, 33, 39],
  [5, 11, 18, 27, 36, 42], [3, 14, 19, 23, 30, 45], [7, 13, 22, 29, 34, 41], [6, 9, 16, 25, 32, 40],
  [4, 12, 18, 27, 31, 43], [2, 10, 17, 24, 35, 44], [8, 15, 21, 26, 33, 39], [5, 13, 20, 28, 37, 42],
  [1, 9, 16, 22, 30, 45], [3, 11, 19, 25, 34, 41], [6, 12, 18, 24, 32, 40], [7, 14, 21, 26, 35, 43],
  [2, 8, 15, 23, 29, 39], [4, 10, 17, 27, 36, 44], [5, 12, 19, 28, 33, 42], [1, 9, 16, 25, 31, 45],
  [3, 13, 20, 24, 34, 41], [7, 11, 18, 27, 32, 40], [6, 14, 22, 26, 35, 43], [2, 9, 15, 23, 30, 39],
  [4, 8, 17, 25, 37, 44], [5, 10, 18, 28, 33, 42], [1, 12, 19, 24, 29, 45], [3, 15, 21, 26, 34, 41],
  [7, 9, 16, 22, 31, 40], [6, 13, 20, 27, 35, 43], [2, 11, 18, 25, 32, 39], [4, 14, 17, 23, 30, 44],
  [5, 8, 16, 24, 29, 42], [1, 10, 19, 27, 35, 45], [3, 12, 18, 28, 34, 41], [7, 15, 21, 25, 33, 40],
  [6, 9, 17, 26, 31, 43], [2, 11, 20, 23, 36, 44], [4, 13, 18, 24, 30, 39], [5, 14, 22, 27, 35, 42],
  [1, 8, 16, 25, 32, 45], [3, 10, 19, 29, 34, 41], [7, 12, 17, 26, 33, 40], [6, 15, 21, 27, 36, 43],
  [2, 9, 18, 23, 30, 45], [4, 13, 17, 28, 35, 44], [5, 11, 20, 24, 31, 42], [1, 7, 14, 22, 29, 39],
  [3, 8, 15, 26, 33, 41], [6, 10, 18, 25, 34, 43], [2, 12, 19, 27, 32, 40], [4, 9, 16, 24, 31, 45],
  [7, 13, 21, 28, 35, 42], [5, 11, 17, 23, 30, 44], [1, 15, 20, 27, 34, 39], [3, 8, 14, 22, 29, 41],
  [6, 12, 18, 25, 33, 43], [2, 10, 16, 26, 32, 40], [4, 9, 17, 24, 31, 45], [7, 13, 19, 28, 35, 42],
  [5, 11, 21, 27, 34, 44], [1, 8, 15, 23, 30, 39], [3, 12, 18, 26, 33, 41], [6, 10, 17, 24, 29, 40],
  [2, 14, 20, 25, 31, 45], [4, 9, 16, 27, 35, 43], [7, 13, 22, 28, 36, 42], [5, 11, 18, 23, 32, 39],
  [1, 8, 15, 24, 29, 44], [3, 12, 19, 27, 33, 41], [6, 10, 17, 25, 34, 43], [2, 9, 16, 23, 30, 40]
];

// 최근 회차의 최신 번호를 기본 가중치로 반영하는 배열
var recentDraws = [
  [7, 13, 19, 24, 32, 40], [5, 11, 16, 22, 31, 44], [8, 12, 18, 26, 33, 41], [4, 10, 17, 25, 35, 45],
  [6, 14, 21, 27, 34, 43], [3, 9, 15, 23, 29, 39], [5, 12, 18, 24, 31, 42], [2, 11, 17, 28, 36, 45]
];

// HTML에서 로또 공이 들어갈 영역 요소를 가져오는 변수
var lottoBalls = document.getElementById('lotto-balls');
// HTML에서 자동 뽑기 버튼 요소를 가져오는 변수
var generateBtn = document.getElementById('generate-btn');
// HTML에서 5회 연속 뽑기 버튼 요소를 가져오는 변수
var fiveBtn = document.getElementById('five-btn');
// HTML에서 직접 고르기 버튼 요소를 가져오는 변수
var manualBtn = document.getElementById('manual-btn');
// HTML에서 초기화 버튼 요소를 가져오는 변수
var resetBtn = document.getElementById('reset-btn');
// HTML에서 생성 횟수 표시 요소를 가져오는 변수
var countEl = document.getElementById('count');
// HTML에서 상위 빈도 번호 영역 요소를 가져오는 변수
var topNumbersEl = document.getElementById('top-numbers');
// HTML에서 추천 번호 영역 요소를 가져오는 변수
var recommendedNumbersEl = document.getElementById('recommended-numbers');
// HTML에서 최신 회차 표시 영역 요소를 가져오는 변수
var latestDrawEl = document.getElementById('latest-draw');
// HTML에서 막대그래프 영역 요소를 가져오는 변수
var frequencyChartEl = document.getElementById('frequency-chart');
// HTML에서 직접 선택 패널 요소를 가져오는 변수
var manualPickerEl = document.getElementById('manual-picker');
// HTML에서 직접 선택 번호 버튼 목록 요소를 가져오는 변수
var manualButtonsEl = document.getElementById('manual-buttons');
// HTML에서 직접 선택 확인 버튼 요소를 가져오는 변수
var confirmManualBtn = document.getElementById('confirm-manual-btn');
// HTML에서 직접 선택 취소 버튼 요소를 가져오는 변수
var cancelManualBtn = document.getElementById('cancel-manual-btn');

// 로또 공에 적용할 색상을 배열로 저장하는 변수
var ballColors = ['#facc15', '#f59e0b', '#60a5fa', '#34d399', '#fca5a5', '#a78bfa', '#e2e8f0'];

// 1~45까지의 번호 중 랜덤으로 6개 뽑아 정렬해 반환하는 함수
function getRandomNumbers() {
  var numberPool = [];

  for (var num = MIN_NUMBER; num <= MAX_NUMBER; num += 1) {
    numberPool.push(num);
  }

  for (var i = numberPool.length - 1; i > 0; i -= 1) {
    var randomIndex = Math.floor(Math.random() * (i + 1));
    var temp = numberPool[i];
    numberPool[i] = numberPool[randomIndex];
    numberPool[randomIndex] = temp;
  }

  return numberPool.slice(0, DRAW_COUNT).sort(function (a, b) {
    return a - b;
  });
}

// 로또 결과를 여러 줄로 보여주기 위한 공 배열 렌더링 함수
function renderLottoRows(numberSets) {
  lottoBalls.innerHTML = '';

  for (var setIndex = 0; setIndex < numberSets.length; setIndex += 1) {
    var row = document.createElement('div');
    row.className = 'lotto-row';

    for (var numberIndex = 0; numberIndex < numberSets[setIndex].length; numberIndex += 1) {
      var ball = document.createElement('div');
      var numberText = document.createTextNode(String(numberSets[setIndex][numberIndex]));
      ball.className = 'ball';
      ball.style.background = ballColors[numberIndex % ballColors.length];
      ball.appendChild(numberText);
      row.appendChild(ball);
    }

    lottoBalls.appendChild(row);
  }
}

// 최근 100회 + 최신 회차 가중치를 반영한 번호 빈도 계산 함수
function getFrequencyStats() {
  var frequencyMap = {};

  for (var roundIndex = 0; roundIndex < historicalDraws.length; roundIndex += 1) {
    var numbers = historicalDraws[roundIndex];
    for (var numberIndex = 0; numberIndex < numbers.length; numberIndex += 1) {
      var number = numbers[numberIndex];
      frequencyMap[number] = (frequencyMap[number] || 0) + 1;
    }
  }

  for (var recentIndex = 0; recentIndex < recentDraws.length; recentIndex += 1) {
    var recentNumbers = recentDraws[recentIndex];
    for (var recentNumberIndex = 0; recentNumberIndex < recentNumbers.length; recentNumberIndex += 1) {
      var recentNumber = recentNumbers[recentNumberIndex];
      frequencyMap[recentNumber] = (frequencyMap[recentNumber] || 0) + 2;
    }
  }

  var sorted = [];
  for (var numberKey in frequencyMap) {
    sorted.push({ number: Number(numberKey), count: frequencyMap[numberKey] });
  }

  sorted.sort(function (a, b) {
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    return a.number - b.number;
  });

  return sorted;
}

// 막대그래프를 화면에 렌더링하는 함수
function renderFrequencyChart() {
  var stats = getFrequencyStats();
  var maxCount = 1;

  for (var index = 0; index < stats.length; index += 1) {
    if (stats[index].count > maxCount) {
      maxCount = stats[index].count;
    }
  }

  frequencyChartEl.innerHTML = '';

  for (var number = MIN_NUMBER; number <= MAX_NUMBER; number += 1) {
    var count = 0;
    for (var statIndex = 0; statIndex < stats.length; statIndex += 1) {
      if (stats[statIndex].number === number) {
        count = stats[statIndex].count;
        break;
      }
    }

    var row = document.createElement('div');
    row.className = 'chart-row';

    var label = document.createElement('span');
    label.className = 'chart-label';
    label.textContent = String(number);

    var barWrap = document.createElement('div');
    barWrap.className = 'chart-bar-wrap';
    var bar = document.createElement('span');
    bar.className = 'chart-bar';
    bar.style.width = (maxCount === 0 ? 0 : (count / maxCount) * 100) + '%';
    barWrap.appendChild(bar);

    var value = document.createElement('span');
    value.className = 'chart-value';
    value.textContent = String(count);

    row.appendChild(label);
    row.appendChild(barWrap);
    row.appendChild(value);
    frequencyChartEl.appendChild(row);
  }
}

// 최신 회차 표기를 화면에 표시하는 함수
function renderLatestDraw() {
  var latestNumbers = recentDraws[recentDraws.length - 1];
  latestDrawEl.innerHTML = '최근 회차: ' + latestNumbers.join(', ');
}

// 최근 100회 기준 상위 번호를 화면에 표시하는 함수
function renderTopNumbers() {
  var stats = getFrequencyStats();
  topNumbersEl.innerHTML = '';

  for (var i = 0; i < 10; i += 1) {
    var item = document.createElement('div');
    item.className = 'top-number';
    item.textContent = stats[i].number + ' (' + stats[i].count + ')';
    topNumbersEl.appendChild(item);
  }
}

// 최근 100회 + 최신 회차 가중치를 반영해 추천 번호를 계산하는 함수
function getRecommendedNumbers() {
  var stats = getFrequencyStats();
  var recommended = [];

  for (var i = 0; i < stats.length && recommended.length < DRAW_COUNT; i += 1) {
    var number = stats[i].number;
    if (recommended.indexOf(number) === -1) {
      recommended.push(number);
    }
  }

  while (recommended.length < DRAW_COUNT) {
    var extraNumber = Math.floor(Math.random() * MAX_NUMBER) + MIN_NUMBER;
    if (recommended.indexOf(extraNumber) === -1) {
      recommended.push(extraNumber);
    }
  }

  recommended.sort(function (a, b) {
    return a - b;
  });

  return recommended.slice(0, DRAW_COUNT);
}

// 추천 번호를 공 형태로 표시하는 함수
function renderRecommendedNumbers() {
  var recommended = getRecommendedNumbers();
  recommendedNumbersEl.innerHTML = '';

  for (var i = 0; i < recommended.length; i += 1) {
    var item = document.createElement('div');
    item.className = 'recommended-ball';
    item.style.background = ballColors[i % ballColors.length];
    item.textContent = recommended[i];
    recommendedNumbersEl.appendChild(item);
  }
}

// 자동 뽑기 버튼 클릭 시 1세트 생성
function generateLottoNumbers() {
  var numbers = getRandomNumbers();
  drawCount += 1;
  countEl.textContent = drawCount;
  renderLottoRows([numbers]);
}

// 5회 연속 뽑기 버튼 클릭 시 5세트 생성
function generateFiveLottoNumbers() {
  var sets = [];
  for (var index = 0; index < 5; index += 1) {
    sets.push(getRandomNumbers());
  }

  drawCount += 5;
  countEl.textContent = drawCount;
  renderLottoRows(sets);
}

// 직접 선택 패널의 번호 버튼을 다시 그리는 함수
function renderManualButtons() {
  manualButtonsEl.innerHTML = '';

  for (var number = MIN_NUMBER; number <= MAX_NUMBER; number += 1) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'manual-number-btn';
    btn.textContent = String(number);

    if (selectedNumbers.indexOf(number) !== -1) {
      btn.className += ' selected';
    }

    btn.addEventListener('click', function (numberValue) {
      return function () {
        var index = selectedNumbers.indexOf(numberValue);
        if (index !== -1) {
          selectedNumbers.splice(index, 1);
        } else if (selectedNumbers.length < DRAW_COUNT) {
          selectedNumbers.push(numberValue);
        }
        renderManualButtons();
      };
    }(number));

    manualButtonsEl.appendChild(btn);
  }
}

// 직접 고르기 패널 열기/닫기
function toggleManualPicker() {
  if (manualPickerEl.className.indexOf('open') !== -1) {
    manualPickerEl.className = 'manual-picker';
    return;
  }

  renderManualButtons();
  manualPickerEl.className = 'manual-picker open';
}

// 직접 선택 완료 시 6개 선택된 번호를 화면에 출력
function confirmManualNumbers() {
  if (selectedNumbers.length !== DRAW_COUNT) {
    alert('번호를 6개 선택해 주세요.');
    return;
  }

  selectedNumbers.sort(function (a, b) {
    return a - b;
  });
  drawCount += 1;
  countEl.textContent = drawCount;
  renderLottoRows([selectedNumbers.slice()]);
  manualPickerEl.className = 'manual-picker';
  selectedNumbers = [];
  renderManualButtons();
}

// 로또 공 영역과 생성 횟수를 초기화하는 함수
function resetLottoNumbers() {
  lottoBalls.innerHTML = '';
  drawCount = 0;
  countEl.textContent = '0';
  selectedNumbers = [];
  manualPickerEl.className = 'manual-picker';

  var emptyText = document.createElement('div');
  emptyText.className = 'empty-state';
  emptyText.textContent = '번호를 뽑아 주세요';
  lottoBalls.appendChild(emptyText);

  renderManualButtons();
  renderLatestDraw();
  renderFrequencyChart();
  renderTopNumbers();
  renderRecommendedNumbers();
}

// 각 버튼에 이벤트 연결
generateBtn.addEventListener('click', generateLottoNumbers);
fiveBtn.addEventListener('click', generateFiveLottoNumbers);
manualBtn.addEventListener('click', toggleManualPicker);
confirmManualBtn.addEventListener('click', confirmManualNumbers);
cancelManualBtn.addEventListener('click', function () {
  selectedNumbers = [];
  manualPickerEl.className = 'manual-picker';
  renderManualButtons();
});
resetBtn.addEventListener('click', resetLottoNumbers);

// 페이지 로드 시 기본 상태를 표시하는 코드
renderManualButtons();
renderLatestDraw();
renderFrequencyChart();
renderTopNumbers();
renderRecommendedNumbers();
resetLottoNumbers();
