'use client';

import { useEffect, useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Twitter, 
  Instagram, 
  Youtube, 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  HelpCircle, 
  XCircle,
  Calendar
} from 'lucide-react';
import { Claim, Influencer } from '@/types';
import { useParams } from 'next/navigation';

interface InfluencerDetail extends Influencer {
  claims: Claim[];
}

export default function InfluencerDetailPage() {
  const params = useParams();
  const [influencer, setInfluencer] = useState<InfluencerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInfluencerDetails = async () => {
      if (!params.id) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/influencers/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch influencer details');
        }
        const data = await response.json();
        setInfluencer(data.influencer);
      } catch (error) {
        console.error('Error:', error);
        setError('Failed to load influencer details');
      } finally {
        setLoading(false);
      }
    };

    fetchInfluencerDetails();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <p className="text-lg">Loading influencer details...</p>
      </div>
    );
  }

  if (error || !influencer) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <p className="text-lg text-red-500">{error || 'Influencer not found'}</p>
      </div>
    );
  }

  const formatNumber = (num: number | null) => {
    if (num === null) return 'Unknown';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getClaimStatusColor = (status: Claim['status']) => {
    switch (status) {
      case 'Verified': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'Questionable': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      case 'Debunked': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="container p-8 dark:bg-background">
      {/* Header Section */}
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{influencer.canonical_name}</h1>
          <div className="flex flex-wrap gap-2 mt-2">
            {influencer.categories.map((category) => (
              <Badge key={category} variant="secondary">{category}</Badge>
            ))}
          </div>
        </div>

        {/* Credentials and Social Links */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Credentials</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-4 space-y-1">
                {influencer.credentials.map((credential, index) => (
                  <li key={index}>{credential}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Social Media</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {influencer.platform_handles.twitter && (
                  <div className="flex items-center space-x-2">
                    <Twitter className="h-5 w-5" />
                    <span>{influencer.platform_handles.twitter}</span>
                  </div>
                )}
                {influencer.platform_handles.instagram && (
                  <div className="flex items-center space-x-2">
                    <Instagram className="h-5 w-5" />
                    <span>{influencer.platform_handles.instagram}</span>
                  </div>
                )}
                {influencer.platform_handles.youtube && (
                  <div className="flex items-center space-x-2">
                    <Youtube className="h-5 w-5" />
                    <span>{influencer.platform_handles.youtube}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Trust Score</p>
                  <p className="text-2xl font-bold">{influencer.trust_score}%</p>
                </div>
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Followers</p>
                  <p className="text-2xl font-bold">{formatNumber(influencer.follower_count)}</p>
                </div>
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Claims Analyzed</p>
                  <p className="text-2xl font-bold">
                    {influencer.verified_claims_count + 
                     influencer.questionable_claims_count + 
                     influencer.debunked_claims_count}
                  </p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Last Analyzed</p>
                  <p className="text-2xl font-bold">
                    {new Date(influencer.last_analyzed || '').toLocaleDateString()}
                  </p>
                </div>
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Claims Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Claims Analysis</h2>
          
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All Claims</TabsTrigger>
              <TabsTrigger value="verified">Verified</TabsTrigger>
              <TabsTrigger value="questionable">Questionable</TabsTrigger>
              <TabsTrigger value="debunked">Debunked</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {influencer.claims.map((claim) => (
                <Card key={claim.id} className="overflow-hidden">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getClaimStatusColor(claim.status)}`}>
                              {claim.status || 'Pending'}
                            </span>
                            {claim.category && (
                              <Badge variant="outline">{claim.category}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Source: {claim.source_platform} • {new Date(claim.created_at || '').toLocaleDateString()}
                          </p>
                        </div>
                        <span className="text-sm font-medium">
                          Confidence: {claim.confidence_score}%
                        </span>
                      </div>

                      <p className="text-sm">{claim.claim_text}</p>

                      {claim.source_content && (
                        <>
                          <Separator />
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Original Content:</p>
                            <p className="text-sm text-muted-foreground">{claim.source_content}</p>
                          </div>
                        </>
                      )}

                      {claim.scientific_evidence && (
                        <>
                          <Separator />
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Scientific Evidence:</p>
                            <div className="grid gap-2 text-sm">
                              {claim.scientific_evidence.journals_supporting.length > 0 && (
                                <div className="flex items-center space-x-2">
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  <span>Supporting: {claim.scientific_evidence.journals_supporting.join(', ')}</span>
                                </div>
                              )}
                              {claim.scientific_evidence.journals_questioning.length > 0 && (
                                <div className="flex items-center space-x-2">
                                  <HelpCircle className="h-4 w-4 text-yellow-500" />
                                  <span>Questioning: {claim.scientific_evidence.journals_questioning.join(', ')}</span>
                                </div>
                              )}
                              {claim.scientific_evidence.journals_contradicting.length > 0 && (
                                <div className="flex items-center space-x-2">
                                  <XCircle className="h-4 w-4 text-red-500" />
                                  <span>Contradicting: {claim.scientific_evidence.journals_contradicting.join(', ')}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="verified" className="space-y-4">
              {influencer.claims.filter(claim => claim.status === 'Verified').map((claim) => (
                <Card key={claim.id} className="overflow-hidden">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getClaimStatusColor(claim.status)}`}>
                              {claim.status || 'Pending'}
                            </span>
                            {claim.category && (
                              <Badge variant="outline">{claim.category}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Source: {claim.source_platform} • {new Date(claim.created_at || '').toLocaleDateString()}
                          </p>
                        </div>
                        <span className="text-sm font-medium">
                          Confidence: {claim.confidence_score}%
                        </span>
                      </div>

                      <p className="text-sm">{claim.claim_text}</p>

                      {claim.source_content && (
                        <>
                          <Separator />
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Original Content:</p>
                            <p className="text-sm text-muted-foreground">{claim.source_content}</p>
                          </div>
                        </>
                      )}

                      {claim.scientific_evidence && (
                        <>
                          <Separator />
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Scientific Evidence:</p>
                            <div className="grid gap-2 text-sm">
                              {claim.scientific_evidence.journals_supporting.length > 0 && (
                                <div className="flex items-center space-x-2">
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  <span>Supporting: {claim.scientific_evidence.journals_supporting.join(', ')}</span>
                                </div>
                              )}
                              {claim.scientific_evidence.journals_questioning.length > 0 && (
                                <div className="flex items-center space-x-2">
                                  <HelpCircle className="h-4 w-4 text-yellow-500" />
                                  <span>Questioning: {claim.scientific_evidence.journals_questioning.join(', ')}</span>
                                </div>
                              )}
                              {claim.scientific_evidence.journals_contradicting.length > 0 && (
                                <div className="flex items-center space-x-2">
                                  <XCircle className="h-4 w-4 text-red-500" />
                                  <span>Contradicting: {claim.scientific_evidence.journals_contradicting.join(', ')}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="questionable" className="space-y-4">
              {influencer.claims.filter(claim => claim.status === 'Questionable').map((claim) => (
                <Card key={claim.id} className="overflow-hidden">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getClaimStatusColor(claim.status)}`}>
                              {claim.status || 'Pending'}
                            </span>
                            {claim.category && (
                              <Badge variant="outline">{claim.category}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Source: {claim.source_platform} • {new Date(claim.created_at || '').toLocaleDateString()}
                          </p>
                        </div>
                        <span className="text-sm font-medium">
                          Confidence: {claim.confidence_score}%
                        </span>
                      </div>

                      <p className="text-sm">{claim.claim_text}</p>

                      {claim.source_content && (
                        <>
                          <Separator />
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Original Content:</p>
                            <p className="text-sm text-muted-foreground">{claim.source_content}</p>
                          </div>
                        </>
                      )}

                      {claim.scientific_evidence && (
                        <>
                          <Separator />
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Scientific Evidence:</p>
                            <div className="grid gap-2 text-sm">
                              {claim.scientific_evidence.journals_supporting.length > 0 && (
                                <div className="flex items-center space-x-2">
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  <span>Supporting: {claim.scientific_evidence.journals_supporting.join(', ')}</span>
                                </div>
                              )}
                              {claim.scientific_evidence.journals_questioning.length > 0 && (
                                <div className="flex items-center space-x-2">
                                  <HelpCircle className="h-4 w-4 text-yellow-500" />
                                  <span>Questioning: {claim.scientific_evidence.journals_questioning.join(', ')}</span>
                                </div>
                              )}
                              {claim.scientific_evidence.journals_contradicting.length > 0 && (
                                <div className="flex items-center space-x-2">
                                  <XCircle className="h-4 w-4 text-red-500" />
                                  <span>Contradicting: {claim.scientific_evidence.journals_contradicting.join(', ')}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="debunked" className="space-y-4">
              {influencer.claims.filter(claim => claim.status === 'Debunked').map((claim) => (
                <Card key={claim.id} className="overflow-hidden">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getClaimStatusColor(claim.status)}`}>
                              {claim.status || 'Pending'}
                            </span>
                            {claim.category && (
                              <Badge variant="outline">{claim.category}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Source: {claim.source_platform} • {new Date(claim.created_at || '').toLocaleDateString()}
                          </p>
                        </div>
                        <span className="text-sm font-medium">
                          Confidence: {claim.confidence_score}%
                        </span>
                      </div>

                      <p className="text-sm">{claim.claim_text}</p>

                      {claim.source_content && (
                        <>
                          <Separator />
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Original Content:</p>
                            <p className="text-sm text-muted-foreground">{claim.source_content}</p>
                          </div>
                        </>
                      )}

                      {claim.scientific_evidence && (
                        <>
                          <Separator />
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Scientific Evidence:</p>
                            <div className="grid gap-2 text-sm">
                              {claim.scientific_evidence.journals_supporting.length > 0 && (
                                <div className="flex items-center space-x-2">
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  <span>Supporting: {claim.scientific_evidence.journals_supporting.join(', ')}</span>
                                </div>
                              )}
                              {claim.scientific_evidence.journals_questioning.length > 0 && (
                                <div className="flex items-center space-x-2">
                                  <HelpCircle className="h-4 w-4 text-yellow-500" />
                                  <span>Questioning: {claim.scientific_evidence.journals_questioning.join(', ')}</span>
                                </div>
                              )}
                              {claim.scientific_evidence.journals_contradicting.length > 0 && (
                                <div className="flex items-center space-x-2">
                                  <XCircle className="h-4 w-4 text-red-500" />
                                  <span>Contradicting: {claim.scientific_evidence.journals_contradicting.join(', ')}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
