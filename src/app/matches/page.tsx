
"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Swords, Users, MoreHorizontal, Pencil, Trash2, ArrowUpDown } from "lucide-react"
import { getMatches, getPlayers, type Match, type Player, updateMatch as updateMatchData } from "@/lib/data"
import { Skeleton } from "@/components/ui/skeleton"
import { MatchList } from "@/components/matches/match-list"
import { useAuth } from "@/hooks/use-auth"
import { EditMatchForm } from "@/components/admin/edit-match-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { updateMatchScore } from "@/app/actions"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/context/language-provider"


const STAGES = ["Stage 1 (1v3)", "Stage 2 (1v2)", "Stage 3 (1v1)"]

type SortKey = 'matchNum' | 'timestamp';

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const { toast } = useToast()
  const { t, language } = useTranslation();

  const [isMatchDialogOpen, setIsMatchDialogOpen] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' } | null>({ key: 'matchNum', direction: 'ascending' });

  const fetchMatches = async () => {
    setLoading(true)
    try {
      const [allMatches, allPlayers] = await Promise.all([getMatches(), getPlayers()])
      setMatches(allMatches)
      setPlayers(allPlayers)
    } catch (error) {
      console.error("Error fetching matches:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMatches()
  }, [])

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

  const requestSort = (key: SortKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };


  const handleEditMatch = (match: Match) => {
    setSelectedMatch(match)
    setIsMatchDialogOpen(true)
  }
  
  const handleSaveMatch = async (updatedMatch: Match) => {
    try {
      const result = await updateMatchScore({ matchId: updatedMatch.id, newScore: updatedMatch.result, language });
      if (result.error) {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
      } else {
        toast({ title: 'Match Updated', description: `Match score has been updated.` });
        // Refresh matches to show updated scores and stats
        fetchMatches();
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'An unexpected error occurred.' });
    }
    setIsMatchDialogOpen(false);
    setSelectedMatch(null);
  }

  const getPlayerById = (id: string) => players.find(p => p.id === id)

  const getInitials = (name?: string) => {
    if (!name) return '?'
    const names = name.split(' ')
    const initials = names.map((n) => n[0]).join('')
    return initials.toUpperCase()
  }

  const getOpponentDisplay = (match: Match) => {
    const opponentIds = match.player2Ids || (match.player2Id ? [match.player2Id] : []);
    const opponentPlayers = opponentIds.map(id => getPlayerById(id)).filter(p => p) as Player[];

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
    );
  };


  if (loading) {
    return (
      <div className="space-y-6">
        <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">{t('matches')}</h1>
            <p className="text-muted-foreground">{t('matchesSubtitle')}</p>
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{t('matches')}</h1>
        <p className="text-muted-foreground">{t('matchesSubtitle')}</p>
      </div>

       <MatchList
            matches={sortedMatches}
            players={players}
            isAdmin={user?.role === 'admin'}
            onEditMatch={handleEditMatch}
        />


      <Dialog
        open={isMatchDialogOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setSelectedMatch(null)
          }
          setIsMatchDialogOpen(isOpen)
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('editMatchScore')}</DialogTitle>
            <DialogDescription>
              {t('editMatchScoreDescription')}
            </DialogDescription>
          </DialogHeader>
          <EditMatchForm
            match={selectedMatch}
            players={players}
            isCreating={false}
            onSave={handleSaveMatch}
            onCancel={() => setIsMatchDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
