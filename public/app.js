let letters;
let sessionPool = [];
let currentItem = null;

let currentAnswer = "";
let currentAnswerKana = "";
let recognizedText = "";

let recorder;
let chunks = [];
let userAudioUrl = null;

/* ================= LOAD DATA ================= */
fetch("/api/letters")
  .then(res => res.json())
  .then(data => letters = data);

/* ================= SPEECH ================= */
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

if (recognition) {
  recognition.lang = "ja-JP";
  recognition.continuous = false;
  recognition.onresult = e => {
    recognizedText = e.results[0][0].transcript
      .toLowerCase()
      .replace(/\s/g, "");
  };
}

/* ================= MIC TEST ================= */
let testAudioUrl = null;

async function startMicTest() {
  chunks = [];
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  recorder = new MediaRecorder(stream);

  recorder.ondataavailable = e => chunks.push(e.data);
  recorder.start();

  setTimeout(() => recorder.stop(), 3000);

  recorder.onstop = () => {
    testAudioUrl = URL.createObjectURL(new Blob(chunks));
    alert("✔ Mic OK");
  };
}

function playMicTest() {
  if (testAudioUrl) new Audio(testAudioUrl).play();
}

/* ================= SESSION ================= */
function resetSession() {
  sessionPool = [];

  if (hiragana.checked) sessionPool.push(...letters.hiragana);
  if (katakana.checked) sessionPool.push(...letters.katakana);
  if (combo.checked) sessionPool.push(...letters.combo);

  sessionPool.sort(() => Math.random() - 0.5);

  result.innerText = "🔄 Session mới";
}

/* ================= START ================= */
function start() {
  if (!letters) return alert("Chưa load xong chữ!");

  if (sessionPool.length === 0) {
    result.innerText = "🎉 Học xong! Reset để học lại.";
    kana.innerText = "✓";
    return;
  }

  controls.style.display = "none";
  recognizedText = "";
  chunks = [];

  currentItem = sessionPool.shift();
  currentAnswer = currentItem.romaji;
  currentAnswerKana = currentItem.kana;

  kana.innerText = currentAnswerKana;
  result.innerText = "";

  startRound(
    Number(showTime.value),
    Number(speakTime.value)
  );
}

/* ================= CORE ================= */
async function startRound(showSec, speakSec) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  recorder = new MediaRecorder(stream);

  recorder.ondataavailable = e => chunks.push(e.data);
  recorder.start();

  if (recognition) recognition.start();

  setTimeout(() => {
    kana.innerText = "❓";
  }, showSec * 1000);

  let count = speakSec;
  result.innerText = `🎙️ Nói (${count}s)`;

  const timer = setInterval(() => {
    count--;
    result.innerText = `🎙️ Nói (${count}s)`;

    if (count <= 0) {
      clearInterval(timer);
      finish();
    }
  }, 1000);
}

/* ================= FINISH ================= */
function finish() {
  if (recognition) recognition.stop();
  recorder.stop();

  recorder.onstop = () => {
    userAudioUrl = URL.createObjectURL(new Blob(chunks));

    if (recognizedText.includes(currentAnswer)) {
      result.innerText = `✅ ĐÚNG | ${recognizedText}`;
    } else {
      result.innerText =
        `❌ SAI | ${recognizedText || "Không nhận"} | Đúng: ${currentAnswer}`;
    }

    controls.style.display = "block";
  };
}

/* ================= PLAY ================= */
function playUserVoice() {
  if (userAudioUrl) new Audio(userAudioUrl).play();
}

function playCorrect() {
  const msg = new SpeechSynthesisUtterance(currentAnswerKana);
  msg.lang = "ja-JP";
  speechSynthesis.speak(msg);
}
