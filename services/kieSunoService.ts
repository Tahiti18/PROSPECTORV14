import { saveAsset } from './geminiService';
import { toast } from './toastManager';

// Must match vite.config.ts proxy matcher: url.startsWith('/api/kie/suno')
const BASE_URL = '/api/kie/suno';

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

const log = (msg: string, data?: any) => {
  if (data) console.log(`[KIE_SUNO] ${msg}`, data);
  else console.log(`[KIE_SUNO] ${msg}`);
};

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const toDebugString = (v: any) => {
  try { return JSON.stringify(v); } catch { return String(v); }
};

export const kieSunoService = {
  /**
   * Submit generation (via proxy)
   * Keep signature backward-compatible with SonicStudio.tsx
   */
  generateMusic: async (
    prompt: string,
    instrumental: boolean,
    duration?: number,
    webhookUrl?: string
  ): Promise<SunoJob> => {
    const jobId = `JOB_SUNO_${Date.now()}`;
    log(`Initializing Job ${jobId}`);

    // ✅ Correct payload for KIE /api/v1/generate (the proxy forwards /suno_submit -> /generate)
    const payload: any = {
      prompt,
      customMode: false,
      instrumental,
      model: 'V4_5',
      callBackUrl: webhookUrl || `${window.location.origin}/api/kie/callback`
    };

    // Keep duration only if you use it; harmless if ignored upstream
    if (typeof duration === 'number') payload.duration = duration;

    // Proxy route (alias): /api/kie/suno/suno_submit  (proxy will forward to /generate)
    const submitUrl = `${BASE_URL}/suno_submit`;
    log(`Posting to Proxy: ${submitUrl}`, payload);

    const res = await fetch(submitUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json().catch(() => ({}));
    log(`Submit Response (${res.status})`, data);

    if (!res.ok) {
      throw new Error(`Proxy Error (${res.status}): ${data?.error || data?.msg || 'Unknown Proxy Error'}`);
    }

    // ✅ Accept all known task id shapes (new + legacy)
    const taskId =
      data?.data?.taskId ||
      data?.taskId ||
      data?.id ||
      data?.task_id;

    if (!taskId) {
      // Show full upstream debug payload in the UI (you’re on iPad, no console)
      throw new Error(`KIE response missing 'taskId'. Debug: ${toDebugString(data)}`);
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
   * Prefer /record-info?taskId=... (new). Fallback to /status/:id if needed.
   */
  pollTask: async (taskId: string): Promise<SunoClip[]> => {
    let attempts = 0;
    const MAX_TIMEOUT = 180000;
    const startTime = Date.now();

    const INITIAL_DELAY = 2000;
    const MAX_DELAY = 10000;
    const GROWTH_FACTOR = 1.5;

    while (Date.now() - startTime < MAX_TIMEOUT) {
      attempts++;
      const delay = Math.min(INITIAL_DELAY * Math.pow(GROWTH_FACTOR, attempts), MAX_DELAY);
      await sleep(delay);

      // Try record-info first
      let res = await fetch(`${BASE_URL}/record-info?taskId=${encodeURIComponent(taskId)}`);
      let raw = await res.json().catch(() => ({}));

      // Fallback to /status/:id if record-info isn't wired
      if (res.status === 404) {
        res = await fetch(`${BASE_URL}/status/${encodeURIComponent(taskId)}`);
        raw = await res.json().catch(() => ({}));
      }

      const data = raw?.data ?? raw;

      if (res.status === 404) {
        log(`Status 404 for ${taskId}`, raw);
        if (attempts > 5) throw new Error(`Task Not Found (404) persistently. Debug: ${toDebugString(raw)}`);
        continue;
      }

      if (!res.ok) {
        throw new Error(`Status Check Failed (${res.status}): ${raw?.error || raw?.msg || 'Unknown Error'}`);
      }

      const status = String(data?.status || data?.state || '').toUpperCase();
      log(`Poll ${taskId} [${attempts}]: ${status}`, data);

      if (['COMPLETED', 'SUCCESS', 'SUCCEEDED'].includes(status)) {
        return kieSunoService.parseClips(data);
      }

      if (status.includes('FAILED') || status.includes('ERROR')) {
        throw new Error(data?.error || raw?.error || 'Generation Task Failed at Provider');
      }
    }

    throw new Error('Polling Timed Out (Exceeded 3 minutes)');
  },

  parseClips: (data: any): SunoClip[] => {
    let clips: SunoClip[] = [];

    const rawClips = data?.clips || data?.output || data?.audios || data?.audioList || [];

    if (Array.isArray(rawClips)) {
      clips = rawClips
        .map((c: any) => ({
          id: c.id,
          url: c.audio_url || c.audioUrl || c.url || c.video_url,
          image_url: c.image_url || c.imageUrl || c.image_large_url,
          duration: c.duration,
          title: c.title
        }))
        .filter((c: any) => c.url);
    } else if (data?.audio_url || data?.audioUrl || data?.url) {
      clips = [{
        id: data?.id,
        url: data?.audio_url || data?.audioUrl || data?.url,
        image_url: data?.image_url || data?.imageUrl,
        duration: data?.duration
      }];
    }

    if (!clips.length) throw new Error(`Task Completed but no Audio URLs found. Debug: ${toDebugString(data)}`);
    return clips;
  },

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

    clips.forEach((clip, i) => {
      const displayTitle = clip.title || `SUNO_TRACK_${i + 1}`;
      try {
        saveAsset('AUDIO', displayTitle, clip.url, 'SONIC_STUDIO', leadId, {
          sunoJobId: clip.id || job.taskId,
          promptSignature: signature,
          duration: clip.duration || 120,
          isInstrumental: instrumental,
          coverUrl: customCoverUrl || clip.image_url
        });
        urls.push(clip.url);
      } catch (err: any) {
        console.error('Failed to save asset for clip', clip, err);
      }
    });

    log('Final URLs Saved:', urls);
    toast.success(`Generated ${clips.length} Music Tracks.`);
    return urls;
  }
};
