// Tts.jsx

const RAPID_API_KEY = process.env.REACT_APP_RAPID_API_KEY; // Replace with your RapidAPI key
const TTS_API_URI = "https://open-ai-text-to-speech1.p.rapidapi.com/";
const DEFAULT_VOICE = "onyx"; // Options: alloy, echo, fable, onyx, nova, shimmer

// Optionally, if you have waiting audio clips to play while TTS is processing,
// list their URLs in this array.
const waitingAudioClips = [
  // Example: "/audio/waiting1.mp3", "/audio/waiting2.mp3"
];

let waitingAudio = null;

/**
 * Plays a random waiting audio clip (if any) to indicate processing.
 */
function playRandomWaitingAudio() {
  if (waitingAudioClips.length > 0) {
    const randomIndex = Math.floor(Math.random() * waitingAudioClips.length);
    waitingAudio = new Audio(waitingAudioClips[randomIndex]);
    waitingAudio.loop = false;
    waitingAudio.play();
  }
}

/**
 * Stops the waiting audio if it is currently playing.
 */
function stopWaitingAudio() {
  if (waitingAudio && !waitingAudio.paused) {
    waitingAudio.pause();
    waitingAudio.currentTime = 0;
  }
}

/**
 * Converts the provided text into speech using the RapidAPI TTS endpoint.
 * Returns a Promise that resolves when the speech has finished playing.
 *
 * @param {string} text - The text to be spoken.
 * @param {string} [voice=DEFAULT_VOICE] - The voice to use (default: "alloy").
 */
export async function say(text, voice = DEFAULT_VOICE) {
  playRandomWaitingAudio();

  const payload = {
    model: "tts-1",
    input: text,
    voice: voice,
  };

  try {
    const response = await fetch(TTS_API_URI, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-rapidapi-host": "open-ai-text-to-speech1.p.rapidapi.com",
        "x-rapidapi-key": RAPID_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    stopWaitingAudio();

    if (!response.ok) {
      console.error("TTS API request failed:", response.statusText);
      return;
    }

    // The response is an MP3 audio stream. Convert it to a blob.
    const blob = await response.blob();
    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);
    audio.play();

    // Return a promise that resolves when the audio finishes playing.
    return new Promise((resolve) => {
      audio.onended = () => {
        resolve();
      };
    });
  } catch (error) {
    stopWaitingAudio();
    console.error("Error during TTS request:", error);
  }
}
