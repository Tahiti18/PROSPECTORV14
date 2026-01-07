
import { saveAsset, AssetRecord } from './geminiService';
import { toast } from './toastManager';

// Configuration
const KIE_KEY = '302d700cb3e9e3dcc2ad9d94d5059279'; // KIE Proxy Key
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
      wait_audio: false // Force async
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
  pollTask: async (taskId: string): Promise<string[]> => {
    let attempts = 0;
    const maxAttempts = 30; // 30 attempts * ~5s avg = ~2.5 mins max wait
    
    // Polling loop
    while (attempts < maxAttempts) {
      attempts++;
      const backoff = Math.min(2000 * Math.pow(1.5, attempts), 10000); // Cap at 10s
      await new Promise(r => setTimeout(r, backoff));

      try {
        const res = await fetch(`${BASE_URL}/${taskId}`, { headers });
        if (!res.ok) {
            // If 404, it might be too early, warn but don't crash
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
           // KIE Suno usually returns array of objects with 'audio_url' or just 'audio_url'
           let urls: string[] = [];
           
           if (Array.isArray(data.clips)) {
               urls = data.clips.map((c: any) => c.audio_url || c.audio_url || c.url).filter(Boolean);
           } else if (Array.isArray(data.output)) {
               urls = data.output.map((c: any) => c.audio_url || c.url).filter(Boolean);
           } else if (data.audio_url) {
               urls = [data.audio_url];
           }

           if (urls.length > 0) return urls;
           // If completed but no URLs, strictly fail
           throw new Error("Task Completed but no Audio URLs found.");
        }

        if (status === 'FAILED' || status === 'ERROR') {
           throw new Error(data.error || "Generation Task Failed at Provider");
        }

        // If processing/submitted, loop continues...

      } catch (e: any) {
        console.warn(`[KIE_SUNO] Polling error (attempt ${attempts}):`, e.message);
        if (attempts > 5 && e.message.includes("Status Check Failed")) throw e; // Hard fail after 5 bad network hits
      }
    }

    throw new Error("Polling Timed Out");
  },

  /**
   * 3. ORCHESTRATOR (Client-Side Wrapper)
   */
  runFullCycle: async (prompt: string, instrumental: boolean, leadId?: string): Promise<string[]> => {
    // 1. Start
    const job = await kieSunoService.generateMusic(prompt, instrumental);
    
    // 2. Poll
    const audioUrls = await kieSunoService.pollTask(job.taskId!);
    
    // 3. Save Assets
    if (audioUrls && audioUrls.length > 0) {
        audioUrls.forEach((url, i) => {
            saveAsset(
                'AUDIO', 
                `SUNO_TRACK_${i+1}: ${prompt.slice(0, 20)}...`, 
                url, 
                'SONIC_STUDIO', 
                leadId
            );
        });
        toast.success(`Generated ${audioUrls.length} Music Tracks.`);
        return audioUrls;
    }
    
    return [];
  }
};
