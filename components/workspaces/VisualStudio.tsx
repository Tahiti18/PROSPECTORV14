
import React from 'react';
import { CreateWorkspace } from './CreateWorkspace';
import { Lead } from '../../types';

interface VisualStudioProps {
  leads: Lead[];
  lockedLead?: Lead;
}

export const VisualStudio: React.FC<VisualStudioProps> = ({ leads, lockedLead }) => {
  return <CreateWorkspace activeModule="VISUAL_STUDIO" leads={leads} lockedLead={lockedLead} />;
};
