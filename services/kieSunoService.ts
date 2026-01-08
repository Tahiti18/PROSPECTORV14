
import { saveAsset } from './geminiService';
import { toast } from './toastManager';

// Frontend hits the Vite proxy namespace
const BASE_URL = '/api/kie';

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
const unwrap = (v: any) => (v && typeof v === 'object' && 'data' in v ? v.data : v);

export const kieSunoService = {
  /**
   * Submit generation (via proxy)
   */
  generateMusic: async (
    prompt: string,
    instrumental: boolean,
    duration?: number,
    webhookUrl?: string
  ): Promise<SunoJob> => {
    const jobId = `JOB_SUNO_${Date.now()}`;
    log(`Initializing Job ${jobId}`);

    const callBackUrl = webhookUrl || `${window.location.origin}/api/kie/callback`;

    const payload: any = {
      prompt,
      customMode: false,
      instrumental,
      model: 'V4_5',
      callBackUrl
    };

    if (typeof duration === 'number') payload.duration = duration;

    const submitUrl = `${BASE_URL}/submit`;
    log(`Posting to Proxy: ${submitUrl}`, payload);

    // Timeout controller to prevent infinite hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout for initial handshake

    try {
        const res = await fetch(submitUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        const text = await res.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            log('Failed to parse JSON response', text);
            throw new Error(`Invalid JSON from Proxy: ${text.slice(0, 100)}`);
        }

        if (!res.ok) {
          log('Submit error body:', data);
          throw new Error(
            `Proxy Error (${res.status}): ${data?.msg || data?.error || 'Unknown Proxy Error'}`
          );
        }

        const d = unwrap(data);
        const taskId = d?.taskId || data?.taskId;

        if (!taskId) {
          log('Missing taskId in response:', data);
          throw new Error("KIE response missing 'taskId'");
        }

        return {
          id: jobId,
          taskId,
          status: 'QUEUED',
          prompt,
          instrumental,
          createdAt: Date.now()
        };
    } catch (e: any) {
        log('Fetch failed', e);
        throw e;
    } finally {
        clearTimeout(timeoutId);
    }
  },

  /**
   * Poll status (via proxy)
   */
  pollTask: async (taskId: string): Promise<SunoClip[]> => {
    let attempts = 0;
    const MAX_TIMEOUT = 180000;
    const startTime = Date.now();

    while (Date.now() - startTime < MAX_TIMEOUT) {
      attempts++;
      await sleep(Math.min(2000 * Math.pow(1.5, attempts), 10000));

      const statusUrl = `${BASE_URL}/record-info?taskId=${encodeURIComponent(taskId)}`;
      
      try {
          const res = await fetch(statusUrl);
          const data = await res.json().catch(() => ({}));
          const d = unwrap(data);

          if (!res.ok) {
            throw new Error(
              `Status Check Failed (${res.status}): ${data?.msg || data?.error || 'Unknown Error'}`
            );
          }

          const status = String(d?.status || d?.state || data?.status || data?.state || '').toUpperCase();
          log(`Poll ${taskId} [${attempts}]: ${status}`, data);

          if (['SUCCESS', 'SUCCEEDED', 'COMPLETED'].includes(status)) {
            return kieSunoService.parseClips(d);
          }

          if (status.includes('FAILED') || status.includes('ERROR')) {
            throw new Error(d?.error || data?.msg || data?.error || 'Generation Task Failed');
          }
      } catch (e) {
          log(`Poll attempt ${attempts} failed (network/parse error), retrying...`, e);
          // Don't throw immediately on poll network error, retry a few times
          if (attempts > 20) throw e; 
      }
    }

    throw new Error('Polling Timed Out (Exceeded 3 minutes)');
  },

  parseClips: (d: any): SunoClip[] => {
    const raw = d?.clips || d?.audioList || d?.audios || d?.output || [];

    let clips: SunoClip[] = [];

    if (Array.isArray(raw)) {
      clips = raw
        .map((c: any) => ({
          id: c.id,
          url: c.audio_url || c.audioUrl || c.url,
          image_url: c.image_url || c.imageUrl,
          duration: c.duration,
          title: c.title
        }))
        .filter((c: any) => c.url);
    } else if (d?.audio_url || d?.audioUrl || d?.url) {
      clips = [
        {
          id: d?.id,
          url: d.audio_url || d.audioUrl || d.url,
          image_url: d.image_url || d.imageUrl,
          duration: d.duration
        }
      ];
    }

    if (!clips.length) throw new Error('Task Completed but no Audio URLs found.');
    return clips;
  },

  /**
   * Orchestrator
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
};
