'use client';

import { useState } from 'react';
import { InfluencerProfile } from '@/components/custom/InfluencerProfile';
import { InfluencerVerify } from '@/components/custom/InfluencerVerify';
import type { ResearchConfig, VerificationResult } from '@/types';

export default function Home() {
  const [result, setResult] = useState<VerificationResult | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleSearch = async (influencerName: string) => {
    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ influencerName }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setResult(data);
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  };

  const handleStartAnalysis = async (config: ResearchConfig) => {
    setIsAnalyzing(true);
    try {
      // Call your analysis API endpoint here
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          influencerName: result?.canonicalName,
          ...config,
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      // Handle successful analysis start
      // Maybe redirect to a results page or show a success message
    } catch (error) {
      console.error('Error:', error);
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <main className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold mb-6">
        Health Claims Verification Platform
      </h1>

      {!result && <InfluencerVerify onSearch={handleSearch} />}

      {result && (
        <InfluencerProfile
          result={result}
          onStartAnalysis={handleStartAnalysis}
        />
      )}
    </main>
  );
}
