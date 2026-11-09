// 간단 계산기 동작: 바닐라 자바스크립트만 사용합니다. (외부 라이브러리 없음, 저장 기능 없음)
// ----- 화면 요소 -----
const displayScreen = document.getElementById("display"); // 숫자와 결과가 보이는 표시창을 가져옵니다.
const buttonArea = document.getElementById("buttonArea"); // 모든 버튼을 담고 있는 영역을 가져옵니다.
const ERROR_MESSAGE = "계산할 수 없습니다"; // 0으로 나눌 때처럼 계산이 안 될 때 보여 줄 문구입니다.
// ----- 계산 상태 -----
let previousNumber = null; // 연산자를 누르기 전에 입력한 숫자(첫 번째 숫자)를 저장합니다.
let selectedOperator = null; // 누른 연산자(+, -, *, /)를 저장합니다.
let waitingForNextNumber = false; // true면 다음 숫자를 누를 때 표시창을 새로 시작합니다.
// ----- 숫자음 (귀여운 목소리) -----
const NUMBER_WORDS = { // 숫자 버튼마다 읽어 줄 한국어 말입니다.
  "0": "영", "1": "일", "2": "이", "3": "삼", "4": "사", // 숫자 0~4를 읽을 말입니다.
  "5": "오", "6": "육", "7": "칠", "8": "팔", "9": "구" // 숫자 5~9를 읽을 말입니다.
}; // 읽을 말 표를 마칩니다.
const hasSpeech = "speechSynthesis" in window; // 이 브라우저에 글을 읽어 주는 기능(Web Speech API)이 있는지 확인합니다.
if (hasSpeech) speechSynthesis.getVoices(); // 목소리 목록을 미리 불러 둡니다. (크롬은 처음 부를 때 목록을 준비합니다.)
// 숫자음: 누른 숫자를 높고 귀여운 목소리로 읽어 줍니다.
function playNumberSound(number) { // number는 누른 숫자 글자("0"~"9")입니다.
  const koreanVoice = hasSpeech ? speechSynthesis.getVoices().find((voice) => voice.lang.startsWith("ko")) : undefined; // 이 PC에 있는 한국어 목소리를 찾습니다.
  if (koreanVoice === undefined) return playDialTone(number); // 한국어 목소리가 없으면 대신 키패드 소리를 냅니다.
  speechSynthesis.cancel(); // 빠르게 누를 때 앞 목소리가 밀리지 않도록 하던 말을 멈춥니다.
  const speech = new SpeechSynthesisUtterance(NUMBER_WORDS[number]); // 읽을 말(예: 1이면 "일")을 준비합니다.
  speech.voice = koreanVoice; // 찾은 한국어 목소리를 씁니다.
  speech.pitch = 1.8; // 목소리를 높게(최대 2) 해서 귀엽게 만듭니다.
  speech.rate = 1.2; // 조금 빠르게 읽어서 통통 튀는 느낌을 냅니다.
  speechSynthesis.speak(speech); // 목소리로 읽어 줍니다.
} // 숫자음 함수를 마칩니다.
// ----- 키패드 소리 (목소리가 없을 때 대신 쓰는 소리) -----
const DIAL_TONES = { // 숫자마다 함께 울리는 두 소리의 높이(Hz)입니다. 실제 전화 키패드 숫자음(DTMF)과 같습니다.
  "1": [697, 1209], "2": [697, 1336], "3": [697, 1477], // 맨 윗줄 숫자 1, 2, 3의 소리 높이입니다.
  "4": [770, 1209], "5": [770, 1336], "6": [770, 1477], // 둘째 줄 숫자 4, 5, 6의 소리 높이입니다.
  "7": [852, 1209], "8": [852, 1336], "9": [852, 1477], // 셋째 줄 숫자 7, 8, 9의 소리 높이입니다.
  "0": [941, 1336] // 맨 아랫줄 숫자 0의 소리 높이입니다.
}; // 숫자음 높이 표를 마칩니다.
let soundPlayer = null; // 소리를 만드는 브라우저 기능(AudioContext)입니다. 처음 버튼을 누를 때 만듭니다.
// 키패드 소리: 한국어 목소리가 없을 때 대신 내는 짧은 소리입니다. (0.15초)
function playDialTone(number) { // number는 누른 숫자 글자("0"~"9")입니다.
  if (soundPlayer === null) soundPlayer = new AudioContext(); // 브라우저는 클릭한 뒤에만 소리를 허락하므로 첫 클릭 때 만듭니다.
  const startTime = soundPlayer.currentTime; // 지금 시각을 소리 시작 시각으로 정합니다.
  const volume = soundPlayer.createGain(); // 소리 크기를 조절하는 볼륨 장치를 만듭니다.
  volume.gain.setValueAtTime(0.15, startTime); // 처음 볼륨을 작게(0.15) 정합니다.
  volume.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15); // 0.15초 동안 볼륨을 줄여 '딱' 소리 없이 부드럽게 끝냅니다.
  volume.connect(soundPlayer.destination); // 볼륨 장치를 스피커에 연결합니다.
  for (const frequency of DIAL_TONES[number]) { // 그 숫자의 두 소리 높이를 하나씩 꺼냅니다.
    const tone = soundPlayer.createOscillator(); // 소리(삐 소리)를 만드는 장치를 만듭니다.
    tone.frequency.value = frequency; // 소리 높이를 정합니다.
    tone.connect(volume); // 소리를 볼륨 장치에 연결합니다.
    tone.start(startTime); // 지금 소리를 냅니다.
    tone.stop(startTime + 0.15); // 0.15초 뒤에 소리를 멈춥니다.
  } // 두 소리 만들기를 마칩니다.
} // 키패드 소리 함수를 마칩니다.
// 숫자 버튼(0~9): 누른 숫자를 표시창에 씁니다.
function inputNumber(number) { // number는 누른 숫자 글자("0"~"9")입니다.
  playNumberSound(number); // 누른 숫자의 숫자음을 냅니다.
  const startNewNumber = waitingForNextNumber || displayScreen.textContent === "0" || displayScreen.textContent === ERROR_MESSAGE; // 표시창을 새로 시작해야 하는지 확인합니다.
  if (startNewNumber) { // 새로 시작해야 하면
    displayScreen.textContent = number; // 표시창을 누른 숫자로 바꿉니다.
  } else { // 이어서 입력하는 중이면
    displayScreen.textContent += number; // 지금 숫자 뒤에 누른 숫자를 붙입니다.
  } // 숫자 쓰기를 마칩니다.
  waitingForNextNumber = false; // 숫자를 입력했으니 기다리는 상태를 끝냅니다.
} // 숫자 입력 함수를 마칩니다.
// 연산자 버튼(+, -, *, /): 지금 숫자와 연산자를 기억해 둡니다.
function chooseOperator(operator) { // operator는 누른 연산자 기호입니다.
  if (selectedOperator !== null && !waitingForNextNumber) showResult(); // 2 + 3 × 처럼 이어서 누르면 앞의 계산을 먼저 합니다.
  if (displayScreen.textContent === ERROR_MESSAGE) return; // 오류 문구가 보이면 연산자를 받지 않습니다.
  previousNumber = Number(displayScreen.textContent); // 표시창의 숫자를 첫 번째 숫자로 저장합니다.
  selectedOperator = operator; // 누른 연산자를 저장합니다.
  waitingForNextNumber = true; // 이제 두 번째 숫자를 기다립니다.
} // 연산자 선택 함수를 마칩니다.
// 사칙연산: 두 숫자를 연산자에 맞게 계산해서 돌려줍니다.
function calculate(firstNumber, secondNumber, operator) { // 첫 번째 숫자, 두 번째 숫자, 연산자를 받습니다.
  if (operator === "+") return firstNumber + secondNumber; // 더하기 결과를 돌려줍니다.
  if (operator === "-") return firstNumber - secondNumber; // 빼기 결과를 돌려줍니다.
  if (operator === "*") return firstNumber * secondNumber; // 곱하기 결과를 돌려줍니다.
  return firstNumber / secondNumber; // 남은 경우는 나누기이므로 나누기 결과를 돌려줍니다.
} // 계산 함수를 마칩니다.
// = 버튼: 계산 결과를 표시창에 보여 줍니다.
function showResult() { // 저장해 둔 숫자와 연산자로 계산합니다.
  if (selectedOperator === null || waitingForNextNumber) return; // 연산자나 두 번째 숫자가 없으면 계산하지 않습니다.
  const secondNumber = Number(displayScreen.textContent); // 표시창의 숫자를 두 번째 숫자로 읽습니다.
  const result = calculate(previousNumber, secondNumber, selectedOperator); // 두 숫자를 계산합니다.
  if (Number.isFinite(result)) { // 정상적인 숫자 결과이면
    displayScreen.textContent = String(Number(result.toPrecision(12))); // 1÷3 같은 긴 소수를 12자리로 줄여 보여 줍니다.
  } else { // 0으로 나눠서 결과가 숫자가 아니면
    displayScreen.textContent = ERROR_MESSAGE; // 안내 문구를 보여 줍니다.
  } // 결과 표시를 마칩니다.
  previousNumber = null; // 계산이 끝났으니 첫 번째 숫자를 지웁니다.
  selectedOperator = null; // 계산이 끝났으니 연산자를 지웁니다.
  waitingForNextNumber = true; // 다음 숫자를 누르면 새 계산을 시작합니다.
} // 결과 표시 함수를 마칩니다.
// Clear 버튼: 계산기를 처음 상태로 되돌립니다.
function clearCalculator() { // 표시창과 계산 상태를 모두 지웁니다.
  displayScreen.textContent = "0"; // 표시창을 0으로 바꿉니다.
  previousNumber = null; // 저장한 첫 번째 숫자를 지웁니다.
  selectedOperator = null; // 저장한 연산자를 지웁니다.
  waitingForNextNumber = false; // 기다리는 상태를 해제합니다.
} // 초기화 함수를 마칩니다.
// 버튼 클릭: 누른 버튼의 종류(class)에 맞는 함수를 실행합니다.
function handleButtonClick(event) { // event는 클릭 정보입니다.
  const button = event.target.closest("button"); // 클릭한 곳의 버튼을 찾습니다.
  if (button === null) return; // 버튼 사이 빈 곳을 누르면 아무것도 하지 않습니다.
  const buttonValue = button.dataset.value; // 버튼의 data-value 값(숫자나 기호)을 읽습니다.
  if (button.classList.contains("number")) inputNumber(buttonValue); // 숫자 버튼이면 숫자를 입력합니다.
  else if (button.classList.contains("operator")) chooseOperator(buttonValue); // 연산자 버튼이면 연산자를 고릅니다.
  else if (button.classList.contains("equals")) showResult(); // = 버튼이면 결과를 보여 줍니다.
  else if (button.classList.contains("clear")) clearCalculator(); // Clear 버튼이면 처음으로 되돌립니다.
} // 버튼 처리 함수를 마칩니다.
buttonArea.addEventListener("click", handleButtonClick); // 버튼 영역을 누르면 버튼 처리 함수가 실행되게 연결합니다.
