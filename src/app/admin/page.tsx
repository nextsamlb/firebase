

'use client'

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import {
  Users,
  UserPlus,
  Shield,
  Activity,
  Database,
  Settings,
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Search,
  Cpu,
  HardDrive,
  MemoryStick,
  Server,
  Trophy,
  Crown,
  PlayCircle,
  BarChart3,
  Calendar,
  Zap,
  Loader2,
  Plus,
  Megaphone,
  ArrowUpDown,
  Pencil
} from "lucide-react"
import { useAuth } from '@/hooks/use-auth'
import { 
    getPlayers, Player, getMatches, Match, deletePlayer as deletePlayerData, 
    addPlayer as addPlayerData, updatePlayer as updatePlayerData, addMatch, 
    updateMatch, deleteMatch as deleteMatchData, MediaItem, getMediaItems, 
    addMediaItem, deleteMediaItem, getLeagues, League, addLeague, updateLeague, deleteLeague
} from '@/lib/data'
import { generateStageMatches } from '@/app/actions/league-actions'
import { generateBullyingReport } from '@/app/actions'
import { generateNewsTicker } from '@/app/actions/league-actions'
import { EditUserForm } from '@/components/admin/edit-user-form'
import { EditMatchForm } from '@/components/admin/edit-match-form'
import { EditLeagueForm } from '@/components/admin/edit-league-form'
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Progress } from "@/components/ui/progress"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import Image from "next/image"
import { useTranslation } from "@/context/language-provider"
import { format } from "date-fns"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"


const auditLogs = [
  {
    id: 1,
    action: "User Login",
    user: "admin",
    timestamp: "2024-01-15T10:30:00Z",
    ip: "192.168.1.100",
    status: "success",
    details: "Successful admin login",
  },
  {
    id: 2,
    action: "User Created",
    user: "admin",
    timestamp: "2024-01-15T10:25:00Z",
    ip: "192.168.1.100",
    status: "success",
    details: "Created new player account for Johnny Striker",
  },
  {
    id: 3,
    action: "User Suspended",
    user: "admin",
    timestamp: "2024-01-15T10:20:00Z",
    ip: "192.168.1.100",
    status: "success",
    details: "Suspended user johnny for policy violation",
  },
]

type SortKey = 'matchNum' | 'timestamp';

const STAGES = ["Stage 1 (1v3)", "Stage 2 (1v2)", "Stage 3 (1v1)"]

export default function SuperAdminPanel() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { t, language } = useTranslation();

  const [players, setPlayers] = useState<Player[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [leagues, setLeagues] = useState<League[]>([]);
  const [logs] = useState(auditLogs)
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false)
  const [isMatchDialogOpen, setIsMatchDialogOpen] = useState(false)
  const [isLeagueDialogOpen, setIsLeagueDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{type: 'user' | 'match' | 'media' | 'league', data: Player | Match | MediaItem | League} | null>(null)
  const [selectedUser, setSelectedUser] = useState<Player | null>(null)
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  const [isCreating, setIsCreating] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [generatingMatches, setGeneratingMatches] = useState(false);
  const [generatingNews, setGeneratingNews] = useState(false);
  const [generatingBullyingReport, setGeneratingBullyingReport] = useState(false);
  const [isAddMediaOpen, setIsAddMediaOpen] = useState(false);
  const [newMediaItem, setNewMediaItem] = useState({ title: '', description: '', src: '', hint: '' });
  const [systemStats, setSystemStats] = useState({
    cpu: 0,
    memory: 0,
    disk: 0,
    uptime: "15 days, 6 hours",
    onlineUsers: 0,
    dbStatus: "healthy",
  })
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' } | null>({ key: 'matchNum', direction: 'ascending' });

  const sortedMatches = useMemo(() => {
    let sortableMatches = [...matches];
    if (sortConfig !== null) {
      sortableMatches.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableMatches;
  }, [matches, sortConfig]);

  const filteredPlayers = useMemo(() => players.filter(p => p.role === 'player').filter(
    (player) =>
      player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (player.nickname && player.nickname.toLowerCase().includes(searchTerm.toLowerCase())),
  ), [players, searchTerm]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
        const [allPlayers, allMatches, allMediaItems, allLeagues] = await Promise.all([
            getPlayers(), 
            getMatches(), 
            getMediaItems(),
            getLeagues()
        ])
        setPlayers(allPlayers)
        setMatches(allMatches)
        setMediaItems(allMediaItems);
        setLeagues(allLeagues);
    } catch(error){
        toast({ variant: "destructive", title: "Error", description: "Failed to load data."})
    } finally {
        setLoading(false)
    }
  },[toast])

  useEffect(() => {
    loadData()
  }, [loadData])
  
   useEffect(() => {
    const interval = setInterval(() => {
      setSystemStats((prev) => ({
        ...prev,
        cpu: Math.max(20, Math.min(90, prev.cpu + (Math.random() - 0.5) * 10)),
        memory: Math.max(30, Math.min(95, prev.memory + (Math.random() - 0.5) * 8)),
        disk: Math.max(10, Math.min(80, prev.disk + (Math.random() - 0.5) * 5)),
        onlineUsers: Math.max(50, Math.min(200, prev.onlineUsers + Math.floor((Math.random() - 0.5) * 20))),
      }))
    }, 5000)

    return () => clearInterval(interval)
  }, [])
  
  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">Administrator privileges required</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center">
        <div className="relative z-10 flex items-center justify-center">
          <div className="text-center glass p-8 rounded-2xl">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
            <p className="text-white text-xl font-semibold">Loading Admin Panel...</p>
          </div>
        </div>
      </div>
    )
  }


  const handleCreate = (type: 'user' | 'match' | 'league') => {
      setIsCreating(true)
      if (type === 'user') {
        setSelectedUser(null)
        setIsUserDialogOpen(true)
      } else if (type === 'match'){
        setSelectedMatch(null)
        setIsMatchDialogOpen(true)
      } else if (type === 'league') {
        setSelectedLeague(null)
        setIsLeagueDialogOpen(true);
      }
  }

  const confirmDelete = async () => {
    if (!itemToDelete) return

    try {
      if (itemToDelete.type === 'user') {
        await deletePlayerData(itemToDelete.data.id)
        setPlayers(players.filter((u) => u.id !== itemToDelete.data.id))
        toast({ title: 'User Deleted', description: `User has been deleted.` })
      } else if (itemToDelete.type === 'match') {
        await deleteMatchData(itemToDelete.data.id)
        setMatches(matches.filter((m) => m.id !== itemToDelete.data.id))
        toast({ title: 'Match Deleted', description: `Match has been deleted.` })
      } else if (itemToDelete.type === 'media') {
          await deleteMediaItem(itemToDelete.data.id);
          setMediaItems(mediaItems.filter(item => item.id !== itemToDelete.data.id));
          toast({ title: 'Media Item Deleted', description: 'The media item has been removed.' });
      } else if (itemToDelete.type === 'league') {
          await deleteLeague(itemToDelete.data.id);
          setLeagues(leagues.filter(l => l.id !== itemToDelete.data.id));
          toast({ title: 'League Deleted', description: 'The league has been removed.' });
      }
    } catch (error) {
       toast({ variant: 'destructive', title: 'Error', description: `Failed to delete ${itemToDelete.type}.`})
    }

    setIsDeleteDialogOpen(false)
    setItemToDelete(null)
  }


  const handleEditUser = (userToEdit: Player) => {
    setSelectedUser(userToEdit)
    setIsCreating(false)
    setIsUserDialogOpen(true)
  }

  const handleEditMatch = (matchToEdit: Match) => {
    setSelectedMatch(matchToEdit)
    setIsCreating(false)
    setIsMatchDialogOpen(true)
  }

  const handleEditLeague = (leagueToEdit: League) => {
    setSelectedLeague(leagueToEdit);
    setIsCreating(false);
    setIsLeagueDialogOpen(true);
  }

  const handleDelete = (type: 'user' | 'match' | 'media' | 'league', data: Player | Match | MediaItem | League) => {
    setItemToDelete({ type, data })
    setIsDeleteDialogOpen(true)
  }

  const handleSaveUser = async (updatedUser: Omit<Player, 'id'> | Player, action?: {type: 'refund' | 'deduct', amount: number}) => {
    try {
      let userToSave = { ...(selectedUser || {}), ...updatedUser } as Player;

      if (action) {
        if (action.type === 'refund') {
          userToSave.balance += action.amount;
        } else {
          userToSave.balance -= action.amount;
        }
      }

      if (isCreating) {
        const result = await addPlayerData(userToSave);
        setPlayers([result, ...players]);
        toast({ title: 'User Created', description: `User ${result.name} has been created.` });
      } else {
        const result = await updatePlayerData(userToSave);
        setPlayers(players.map((u) => (u.id === result.id ? result : u)));
        if (action) {
           toast({ title: `Balance Updated`, description: `${result.name}'s balance has been updated.` });
        } else {
           toast({ title: 'User Updated', description: `User ${result.name} has been updated.` });
        }
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
    }
    setIsUserDialogOpen(false);
    setSelectedUser(null);
    setIsCreating(false);
  }
  
  const handleSaveMatch = async (updatedMatch: Match) => {
    try {
        if (isCreating) {
           const result = await addMatch(updatedMatch);
           setMatches([result, ...matches].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
           toast({ title: 'Match Created', description: `Match has been created.` })
        } else {
           const result = await updateMatch(updatedMatch);
            setMatches(matches.map((m) => (m.id === result.id ? result : m)));
            toast({ title: 'Match Updated', description: `Match has been updated.` })
        }
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: (error as Error).message })
    }
    setIsMatchDialogOpen(false)
    setSelectedMatch(null)
    setIsCreating(false)
  }

  const handleSaveLeague = async (leagueData: Omit<League, 'id'> | League) => {
    try {
        if (isCreating) {
            const newLeague = await addLeague(leagueData as Omit<League, 'id'>);
            setLeagues([...leagues, newLeague]);
            toast({ title: 'League Created', description: `League "${newLeague.name}" has been created.` });
        } else {
            const updated = await updateLeague(leagueData as League);
            setLeagues(leagues.map(l => l.id === updated.id ? updated : l));
            toast({ title: 'League Updated', description: `League "${updated.name}" has been updated.` });
        }
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
    }
    setIsLeagueDialogOpen(false);
    setSelectedLeague(null);
    setIsCreating(false);
  };

  const handleGenerateMatches = async (stageName: string) => {
    setGeneratingMatches(true);
    try {
      const result = await generateStageMatches({ stageName });
      if (result.error) {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
      } else {
        toast({ title: 'Success', description: `Successfully generated ${result.matchCount} matches for ${stageName}.` });
        loadData(); // Refresh data after generation
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'An unexpected error occurred.' });
    } finally {
      setGeneratingMatches(false);
    }
  };

  const handleGenerateNews = async () => {
    setGeneratingNews(true);
    try {
        const recentMatches = matches.filter(m => m.result).slice(0, 5);
        const topPlayers = [...players].sort((a,b) => b.stats.points - a.stats.points).slice(0,3);

        const result = await generateNewsTicker({ matches: recentMatches.map(m => ({ player1Id: m.player1Id, result: m.result })), players: topPlayers.map(p => ({ name: p.name, stats: { points: p.stats.points, goalsFor: p.stats.goalsFor }})), language });
        
        if ('error' in result) {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        } else {
            toast({ title: 'Success', description: `Generated ${result.news.length} news items in ${language}.` });
            // In a real app, you would probably want to refresh the app state
            // to show the new news items immediately.
        }
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to generate news ticker.' });
    } finally {
        setGeneratingNews(false);
    }
  }

  const handleGenerateBullyingReport = async () => {
    setGeneratingBullyingReport(true);
    try {
        const playersWithVotes = players.filter(p => p.role === 'player' && p.worstPlayerVotes > 0).map(p => ({
            playerName: p.name,
            worstPlayerVotes: p.worstPlayerVotes,
        }));
        
        if (playersWithVotes.length === 0) {
            toast({ variant: 'default', title: 'No Data', description: 'No players have received "worst player" votes yet.' });
            return;
        }

        const result = await generateBullyingReport({ players: playersWithVotes, language });

        if ('error' in result) {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        } else {
            toast({ title: 'Report Generated', description: `A community conduct report concerning ${result.report?.playerInFocus} has been added to the news ticker.` });
        }
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to generate bullying report.' });
    } finally {
        setGeneratingBullyingReport(false);
    }
  }

  const handleAddMedia = async () => {
    if (!newMediaItem.src || !newMediaItem.title) {
        toast({ variant: 'destructive', title: 'Error', description: 'Source URL and Title are required.' });
        return;
    }
    try {
        const addedItem = await addMediaItem(newMediaItem);
        setMediaItems([...mediaItems, addedItem]);
        toast({ title: 'Media Added', description: 'New item added to the Media Hub.' });
        setIsAddMediaOpen(false);
        setNewMediaItem({ title: '', description: '', src: '', hint: '' });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to add media item.' });
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

   const getStatusColor = (status: string) => {
    switch (status) {
      case "success": return "bg-green-500"
      case "failed": return "bg-red-500"
      default: return "bg-gray-500"
    }
  }

  const requestSort = (key: SortKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getOpponentDisplay = (match: Match) => {
    const opponentIds = match.player2Ids || (match.player2Id ? [match.player2Id] : []);
    const opponentPlayers = opponentIds.map(id => players.find(p => p.id === id)).filter(p => p) as Player[];

    if (opponentPlayers.length === 0) {
      return <span className="text-muted-foreground">N/A</span>;
    }
    return (
      <div className="flex items-center gap-2">
        {opponentPlayers.length > 1 ? (
          <div className="flex -space-x-2 rtl:space-x-reverse">
            {opponentPlayers.map(p => (
              <Avatar key={p.id} className="h-8 w-8 border-2 border-background">
                <AvatarImage src={p.avatar} data-ai-hint="person face" />
                <AvatarFallback>{getInitials(p.name)}</AvatarFallback>
              </Avatar>
            ))}
          </div>
        ) : (
          <Avatar className="h-8 w-8">
            <AvatarImage src={opponentPlayers[0].avatar} data-ai-hint="person face" />
            <AvatarFallback>{getInitials(opponentPlayers[0].name)}</AvatarFallback>
          </Avatar>
        )}
        <span className="truncate">{opponentPlayers.map(p => p.name).join(', ')}</span>
      </div>
    )
  };

  const getInitials = (name?: string) => {
    if (!name) return '?'
    const names = name.split(' ')
    const initials = names.map((n) => n[0]).join('')
    return initials.toUpperCase()
  }

  const chartData = [
      { month: "January", users: 186, matches: 80 },
      { month: "February", users: 305, matches: 200 },
      { month: "March", users: 237, matches: 120 },
      { month: "April", users: 73, matches: 190 },
      { month: "May", users: 209, matches: 130 },
      { month: "June", users: 214, matches: 140 },
  ]

  const chartConfig = {
      users: { label: "Users", color: "hsl(var(--chart-1))" },
      matches: { label: "Matches", color: "hsl(var(--chart-2))" },
  }

  return (
    <div className="relative overflow-y-auto">
        <div className="absolute inset-0">
          <Image
            src="https://picsum.photos/seed/admin-bg/1920/1080"
            alt="Abstract background"
            fill
            className="object-cover"
            data-ai-hint="abstract background"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/90 to-background" />
        </div>
       <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="glass p-6 rounded-2xl">
            <h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-3">
              <Crown className="w-10 h-10 text-primary" />
              {t('adminPanel')}
            </h1>
            <p className="text-muted-foreground">{t('adminPanelSubtitle')}</p>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-green-500" />
                <span className="font-medium">{loading ? '-' : players.filter(p => p.role === 'player').length} {t('players')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-500" />
                <span className="font-medium">{loading ? '-' : matches.length} {t('matches')}</span>
              </div>
            </div>
          </div>
        </div>

         {/* Quick Actions */}
        <div className="mb-8">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                {t('quickActions')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                 <Button onClick={() => handleCreate('user')}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    {t('createPlayer')}
                </Button>
                <Button onClick={loadData} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {t('refreshData')}
                </Button>
                 <Button variant="outline" disabled>
                    <Settings className="w-4 h-4 mr-2" />
                    {t('appSettings')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>


        {/* Main Admin Tabs */}
        <Tabs defaultValue="players" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 glass">
            <TabsTrigger value="players">
              <Users className="w-4 h-4 mr-2" />
              {t('players')}
            </TabsTrigger>
            <TabsTrigger value="leagues">
                <Trophy className="w-4 h-4 mr-2" />
                {t('leagues')}
            </TabsTrigger>
            <TabsTrigger value="matches">
              <Calendar className="w-4 h-4 mr-2" />
              {t('matches')}
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              {t('analytics')}
            </TabsTrigger>
            <TabsTrigger value="system">
              <Database className="w-4 h-4 mr-2" />
              {t('system')}
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4 mr-2" />
              {t('settings')}
            </TabsTrigger>
          </TabsList>

          {/* Players Tab */}
          <TabsContent value="players" className="space-y-4">
            <Card className="glass">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    {t('playerManagement')}
                  </CardTitle>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder={t('searchPlayers')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('player')}</TableHead>
                        <TableHead>{t('stats')}</TableHead>
                        <TableHead>{t('balance')}</TableHead>
                        <TableHead>{t('status')}</TableHead>
                        <TableHead>{t('actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPlayers.map((player) => (
                        <TableRow key={player.id} className="hover:bg-muted/10">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={player.avatar} data-ai-hint="person face" />
                                <AvatarFallback>
                                  {getInitials(player.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{player.name}</p>
                                <p className="text-sm text-muted-foreground">"{player.nickname}"</p>
                                <p className="text-xs text-muted-foreground">{player.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>P: {player.stats.played} | W: {player.stats.wins}</div>
                              <div>G: {player.stats.goalsFor} | GD: {player.stats.goalDifference}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-green-500 font-bold">${player.balance.toLocaleString()}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                               {player.role === 'admin' && <Badge variant="destructive">Admin</Badge>}
                               {player.role === 'player' && <Badge>Player</Badge>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleEditUser(player)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleDelete('user', player)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leagues Tab */}
          <TabsContent value="leagues" className="space-y-4">
            <Card className="glass">
              <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-primary" />
                        {t('leagueManagement')}
                    </CardTitle>
                    <Button onClick={() => handleCreate('league')}>
                        <Plus className="w-4 h-4 mr-2" />
                        {t('createLeague')}
                    </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('leagueName')}</TableHead>
                            <TableHead>{t('status')}</TableHead>
                            <TableHead>{t('entryFee')}</TableHead>
                            <TableHead>{t('prizePool')}</TableHead>
                            <TableHead>{t('topScorerPrize')}</TableHead>
                            <TableHead className="text-right">{t('actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {leagues.map(league => (
                            <TableRow key={league.id}>
                                <TableCell className="font-medium">{league.name}</TableCell>
                                <TableCell>
                                    <Badge variant={league.status === 'active' ? 'default' : 'secondary'}>{league.status.toUpperCase()}</Badge>
                                </TableCell>
                                <TableCell>${league.entryFee.toLocaleString()}</TableCell>
                                <TableCell>${league.prizePool.toLocaleString()}</TableCell>
                                <TableCell>${league.topScorerPrize.toLocaleString()}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" onClick={() => handleEditLeague(league)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete('league', league)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Matches Tab */}
          <TabsContent value="matches" className="space-y-4">
             <Card className="glass">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <PlayCircle className="w-5 h-5 text-primary" />
                        {t('matchGeneration')}
                    </CardTitle>
                    <CardDescription>{t('matchGenerationDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                        {STAGES.map((stage) => (
                            <AccordionItem value={stage} key={stage}>
                                <AccordionTrigger>{stage}</AccordionTrigger>
                                <AccordionContent>
                                    <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
                                        <p className="text-sm text-muted-foreground">{t('generateMatchesFor')} {stage}</p>
                                        <Button
                                            onClick={() => handleGenerateMatches(stage)}
                                            disabled={generatingMatches}
                                        >
                                            {generatingMatches ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                                            {t('generate')}
                                        </Button>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>
             <Card className="glass">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    {t('matchManagement')}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">
                               <Button variant="ghost" onClick={() => requestSort('matchNum')}>
                                 # <ArrowUpDown className="ml-2 h-4 w-4" />
                               </Button>
                            </TableHead>
                            <TableHead>
                               <Button variant="ghost" onClick={() => requestSort('timestamp')}>
                                 {t('date')} <ArrowUpDown className="ml-2 h-4 w-4" />
                               </Button>
                            </TableHead>
                            <TableHead>{t('home')}</TableHead>
                            <TableHead>{t('away')}</TableHead>
                            <TableHead className="text-center">{t('result')}</TableHead>
                            <TableHead className="text-right">{t('actions')}</TableHead>
                        </TableRow>
                    </TableHeader>

                    {STAGES.map(stage => {
                        const stageMatches = sortedMatches.filter(m => m.stageName === stage);
                        if (stageMatches.length === 0) return null;
                        return (
                            <TableBody key={stage}>
                                <TableRow>
                                    <TableCell colSpan={6} className="font-bold text-lg bg-muted/50 text-primary">
                                        {stage}
                                    </TableCell>
                                </TableRow>
                                {stageMatches.map(match => {
                                     const player1 = players.find(p => p.id === match.player1Id);
                                     return (
                                        <TableRow key={match.id}>
                                            <TableCell className="font-medium">{match.matchNum}</TableCell>
                                            <TableCell>{format(new Date(match.timestamp), 'MMM d, yyyy')}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={player1?.avatar} data-ai-hint="person face" />
                                                        <AvatarFallback>{getInitials(player1?.name)}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium">{player1?.name || 'N/A'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{getOpponentDisplay(match)}</TableCell>
                                            <TableCell className="text-center font-bold text-lg">
                                                {match.result ? 
                                                    <Badge>{match.result}</Badge> 
                                                    : <Badge variant="outline">TBD</Badge>
                                                }
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" onClick={() => handleEditMatch(match)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                     )
                                })}
                            </TableBody>
                        )
                    })}
                 </Table>
                 {sortedMatches.length === 0 && (
                    <div className="text-center py-20 text-muted-foreground">
                        <Calendar className="w-12 h-12 mx-auto mb-4" />
                        <p>{t('noMatchesFound')}</p>
                    </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
           {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="glass">
                        <CardHeader>
                            <CardTitle>{t('userGrowth')}</CardTitle>
                            <CardDescription>{t('userGrowthDescription')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={chartConfig} className="h-64">
                                <BarChart data={chartData}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Bar dataKey="users" fill="var(--color-users)" radius={4} />
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                    <Card className="glass">
                        <CardHeader>
                            <CardTitle>{t('matchActivity')}</CardTitle>
                            <CardDescription>{t('matchActivityDescription')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <ChartContainer config={chartConfig} className="h-64">
                                <BarChart data={chartData}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Bar dataKey="matches" fill="var(--color-matches)" radius={4} />
                                </BarChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>

          {/* System Tab */}
          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* System Stats Cards */}
               <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('serverUptime')}</CardTitle>
                        <Server className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{systemStats.uptime}</div>
                        <p className="text-xs text-muted-foreground">{t('lastRestart')}</p>
                    </CardContent>
                </Card>
                 <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('onlineUsers')}</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{systemStats.onlineUsers}</div>
                        <p className="text-xs text-muted-foreground">{t('activeSessions')}</p>
                    </CardContent>
                </Card>
                <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('dbStatus')}</CardTitle>
                        <Database className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500 capitalize">{systemStats.dbStatus}</div>
                        <p className="text-xs text-muted-foreground">{t('dbStatusDescription')}</p>
                    </CardContent>
                </Card>
                <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('systemAlerts')}</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0</div>
                        <p className="text-xs text-muted-foreground">{t('noCriticalAlerts')}</p>
                    </CardContent>
                </Card>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="glass">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium flex items-center gap-2">
                            <Cpu className="h-5 w-5 text-primary" /> {t('cpuUsage')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{systemStats.cpu.toFixed(1)}%</div>
                        <Progress value={systemStats.cpu} className="mt-2 h-2" />
                    </CardContent>
                </Card>
                 <Card className="glass">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium flex items-center gap-2">
                            <MemoryStick className="h-5 w-5 text-primary" /> {t('memoryUsage')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{systemStats.memory.toFixed(1)}%</div>
                        <Progress value={systemStats.memory} className="mt-2 h-2" />
                    </CardContent>
                </Card>
                 <Card className="glass">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium flex items-center gap-2">
                            <HardDrive className="h-5 w-5 text-primary" /> {t('diskSpace')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{systemStats.disk.toFixed(1)}%</div>
                        <Progress value={systemStats.disk} className="mt-2 h-2" />
                    </CardContent>
                </Card>
             </div>
             {/* Audit Logs */}
            <Card className="glass">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-muted-foreground" /> {t('auditLog')}
                    </CardTitle>
                    <CardDescription>{t('auditLogDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('action')}</TableHead>
                                    <TableHead>{t('user')}</TableHead>
                                    <TableHead>{t('timestamp')}</TableHead>
                                    <TableHead>{t('ipAddress')}</TableHead>
                                    <TableHead>{t('status')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.map((log) => (
                                <TableRow key={log.id} className="hover:bg-muted/10">
                                    <TableCell className="font-medium">{log.action}</TableCell>
                                    <TableCell>{log.user}</TableCell>
                                    <TableCell>{formatDate(log.timestamp)}</TableCell>
                                    <TableCell>{log.ip}</TableCell>
                                    <TableCell>
                                        <Badge className={`${getStatusColor(log.status)}`}>{log.status}</Badge>
                                    </TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
          </TabsContent>
          
          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
                <Card className="glass">
                    <CardHeader>
                        <CardTitle>{t('newsTicker')}</CardTitle>
                        <CardDescription>{t('newsTickerDescription')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-4">
                            <Button onClick={handleGenerateNews} disabled={generatingNews}>
                                {generatingNews ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                                {t('generateNewsItems')}
                            </Button>
                            <Button onClick={handleGenerateBullyingReport} disabled={generatingBullyingReport} variant="destructive">
                                {generatingBullyingReport ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Megaphone className="w-4 h-4 mr-2" />}
                                {t('generateConductReport')}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">{t('newsTickerInfo')}</p>
                    </CardContent>
                </Card>

                <Card className="glass">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>{t('mediaHubManagement')}</CardTitle>
                                <CardDescription>{t('mediaHubManagementDescription')}</CardDescription>
                            </div>
                             <Button onClick={() => setIsAddMediaOpen(true)}>
                                <Plus className="w-4 h-4 mr-2" /> {t('addMedia')}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('preview')}</TableHead>
                                    <TableHead>{t('title')}</TableHead>
                                    <TableHead>{t('description')}</TableHead>
                                    <TableHead className="text-right">{t('actions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {mediaItems.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <Image src={item.src} alt={item.title} width={100} height={75} className="rounded-md object-cover" data-ai-hint={item.hint}/>
                                        </TableCell>
                                        <TableCell className="font-medium">{item.title}</TableCell>
                                        <TableCell className="text-muted-foreground">{item.description}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" className="text-destructive" onClick={() => handleDelete('media', item)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
        
        <Dialog
            open={isUserDialogOpen}
            onOpenChange={(isOpen) => {
              if (!isOpen) {
                setSelectedUser(null)
                setIsCreating(false)
              }
              setIsUserDialogOpen(isOpen)
            }}
          >
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {isCreating ? 'Create New Player' : 'Edit Player'}
                </DialogTitle>
                <DialogDescription>
                  {isCreating
                    ? 'Fill in the details for the new player.'
                    : 'Make changes to the player profile here. Click save when you are done.'}
                </DialogDescription>
              </DialogHeader>
              <EditUserForm
                user={selectedUser}
                isCreating={isCreating}
                onSave={handleSaveUser}
                onCancel={() => setIsUserDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
          
           <Dialog
            open={isMatchDialogOpen}
            onOpenChange={(isOpen) => {
              if (!isOpen) {
                setSelectedMatch(null)
                setIsCreating(false)
              }
              setIsMatchDialogOpen(isOpen)
            }}
          >
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {isCreating ? 'Create New Match' : 'Edit Match'}
                </DialogTitle>
                <DialogDescription>
                  {isCreating
                    ? 'Fill in the details for the new match.'
                    : 'Make changes to the match here. Click save when you are done.'}
                </DialogDescription>
              </DialogHeader>
              <EditMatchForm
                match={selectedMatch}
                players={players}
                isCreating={isCreating}
                onSave={handleSaveMatch}
                onCancel={() => setIsMatchDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        
        <Dialog open={isLeagueDialogOpen} onOpenChange={setIsLeagueDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isCreating ? t('createLeague') : t('editLeague')}</DialogTitle>
                    <DialogDescription>
                        {isCreating ? 'Set up a new competition.' : 'Update the details for this league.'}
                    </DialogDescription>
                </DialogHeader>
                <EditLeagueForm
                    league={selectedLeague}
                    onSave={handleSaveLeague}
                    onCancel={() => setIsLeagueDialogOpen(false)}
                />
            </DialogContent>
        </Dialog>

           <Dialog open={isAddMediaOpen} onOpenChange={setIsAddMediaOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Media Item</DialogTitle>
                  <DialogDescription>Add a new image to the Media Hub gallery.</DialogDescription>
                </DialogHeader>
                 <div className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="media-title">Title</Label>
                        <Input id="media-title" value={newMediaItem.title} onChange={e => setNewMediaItem({...newMediaItem, title: e.target.value})} />
                    </div>
                     <div>
                        <Label htmlFor="media-src">Image URL</Label>
                        <Input id="media-src" value={newMediaItem.src} onChange={e => setNewMediaItem({...newMediaItem, src: e.target.value})} />
                    </div>
                     <div>
                        <Label htmlFor="media-desc">Description</Label>
                        <Input id="media-desc" value={newMediaItem.description} onChange={e => setNewMediaItem({...newMediaItem, description: e.target.value})} />
                    </div>
                     <div>
                        <Label htmlFor="media-hint">AI Hint</Label>
                        <Input id="media-hint" value={newMediaItem.hint} onChange={e => setNewMediaItem({...newMediaItem, hint: e.target.value})} />
                    </div>
                    <Button onClick={handleAddMedia} className="w-full">Add Item</Button>
                </div>
              </DialogContent>
            </Dialog>

           <AlertDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
            >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the {itemToDelete?.type}.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={confirmDelete}>Continue</Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
      </div>
    </div>
  )
}
