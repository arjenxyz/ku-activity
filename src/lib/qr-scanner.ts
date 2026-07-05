import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
  type CameraDevice,
  type Html5QrcodeCameraScanConfig,
} from 'html5-qrcode';

export type QrScanLayout = 'fullscreen' | 'embedded';

export function isLikelyDesktop() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(pointer: fine)').matches || navigator.maxTouchPoints === 0;
}

/** TWA / gömülü WebView — native BarcodeDetector burada sorun çıkarabiliyor */
export function isEmbeddedWebView() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return (
    /;\s*wv\)/i.test(ua) ||
    /WebView/i.test(ua) ||
    /FBAV|Instagram|Line\/|MicroMessenger/i.test(ua)
  );
}

export function shouldUseNativeBarcodeDetector() {
  if (typeof window === 'undefined') return false;
  if (isEmbeddedWebView()) return false;
  return typeof (window as Window & { BarcodeDetector?: unknown }).BarcodeDetector !== 'undefined';
}

export function createQrScanner(elementId: string) {
  return new Html5Qrcode(elementId, {
    verbose: false,
    formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
    useBarCodeDetectorIfSupported: shouldUseNativeBarcodeDetector(),
  });
}

function cameraPriority(cam: CameraDevice, desktop: boolean) {
  const label = cam.label.toLowerCase();
  if (desktop) {
    if (/front|user|face|ön|integrated|built-in|webcam|hd pro/i.test(label)) return 0;
    if (/back|rear|environment|arka|wide|tele/i.test(label)) return 2;
    return 1;
  }
  if (/back|rear|environment|arka|wide|tele/i.test(label)) return 0;
  if (/front|user|face|ön|integrated|built-in|webcam/i.test(label)) return 1;
  return 2;
}

function buildVideoConstraints(desktop: boolean): MediaTrackConstraints {
  if (desktop) {
    return {
      width: { ideal: 1920, min: 720 },
      height: { ideal: 1080, min: 480 },
    };
  }
  return {
    facingMode: { ideal: 'environment' },
    width: { ideal: 1920, min: 640 },
    height: { ideal: 1080, min: 480 },
  };
}

export function buildScanConfig(desktop: boolean, layout: QrScanLayout): Html5QrcodeCameraScanConfig {
  const fps = desktop ? 15 : 24;
  const videoConstraints = buildVideoConstraints(desktop);

  if (layout === 'fullscreen') {
    return {
      fps,
      disableFlip: false,
      videoConstraints,
    };
  }

  return {
    fps,
    disableFlip: false,
    videoConstraints,
    qrbox: (viewfinderWidth, viewfinderHeight) => {
      if (desktop) {
        return {
          width: Math.floor(viewfinderWidth * 0.94),
          height: Math.floor(viewfinderHeight * 0.94),
        };
      }
      const edge = Math.min(viewfinderWidth, viewfinderHeight);
      const size = Math.max(240, Math.floor(edge * 0.92));
      return { width: size, height: size };
    },
  };
}

export function buildCameraConstraint(
  camera: string | MediaTrackConstraints,
  desktop: boolean
): string | MediaTrackConstraints {
  if (typeof camera === 'string') return camera;
  if (!desktop) return camera;
  return {
    ...camera,
    width: { ideal: 1920, min: 720 },
    height: { ideal: 1080, min: 480 },
  };
}

export async function pickCameraConfigs(): Promise<Array<string | MediaTrackConstraints>> {
  const desktop = isLikelyDesktop();
  const configs: Array<string | MediaTrackConstraints> = [];

  try {
    const cameras = await Html5Qrcode.getCameras();
    if (cameras.length > 0) {
      const sorted = [...cameras].sort(
        (a, b) => cameraPriority(a, desktop) - cameraPriority(b, desktop)
      );
      for (const cam of sorted) configs.push(cam.id);
    }
  } catch {
    /* getCameras desteklenmiyorsa facingMode dene */
  }

  const mobileVideo = buildVideoConstraints(false);
  if (desktop) {
    configs.push({ facingMode: 'user' });
    configs.push({ facingMode: 'environment' });
  } else {
    configs.push({ ...mobileVideo, facingMode: { ideal: 'environment' } });
    configs.push({ facingMode: 'user' });
    configs.push({ facingMode: 'environment' });
  }

  const seen = new Set<string>();
  return configs.filter((c) => {
    const key = typeof c === 'string' ? c : JSON.stringify(c);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Sürekli odak — başarılı kamera açılışından sonra çağırın */
export async function enhanceRunningCamera(scanner: Html5Qrcode) {
  try {
    const caps = scanner.getRunningTrackCapabilities() as MediaTrackCapabilities & {
      focusMode?: string[];
    };
    const patches: MediaTrackConstraints & { focusMode?: string } = {};

    if (caps.focusMode?.includes('continuous')) {
      patches.focusMode = 'continuous';
    } else if (caps.focusMode?.includes('auto')) {
      patches.focusMode = 'auto';
    }

    if (Object.keys(patches).length > 0) {
      await scanner.applyVideoConstraints(patches);
    }
  } catch {
    /* cihaz desteklemiyorsa devam */
  }
}

export async function scanQrFromFile(scanner: Html5Qrcode, file: File): Promise<string> {
  try {
    const result = await scanner.scanFileV2(file, false);
    return result.decodedText;
  } catch {
    return scanner.scanFile(file, false);
  }
}
