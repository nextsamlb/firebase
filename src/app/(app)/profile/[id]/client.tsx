
'use client'

import { useState, useEffect, useCallback } from 'react'
import { getPlayers, type Player } from '@/lib/data'
import { notFound } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Mail,
  Calendar as CalendarIcon,
  Shield,
  Trophy,
  BarChart3,
  TrendingUp,
  User as UserIcon,
  Edit,
  Save,
  X,
  MapPin,
  Weight,
  Award,
  Target,
  FileText,
  Footprints,
  Cake,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { generatePlayerReport } from '@/app/actions'
import { updatePlayer as updatePlayerData } from '@/lib/data'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import Image from 'next/image'
import { useTranslation } from '@/context/language-provider'

export default function PlayerProfileClient({ playerId }: { playerId: string }) {
  const { user: authUser, updateUser: updateAuthUser } = useAuth()
  const { toast } = useToast()
  const { t, language } = useTranslation();
  const [player, setPlayer] = useState<Player | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Player>>({})
  const [aiReport, setAiReport] = useState<string>('')
  const [generatingReport, setGeneratingReport] = useState(false)

  const fetchPlayerData = useCallback(async () => {
    setLoading(true)
    const players = await getPlayers()
    const targetUser = players.find((u) => u.id === playerId)
    setPlayer(targetUser || null)
    if(targetUser) {
        setEditForm(targetUser)
    }
    setLoading(false)
  }, [playerId])

  useEffect(() => {
    fetchPlayerData()
  }, [fetchPlayerData])

  const handleSave = async () => {
    if (!player || !editForm) return;

    const playerToUpdate = { ...player, ...editForm } as Player;
    
    try {
        const result = await updatePlayerData(playerToUpdate);
        setPlayer(result);
        setIsEditing(false);
        toast({ title: 'Success', description: 'Player profile updated successfully.' });

        // If the authenticated user updated their own profile, update the auth context
        if (authUser?.id === result.id) {
            updateAuthUser(result);
        }
    } catch(error) {
        toast({ variant: 'destructive', title: 'Error', description: 'An unexpected error occurred.' });
    }
}

  const generateAIReport = async () => {
    if (!player) return
    setGeneratingReport(true)
    try {
      const report = await generatePlayerReport({
        name: player.name,
        nickname: player.nickname,
        matchesPlayed: player.stats.played,
        wins: player.stats.wins,
        goals: player.stats.goalsFor,
        assists: player.stats.assists,
        winRate: ((player.stats.wins / (player.stats.played || 1)) * 100).toFixed(1) + '%',
        language: language,
      })
      if ('error' in report) {
        toast({
          variant: 'destructive',
          title: 'Error Generating Report',
          description: report.error,
        })
        setAiReport('Failed to generate AI report.')
      } else {
        setAiReport(report.report)
      }
    } catch (error) {
      console.error('Failed to generate AI report:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred while generating the report.',
      })
      setAiReport('Failed to generate AI report.')
    } finally {
      setGeneratingReport(false)
    }
  }

  if (loading) {
    return (
        <div className="flex items-center justify-center p-4">
          <div className="text-center glass p-8 rounded-2xl">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
            <p className="text-white text-xl font-semibold">Loading Player Profile...</p>
          </div>
        </div>
    )
  }

  if (!player) {
    return (
        <div className="flex items-center justify-center p-4">
          <Card className="glass border-destructive/20 max-w-md">
            <CardContent className="p-8 text-center">
              <UserIcon className="w-16 h-16 text-destructive mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Player Not Found</h2>
              <p className="text-white/70">The requested player profile could not be found.</p>
            </CardContent>
          </Card>
        </div>
    )
  }

  const getInitials = (name: string) => {
    const names = name.split(' ')
    const initials = names.map((n) => n[0]).join('')
    return initials.toUpperCase()
  }

  const canEdit = authUser?.role === 'admin' || authUser?.id === player.id

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="max-w-6xl mx-auto">
          <Card className="glass border-primary/20">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="relative">
                  <Avatar className="w-32 h-32 border-4 border-primary">
                    <AvatarImage src={player.avatar || "/placeholder.svg"} alt={player.nickname} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">
                      {getInitials(player.name)}
                    </AvatarFallback>
                  </Avatar>
                  <Badge
                    className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-green-500`}
                  >
                    Active
                  </Badge>
                </div>

                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-4xl font-bold text-white mb-2">
                    {player.name}
                  </h1>
                  <p className="text-2xl text-primary mb-2">"{player.nickname}"</p>
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
                    <Badge variant="outline" className="border-primary text-primary">
                      {player.position || 'Player'}
                    </Badge>
                     <Badge variant="outline" className="border-primary text-primary">
                      {player.nationality || 'Earth'}
                    </Badge>
                  </div>
                </div>

                {canEdit && (
                  <div className="flex gap-2">
                    <Button onClick={() => setIsEditing(true)} className="bg-primary hover:bg-primary/80">
                      <Edit className="w-4 h-4 me-2" />
                      {t('editProfile')}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4 glass">
              <TabsTrigger
                value="overview"
              >
                {t('overview')}
              </TabsTrigger>
              <TabsTrigger
                value="stats"
              >
                {t('statistics')}
              </TabsTrigger>
              <TabsTrigger
                value="achievements"
              >
                {t('achievements')}
              </TabsTrigger>
              <TabsTrigger
                value="ai-report"
              >
                {t('aiReport')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-4">
               <Card className="glass border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      Bio
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-white/80 italic">{player.bio || 'No biography available.'}</p>
                  </CardContent>
                </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="glass border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <UserIcon className="w-5 h-5 text-primary" />
                      {t('personalInfo')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-primary" />
                      <span className="text-white/70">{t('email')}:</span>
                      <span className="text-white">{player.email}</span>
                    </div>
                     <div className="flex items-center gap-2">
                      <Cake className="w-4 h-4 text-primary" />
                      <span className="text-white/70">{t('born')}:</span>
                      <span className="text-white">{new Date(player.dateOfBirth || Date.now()).toLocaleDateString()}</span>
                    </div>
                     <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-primary" />
                      <span className="text-white/70">{t('joined')}:</span>
                      <span className="text-white">{new Date(player.registrationDate || Date.now()).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="glass border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      {t('physical')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-white/70">{t('height')}:</span>
                      <span className="text-white font-bold">{player.height || 'N/A'} cm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">{t('weight')}:</span>
                      <span className="text-white font-bold">{player.weight || 'N/A'} kg</span>
                    </div>
                     <div className="flex justify-between">
                      <span className="text-white/70">{t('preferredFoot')}:</span>
                      <span className="text-white font-bold">{player.preferredFoot || 'N/A'}</span>
                    </div>
                  </CardContent>
                </Card>


                <Card className="glass border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Target className="w-5 h-5 text-primary" />
                      {t('performance')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-white/70">{t('goalsPerMatch')}:</span>
                      <span className="text-white font-bold">
                        {(player.stats.goalsFor / (player.stats.played || 1)).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">{t('winRate')}:</span>
                      <span className="text-white font-bold">
                        {((player.stats.wins / (player.stats.played || 1)) * 100).toFixed(1)}%
                      </span>
                    </div>
                     <div className="flex justify-between">
                      <span className="text-white/70">{t('bestPlayerVotes')}:</span>
                      <span className="text-white font-bold">{player.bestPlayerVotes}</span>
                    </div>
                     <div className="flex justify-between">
                      <span className="text-white/70">{t('worstPlayerVotes')}:</span>
                      <span className="text-white font-bold">{player.worstPlayerVotes}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="stats" className="space-y-6 mt-4">
              <Card className="glass border-primary/20">
                <CardHeader>
                  <CardTitle className="text-white">{t('detailedStatistics')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary mb-2">{player.stats.played}</div>
                      <div className="text-white/70">{t('matchesPlayed')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-400 mb-2">{player.stats.wins}</div>
                      <div className="text-white/70">{t('wins')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-yellow-400 mb-2">{player.stats.draws}</div>
                      <div className="text-white/70">{t('draws')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-red-400 mb-2">{player.stats.losses}</div>
                      <div className="text-white/70">{t('losses')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-400 mb-2">{player.stats.goalsFor}</div>
                      <div className="text-white/70">{t('goalsFor')}</div>
                    </div>
                     <div className="text-center">
                      <div className="text-3xl font-bold text-purple-400 mb-2">{player.stats.goalsAgainst}</div>
                      <div className="text-white/70">{t('goalsAgainst')}</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${player.stats.goalDifference > 0 ? 'text-green-400' : 'text-red-400'} mb-2`}>{player.stats.goalDifference}</div>
                      <div className="text-white/70">{t('goalDifference')}</div>
                    </div>
                     <div className="text-center">
                      <div className="text-3xl font-bold text-primary mb-2">{player.stats.points}</div>
                      <div className="text-white/70">{t('points')}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="achievements" className="space-y-6 mt-4">
              <Card className="glass border-primary/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary" />
                    {t('achievementsAndAwards')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Placeholder for achievements */}
                     <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                        <Trophy className="w-6 h-6 text-primary" />
                        <span className="text-white">{t('season1TopScorer')}</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                        <Trophy className="w-6 h-6 text-primary" />
                        <span className="text-white">{t('playerOfTheMonth')}</span>
                      </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ai-report" className="space-y-6 mt-4">
              <Card className="glass border-primary/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    {t('aiPerformanceAnalysis')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {aiReport ? (
                    <div className="prose prose-sm prose-invert max-w-none text-white whitespace-pre-wrap rounded-md bg-muted/50 p-4">
                      {aiReport}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <TrendingUp className="w-16 h-16 text-primary/50 mx-auto mb-4" />
                      <p className="text-white/70 mb-4">{t('noAiReport')}</p>
                      <Button
                        onClick={generateAIReport}
                        disabled={generatingReport}
                        className="bg-primary hover:bg-primary/80"
                      >
                        {generatingReport ? t('generatingReport') : t('generateAiReport')}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('editProfile')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">{t('fullName')}</Label>
                  <Input
                    id="name"
                    value={editForm.name || ""}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>
                 <div>
                  <Label htmlFor="nickname">{t('nickname')}</Label>
                  <Input
                    id="nickname"
                    value={editForm.nickname || ""}
                    onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })}
                  />
                </div>
              </div>

               <div className="grid grid-cols-2 gap-4">
                 <div>
                  <Label htmlFor="email">{t('email')}</Label>
                  <Input
                    id="email"
                    value={editForm.email || ""}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  />
                </div>
                 <div>
                  <Label htmlFor="avatar">{t('avatarUrl')}</Label>
                  <Input
                    id="avatar"
                    value={editForm.avatar || ""}
                    onChange={(e) => setEditForm({ ...editForm, avatar: e.target.value })}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                    id="bio"
                    value={editForm.bio || ""}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                />
              </div>

               <div className="grid grid-cols-2 gap-4">
                 <div>
                  <Label htmlFor="position">{t('position')}</Label>
                  <Input
                    id="position"
                    value={editForm.position || ""}
                    onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                  />
                </div>
                 <div>
                  <Label htmlFor="nationality">{t('nationality')}</Label>
                  <Input
                    id="nationality"
                    value={editForm.nationality || ""}
                    onChange={(e) => setEditForm({ ...editForm, nationality: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button onClick={handleSave} className="flex-1">
                  <Save className="w-4 h-4 me-2" />
                  {t('saveChanges')}
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                  <X className="w-4 h-4 me-2" />
                  {t('cancel')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
  )
}
