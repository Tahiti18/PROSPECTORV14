import { saveAsset } from './geminiService';
import { toast } from './toastManager';

const BASE_URL = '/api/kie/suno';
const GALLERY_KEY = 'SONIC_STUDIO_SUNO_GALLERY_V1';

export interface SunoClip {
  id?: string;
  url: string;
  image_url?: string;
  duration?: number;
  title?: string;
}

type PersistedTrack = {
  id: string;
  url: string;
  title: string;
  image_url?: string;
  duration?: number;
  createdAt: number;
};

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

const loadGallery = (): PersistedTrack[] => {
  try {
    const raw = localStorage.getItem(GALLERY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveGallery = (tracks: PersistedTrack[]) => {
  localStorage.setItem(GALLERY_KEY, JSON.stringify(tracks));
  window.dispatchEvent(new CustomEvent('suno:gallery_updated', { detail: tracks }));
};

export const kieSunoService = {
  getPersistedGallery: (): PersistedTrack[] => loadGallery(),

  generateMusic: async (prompt: string, instrumental: boolean) => {
    const res = await fetch(`${BASE_URL}/suno_submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        instrumental,
        model: 'V4_5'
      })
    });

    const data = await res.json();
    const taskId = data?.data?.taskId || data?.taskId;

    if (!taskId) throw new Error('Missing taskId from Suno');

    return taskId;
  },

  pollTask: async (taskId: string): Promise<SunoClip[]> => {
    const start = Date.now();

    while (Date.now() - start < 180000) {
      await sleep(3000);

      let res = await fetch(`${BASE_URL}/record-info?taskId=${taskId}`);
      let data = await res.json();

      if (res.status === 404) {
        res = await fetch(`${BASE_URL}/status/${taskId}`);
        data = await res.json();
      }

      const payload = data?.data || data;
      const status = String(payload?.status || '').toUpperCase();

      if (['COMPLETED', 'SUCCESS'].includes(status)) {
        const clips: SunoClip[] = [];

        const scan = (obj: any) => {
          if (!obj) return;
          if (Array.isArray(obj)) return obj.forEach(scan);
          if (typeof obj === 'object') {
            const url = obj.audio_url || obj.url;
            if (url) clips.push({ url, title: obj.title, duration: obj.duration });
            Object.values(obj).forEach(scan);
          }
        };

        scan(payload);
        return clips;
      }

      if (status.includes('FAIL')) {
        throw new Error('Suno generation failed');
      }
    }

    throw new Error('Polling timeout');
  },

  runFullCycle: async (prompt: string, instrumental: boolean) => {
    const taskId = await kieSunoService.generateMusic(prompt, instrumental);
    const clips = await kieSunoService.pollTask(taskId);

    const existing = loadGallery();
    const now = Date.now();

    const newTracks: PersistedTrack[] = clips.map((c, i) => ({
      id: `${taskId}_${i}`,
      url: c.url,
      title: c.title || `SUNO_TRACK_${i + 1}`,
      image_url: c.image_url,
      duration: c.duration || 120,
      createdAt: now
    }));

    // ✅ LOCAL PERSISTENCE (THIS FIXES DISAPPEARING TRACKS)
    const merged = [...newTracks, ...existing];
    saveGallery(merged);

    // ✅ ASSET / VAULT PERSISTENCE
    for (const track of newTracks) {
      try {
        await saveAsset(
          'AUDIO',
          track.title,
          track.url,
          'SONIC_STUDIO',
          undefined,
          { duration: track.duration }
        );
      } catch (e) {
        console.error('Asset save failed', e);
      }
    }

    toast.success(`Generated ${newTracks.length} tracks`);
    return newTracks.map(t => t.url);
  }
};
