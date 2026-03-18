/**
 * Unified haptics utility.
 *
 * Tries Capacitor's native Haptics plugin first (available when running
 * inside a native iOS/Android shell). Falls back to the Web Vibration API
 * where supported, and silently no-ops everywhere else.
 */

let Haptics = null;
let ImpactStyle = null;
let NotificationType = null;

// Lazy-load the Capacitor plugin so the module works even when
// @capacitor/haptics is not installed (plain web builds).
async function getHaptics() {
  if (Haptics) return Haptics;
  try {
    const mod = await import('@capacitor/haptics');
    Haptics = mod.Haptics;
    ImpactStyle = mod.ImpactStyle;
    NotificationType = mod.NotificationType;
    return Haptics;
  } catch {
    return null;
  }
}

function vibrateFallback(ms = 50) {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(ms);
    }
  } catch {
    // Silently ignore — vibration not available.
  }
}

/**
 * Light impact feedback (e.g. tapping a card).
 */
export async function hapticLight() {
  try {
    const h = await getHaptics();
    if (h) {
      await h.impact({ style: ImpactStyle.Light });
    } else {
      vibrateFallback(30);
    }
  } catch {
    // Silent.
  }
}

/**
 * Medium impact feedback (e.g. toggling a switch).
 */
export async function hapticMedium() {
  try {
    const h = await getHaptics();
    if (h) {
      await h.impact({ style: ImpactStyle.Medium });
    } else {
      vibrateFallback(50);
    }
  } catch {
    // Silent.
  }
}

/**
 * Heavy impact feedback (e.g. confirming a destructive action).
 */
export async function hapticHeavy() {
  try {
    const h = await getHaptics();
    if (h) {
      await h.impact({ style: ImpactStyle.Heavy });
    } else {
      vibrateFallback(80);
    }
  } catch {
    // Silent.
  }
}

/**
 * Success notification feedback.
 */
export async function hapticSuccess() {
  try {
    const h = await getHaptics();
    if (h) {
      await h.notification({ type: NotificationType.Success });
    } else {
      vibrateFallback(50);
    }
  } catch {
    // Silent.
  }
}

/**
 * Error notification feedback.
 */
export async function hapticError() {
  try {
    const h = await getHaptics();
    if (h) {
      await h.notification({ type: NotificationType.Error });
    } else {
      vibrateFallback([50, 30, 50]);
    }
  } catch {
    // Silent.
  }
}
