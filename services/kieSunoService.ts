
import { saveAsset, AssetRecord } from './geminiService';
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

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export const kieSunoService = {
  
  /**
   * Orchestrates the full generation cycle: Submit -> Poll -> Save
   */
  runFullCycle: async (
    prompt: string, 
    instrumental: boolean, 
    leadId?: string, 
    coverUrl?: string, 
    duration?: number
  ): Promise<AssetRecord[]> => {
    
    // 1. SUBMIT
    toast.info("Step 1/3: Transmitting to Neural Audio Engine...");
    const taskId = await kieSunoService.submitMusicGeneration(prompt, instrumental);
    
    if (!taskId) {
        toast.error("Handshake Failed: No Task ID returned from provider.");
        throw new Error("Failed to acquire Task ID from KIE");
    }
    
    // 2. POLL
    toast.neural("Step 2/3: Composing Audio (This takes ~60s)...");
    const results = await kieSunoService.pollForCompletion(taskId);
    
    if (!results || results.length === 0) {
        toast.error("Generation completed but returned no audio files.");
        throw new Error("Empty result set");
    }

    // 3. SAVE
    toast.success(`Step 3/3: Success! ${results.length} Tracks Generated.`);
    
    // Save each variation
    const savedAssets: AssetRecord[] = [];
    
    for (let i = 0; i < results.length; i++) {
       const clip = results[i];
       const title = `SONIC_GEN_${i + 1}: ${prompt.slice(0, 20)}...`;
       
       // Using the new persistent saveAsset (IndexedDB backed)
       const asset = saveAsset('AUDIO', title, clip.url, 'SONIC_STUDIO', leadId, {
         sunoJobId: taskId,
         promptSignature: prompt,
         duration: clip.duration || duration || 30,
         isInstrumental: instrumental,
         coverUrl: clip.image_url || coverUrl,
         lyrics: '' 
       });
       savedAssets.push(asset);
    }

    return savedAssets;
  },

  /**
   * Step 1: Submit Prompt
   */
  submitMusicGeneration: async (prompt: string, instrumental: boolean): Promise<string | null> => {
    try {
      const res = await fetch(`${BASE_URL}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          mv: 'chirp-v3-0', // Using v3 for speed/quality balance
          make_instrumental: instrumental
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`API Error ${res.status}: ${errText}`);
      }

      const data = await res.json();
      console.log("[KIE] Submit Data:", data);
      
      // KIE returns { id: "taskId", ... } depending on version
      return data.id || data.taskId || (data.data && data.data.id) || null;

    } catch (e: any) {
      console.error("[KIE_SUNO] Submit Failed:", e);
      toast.error(`Connection Failed: ${e.message}`);
      throw e;
    }
  },

  /**
   * Step 2: Poll for Completion
   */
  pollForCompletion: async (taskId: string): Promise<SunoClip[]> => {
    const maxAttempts = 60; // 60 * 3s = ~3 mins max wait (Suno can be slow)
    let attempts = 0;

    while (attempts < maxAttempts) {
      await sleep(3000); 
      attempts++;

      try {
        const res = await fetch(`${BASE_URL}/record-info?taskId=${taskId}`);
        
        if (!res.ok) {
            console.warn(`[KIE_SUNO] Poll error ${res.status}, retrying...`);
            continue;
        }

        const data = await res.json();
        // Unwrap data structure if wrapped in 'data' prop
        const info = data.data || data; 
        
        console.log(`[KIE] Poll Status: ${info.status}`);

        if (info.status === 'SUCCESS' || info.status === 'COMPLETED') {
           // KIE returns an array of results in `response` or `data`
           const clips = info.response || info.data || (Array.isArray(info) ? info : []);
           
           if (!clips || clips.length === 0) {
               continue;
           }

           // Normalize output
           return clips.map((c: any) => ({
             id: c.id,
             url: c.audio_url || c.url,
             image_url: c.image_url || c.imageUrl,
             duration: c.duration,
             title: c.title
           })).filter((c: SunoClip) => !!c.url);
        }
        
        if (info.status === 'FAILED' || info.status === 'ERROR') {
            throw new Error(`Generation Failed: ${info.error || 'Unknown Error from Provider'}`);
        }

      } catch (e) {
        console.warn("[KIE_SUNO] Transient Poll Error:", e);
        // Continue polling unless it's a critical logic error
      }
    }

    throw new Error("Generation timed out. The system is busy.");
  }
};
