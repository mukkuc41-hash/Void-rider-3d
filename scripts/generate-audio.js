import fs from 'fs';
import path from 'path';

// Output directory
const outputDir = path.resolve('public/audio');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const SAMPLE_RATE = 44100;

function createWavHeader(numSamples, numChannels = 2, sampleRate = SAMPLE_RATE) {
  const byteRate = sampleRate * numChannels * 2;
  const blockAlign = numChannels * 2;
  const dataSize = numSamples * numChannels * 2;
  const buffer = Buffer.alloc(44);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20);  // AudioFormat (1 = PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34); // BitsPerSample
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  return buffer;
}

function clamp(val, min = -1, max = 1) {
  return Math.max(min, Math.min(max, val));
}

// 1. GENERATE SPACE AMBIENCE (16 seconds loopable stereo WAV)
console.log('Generating space-ambience.wav...');
const ambienceDuration = 16.0;
const ambienceSamples = Math.floor(ambienceDuration * SAMPLE_RATE);
const ambienceData = Buffer.alloc(ambienceSamples * 4); // 16-bit stereo = 4 bytes per sample

for (let i = 0; i < ambienceSamples; i++) {
  const t = i / SAMPLE_RATE;
  const loopT = (t / ambienceDuration) * 2 * Math.PI;

  // Seamless crossfade envelope at edges
  const edgeFade = Math.sin((t / ambienceDuration) * Math.PI);

  // Sub-bass cosmic drone (55 Hz A1 + 82.4 Hz E2 fifth + 110 Hz A2)
  const sub1 = Math.sin(2 * Math.PI * 55 * t + Math.sin(t * 0.4) * 0.5) * 0.28;
  const sub2 = Math.sin(2 * Math.PI * 82.41 * t + Math.cos(t * 0.3) * 0.4) * 0.22;
  const sub3 = Math.sin(2 * Math.PI * 110 * t) * 0.12;

  // Slow harmonic pulse (LFO)
  const lfo1 = 0.5 + 0.5 * Math.sin(loopT * 2);
  const lfo2 = 0.5 + 0.5 * Math.cos(loopT * 3);

  // Ethereal high harmonics / celestial shimmer
  const shimmerL = Math.sin(2 * Math.PI * 220 * t + Math.sin(t * 1.5) * 0.2) * 0.08 * lfo1
                 + Math.sin(2 * Math.PI * 440 * t) * 0.04 * lfo2
                 + Math.sin(2 * Math.PI * 659.25 * t) * 0.03 * (1 - lfo1);

  const shimmerR = Math.sin(2 * Math.PI * 220.5 * t + Math.cos(t * 1.5) * 0.2) * 0.08 * lfo2
                 + Math.sin(2 * Math.PI * 441.2 * t) * 0.04 * (1 - lfo1)
                 + Math.sin(2 * Math.PI * 660.1 * t) * 0.03 * lfo1;

  // Cosmic solar wind (filtered noise approximation)
  const noiseRaw = (Math.sin(i * 12.9898 + Math.cos(i * 4.1414)) * 43758.5453) % 1;
  const windL = (noiseRaw - 0.5) * 0.05 * (0.6 + 0.4 * Math.sin(loopT * 4));
  const windR = ((noiseRaw * 1.61803) % 1 - 0.5) * 0.05 * (0.6 + 0.4 * Math.cos(loopT * 4));

  // Combine channels
  const left = clamp((sub1 + sub2 * 0.9 + sub3 + shimmerL + windL) * 0.85);
  const right = clamp((sub1 + sub2 * 1.1 + sub3 + shimmerR + windR) * 0.85);

  const sampleL = Math.floor(left * 32767);
  const sampleR = Math.floor(right * 32767);

  ambienceData.writeInt16LE(sampleL, i * 4);
  ambienceData.writeInt16LE(sampleR, i * 4 + 2);
}

const ambienceHeader = createWavHeader(ambienceSamples, 2, SAMPLE_RATE);
fs.writeFileSync(path.join(outputDir, 'space-ambience.wav'), Buffer.concat([ambienceHeader, ambienceData]));
console.log('Created public/audio/space-ambience.wav');

// 2. GENERATE CINEMATIC MUSIC (20 seconds epic sci-fi intro music)
console.log('Generating cinematic-music.wav...');
const musicDuration = 20.0;
const musicSamples = Math.floor(musicDuration * SAMPLE_RATE);
const musicData = Buffer.alloc(musicSamples * 4);

// Musical chords: Cm -> Ab -> Eb -> Bb (4 bars, 5 seconds per bar)
const chords = [
  { root: 65.41, third: 77.78, fifth: 98.0, seventh: 116.54, oct: 130.81 }, // C2, Eb2, G2, Bb2, C3
  { root: 51.91, third: 65.41, fifth: 77.78, seventh: 103.83, oct: 103.83 }, // Ab1, C2, Eb2, Ab2
  { root: 77.78, third: 98.0, fifth: 116.54, seventh: 138.59, oct: 155.56 }, // Eb2, G2, Bb2, Eb3
  { root: 58.27, third: 73.42, fifth: 87.31, seventh: 103.83, oct: 116.54 }, // Bb1, D2, F2, Bb2
];

for (let i = 0; i < musicSamples; i++) {
  const t = i / SAMPLE_RATE;
  const loopT = (t / musicDuration) * 2 * Math.PI;

  // Chord progression index (5 seconds per chord)
  const barIndex = Math.floor((t % 20.0) / 5.0) % 4;
  const barT = (t % 5.0) / 5.0; // 0 to 1 within current chord
  const chord = chords[barIndex];

  // 1. Pulsing 16th-note sub bass arpeggio (BPM = 120, 16th note = 0.125s)
  const beatTime = (t * 8.0) % 1.0;
  const beatEnv = Math.exp(-beatTime * 6.5);
  const arpNotes = [chord.root, chord.fifth, chord.third, chord.oct, chord.fifth, chord.seventh, chord.root * 2, chord.fifth];
  const arpStep = Math.floor(t * 8.0) % 8;
  const arpFreq = arpNotes[arpStep];
  const bassArp = Math.sin(2 * Math.PI * arpFreq * t) * beatEnv * 0.28;

  // 2. Heavy sub drone
  const subDrone = Math.sin(2 * Math.PI * chord.root * t) * 0.25;

  // 3. Cinematic pad chords (sawtooth filtered + sine warmth)
  const padEnv = Math.sin(barT * Math.PI); // swell during bar
  const pad1 = Math.sin(2 * Math.PI * chord.root * 2 * t) * 0.12 * padEnv;
  const pad2 = Math.sin(2 * Math.PI * chord.third * 2 * t) * 0.10 * padEnv;
  const pad3 = Math.sin(2 * Math.PI * chord.fifth * 2 * t) * 0.10 * padEnv;
  const pad4 = Math.sin(2 * Math.PI * chord.oct * 2 * t) * 0.08 * padEnv;
  const padTotal = pad1 + pad2 + pad3 + pad4;

  // 4. Shimmering high lead arp (stereo ping-pong)
  const leadStep = Math.floor(t * 16.0) % 8;
  const leadFreq = arpFreq * 4.0;
  const leadEnv = Math.exp(-((t * 16.0) % 1.0) * 10.0);
  const leadNote = Math.sin(2 * Math.PI * leadFreq * t) * leadEnv * 0.09;
  const leadPan = Math.sin(t * Math.PI * 2.0); // panning -1 to +1

  // 5. Cinematic kick/heartbeat pulse (every 0.5s = quarter note at 120 BPM)
  const kickTime = (t * 2.0) % 1.0;
  let kick = 0;
  if (kickTime < 0.2) {
    const kFreq = 110 * Math.exp(-kickTime * 28.0) + 45;
    kick = Math.sin(2 * Math.PI * kFreq * kickTime) * Math.exp(-kickTime * 14.0) * 0.42;
  }

  // 6. Overall cinematic progression riser towards end of 20s
  const riser = (t / musicDuration) * 0.08 * Math.sin(2 * Math.PI * (150 + t * 40) * t);

  // Master mix stereo
  const left = clamp((subDrone + bassArp + padTotal * 0.95 + leadNote * (1 - leadPan * 0.5) + kick + riser) * 0.85);
  const right = clamp((subDrone + bassArp + padTotal * 1.05 + leadNote * (1 + leadPan * 0.5) + kick + riser) * 0.85);

  musicData.writeInt16LE(Math.floor(left * 32767), i * 4);
  musicData.writeInt16LE(Math.floor(right * 32767), i * 4 + 2);
}

const musicHeader = createWavHeader(musicSamples, 2, SAMPLE_RATE);
fs.writeFileSync(path.join(outputDir, 'cinematic-music.wav'), Buffer.concat([musicHeader, musicData]));
console.log('Created public/audio/cinematic-music.wav');

// 3. GENERATE LAUNCH SFX (3.0 seconds thruster ignition & launch roar)
console.log('Generating launch.wav...');
const launchDuration = 3.0;
const launchSamples = Math.floor(launchDuration * SAMPLE_RATE);
const launchData = Buffer.alloc(launchSamples * 4);

for (let i = 0; i < launchSamples; i++) {
  const t = i / SAMPLE_RATE;

  // Stage 1: Pre-ignition spark / turbine spool (0.0 to 0.4s)
  let spool = 0;
  if (t < 0.6) {
    const spoolFreq = 200 + Math.pow(t / 0.6, 2) * 1600;
    const spoolEnv = Math.sin((t / 0.6) * Math.PI * 0.5);
    spool = Math.sin(2 * Math.PI * spoolFreq * t) * spoolEnv * 0.25;
  }

  // Stage 2: Explosive Thruster Ignition Impact (at t = 0.25s)
  let impact = 0;
  if (t >= 0.25) {
    const it = t - 0.25;
    const impactFreq = 160 * Math.exp(-it * 10) + 40;
    impact = Math.sin(2 * Math.PI * impactFreq * it) * Math.exp(-it * 4.5) * 0.65;
  }

  // Stage 3: Hypersonic exhaust roar / jet noise (t >= 0.25 to 3.0)
  let roar = 0;
  if (t >= 0.2) {
    const rt = t - 0.2;
    const roarEnv = Math.min(1.0, rt / 0.25) * Math.exp(-rt * 0.95);
    // Pseudo-random turbulent noise
    const n1 = (Math.sin(i * 15.34 + Math.cos(i * 3.12)) * 43758.54) % 1 - 0.5;
    const n2 = (Math.sin(i * 27.81 + Math.cos(i * 7.45)) * 23421.12) % 1 - 0.5;
    // Layered resonance
    const roarTone = Math.sin(2 * Math.PI * (120 + rt * 180) * t) * 0.3;
    roar = (n1 * 0.45 + n2 * 0.35 + roarTone) * roarEnv * 0.75;
  }

  // Stage 4: High-energy hypersonic shockwave sweep
  let shock = 0;
  if (t >= 0.3 && t < 1.8) {
    const st = t - 0.3;
    const sweepFreq = 300 + Math.sin(st * Math.PI * 0.8) * 800;
    const shockEnv = Math.sin((st / 1.5) * Math.PI);
    shock = Math.sin(2 * Math.PI * sweepFreq * t) * shockEnv * 0.18;
  }

  const mix = (spool + impact + roar + shock);
  const left = clamp(mix * 0.88);
  const right = clamp((spool * 0.95 + impact * 1.05 + roar * 1.02 + shock * 0.98) * 0.88);

  launchData.writeInt16LE(Math.floor(left * 32767), i * 4);
  launchData.writeInt16LE(Math.floor(right * 32767), i * 4 + 2);
}

const launchHeader = createWavHeader(launchSamples, 2, SAMPLE_RATE);
fs.writeFileSync(path.join(outputDir, 'launch.wav'), Buffer.concat([launchHeader, launchData]));
console.log('Created public/audio/launch.wav');

console.log('All audio assets successfully generated in public/audio/ !');
