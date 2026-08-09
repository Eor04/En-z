'use client';

/**
 * Sistema de Notificaciones de Audio Sintetizado Web Audio API
 * Garantiza reproducción instantánea en cualquier navegador sin dependencias de archivos externos.
 */

let sharedAudioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  try {
    if (!sharedAudioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        sharedAudioCtx = new AudioCtxClass();
      }
    }
    if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume();
    }
    return sharedAudioCtx;
  } catch (e) {
    console.log('Error al inicializar AudioContext:', e);
    return null;
  }
};

/**
 * 1. 🔔 Comercio: Nuevo Pedido Entrante (Comanda en Cocina)
 * Tono brillante de campana de cocina de 3 notas
 */
export const playCommerceNewOrderAlert = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [
      { freq: 587.33, start: 0, duration: 0.2 },     // D5
      { freq: 880.00, start: 0.18, duration: 0.2 },  // A5
      { freq: 1174.66, start: 0.36, duration: 0.4 }, // D6
    ];

    notes.forEach(({ freq, start, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + start);

      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(0.35, now + start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + start);
      osc.stop(now + start + duration);
    });
  } catch (err) {
    console.log('Audio commerce alert:', err);
  }
};

/**
 * 2. 🏪 Comercio: Repartidor Aceptó Pedido y va hacia el local
 * Chime armónico ascendente de confirmación
 */
export const playDriverAssignedToStoreAlert = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const chord = [
      { freq: 523.25, start: 0, duration: 0.25 },   // C5
      { freq: 659.25, start: 0.12, duration: 0.25 }, // E5
      { freq: 783.99, start: 0.24, duration: 0.25 }, // G5
      { freq: 1046.5, start: 0.36, duration: 0.5 },  // C6
    ];

    chord.forEach(({ freq, start, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + start);

      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(0.3, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + start);
      osc.stop(now + start + duration);
    });
  } catch (err) {
    console.log('Audio driver assigned alert:', err);
  }
};

/**
 * 3. 🛵 Repartidor: Nuevos Pedidos Disponibles para Recojo
 * Alerta dinámica de moto/radar (triple tono enérgico)
 */
export const playDriverNewDeliveryAlert = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const beeps = [
      { freq: 440, start: 0, duration: 0.12 },
      { freq: 659.25, start: 0.15, duration: 0.12 },
      { freq: 880, start: 0.3, duration: 0.3 },
    ];

    beeps.forEach(({ freq, start, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + start);

      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(0.35, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + start);
      osc.stop(now + start + duration);
    });
  } catch (err) {
    console.log('Audio driver alert:', err);
  }
};

/**
 * 4. 👨‍🍳 Cliente: Comercio Aceptó el Pedido e Inició Cocina
 * Chime suave y agradable
 */
export const playCustomerKitchenStartedAlert = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [
      { freq: 440.0, start: 0, duration: 0.2 },    // A4
      { freq: 554.37, start: 0.15, duration: 0.2 }, // C#5
      { freq: 659.25, start: 0.3, duration: 0.4 },  // E5
    ];

    notes.forEach(({ freq, start, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + start);

      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(0.3, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + start);
      osc.stop(now + start + duration);
    });
  } catch (err) {
    console.log('Audio customer kitchen alert:', err);
  }
};

/**
 * 5. 🚀 Cliente: Repartidor en Camino hacia tu Domicilio
 * Chime de movimiento rápido
 */
export const playCustomerOrderInRouteAlert = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [
      { freq: 493.88, start: 0, duration: 0.15 },  // B4
      { freq: 659.25, start: 0.12, duration: 0.15 }, // E5
      { freq: 987.77, start: 0.24, duration: 0.4 },  // B5
    ];

    notes.forEach(({ freq, start, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + start);

      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(0.3, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + start);
      osc.stop(now + start + duration);
    });
  } catch (err) {
    console.log('Audio in-route alert:', err);
  }
};

/**
 * 6. 🚪 Cliente: ¡Tu Pedido ha Llegado a tu Puerta! (Timbre Doorbell)
 * Tono clásico y claro de timbre de casa ("Ding-Dong" de entrega)
 */
export const playCustomerOrderArrivedDoorAlert = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Ding (659.25 Hz - E5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.45, now + 0.04);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.7);

    // Dong (523.25 Hz - C5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(523.25, now + 0.45);
    gain2.gain.setValueAtTime(0, now + 0.45);
    gain2.gain.linearRampToValueAtTime(0.5, now + 0.49);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.45);
    osc2.stop(now + 1.4);
  } catch (err) {
    console.log('Audio arrived door alert:', err);
  }
};

/**
 * 7. ⭐ Chime de Éxito / Calificación
 */
export const playSuccessChimeAlert = () => {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now);
    osc.frequency.setValueAtTime(659.25, now + 0.1);
    osc.frequency.setValueAtTime(783.99, now + 0.2);
    osc.frequency.setValueAtTime(1046.5, now + 0.3);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.6);
  } catch (err) {
    console.log('Audio success chime alert:', err);
  }
};
