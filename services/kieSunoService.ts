import { saveAsset } from './geminiService';
import { toast } from './toastManager';

// Configuration
// PROXY ENABLED: Requests now route to the local backend proxy defined in vite.config.ts
const BASE_URL = '/api/kie';

// Types
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

export interface SunoRequest {
  prompt: string;
  make_instrumental: boolean;
  wait_audio: boolean;
  webhook_url?: string;
  duration?: number;
}

export interface SunoClip {
  id?: string;
  url: string;
  image_url?: string;
  duration?: number;
  title?: string;
}

// --- API CLIENT ---

const log = (msg: string, data?: any) => {
  if (data) {
    console.log(`[KIE_SUNO] ${msg}`, data);
  } else {
    console.log(`[KIE_SUNO] ${msg}`);
  }
};

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export const kieSunoService = {
  /**
   * 1. ASYNC SUBMISSION (VIA PROXY)
   */
  generateMusic: async (
    prompt: string,
    instrumental: boolean,
    duration?: number,
    webhookUrl?: string
  ): Promise<SunoJob> => {
    const jobId = `JOB_SUNO_${Date.now()}`;
    log(`Initializing Job ${jobId}`);

    // Keep payload minimal and stable
    const payload = {
      prompt: prompt,
      make_instrumental: instrumental,
      wait_audio: false
    };

    // Call local proxy
    const submitUrl = `${BASE_URL}/submit`;
    log(`Posting to Proxy: ${submitUrl}`);

    try {
      const res = await fetch(submitUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));

      // Some providers return { code, msg, data } even with HTTP 200.
      const providerOk =
        res.ok && (data?.code === undefined || data?.code === 200 || data?.code === 0);

      if (!providerOk) {
        log(`Error Response Body:`, data);
        const errMsg =
          data?.error ||
          data?.msg ||
          (data?.raw ? `Raw: ${data.raw}` : 'Unknown Proxy Error');
        throw new Error(`Proxy Error (${res.status}): ${errMsg}`);
      }

      // KIE wrapper shape: { data: { taskId: "..." } }
      const taskId =
        data?.data?.taskId ||
        data?.taskId ||
        data?.id ||
        data?.task_id;

      if (!taskId || typeof taskId !== 'string') {
        log('Missing Task ID in Response:', data);
        throw new Error("KIE response missing taskId");
      }

      log(`Job ${jobId} -> Task ${taskId} Submitted via Proxy`);

      return {
        id: jobId,
        taskId,
        status: 'QUEUED',
        prompt,
        instrumental,
        createdAt: Date.now()
      };
    } catch (e: any) {
      log(`Job ${jobId} Failed Initialization`, e);
      throw e;
    }
  },

  /**
   * 2. ROBUST POLLING (VIA PROXY)
   */
  pollTask: async (taskId: string): Promise<SunoClip[]> => {
    let attempts = 0;
    const MAX_TIMEOUT = 180000; // 3 Minutes Max
    const startTime = Date.now();

    const INITIAL_DELAY = 2000;
    const MAX_DELAY = 10000;
    const GROWTH_FACTOR = 1.5;

    while ((Date.now() - startTime) < MAX_TIMEOUT) {
      attempts++;
      const delay = Math.min(INITIAL_DELAY * Math.pow(GROWTH_FACTOR, attempts), MAX_DELAY);
      await sleep(delay);

      try {
        // KIE status details (via proxy)
        const statusUrl = `${BASE_URL}/record-info?taskId=${encodeURIComponent(taskId)}`;
        const res = await fetch(statusUrl);

        const data = await res.json().catch(() => ({}));

        // unwrap common provider shape
        const root = data?.data ?? data;

        if (res.status === 404) {
          console.warn(
            `[KIE_SUNO] Task ${taskId} not found at proxy (404). Raw response:`,
            data
          );
          if (attempts > 5) throw new Error('Task Not Found (404) persistently.');
          continue;
        }

        // Provider-level ok check
        const providerOk =
          res.ok && (data?.code === undefined || data?.code === 200 || data?.code === 0);

        if (!providerOk) {
          const errMsg =
            data?.error ||
            data?.msg ||
            root?.error ||
            (data?.raw ? `Raw: ${data.raw}` : 'Unknown Error');
          throw new Error(`Status Check Failed (${res.status}): ${errMsg}`);
        }

        const status = (
          root?.status ||
          root?.state ||
          data?.status ||
          data?.state ||
          ''
        ).toUpperCase();

        log(`Poll ${taskId} [${attempts}]: ${status}`, data);

        if (['COMPLETED', 'SUCCESS', 'SUCCEEDED', 'DONE'].includes(status)) {
          return kieSunoService.parseClips(root);
        }

        if (['FAILED', 'ERROR'].includes(status)) {
          throw new Error(root?.error || data?.error || data?.msg || 'Generation Task Failed');
        }
      } catch (e: any) {
        console.warn(`[KIE_SUNO] Polling error:`, e.message);
        if (e.message.includes('401') || e.message.includes('403')) throw e;
        if (e.message.includes('404')) throw e;
      }
    }

    throw new Error('Polling Timed Out (Exceeded 3 minutes)');
  },

  parseClips: (data: any): SunoClip[] => {
    // accept either root object or wrapped response
    const root = data?.data ?? data;

    let clips: SunoClip[] = [];

    const rawClips = root?.clips || root?.output || root?.audios || [];

    if (Array.isArray(rawClips)) {
      clips = rawClips
        .map((c: any) => ({
          id: c.id || c.clip_id,
          url: c.audio_url || c.url || c.video_url,
          image_url: c.image_url || c.image_large_url,
          duration: c.duration,
          title: c.title
        }))
        .filter((c: any) => c.url);
    } else if (root?.audio_url || root?.url) {
      clips = [
        {
          id: root?.id,
          url: root?.audio_url || root?.url,
          image_url: root?.image_url,
          duration: root?.duration
        }
      ];
    }

    if (clips.length === 0) throw new Error('Task Completed but no Audio URLs found.');
    return clips;
  },

  /**
   * 3. ORCHESTRATOR
   */
  runFullCycle: async (
    prompt: string,
    instrumental: boolean,
    leadId?: string,
    customCoverUrl?: string,
    duration?: number
  ): Promise<string[]> => {
    // 1. Start Async
    const job = await kieSunoService.generateMusic(prompt, instrumental, duration);

    // 2. Poll for Result
    const clips = await kieSunoService.pollTask(job.taskId!);

    // 3. Process Results
    const signature = prompt.split(',')[0].trim().slice(0, 30);

    if (clips && clips.length > 0) {
      clips.forEach((clip, i) => {
        const displayTitle = clip.title || `SUNO_TRACK_${i + 1}`;

        saveAsset('AUDIO', displayTitle, clip.url, 'SONIC_STUDIO', leadId, {
          sunoJobId: clip.id || job.taskId,
          promptSignature: signature,
          duration: clip.duration || 120,
          isInstrumental: instrumental,
          coverUrl: customCoverUrl || clip.image_url
        });
      });

      toast.success(`Generated ${clips.length} Music Tracks.`);
      return clips.map(c => c.url);
    }

    return [];
  }
};
