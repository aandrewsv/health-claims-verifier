import React, { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ResearchConfig, VerificationResult } from '@/types';
import { CheckCircle, Info, Link2, Loader2, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';


interface InfluencerProfileProps {
  result: VerificationResult;
  onStartAnalysis: (config: ResearchConfig) => Promise<void>;
}

const CLAIMS_LIMITS = [{ value: '25', label: '25 claims' }];

const JOURNALS = [
  { value: 'pubmed', label: 'PubMed Central' },
  { value: 'nejm', label: 'New England Journal of Medicine' },
  { value: 'lancet', label: 'The Lancet' },
  { value: 'nature', label: 'Nature' },
  {
    value: 'jama',
    label: 'JAMA (Journal of the American Medical Association)',
  },
  { value: 'bmj', label: 'The BMJ (British Medical Journal)' },
  { value: 'science', label: 'Science' },
];

const DATE_RANGES = [
  { value: 'month', label: 'Last Month' },
  { value: 'week', label: 'Last Week' },
  { value: 'day', label: 'Last Day' },
  { value: 'hour', label: 'Last Hour' },
] as const;

type DateRange = (typeof DATE_RANGES)[number]['value'];

export function InfluencerProfile({
  result,
  onStartAnalysis,
}: InfluencerProfileProps) {
  const [dateRange, setDateRange] = useState<DateRange>('month');
  const [claimsLimit, setClaimsLimit] = useState('25');
  const [selectedJournals, setSelectedJournals] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();
  const handleDateRangeChange = (value: string) => {
    setDateRange(value as DateRange);
  };

  const handleAnalysis = async () => {
    if (selectedJournals.length === 0) {
      setError('Please select at least one journal');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await onStartAnalysis({
        recencyFilter: dateRange,
        claimsLimit,
        selectedJournals,
      });
      // Redirect to the leaderboard page
      router.push('/leaderboard');
    } catch (err) {
      console.error(err);
      setError('Failed to start analysis');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Influencer Profile Card */}
      <Card>
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{result.canonicalName}</CardTitle>
              <div className="text-sm text-muted-foreground mt-1">
                {result.knownAliases.join(', ')}
              </div>
            </div>
            <Badge className="ml-2" variant="secondary">
              <CheckCircle className="w-4 h-4 mr-1" />
              {result.confidence}% Confidence
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Credentials and Categories */}
          <div className="flex flex-wrap gap-2">
            {result.credentials.map((credential, index) => (
              <Badge key={index} variant="outline">
                {credential}
              </Badge>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {result.categories.map((category, index) => (
              <Badge key={index} variant="secondary">
                {category}
              </Badge>
            ))}
          </div>

          {/* Social Stats */}
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              {result.approximateFollowers
                ? result.approximateFollowers.toLocaleString()
                : 'Unknown'}{' '}
              followers
            </div>
            <div className="flex gap-2">
              {Object.entries(result.platformHandles).map(
                ([platform, handle]) =>
                  handle && (
                    <Badge
                      key={platform}
                      variant="outline"
                      className="flex items-center"
                    >
                      {/* {platform === 'twitter' && <Twitter className="w-3 h-3 mr-1" />}
                    {platform === 'instagram' && <Instagram className="w-3 h-3 mr-1" />}
                    {platform === 'youtube' && <Youtube className="w-3 h-3 mr-1" />} */}
                      <Link2 className="w-3 h-3 mr-1" />
                      {platform}: {handle}
                    </Badge>
                  )
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Research Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle>Configure Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date Range */}
          {/* Date Range Selection */}
          <div className="grid gap-2">
            <label className="text-sm font-medium">Time Period</label>
            <Select value={dateRange} onValueChange={handleDateRangeChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATE_RANGES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Claims Limit */}
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">
                Limit of Claims to Analyze
              </label>
              <HoverCard>
                <HoverCardTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </HoverCardTrigger>
                <HoverCardContent>
                  <p className="text-sm">
                    Limited to 25 claims to avoid expensive token usage. The
                    system uses batch processing behind the scenes to handle
                    larger sets of claims.
                  </p>
                </HoverCardContent>
              </HoverCard>
            </div>
            <Select value={claimsLimit} onValueChange={setClaimsLimit}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CLAIMS_LIMITS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Journals */}
          <div className="grid gap-2">
            <label className="text-sm font-medium">Select Journals</label>
            <div className="flex flex-wrap gap-2">
              {JOURNALS.map((journal) => (
                <Badge
                  key={journal.value}
                  variant={
                    selectedJournals.includes(journal.value)
                      ? 'default'
                      : 'outline'
                  }
                  className="cursor-pointer"
                  onClick={() => {
                    if (selectedJournals.includes(journal.value)) {
                      setSelectedJournals(
                        selectedJournals.filter((j) => j !== journal.value)
                      );
                    } else {
                      setSelectedJournals([...selectedJournals, journal.value]);
                    }
                  }}
                >
                  {journal.label}
                </Badge>
              ))}
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            className="w-full"
            onClick={handleAnalysis}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting Analysis...
              </>
            ) : (
              'Start Analysis'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
