
import { saveAsset } from './geminiService';
import { toast } from './toastManager';

// Configuration
// PROXY ENABLED: Requests now route to the local backend proxy defined in vite.config.ts
const BASE_URL = '/api/kie/suno';

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
  console.log(`[KIE_SUNO] ${msg}`, data || '');
};

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export const kieSunoService = {
  
  /**
   * 1. ASYNC SUBMISSION (VIA PROXY)
   */
  generateMusic: async (prompt: string, instrumental: boolean, webhookUrl?: string): Promise<SunoJob> => {
    const jobId = `JOB_SUNO_${Date.now()}`;
    log(`Initializing Job ${jobId}`);

    const payload: SunoRequest = {
      prompt,
      make_instrumental: instrumental,
      wait_audio: false,
      ...(webhookUrl ? { webhook_url: webhookUrl } : {})
    };

    // Call local proxy with the CORRECTED endpoint
    const submitUrl = `${BASE_URL}/suno_submit`;
    log(`Posting to Proxy: ${submitUrl}`);

    try {
      const res = await fetch(submitUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errText = await res.text();
        log(`Error Raw Response: ${errText}`);
        throw new Error(`Proxy Error (${res.status}): ${errText}`);
      }

      const data = await res.json();
      const taskId = data.id || data.task_id;

      if (!taskId) {
        throw new Error("KIE response missing 'id' or 'task_id'");
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
        // Call local proxy status
        const statusUrl = `${BASE_URL}/status/${taskId}`;
        const res = await fetch(statusUrl);
        
        if (res.status === 404) {
            console.warn(`[KIE_SUNO] Task ${taskId} not found at proxy. Retrying...`);
            continue;
        }

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Status Check Failed: ${res.status} ${err}`);
        }

        const data = await res.json();
        const status = (data.status || data.state || '').toUpperCase();
        
        log(`Poll ${taskId} [${attempts}]: ${status}`);

        if (['COMPLETED', 'SUCCESS', 'SUCCEEDED'].includes(status)) {
           return kieSunoService.parseClips(data);
        }

        if (['FAILED', 'ERROR'].includes(status)) {
           throw new Error(data.error || "Generation Task Failed at Provider");
        }

      } catch (e: any) {
        console.warn(`[KIE_SUNO] Polling error:`, e.message);
        if (e.message.includes("401") || e.message.includes("403")) throw e;
      }
    }

    throw new Error("Polling Timed Out (Exceeded 3 minutes)");
  },

  parseClips: (data: any): SunoClip[] => {
      let clips: SunoClip[] = [];
      const rawClips = data.clips || data.output || [];
      
      if (Array.isArray(rawClips)) {
          clips = rawClips.map((c: any) => ({
              id: c.id,
              url: c.audio_url || c.url || c.video_url,
              image_url: c.image_url || c.image_large_url,
              duration: c.duration,
              title: c.title
          })).filter(c => c.url);
      } else if (data.audio_url) {
          clips = [{
              id: data.id,
              url: data.audio_url,
              image_url: data.image_url,
              duration: data.duration
          }];
      }

      if (clips.length === 0) throw new Error("Task Completed but no Audio URLs found.");
      return clips;
  },

  /**
   * 3. ORCHESTRATOR
   */
  runFullCycle: async (prompt: string, instrumental: boolean, leadId?: string, customCoverUrl?: string): Promise<string[]> => {
    // 1. Start Async
    const job = await kieSunoService.generateMusic(prompt, instrumental);
    
    // 2. Poll for Result
    const clips = await kieSunoService.pollTask(job.taskId!);
    
    // 3. Process Results
    const signature = prompt.split(',')[0].trim().slice(0, 30);

    if (clips && clips.length > 0) {
        clips.forEach((clip, i) => {
            const displayTitle = clip.title || `SUNO_TRACK_${i+1}`;
            
            saveAsset(
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
                    coverUrl: customCoverUrl || clip.image_url
                }
            );
        });
        toast.success(`Generated ${clips.length} Music Tracks.`);
        return clips.map(c => c.url);
    }
    
    return [];
  }
};
