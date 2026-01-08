
import { saveAsset } from './geminiService';
import { toast } from './toastManager';

// Frontend hits the Vite proxy namespace
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
const unwrap = (v: any) => (v && typeof v === 'object' && 'data' in v ? v.data : v);

export const kieSunoService = {
  /**
   * Submit generation (via proxy)
   *
   * IMPORTANT: Signature is backward-compatible to avoid TS2554 in SonicStudio.tsx.
   */
  generateMusic: async (
    prompt: string,
    instrumental: boolean,
    duration?: number,
    webhookUrl?: string
  ): Promise<SunoJob> => {
    const jobId = `JOB_SUNO_${Date.now()}`;
    log(`Initializing Job ${jobId}`);

    // KIE requires callBackUrl to be a valid URI.
    // If caller provided webhookUrl, use it; otherwise use our Railway origin callback endpoint.
    const callBackUrl = webhookUrl || `${window.location.origin}/api/kie/callback`;

    // Minimal required fields per KIE docs: prompt/customMode/instrumental/model/callBackUrl
    const payload: any = {
      prompt,
      customMode: false,
      instrumental,
      model: 'V4_5',
      callBackUrl
    };

    // If your UI passes duration, include it only when defined (harmless if upstream ignores it)
    if (typeof duration === 'number') payload.duration = duration;

    const submitUrl = `${BASE_URL}/suno/suno_submit`;
    log(`Posting to Proxy: ${submitUrl}`, payload);

    const res = await fetch(submitUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json().catch(() => ({}));

    // LOGGING: KIE Submit Response
    log(`Submit Response (${res.status})`, data);

    if (!res.ok) {
      log('Submit error body:', data);
      throw new Error(
        `Proxy Error (${res.status}): ${data?.msg || data?.error || 'Unknown Proxy Error'}`
      );
    }

    // Typical shape: { code, msg, data: { taskId } }
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
      const res = await fetch(statusUrl);
      const data = await res.json().catch(() => ({}));
      const d = unwrap(data);

      if (!res.ok) {
        throw new Error(
          `Status Check Failed (${res.status}): ${data?.msg || data?.error || 'Unknown Error'}`
        );
      }

      const status = String(d?.status || d?.state || data?.status || data?.state || '').toUpperCase();
      log(`Poll ${taskId} [${attempts}]: ${status}`);

      if (['SUCCESS', 'SUCCEEDED', 'COMPLETED'].includes(status)) {
        // LOGGING: Poll Completion Payload
        log('Poll Completion Payload:', d);
        return kieSunoService.parseClips(d);
      }

      if (status.includes('FAILED') || status.includes('ERROR')) {
        throw new Error(d?.error || data?.msg || data?.error || 'Generation Task Failed');
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
   * Orchestrator (backward-compatible signature)
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
        console.error("Failed to save asset for clip", clip, err);
      }
    });

    // LOGGING: Final URLs
    log('Final URLs Saved:', urls);

    toast.success(`Generated ${clips.length} Music Tracks.`);
    return urls;
  }
};
