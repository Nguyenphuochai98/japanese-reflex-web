let letters;
let currentAnswer = "";
let currentAnswerKana = "";
let userAudioUrl = null;

/* ================= LOAD DATA ================= */
fetch("/api/letters")
  .then(res => res.json())
  .then(data => letters = data);

/* ================= SPEECH ================= */
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

let recognizedText = "";

if (recognition) {
  recognition.lang = "ja-JP";
  recognition.onresult = e => {
    recognizedText = e.results[0][0].transcript
      .toLowerCase()
      .replace(/\s/g, "");
  };
}

/* ================= RECORD ================= */
let recorder;
let chunks = [];

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
    alert("✔ Đã thu xong, bấm Nghe lại");
  };
}

function playMicTest() {
  if (testAudioUrl) new Audio(testAudioUrl).play();
}

/* ================= MAIN ================= */
function start() {
  controls.style.display = "none";
  recognizedText = "";
  chunks = [];

  const pool = [];
  if (hiragana.checked) pool.push(...letters.hiragana);
  if (katakana.checked) pool.push(...letters.katakana);
  if (combo.checked) pool.push(...letters.combo);

  const item = pool[Math.floor(Math.random() * pool.length)];
  currentAnswer = item.romaji;
  currentAnswerKana = item.kana;
  kana.innerText = item.kana;
  result.innerText = "";

  setTimeout(() => countdown(Number(time.value)), 1000);
}

/* ================= COUNTDOWN ================= */
async function countdown(seconds) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  recorder = new MediaRecorder(stream);

  recorder.ondataavailable = e => chunks.push(e.data);
  recorder.start();
  if (recognition) recognition.start();

  let count = seconds;
  const timer = setInterval(() => {
    kana.innerText = `HÃY NÓI (${count})`;
    count--;

    if (count < 0) {
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
      result.innerText = `✅ ĐÚNG | Bạn nói: ${recognizedText}`;
    } else {
      result.innerText =
        `❌ SAI | Bạn nói: ${recognizedText || "Không nhận"} | Đúng: ${currentAnswer}`;
    }

    controls.style.display = "block";
  };
}

/* ================= PLAYBACK ================= */
function playUserVoice() {
  if (userAudioUrl) new Audio(userAudioUrl).play();
}

function playCorrect() {
  const msg = new SpeechSynthesisUtterance(currentAnswerKana);
  msg.lang = "ja-JP";
  speechSynthesis.speak(msg);
}
