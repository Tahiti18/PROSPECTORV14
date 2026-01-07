
import { saveAsset } from './geminiService';
import { toast } from './toastManager';

// Configuration
const KIE_KEY = '302d700cb3e9e3dcc2ad9d94d5059279'; 
const BASE_URL = 'https://api.kie.ai/api/v1/suno';

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

const headers = {
  'Authorization': `Bearer ${KIE_KEY}`,
  'Content-Type': 'application/json'
};

const log = (msg: string, data?: any) => {
  console.log(`[KIE_SUNO] ${msg}`, data || '');
};

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export const kieSunoService = {
  
  /**
   * 1. ASYNC SUBMISSION WITH ENDPOINT PROBING
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

    // Candidate endpoints to probe (First non-404 wins)
    const candidates = [
        `${BASE_URL}/submit`,
        `${BASE_URL}/generate`,
        `${BASE_URL}/create`, 
        // Fallback absolute URL to bypass any potential local proxy issues
        'https://api.kie.ai/api/v1/suno/submit' 
    ];

    let successData: any = null;
    let lastError = "No endpoints attempted";

    for (const url of candidates) {
        log(`Probing Endpoint: ${url}`);
        
        try {
            // Force absolute URL usage to prevent relative path proxy interception
            const absoluteUrl = new URL(url).toString(); 
            
            const res = await fetch(absoluteUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload)
            });

            if (res.status === 404) {
                log(`Endpoint 404 (Not Found): ${url}`);
                continue; // Try next candidate
            }

            if (!res.ok) {
                // If we get here, the endpoint EXISTS but the request failed (400, 401, 500).
                // We stop probing because we found the right door, just used the wrong key/payload.
                const errText = await res.text();
                throw new Error(`API Error [${res.status}] at ${url}: ${errText}`);
            }

            // Success (2xx)
            successData = await res.json();
            log(`Endpoint Confirmed: ${url}`);
            break; // Stop probing

        } catch (e: any) {
            // If it's a network error or the explicit error thrown above (non-404), rethrow immediately.
            // We only loop on explicit 404s.
            if (e.message.includes("API Error") || e.message.includes("Network")) {
                throw e; 
            }
            // Capture generic errors to throw if all fail
            lastError = e.message;
            log(`Probe Failed for ${url}:`, e.message);
        }
    }

    if (!successData) {
        throw new Error(`All endpoints returned 404 or failed. Last error: ${lastError}`);
    }

    const taskId = successData.id || successData.task_id;

    if (!taskId) {
        throw new Error("KIE response missing 'id' or 'task_id'");
    }

    log(`Job ${jobId} -> Task ${taskId} Submitted`);

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
   * 2. ROBUST POLLING (Exponential Backoff)
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
        // Ensure absolute URL here as well
        const absolutePollUrl = new URL(`${BASE_URL}/${taskId}`).toString();
        const res = await fetch(absolutePollUrl, { headers });
        
        if (res.status === 404) {
            console.warn(`[KIE_SUNO] Task ${taskId} not found yet. Retrying...`);
            continue;
        }

        if (!res.ok) throw new Error(`Status Check Failed: ${res.status}`);

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
