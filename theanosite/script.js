const MORSE = {
  A: ".-",
  B: "-...",
  C: "-.-.",
  D: "-..",
  E: ".",
  F: "..-.",
  G: "--.",
  H: "....",
  I: "..",
  J: ".---",
  K: "-.-",
  L: ".-..",
  M: "--",
  N: "-.",
  O: "---",
  P: ".--.",
  Q: "--.-",
  R: ".-.",
  S: "...",
  T: "-",
  U: "..-",
  V: "...-",
  W: ".--",
  X: "-..-",
  Y: "-.--",
  Z: "--..",
  "0": "-----",
  "1": ".----",
  "2": "..---",
  "3": "...--",
  "4": "....-",
  "5": ".....",
  "6": "-....",
  "7": "--...",
  "8": "---..",
  "9": "----.",
};

const MESSAGE = "STAY QUIET STAY HIDDEN";
const morseLine = document.getElementById("morse-line");
const audioToggle = document.getElementById("audio-toggle");
const UNIT = 140;
let audioEnabled = false;
let audioContext = null;

function buildMorse(message) {
  const visuals = [];
  const events = [];
  const chars = message.toUpperCase().split("");

  chars.forEach((char, index) => {
    if (char === " ") {
      return;
    }

    const code = MORSE[char];
    if (!code) {
      return;
    }

    const symbols = code.split("");
    symbols.forEach((symbol, symbolIndex) => {
      const visualIndex = visuals.length;
      visuals.push({
        type: symbol === "." ? "dot" : "dash",
        value: symbol,
      });
      events.push({
        duration: (symbol === "." ? 1 : 3) * UNIT,
        spanIndex: visualIndex,
        sound: true,
      });

      const isLastSymbol = symbolIndex === symbols.length - 1;
      if (isLastSymbol) {
        const nextChar = chars[index + 1];
        if (nextChar) {
          if (nextChar === " ") {
            const gapIndex = visuals.length;
            visuals.push({ type: "gap", value: "/" });
            events.push({ duration: 7 * UNIT, spanIndex: gapIndex, sound: false });
          } else {
            const gapIndex = visuals.length;
            visuals.push({ type: "gap", value: " " });
            events.push({ duration: 3 * UNIT, spanIndex: gapIndex, sound: false });
          }
        }
      } else {
        events.push({ duration: 1 * UNIT, spanIndex: null, sound: false });
      }
    });
  });

  return { visuals, events };
}

function renderMorse(symbols) {
  morseLine.innerHTML = "";
  symbols.forEach((symbol) => {
    const span = document.createElement("span");
    span.className = `symbol ${symbol.type}`;
    span.textContent = symbol.value;
    morseLine.appendChild(span);
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ensureAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
}

function playTone(duration) {
  if (!audioEnabled || !audioContext) return;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(620, audioContext.currentTime);
  gain.gain.setValueAtTime(0, audioContext.currentTime);
  gain.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration / 1000);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration / 1000 + 0.02);
}

const { visuals, events } = buildMorse(MESSAGE);
renderMorse(visuals);

audioToggle.addEventListener("click", () => {
  ensureAudioContext();
  audioEnabled = !audioEnabled;
  audioToggle.classList.toggle("is-on", audioEnabled);
  audioToggle.textContent = audioEnabled ? "Disable Audio" : "Enable Audio";
});

async function runSignal() {
  const spans = morseLine.querySelectorAll(".symbol");
  while (true) {
    for (const event of events) {
      spans.forEach((span) => span.classList.remove("active"));
      if (event.spanIndex !== null && spans[event.spanIndex]) {
        spans[event.spanIndex].classList.add("active");
      }
      if (event.sound) {
        playTone(event.duration);
      }
      await sleep(event.duration);
    }
  }
}

runSignal();
