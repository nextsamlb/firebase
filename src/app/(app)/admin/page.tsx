

'use client'

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  Swords,
  Crown,
  PlayCircle,
  Save,
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
    addMediaItem, deleteMediaItem, Competition, getCompetitions, addCompetition,
    updateCompetition, deleteCompetition
} from '@/lib/data'
import { generateStageMatches } from '@/app/actions/league-actions'
import { generateBullyingReport } from '@/app/actions'
import { generateNewsTicker } from '@/app/actions/league-actions'
import { Skeleton } from "@/components/ui/skeleton"
import { EditUserForm } from '@/components/admin/edit-user-form'
import { EditMatchForm } from '@/components/admin/edit-match-form'
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Progress } from "@/components/ui/progress"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import Image from "next/image"
import { useTranslation } from "@/context/language-provider"
import { format } from "date-fns"

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
  const { language } = useTranslation();

  const [players, setPlayers] = useState<Player[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [leagues, setLeagues] = useState<Competition[]>([])
  const [logs, setLogs] = useState(auditLogs)
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])

  const [loading, setLoading] = useState(true)
  
  const [isLeagueDialogOpen, setIsLeagueDialogOpen] = useState(false);
  const [isCreatingLeague, setIsCreatingLeague] = useState(false);
  const [selectedLeagueToEdit, setSelectedLeagueToEdit] = useState<Competition | null>(null);
  const [leagueToDelete, setLeagueToDelete] = useState<Competition | null>(null);


  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false)
  const [isMatchDialogOpen, setIsMatchDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const [itemToDelete, setItemToDelete] = useState<{type: 'user' | 'match' | 'media' | 'competition', data: Player | Match | MediaItem | Competition} | null>(null)

  const [selectedUser, setSelectedUser] = useState<Player | null>(null)
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [selectedLeagueFilter, setSelectedLeagueFilter] = useState("all")

  const [isCreating, setIsCreating] = useState(false)
  const [userFilter, setUserFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  const [generatingMatches, setGeneratingMatches] = useState(false);
  const [generatingNews, setGeneratingNews] = useState(false);
  const [generatingBullyingReport, setGeneratingBullyingReport] = useState(false);
  const [selectedCompetitionForMatchGen, setSelectedCompetitionForMatchGen] = useState<string>('');


  const [isAddMediaOpen, setIsAddMediaOpen] = useState(false);
  const [newMediaItem, setNewMediaItem] = useState({ title: '', description: '', src: '', hint: '' });

  const [systemStats, setSystemStats] = useState({
    cpu: 45,
    memory: 68,
    disk: 32,
    uptime: "15 days, 6 hours",
    onlineUsers: 127,
    dbStatus: "healthy",
  })
  
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' } | null>({ key: 'matchNum', direction: 'ascending' });

  
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
        const [allPlayers, allMatches, allMediaItems, allCompetitions] = await Promise.all([getPlayers(), getMatches(), getMediaItems(), getCompetitions()])
        setPlayers(allPlayers)
        setMatches(allMatches)
        setMediaItems(allMediaItems);
        setLeagues(allCompetitions);
        if (allCompetitions.length > 0 && !selectedCompetitionForMatchGen) {
          setSelectedCompetitionForMatchGen(allCompetitions[0].id);
        }
    } catch(error){
        toast({ variant: "destructive", title: "Error", description: "Failed to load data."})
    } finally {
        setLoading(false)
    }
  },[toast, selectedCompetitionForMatchGen])


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


  const handleCreate = (type: 'user' | 'match') => {
      setIsCreating(true)
      if (type === 'user') {
        setSelectedUser(null)
        setIsUserDialogOpen(true)
      } else if (type === 'match'){
        setSelectedMatch(null)
        setIsMatchDialogOpen(true)
      }
  }

  const handleOpenLeagueDialog = (league: Competition | null) => {
    setSelectedLeagueToEdit(league);
    setIsCreatingLeague(!league);
    setIsLeagueDialogOpen(true);
  };

  const handleSaveLeague = async (leagueData: Omit<Competition, 'id'> | Competition) => {
      try {
        if (isCreatingLeague) {
            const result = await addCompetition(leagueData as Omit<Competition, 'id'>);
            setLeagues(prev => [...prev, result]);
            toast({ title: "Success", description: "New league created." });
        } else {
            const result = await updateCompetition(leagueData as Competition);
            setLeagues(prev => prev.map(l => l.id === result.id ? result : l));
            toast({ title: "Success", description: "League updated." });
        }
      } catch (error) {
           toast({ variant: 'destructive', title: 'Error', description: (error as Error).message });
      }
      setIsLeagueDialogOpen(false);
      setSelectedLeagueToEdit(null);
      setIsCreatingLeague(false);
  };

  const handleStartLeague = (leagueId: string) => {
    const league = leagues.find(l => l.id === leagueId);
    if (!league) return;
    const updatedLeague = { ...league, status: 'active' as const };
    updateCompetition(updatedLeague).then(() => {
        setLeagues(prev => prev.map(l => l.id === leagueId ? updatedLeague : l));
        toast({ title: 'League Started!', description: 'The league is now active.' });
    }).catch(error => {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to start league.' });
    });
  };

  const handleFinalizeLeague = async (league: Competition) => {
      const competitionMatches = matches.filter(m => m.competitionId === league.id);
      const playerList = players.filter(p => p.role === 'player');
      
      const competitionPlayerStats: Record<string, { points: number, goalDifference: number, goalsFor: number }> = {};
      playerList.forEach(p => {
          competitionPlayerStats[p.id] = { points: 0, goalDifference: 0, goalsFor: 0 };
      });

      competitionMatches.forEach(match => {
          if (!match.result) return;
          const scores = match.result.split('-').map(Number);
          const p1 = match.player1Id;
          const p2 = match.player2Id || match.player2Ids?.[0]; // Simplified for this logic

          if (competitionPlayerStats[p1]) {
            competitionPlayerStats[p1].goalsFor += scores[0];
            competitionPlayerStats[p1].goalDifference += scores[0] - scores[1];
            if (scores[0] > scores[1]) competitionPlayerStats[p1].points += 3;
            else if (scores[0] === scores[1]) competitionPlayerStats[p1].points += 1;
          }
          if (p2 && competitionPlayerStats[p2]) {
             competitionPlayerStats[p2].goalsFor += scores[1];
             competitionPlayerStats[p2].goalDifference += scores[1] - scores[0];
             if (scores[1] > scores[0]) competitionPlayerStats[p2].points += 3;
             else if (scores[0] === scores[1]) competitionPlayerStats[p2].points += 1;
          }
      });
      
      const sortedPlayers = Object.keys(competitionPlayerStats).sort((a, b) => {
          const statsA = competitionPlayerStats[a];
          const statsB = competitionPlayerStats[b];
          if (statsB.points !== statsA.points) return statsB.points - statsA.points;
          if (statsB.goalDifference !== statsA.goalDifference) return statsB.goalDifference - statsA.goalDifference;
          return statsB.goalsFor - statsA.goalsFor;
      });

      const winnerId = sortedPlayers[0];
      const runnerUpId = sortedPlayers[1];

      if(!winnerId) {
          toast({variant: 'destructive', title: 'Error', description: 'No players available to award prize.'});
          return;
      }
      
      const winnerPlayer = players.find(p => p.id === winnerId);
      if (!winnerPlayer) return;

      const updatedPlayer = { ...winnerPlayer, balance: winnerPlayer.balance + league.prizePool };

      try {
          await updatePlayerData(updatedPlayer);
          setPlayers(players.map(p => p.id === updatedPlayer.id ? updatedPlayer : p));
          const updatedLeague: Competition = { 
              ...league, 
              status: 'completed' as const,
              winnerId: winnerId,
              runnerUpId: runnerUpId || null,
          };
          await updateCompetition(updatedLeague);
          setLeagues(leagues.map(l => l.id === league.id ? updatedLeague : l));
          toast({ title: 'League Finalized!', description: `${winnerPlayer.name} has been awarded $${league.prizePool.toLocaleString()}!`});
      } catch (error) {
           toast({variant: 'destructive', title: 'Error', description: 'Failed to finalize league.'});
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
      } else if (itemToDelete.type === 'competition') {
          await deleteCompetition((itemToDelete.data as Competition).id);
          setLeagues(prev => prev.filter(l => l.id !== (itemToDelete.data as Competition).id));
          toast({ title: "League Deleted", description: "The league has been removed." });
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

  const handleDelete = (type: 'user' | 'match' | 'media' | 'competition', data: Player | Match | MediaItem | Competition) => {
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

  const handleGenerateMatches = async (stageName: string) => {
    if (!selectedCompetitionForMatchGen) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select a competition first.' });
      return;
    }
    setGeneratingMatches(true);
    try {
      const result = await generateStageMatches({ stageName, competitionId: selectedCompetitionForMatchGen });
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

        const result = await generateNewsTicker({ matches: recentMatches, players: topPlayers, language });
        
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
      case "active": return "bg-green-500"
      case "registration": return "bg-blue-500"
      case "completed": return "bg-gray-500"
      case "suspended": return "bg-red-500"
      case "success": return "bg-green-500"
      case "failed": return "bg-red-500"
      default: return "bg-gray-500"
    }
  }

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

  const filteredPlayers = players.filter(p => p.role === 'player').filter(
    (player) =>
      player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (player.nickname && player.nickname.toLowerCase().includes(searchTerm.toLowerCase())),
  )
  
  const sortedMatches = useMemo(() => {
    let matchesToFilter = selectedLeagueFilter === 'all'
      ? matches
      : matches.filter(m => m.competitionId === selectedLeagueFilter);

    let sortableMatches = [...matchesToFilter];
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
  }, [matches, sortConfig, selectedLeagueFilter]);
  
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
              Super Admin Panel
            </h1>
            <p className="text-muted-foreground">Complete control over PIFA League system</p>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-green-500" />
                <span className="font-medium">{loading ? '-' : players.filter(p => p.role === 'player').length} Players</span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-blue-500" />
                <span className="font-medium">{loading ? '-' : leagues.length} Leagues</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-500" />
                <span className="font-medium">{loading ? '-' : matches.length} Matches</span>
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
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                 <Button onClick={() => handleCreate('user')}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create Player
                </Button>
                <Button onClick={() => handleOpenLeagueDialog(null)}>
                    <Trophy className="w-4 h-4 mr-2" />
                    Create League
                </Button>
                <Button onClick={loadData} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Data
                </Button>
                 <Button variant="outline" disabled>
                    <Settings className="w-4 h-4 mr-2" />
                    App Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

         {/* League Actions */}
        <div className="mb-8">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-primary" />
                League Actions
              </CardTitle>
              <CardDescription>Generate matches for a specific league stage.</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="flex flex-col md:flex-row items-center gap-4">
                  <Select value={selectedCompetitionForMatchGen} onValueChange={setSelectedCompetitionForMatchGen}>
                    <SelectTrigger className="w-full md:w-64">
                      <SelectValue placeholder="Select a competition" />
                    </SelectTrigger>
                    <SelectContent>
                      {leagues.map((league) => (
                        <SelectItem key={league.id} value={league.id}>
                          {league.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" disabled={generatingMatches || !selectedCompetitionForMatchGen} onClick={() => handleGenerateMatches("Stage 1 (1v3)")}>
                        {generatingMatches ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Users className="w-4 h-4 mr-2" />}
                        Generate Stage 1
                    </Button>
                    <Button size="sm" disabled={generatingMatches || !selectedCompetitionForMatchGen} onClick={() => handleGenerateMatches("Stage 2 (1v2)")}>
                        {generatingMatches ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Users className="w-4 h-4 mr-2" />}
                        Generate Stage 2
                    </Button>
                    <Button size="sm" disabled={generatingMatches || !selectedCompetitionForMatchGen} onClick={() => handleGenerateMatches("Stage 3 (1v1)")}>
                        {generatingMatches ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Swords className="w-4 h-4 mr-2" />}
                        Generate Stage 3
                    </Button>
                  </div>
              </div>
            </CardContent>
          </Card>
        </div>


        {/* Main Admin Tabs */}
        <Tabs defaultValue="players" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 glass">
            <TabsTrigger value="players">
              <Users className="w-4 h-4 mr-2" />
              Players
            </TabsTrigger>
            <TabsTrigger value="leagues">
              <Trophy className="w-4 h-4 mr-2" />
              Leagues
            </TabsTrigger>
            <TabsTrigger value="matches">
              <Calendar className="w-4 h-4 mr-2" />
              Matches
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="system">
              <Database className="w-4 h-4 mr-2" />
              System
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Players Tab */}
          <TabsContent value="players" className="space-y-4">
            <Card className="glass">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Player Management
                  </CardTitle>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Search players..."
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
                        <TableHead>Player</TableHead>
                        <TableHead>Stats</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPlayers.map((player) => (
                        <TableRow key={player.id} className="hover:bg-muted/10">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={player.avatar || "/placeholder.svg"} />
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
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {leagues.map((league) => (
                <Card key={league.id} className="glass flex flex-col">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{league.name}</CardTitle>
                      <Badge className={getStatusColor(league.status)}>
                        {league.status.toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 flex-grow">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-muted-foreground">Players:</span><span className="ml-2">{league.players}/{league.maxPlayers}</span></div>
                      <div><span className="text-muted-foreground">Entry Fee:</span><span className="text-green-500 ml-2">${league.entryFee.toLocaleString()}</span></div>
                      <div><span className="text-muted-foreground">Prize Pool:</span><span className="text-yellow-500 ml-2">${league.prizePool.toLocaleString()}</span></div>
                    </div>
                  </CardContent>
                  <div className="p-4 pt-0 mt-auto">
                    {league.status === 'registration' && (
                        <Button size="sm" className="w-full" onClick={() => handleStartLeague(league.id)}>
                            <PlayCircle className="w-4 h-4 mr-1" /> Start
                        </Button>
                    )}
                    {league.status === 'active' && (
                        <Button size="sm" className="w-full" onClick={() => handleFinalizeLeague(league)}>
                           <Trophy className="w-4 h-4 mr-1" /> Finalize
                        </Button>
                    )}
                    {league.status === 'completed' && <Button size="sm" className="w-full" disabled>Completed</Button>}

                    <div className="flex gap-2 mt-2">
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => handleOpenLeagueDialog(league)} disabled={league.status === 'completed'}>
                          <Edit className="w-4 h-4 mr-1" /> Edit
                        </Button>
                        <Button size="sm" variant="destructive" className="flex-1" onClick={() => handleDelete('competition', league)}>
                          <Trash2 className="w-4 h-4 mr-1" /> Delete
                        </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Matches Tab */}
          <TabsContent value="matches" className="space-y-4">
             <Card className="glass">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Match Management
                  </CardTitle>
                  <div className="flex gap-2">
                    <Select value={selectedLeagueFilter} onValueChange={setSelectedLeagueFilter}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by league" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Leagues</SelectItem>
                        {leagues.map((league) => (
                          <SelectItem key={league.id} value={league.id}>
                            {league.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
                                 Date <ArrowUpDown className="ml-2 h-4 w-4" />
                               </Button>
                            </TableHead>
                            <TableHead>Home</TableHead>
                            <TableHead>Away</TableHead>
                            <TableHead className="text-center">Result</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
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
                        <p>No matches found for this filter.</p>
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
                            <CardTitle>User Growth</CardTitle>
                            <CardDescription>Monthly new user registrations.</CardDescription>
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
                            <CardTitle>Match Activity</CardTitle>
                            <CardDescription>Number of matches played per month.</CardDescription>
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
                        <CardTitle className="text-sm font-medium">Server Uptime</CardTitle>
                        <Server className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{systemStats.uptime}</div>
                        <p className="text-xs text-muted-foreground">Last restart: 15 days ago</p>
                    </CardContent>
                </Card>
                 <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Online Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{systemStats.onlineUsers}</div>
                        <p className="text-xs text-muted-foreground">Currently active sessions</p>
                    </CardContent>
                </Card>
                <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">DB Status</CardTitle>
                        <Database className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500 capitalize">{systemStats.dbStatus}</div>
                        <p className="text-xs text-muted-foreground">Firestore connection stable</p>
                    </CardContent>
                </Card>
                <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">System Alerts</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0</div>
                        <p className="text-xs text-muted-foreground">No critical alerts</p>
                    </CardContent>
                </Card>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="glass">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium flex items-center gap-2">
                            <Cpu className="h-5 w-5 text-primary" /> CPU Usage
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
                            <MemoryStick className="h-5 w-5 text-primary" /> Memory Usage
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
                            <HardDrive className="h-5 w-5 text-primary" /> Disk Space
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
                        <Activity className="h-5 w-5 text-muted-foreground" /> Audit Log
                    </CardTitle>
                    <CardDescription>Recent administrative actions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Action</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead>Timestamp</TableHead>
                                    <TableHead>IP Address</TableHead>
                                    <TableHead>Status</TableHead>
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
                        <CardTitle>News Ticker</CardTitle>
                        <CardDescription>Manually generate AI-powered news items for the scrolling ticker.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-4">
                            <Button onClick={handleGenerateNews} disabled={generatingNews}>
                                {generatingNews ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                                Generate News Items
                            </Button>
                            <Button onClick={handleGenerateBullyingReport} disabled={generatingBullyingReport} variant="destructive">
                                {generatingBullyingReport ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Megaphone className="w-4 h-4 mr-2" />}
                                Generate Conduct Report
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">News is automatically generated when a match score is updated. Use these buttons for manual overrides or special reports.</p>
                    </CardContent>
                </Card>

                <Card className="glass">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Media Hub Management</CardTitle>
                                <CardDescription>Add or remove images from the media hub gallery.</CardDescription>
                            </div>
                             <Button onClick={() => setIsAddMediaOpen(true)}>
                                <Plus className="w-4 h-4 mr-2" /> Add Media
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Preview</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {mediaItems.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <Image src={item.src} alt={item.title} width={100} height={75} className="rounded-md object-cover" />
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
        
        <Dialog open={isLeagueDialogOpen} onOpenChange={(isOpen) => { if (!isOpen) setSelectedLeagueToEdit(null); setIsLeagueDialogOpen(isOpen); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isCreatingLeague ? 'Create New League' : 'Edit League'}</DialogTitle>
            </DialogHeader>
            <LeagueForm
              league={selectedLeagueToEdit}
              onSave={handleSaveLeague}
              onCancel={() => { setIsLeagueDialogOpen(false); setSelectedLeagueToEdit(null); }}
            />
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!itemToDelete && itemToDelete.type === 'competition'} onOpenChange={(isOpen) => { if (!isOpen) setItemToDelete(null)}}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the league &quot;{(itemToDelete?.data as Competition)?.name}&quot;.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <Button variant="outline" onClick={() => setItemToDelete(null)}>Cancel</Button>
                <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
              </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

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
                open={isDeleteDialogOpen && itemToDelete?.type !== 'competition'}
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


// A new sub-component for the league form
function LeagueForm({ league, onSave, onCancel }: { league: Competition | null, onSave: (league: Omit<Competition, 'id'> | Competition) => void, onCancel: () => void }) {
    const [formData, setFormData] = useState({
        name: league?.name || '',
        maxPlayers: league?.maxPlayers || 8,
        entryFee: league?.entryFee || 0,
        prizePool: league?.prizePool || 0,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (league) {
             onSave({ ...league, ...formData });
        } else {
            onSave({
                ...formData,
                players: 0,
                status: 'registration'
            });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div>
                <Label htmlFor="league-name">League Name</Label>
                <Input
                    id="league-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., PIFA World Series"
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="max-players">Max Players</Label>
                    <Input
                        id="max-players"
                        type="number"
                        value={formData.maxPlayers}
                        onChange={(e) => setFormData({ ...formData, maxPlayers: parseInt(e.target.value) || 0 })}
                    />
                </div>
                <div>
                    <Label htmlFor="entry-fee">Entry Fee ($)</Label>
                    <Input
                        id="entry-fee"
                        type="number"
                        value={formData.entryFee}
                        onChange={(e) => setFormData({ ...formData, entryFee: parseInt(e.target.value) || 0 })}
                    />
                </div>
            </div>
            <div>
                <Label htmlFor="prize-pool">Prize Pool ($)</Label>
                <Input
                    id="prize-pool"
                    type="number"
                    value={formData.prizePool}
                    onChange={(e) => setFormData({ ...formData, prizePool: parseInt(e.target.value) || 0 })}
                />
            </div>
            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
            </div>
        </form>
    );
}

    