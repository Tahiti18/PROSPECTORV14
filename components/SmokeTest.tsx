
import React, { useEffect, useState, useRef } from 'react';
import { orchestratePhase1BusinessPackage } from '../services/orchestratorPhase1';
import { Lead } from '../types';

export const SmokeTest: React.FC = () => {
  const [report, setReport] = useState<any>(null);
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const run = async () => {
      const testLead: Lead = {
        id: 'smoke-test-lead',
        businessName: "Reflections MedSpa (Smoke Test)",
        websiteUrl: "https://example.com",
        city: "Houston, TX",
        niche: "MedSpa",
        rank: 1,
        phone: "555-0123",
        email: "test@example.com",
        leadScore: 85,
        assetGrade: "A",
        socialGap: "Test Gap",
        visualProof: "Test Visuals",
        bestAngle: "Test Angle",
        personalizedHook: "Test Hook",
        status: "cold",
        outreachStatus: "cold"
      };

      console.log("SMOKE TEST: STARTING PHASE 1 ORCHESTRATION...");
      try {
        const result = await orchestratePhase1BusinessPackage(testLead);
        
        // Log Summary for Railway/Console visibility
        console.log("SMOKE TEST REPORT:");
        console.log(`STATUS: ${result.status}`);
        console.log(`RUN ID: ${result.runId}`);
        console.log(`ASSETS GENERATED: ${result.assets.length}`);
        console.log(`STEPS EXECUTED: ${result.timeline.length}`);
        console.log(`FAILED STEPS: ${result.timeline.filter((s: any) => s.status === 'FAILED').length}`);
        
        setReport(result);
      } catch (e: any) {
        console.error("SMOKE TEST: CRITICAL FAILURE", e);
        setReport({ status: 'FAILED', error: e.message });
      }
    };

    run();
  }, []);

  if (!report) {
    return (
      <div className="fixed inset-0 bg-black text-green-500 font-mono p-10 overflow-auto">
        <h1 className="text-xl font-bold mb-4">PHASE 1 SMOKE TEST INITIALIZING...</h1>
        <p className="animate-pulse">Executing Orchestration Logic...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black text-green-500 font-mono p-10 overflow-auto">
      <h1 className="text-xl font-bold mb-4">PHASE 1 SMOKE TEST REPORT</h1>
      <div className="mb-4 border-b border-green-900 pb-4">
        <div>STATUS: <span className={report.status === 'SUCCESS' ? 'text-green-400' : 'text-red-500'}>{report.status}</span></div>
        <div>RUN ID: {report.runId}</div>
        <div>ASSETS: {report.assets?.length || 0}</div>
      </div>
      <pre className="text-xs whitespace-pre-wrap">
        {JSON.stringify(report, null, 2)}
      </pre>
    </div>
  );
};
