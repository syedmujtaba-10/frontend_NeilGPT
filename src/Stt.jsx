// Stt.jsx
// Replace with your Hugging Face Inference API key.

const HF_INF_API_KEY = import.meta.env.VITE_HF_INF_API_KEY;
const STT_API_URI = "https://api-inference.huggingface.co/models/openai/whisper-tiny";

let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;

// Callback to handle recognized speech text.
let sttResultCallback = null;
export function setSTTResultCallback(callback) {
  sttResultCallback = callback;
}

/**
 * Starts recording audio using getUserMedia and MediaRecorder.
 */
export async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      // Create a blob from recorded chunks (likely in webm format)
      const blob = new Blob(audioChunks, { type: "audio/webm" });
      // Convert the blob to WAV format
      const wavBlob = await convertBlobToWav(blob);
      // Send the WAV blob to the STT API
      sendToSTT(wavBlob);
    };

    mediaRecorder.start();
    isRecording = true;
    console.log("Recording started");
  } catch (error) {
    console.error("Error accessing microphone:", error);
  }
}

/**
 * Stops recording if recording is in progress.
 */
export function stopRecording() {
  if (mediaRecorder && isRecording) {
    mediaRecorder.stop();
    // Stop all tracks to release the mic
    mediaRecorder.stream.getTracks().forEach((track) => track.stop());
    isRecording = false;
    console.log("Recording stopped");
  }
}

/**
 * Converts an audio Blob (recorded in webm/ogg) into a WAV Blob.
 * It uses an AudioContext to decode and then re-encode the PCM data.
 */
async function convertBlobToWav(blob) {
  const arrayBuffer = await blob.arrayBuffer();
  const audioContext = new AudioContext();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  const wavBuffer = audioBufferToWav(audioBuffer);
  return new Blob([wavBuffer], { type: "audio/wav" });
}

/**
 * Converts an AudioBuffer into a WAV ArrayBuffer.
 */
function audioBufferToWav(buffer, opt = {}) {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = opt.float32 ? 3 : 1;
  const bitDepth = format === 3 ? 32 : 16;

  let interleaved;
  if (numChannels === 2) {
    interleaved = interleave(buffer.getChannelData(0), buffer.getChannelData(1));
  } else {
    interleaved = buffer.getChannelData(0);
  }
  return encodeWAV(interleaved, sampleRate, numChannels, bitDepth);
}

/**
 * Interleaves left and right channel data for stereo audio.
 */
function interleave(inputL, inputR) {
  const length = inputL.length + inputR.length;
  const result = new Float32Array(length);
  let index = 0,
    inputIndex = 0;
  while (index < length) {
    result[index++] = inputL[inputIndex];
    result[index++] = inputR[inputIndex];
    inputIndex++;
  }
  return result;
}

/**
 * Encodes PCM samples into a WAV file format.
 */
function encodeWAV(samples, sampleRate, numChannels, bitDepth) {
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const buffer = new ArrayBuffer(44 + samples.length * bytesPerSample);
  const view = new DataView(buffer);

  function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  let offset = 0;
  writeString(view, offset, "RIFF");
  offset += 4;
  view.setUint32(offset, 36 + samples.length * bytesPerSample, true);
  offset += 4;
  writeString(view, offset, "WAVE");
  offset += 4;
  writeString(view, offset, "fmt ");
  offset += 4;
  view.setUint32(offset, 16, true);
  offset += 4;
  view.setUint16(offset, 1, true);
  offset += 2;
  view.setUint16(offset, numChannels, true);
  offset += 2;
  view.setUint32(offset, sampleRate, true);
  offset += 4;
  view.setUint32(offset, sampleRate * blockAlign, true);
  offset += 4;
  view.setUint16(offset, blockAlign, true);
  offset += 2;
  view.setUint16(offset, bitDepth, true);
  offset += 2;
  writeString(view, offset, "data");
  offset += 4;
  view.setUint32(offset, samples.length * bytesPerSample, true);
  offset += 4;

  if (bitDepth === 16) {
    for (let i = 0; i < samples.length; i++, offset += 2) {
      let s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
  } else {
    for (let i = 0; i < samples.length; i++, offset += 4) {
      view.setFloat32(offset, samples[i], true);
    }
  }
  return buffer;
}

/**
 * Sends the WAV blob to the Hugging Face STT API.
 */
async function sendToSTT(wavBlob) {
  try {
    const response = await fetch(STT_API_URI, {
      method: "POST",
      headers: {
        "Content-Type": "audio/wav",
        Authorization: `Bearer ${HF_INF_API_KEY}`,
      },
      body: wavBlob,
    });

    if (!response.ok) {
      console.error("STT API request failed:", response.statusText);
      return;
    }
    const data = await response.json();
    console.log("STT response:", data);
    if (data.text) {
      if (sttResultCallback) {
        sttResultCallback(data.text);
      } else {
        console.log("No STT callback set. Recognized text:", data.text);
      }
    }
  } catch (error) {
    console.error("Error sending audio to STT API:", error);
  }
}
