import { saveAsset } from './geminiService';
import { toast } from './toastManager';

// Must match vite.config.ts proxy matcher: url.startsWith('/api/kie/suno')
const BASE_URL = '/api/kie/suno';

// Local persistence key (so tracks don't vanish on navigation)
const SUNO_GALLERY_CACHE_KEY = 'SONIC_STUDIO_SUNO_GALLERY_V1';

export interface SunoJob {
  id: string;
  taskId?: string;
  status: 'IDLE' | 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  prompt: string;
  instrumental: boolean;
  resultUrls?: string[];
  error?: string;
  createdAt: number;
}

export interface SunoClip {
  id?: string;
  url: string;
  image_url?: string;
  duration?: number;
  title?: string;
}

type PersistedSunoTrack = {
  id: string;
  url: string;
  title: string;
  image_url?: string;
  duration?: number;
  createdAt: number;
  promptSignature?: string;
  instrumental?: boolean;
};

const log = (msg: string, data?: any) => {
  if (data) console.log(`[KIE_SUNO] ${msg}`, data);
  else console.log(`[KIE_SUNO] ${msg}`);
};

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const toDebugString = (v: any) => {
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
};

const safeLocalStorageGet = (key: string): string | null => {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
};

const safeLocalStorageSet = (key: string, value: string) => {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage?.setItem(key, value);
  } catch {
    // ignore
  }
};

const loadGalleryCache = (): PersistedSunoTrack[] => {
  const raw = safeLocalStorageGet(SUNO_GALLERY_CACHE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeGalleryCache = (tracks: PersistedSunoTrack[]) => {
  safeLocalStorageSet(SUNO_GALLERY_CACHE_KEY, JSON.stringify(tracks));
};

const upsertGalleryTracks = (newTracks: PersistedSunoTrack[]) => {
  const existing = loadGalleryCache();
  const byUrl = new Map<string, PersistedSunoTrack>();

  for (const t of existing) {
    if (t?.url) byUrl.set(t.url, t);
  }
  for (const t of newTracks) {
    if (t?.url) byUrl.set(t.url, t);
  }

  // newest first
  const merged = Array.from(byUrl.values()).sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  writeGalleryCache(merged);

  // notify UI (optional hook)
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('suno:gallery_updated', { detail: { tracks: merged } }));
    }
  } catch {
    // ignore
  }
};

const extractTaskId = (data: any): string => {
  // KIE response shapes vary; handle the common ones
  return (
    data?.data?.taskId ||
    data?.data?.task_id ||
    data?.data?.id ||
    data?.taskId ||
    data?.task_id ||
    data?.id ||
    data?.result?.taskId ||
    data?.result?.task_id ||
    ''
  );
};

export const kieSunoService = {
  getPersistedGallery: (): PersistedSunoTrack[] => loadGalleryCache(),

  /**
   * Submit generation (via proxy)
   * IMPORTANT: this client calls stable proxy routes.
   * - Primary: POST /api/kie/suno/submit
   * - Fallback: POST /api/kie/suno/suno_submit  (for older setups)
   */
  generateMusic: async (
    prompt: string,
    instrumental: boolean,
    duration?: number,
    webhookUrl?: string
  ): Promise<SunoJob> => {
    const jobId = `JOB_SUNO_${Date.now()}`;
    log(`Initializing Job ${jobId}`);

    const payload: any = {
      prompt,
      customMode: false,
      instrumental,
      model: 'V4_5',
      callBackUrl: webhookUrl || `${window.location.origin}/api/kie/callback`
    };

    if (typeof duration === 'number') payload.duration = duration;

    // Primary stable route
    const submitUrlPrimary = `${BASE_URL}/submit`;
    // Fallback for older proxy handler
    const submitUrlFallback = `${BASE_URL}/suno_submit`;

    const doSubmit = async (url: string) => {
      log(`Posting to Proxy: ${url}`, payload);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      log(`Submit Response (${res.status})`, data);

      if (!res.ok) {
        throw new Error(`Proxy Error (${res.status}): ${data?.error || data?.msg || 'Unknown Proxy Error'}`);
      }

      const taskId = extractTaskId(data);
      if (!taskId) {
        throw new Error(`KIE response missing 'taskId'. Debug: ${toDebugString(data)}`);
      }
      return taskId;
    };

    let taskId = '';
    try {
      taskId = await doSubmit(submitUrlPrimary);
    } catch (e: any) {
      // If your proxy doesn't implement /submit yet, fallback to old route
      log(`Primary submit failed, trying fallback`, e?.message || e);
      taskId = await doSubmit(submitUrlFallback);
    }

    return {
      id: jobId,
      taskId,
      status: 'QUEUED',
      prompt,
      instrumental,
      createdAt: Date.now()
    };
  },

  /**
   * Poll status (via proxy)
   * Primary: GET /api/kie/suno/record-info?taskId=...
   * Fallback: GET /api/kie/suno/status/:taskId (only if record-info unavailable)
   */
  pollTask: async (taskId: string): Promise<SunoClip[]> => {
    let attempts = 0;

    const MAX_TIMEOUT = 180000; // 3 minutes
    const startTime = Date.now();

    const INITIAL_DELAY = 2000;
    const MAX_DELAY = 10000;
    const GROWTH_FACTOR = 1.5;

    while (Date.now() - startTime < MAX_TIMEOUT) {
      attempts++;
      const delay = Math.min(INITIAL_DELAY * Math.pow(GROWTH_FACTOR, attempts), MAX_DELAY);
      await sleep(delay);

      // Primary
      let res = await fetch(`${BASE_URL}/record-info?taskId=${encodeURIComponent(taskId)}`);
      let raw = await res.json().catch(() => ({}));

      // Fallback if record-info is not wired
      if (res.status === 404) {
        res = await fetch(`${BASE_URL}/status/${encodeURIComponent(taskId)}`);
        raw = await res.json().catch(() => ({}));
      }

      const unwrapped = raw?.data ?? raw;

      if (res.status === 404) {
        log(`Status 404 for ${taskId}`, raw);
        // give it some time; upstream can lag in first seconds
        if (attempts > 6) throw new Error(`Task Not Found (404) persistently. Debug: ${toDebugString(raw)}`);
        continue;
      }

      if (!res.ok) {
        throw new Error(`Status Check Failed (${res.status}): ${raw?.error || raw?.msg || 'Unknown Error'}`);
      }

      const status = String(unwrapped?.status || unwrapped?.state || '').toUpperCase();
      log(`Poll ${taskId} [${attempts}]: ${status}`, unwrapped);

      if (['COMPLETED', 'SUCCESS', 'SUCCEEDED'].includes(status)) {
        return kieSunoService.parseClips(raw);
      }

      if (status.includes('FAILED') || status.includes('ERROR')) {
        throw new Error(unwrapped?.error || raw?.error || 'Generation Task Failed at Provider');
      }
    }

    throw new Error('Polling Timed Out (Exceeded 3 minutes)');
  },

  /**
   * Robust parser (handles multiple outputs + JSON-in-string)
   */
  parseClips: (input: any): SunoClip[] => {
    const tryParseStringJSON = (v: any) => {
      if (typeof v !== 'string') return v;

      const s = v.trim();
      const looksJson = (s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'));
      if (!looksJson) return v;

      let cur: any = v;
      for (let i = 0; i < 3; i++) {
        try {
          cur = JSON.parse(cur);
        } catch {
          break;
        }
        if (typeof cur !== 'string') break;
      }
      return cur;
    };

    const clips: SunoClip[] = [];
    const seen = new Set<string>();

    const pushClip = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;

      const url =
        obj.audio_url ||
        obj.audioUrl ||
        obj.streamAudioUrl ||
        obj.url ||
        obj.video_url ||
        obj.videoUrl;

      if (!url || typeof url !== 'string') return;
      if (seen.has(url)) return;

      seen.add(url);
      clips.push({
        id: obj.id || obj.taskId || obj.task_id,
        url,
        image_url: obj.image_url || obj.imageUrl || obj.image_large_url,
        duration: obj.duration,
        title: obj.title
      });
    };

    const visit = (node: any, depth = 0) => {
      if (depth > 30) return;

      node = tryParseStringJSON(node);
      if (node == null) return;

      if (typeof node === 'object' && !Array.isArray(node)) {
        pushClip(node);
      }

      if (Array.isArray(node)) {
        for (const item of node) visit(item, depth + 1);
        return;
      }

      if (typeof node === 'object') {
        const maybeResult = (node as any).result ?? (node as any).output ?? (node as any).payload ?? (node as any).data;
        if (typeof maybeResult === 'string') visit(maybeResult, depth + 1);

        for (const k of Object.keys(node)) {
          visit((node as any)[k], depth + 1);
        }
      }
    };

    visit(input);

    if (!clips.length) {
      throw new Error(`Task Completed but no Audio URLs found. Debug: ${toDebugString(input)}`);
    }

    return clips;
  },

  /**
   * Orchestrator:
   * - saves to backend via saveAsset()
   * - persists locally so tracks don't disappear
   */
  runFullCycle: async (
    prompt: string,
    instrumental: boolean,
    leadId?: string,
    customCoverUrl?: string,
    duration?: number,
    webhookUrl?: string
  ): Promise<string[]> => {
    const job = await kieSunoService.generateMusic(prompt, instrumental, duration, webhookUrl);
    const clips = await kieSunoService.pollTask(job.taskId!);

    const signature = prompt.split(',')[0].trim().slice(0, 30);
    const urls: string[] = [];
    const persisted: PersistedSunoTrack[] = [];

    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i];
      const displayTitle = clip.title || `SUNO_TRACK_${i + 1}`;
      const resolvedCover = customCoverUrl || clip.image_url;

      persisted.push({
        id: String(clip.id || job.taskId || `${Date.now()}_${i}`),
        url: clip.url,
        title: displayTitle,
        image_url: resolvedCover,
        duration: clip.duration || 120,
        createdAt: Date.now(),
        promptSignature: signature,
        instrumental
      });

      try {
        const maybePromise = saveAsset(
          'AUDIO',
          displayTitle,
          clip.url,
          'SONIC_STUDIO',
          leadId,
          {
            sunoJobId: clip.id || job.taskId,
            promptSignature: signature,
            duration: clip.duration || 120,
            isInstrumental: instrumental,
            coverUrl: resolvedCover
          }
        );

        if (maybePromise && typeof (maybePromise as any).then === 'function') {
          await maybePromise;
        }

        urls.push(clip.url);
      } catch (err: any) {
        console.error('Failed to save asset for clip', clip, err);
        urls.push(clip.url);
      }
    }

    upsertGalleryTracks(persisted);

    log('Final URLs Saved:', urls);
    toast.success(`Generated ${clips.length} Music Tracks.`);
    return urls;
  }
};
