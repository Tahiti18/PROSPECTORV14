
import React from 'react';
import { GenericIntelNode } from './GenericIntelNode';
import { Lead } from '../../types';

interface ROICalcProps {
  leads: Lead[];
}

export const ROICalc: React.FC<ROICalcProps> = ({ leads }) => {
  return <GenericIntelNode module="ROI_CALC" leads={leads} />;
};
