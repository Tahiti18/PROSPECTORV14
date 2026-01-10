
import { Lead } from '../types';

export interface StrategicDossier {
  id: string;
  leadId: string;
  leadName: string;
  version: number;
  timestamp: number;
  model: string;
  contextSnapshot: {
    assetIds: string[];
  };
  data: any; // The full orchestrated package
}

const STORAGE_KEY = 'pomelli_dossier_db_v1';

const getDb = (): StrategicDossier[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveDb = (db: StrategicDossier[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
};

export const dossierStorage = {
  save: (lead: Lead, packageData: any, assetIds: string[]): StrategicDossier => {
    const db = getDb();
    
    // Calculate Version
    const existing = db.filter(d => d.leadId === lead.id);
    const nextVersion = existing.length > 0 
      ? Math.max(...existing.map(e => e.version)) + 1 
      : 1;

    const dossier: StrategicDossier = {
      id: `DOSSIER-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      leadId: lead.id,
      leadName: lead.businessName,
      version: nextVersion,
      timestamp: Date.now(),
      model: 'gemini-3-flash-preview', 
      contextSnapshot: { assetIds },
      data: packageData
    };

    db.unshift(dossier);
    if (db.length > 50) db.pop();
    
    saveDb(db);
    return dossier;
  },

  getByLead: (leadId: string): StrategicDossier | null => {
    const db = getDb();
    const matches = db.filter(d => d.leadId === leadId).sort((a, b) => b.version - a.version);
    return matches.length > 0 ? matches[0] : null;
  },

  getAllByLead: (leadId: string): StrategicDossier[] => {
    return getDb()
      .filter(d => d.leadId === leadId)
      .sort((a, b) => b.version - a.version); 
  },

  exportToMarkdown: (dossier: StrategicDossier): string => {
    const { data, leadName } = dossier;
    let md = `# STRATEGIC DOSSIER: ${leadName}\n`;
    md += `**Date:** ${new Date(dossier.timestamp).toLocaleDateString()}\n`;
    md += `**Version:** v${dossier.version}\n\n`;

    md += `## 1. EXECUTIVE NARRATIVE\n${data.narrative}\n\n`;

    md += `## 2. STRATEGY DECK\n`;
    data.presentation?.slides?.forEach((s: any, i: number) => {
      md += `### Slide ${i+1}: ${s.title}\n`;
      s.bullets?.forEach((b: string) => md += `- ${b}\n`);
      if(s.visualRef) md += `*Visual Directive: ${s.visualRef}*\n`;
      md += `\n`;
    });

    if (data.visualDirection) {
      md += `## 3. VISUAL DIRECTION\n`;
      md += `**Brand Mood:** ${data.visualDirection.brandMood}\n\n`;
      md += `### Color Palette\n`;
      data.visualDirection.colorPsychology?.forEach((c: any) => md += `- ${c.color}: ${c.purpose}\n`);
      md += `\n### AI Image Prompts\n`;
      data.visualDirection.aiImagePrompts?.forEach((p: any) => md += `**${p.use_case}:** \`${p.prompt}\`\n\n`);
    }

    md += `## 4. OUTREACH SEQUENCE\n`;
    data.outreach?.emailSequence?.forEach((e: any, i: number) => {
      md += `### Email ${i+1}\n**Subject:** ${e.subject}\n\n${e.body}\n\n`;
    });
    
    if (data.outreach?.linkedin) {
        md += `### LinkedIn Message\n${data.outreach.linkedin}\n\n`;
    }

    md += `## 5. CONTENT PACK\n`;
    data.contentPack?.forEach((c: any, i: number) => {
        md += `### Post ${i+1} (${c.platform})\n**Type:** ${c.type}\n**Caption:** ${c.caption}\n\n`;
    });

    return md;
  }
};
