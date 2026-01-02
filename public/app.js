let letters;
let sessionPool = [];
let currentItem = null;

let currentAnswer = "";
let currentAnswerKana = "";
let recognizedText = "";

let recorder;
let chunks = [];
let userAudioUrl = null;
let micStream = null;

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
  try {
    chunks = [];
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recorder = new MediaRecorder(stream);

    recorder.ondataavailable = e => chunks.push(e.data);
    recorder.start();

    setTimeout(() => recorder.stop(), 3000);

    recorder.onstop = () => {
      stream.getTracks().forEach(track => track.stop());
      testAudioUrl = URL.createObjectURL(new Blob(chunks));
      alert("✔ Mic OK");
    };
  } catch (error) {
    alert("⚠️ Không có quyền micro. Bài luyện vẫn chạy bình thường.");
  }
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
  userAudioUrl = null;

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
  micStream = null;
  if (enableMic.checked) {
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      result.innerText = "⚠️ Không có quyền micro. Tiếp tục luyện không mic.";
    }
  }

  if (micStream) {
    recorder = new MediaRecorder(micStream);
    recorder.ondataavailable = e => chunks.push(e.data);
    recorder.start();

    if (recognition) recognition.start();
  } else {
    recorder = null;
  }

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

  const showResult = () => {
    if (recognizedText.includes(currentAnswer)) {
      result.innerText = `✅ ĐÚNG | ${recognizedText}`;
    } else {
      result.innerText =
        `❌ SAI | ${recognizedText || "Không nhận"} | Đúng: ${currentAnswer}`;
    }

    controls.style.display = "flex";
  };

  if (recorder) {
    recorder.stop();
    recorder.onstop = () => {
      if (micStream) micStream.getTracks().forEach(track => track.stop());
      userAudioUrl = URL.createObjectURL(new Blob(chunks));
      showResult();
    };
  } else {
    showResult();
  }
}

/* ================= PLAY ================= */
function playUserVoice() {
  if (userAudioUrl) {
    new Audio(userAudioUrl).play();
  } else {
    alert("Chưa có bản ghi để phát lại.");
  }
}

function playCorrect() {
  const msg = new SpeechSynthesisUtterance(currentAnswerKana);
  msg.lang = "ja-JP";
  speechSynthesis.speak(msg);
}
