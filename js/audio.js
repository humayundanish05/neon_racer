import { userSettings } from './state.js';

let audioCtx;
let engineOsc, engineGain;

export function initAudio() {
    if (audioCtx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();

    // Engine Drone
    engineOsc = audioCtx.createOscillator();
    engineGain = audioCtx.createGain();
    engineOsc.type = 'sawtooth';
    engineOsc.frequency.value = 50;
    engineGain.gain.value = 0.1;
    engineOsc.connect(engineGain);
    engineGain.connect(audioCtx.destination);
    engineOsc.start();
}

export function playSound(type) {
    if (!audioCtx || userSettings.muted) return;

    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.connect(g);
    g.connect(audioCtx.destination);
    const now = audioCtx.currentTime;

    if (type === 'crash') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(10, now + 0.5);
        g.gain.setValueAtTime(0.5, now);
        g.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now); osc.stop(now + 0.5);
    }
    else if (type === 'nearmiss') {
        // "Whoosh" effect
        osc.type = 'sine';
        // Fast frequency sweep up
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(800, now + 0.1);

        g.gain.setValueAtTime(0.3, now);
        g.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        osc.start(now); osc.stop(now + 0.3);
    }
}

export function updateEngineSound(speed, type) {
    if (!audioCtx || !engineOsc) return;

    const baseFreq = 50;
    let freq = baseFreq + (speed * 2.5);

    // Type variation
    if (type === 'truck') {
        engineOsc.type = 'square';
        freq = 30 + (speed * 1.5);
    } else if (type === 'f1') {
        engineOsc.type = 'sawtooth';
        freq = 100 + (speed * 4.0);
    } else {
        engineOsc.type = 'sawtooth';
    }

    // Wobble for realistic idle
    const wobble = Math.sin(audioCtx.currentTime * 10) * 5;
    engineOsc.frequency.setTargetAtTime(freq + wobble, audioCtx.currentTime, 0.1);
}

export function toggleMute(muted) {
    if (!audioCtx) return;
    if (muted) audioCtx.suspend();
    else audioCtx.resume();
}
