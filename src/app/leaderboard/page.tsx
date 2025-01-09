'use client';
import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { ArrowUpIcon, ArrowDownIcon, Users, Shield, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface Influencer {
  id: string;
  canonical_name: string;
  trust_score: number | null;
  follower_count: number | null;
  verified_claims_count: number | null;
  trend: 'up' | 'down';
}

interface Stats {
  totalInfluencers: number;
  totalVerifiedClaims: number;
  averageTrustScore: number;
}

interface LeaderboardResponse {
  stats: Stats;
  influencers: Influencer[];
}

export default function LeaderboardPage() {
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalInfluencers: 0,
    totalVerifiedClaims: 0,
    averageTrustScore: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/leaderboard');
        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard data');
        }
        
        const data: LeaderboardResponse = await response.json();
        setInfluencers(data.influencers);
        setStats(data.stats);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        setError('Failed to load leaderboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const formatNumber = (num: number | null) => {
    if (num === null || isNaN(num)) return 'Unknown';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M+`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K+`;
    return num.toString();
  };

  const formatPercentage = (num: number | null) => {
    if (num === null || isNaN(num)) return 'Unknown';
    return `${num.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading leaderboard data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500 text-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Influencer Trust Leaderboard</h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Real-time rankings of health influencers based on scientific accuracy, credibility, and transparency. 
          Updated daily using AI-powered analysis.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card className="bg-white dark:bg-card shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2 text-muted-foreground">
              <Users className="h-5 w-5" />
              <p className="font-medium">Active Influencers</p>
            </div>
            <h3 className="text-3xl font-bold mt-2 text-center">{formatNumber(stats.totalInfluencers)}</h3>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-card shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2 text-muted-foreground">
              <Shield className="h-5 w-5" />
              <p className="font-medium">Claims Verified</p>
            </div>
            <h3 className="text-3xl font-bold mt-2 text-center">{formatNumber(stats.totalVerifiedClaims)}</h3>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-card shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2 text-muted-foreground">
              <TrendingUp className="h-5 w-5" />
              <p className="font-medium">Average Trust Score</p>
            </div>
            <h3 className="text-3xl font-bold mt-2 text-center">{formatPercentage(stats.averageTrustScore)}</h3>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white dark:bg-card rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-muted">
                <TableHead className="w-[80px] font-semibold">Rank</TableHead>
                <TableHead className="font-semibold">Influencer</TableHead>
                <TableHead className="text-right font-semibold">Trust Score</TableHead>
                <TableHead className="text-center w-[100px] font-semibold">Trend</TableHead>
                <TableHead className="text-right font-semibold">Followers</TableHead>
                <TableHead className="text-right font-semibold">Verified Claims</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {influencers.map((influencer, index) => (
                <TableRow key={influencer.id} className="hover:bg-gray-50 dark:hover:bg-muted">
                  <TableCell className="font-medium">#{index + 1}</TableCell>
                  <TableCell className="font-medium">
                      <Link href={`/influencer/${influencer.id}`} className="text-blue-400 dark:text-blue-300 hover:underline">
                      {influencer.canonical_name || 'Unknown'}
                      </Link>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatPercentage(influencer.trust_score)}
                  </TableCell>
                  <TableCell className="text-center">
                    {influencer.trend === 'up' ? (
                      <ArrowUpIcon className="inline h-5 w-5 text-green-500" />
                    ) : (
                      <ArrowDownIcon className="inline h-5 w-5 text-red-500" />
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(influencer.follower_count)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(influencer.verified_claims_count)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
