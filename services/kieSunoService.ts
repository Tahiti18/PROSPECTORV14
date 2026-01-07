
import { saveAsset, AssetRecord } from './geminiService';
import { toast } from './toastManager';

// Configuration
// Using the same KIE Proxy Key found in geminiService for Veo
const KIE_KEY = '302d700cb3e9e3dcc2ad9d94d5059279'; 
const BASE_URL = 'https://api.kie.ai/api/v1/suno';

// Types
export interface SunoJob {
  id: string; // Internal Job ID
  taskId?: string; // KIE Task ID
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

export const kieSunoService = {
  
  /**
   * 1. SUBMIT JOB
   */
  generateMusic: async (prompt: string, instrumental: boolean): Promise<SunoJob> => {
    const jobId = `JOB_SUNO_${Date.now()}`;
    log(`Initializing Job ${jobId}`);

    const payload: SunoRequest = {
      prompt,
      make_instrumental: instrumental,
      wait_audio: false // Force async to prevent browser timeouts
    };

    try {
      const res = await fetch(`${BASE_URL}/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`KIE API Error (${res.status}): ${errText}`);
      }

      const data = await res.json();
      // KIE Suno output often puts the task ID in 'id' or 'task_id'
      const taskId = data.id || data.task_id;

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

    } catch (e: any) {
      log(`Job ${jobId} Failed Initialization`, e);
      throw e;
    }
  },

  /**
   * 2. POLL STATUS (Exponential Backoff)
   */
  pollTask: async (taskId: string): Promise<SunoClip[]> => {
    let attempts = 0;
    const maxAttempts = 30; // 30 attempts * ~5s avg = ~2.5 mins max wait
    
    // Polling loop
    while (attempts < maxAttempts) {
      attempts++;
      // Exponential backoff: 2s, 3s, 4.5s... capped at 10s
      const backoff = Math.min(2000 * Math.pow(1.5, attempts), 10000); 
      await new Promise(r => setTimeout(r, backoff));

      try {
        const res = await fetch(`${BASE_URL}/${taskId}`, { headers });
        
        if (!res.ok) {
            // If 404, it might be too early (propagation delay), warn but don't crash immediately
            if (res.status === 404) {
                console.warn(`[KIE_SUNO] Task ${taskId} not found yet. Retrying...`);
                continue;
            }
            throw new Error(`Status Check Failed: ${res.status}`);
        }

        const data = await res.json();
        const status = (data.status || '').toUpperCase();
        
        log(`Poll ${taskId}: ${status}`);

        if (status === 'COMPLETED' || status === 'SUCCESS' || status === 'SUCCEEDED') {
           // Success!
           // KIE Suno usually returns array of objects in 'clips' or 'output'
           let clips: SunoClip[] = [];
           
           const rawClips = data.clips || data.output || [];
           
           if (Array.isArray(rawClips)) {
               clips = rawClips.map((c: any) => ({
                   id: c.id,
                   url: c.audio_url || c.url || c.video_url, // Prefer audio_url
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

           if (clips.length > 0) return clips;
           
           // If completed but no URLs, it might be a silent failure or data issue
           throw new Error("Task Completed but no Audio URLs found in response.");
        }

        if (status === 'FAILED' || status === 'ERROR') {
           throw new Error(data.error || "Generation Task Failed at Provider");
        }

        // If processing/submitted/queued, loop continues...

      } catch (e: any) {
        console.warn(`[KIE_SUNO] Polling error (attempt ${attempts}):`, e.message);
        if (attempts > 5 && e.message.includes("Status Check Failed")) throw e; // Hard fail after 5 bad network hits
      }
    }

    throw new Error("Polling Timed Out (Target exceeded 3 minutes)");
  },

  /**
   * 3. ORCHESTRATOR (Client-Side Wrapper)
   */
  runFullCycle: async (prompt: string, instrumental: boolean, leadId?: string): Promise<string[]> => {
    // 1. Start
    const job = await kieSunoService.generateMusic(prompt, instrumental);
    
    // 2. Poll
    const clips = await kieSunoService.pollTask(job.taskId!);
    
    // Extract signature from prompt (e.g. "Uplifting Electronic music...")
    // We roughly take the first few words or split by comma
    const signature = prompt.split(',')[0].trim().slice(0, 30);

    // 3. Save Assets
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
                    duration: clip.duration || 120, // Default 2 mins if unknown
                    isInstrumental: instrumental,
                    coverUrl: clip.image_url
                }
            );
        });
        toast.success(`Generated ${clips.length} Music Tracks.`);
        return clips.map(c => c.url);
    }
    
    return [];
  }
};
