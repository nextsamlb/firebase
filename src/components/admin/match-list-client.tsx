'use client'

import type { Player, Match } from '@/lib/data'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Badge } from '../ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

interface MatchListClientProps {
  matches: Match[]
  players: Player[]
  onEdit: (match: Match) => void
  onDelete: (match: Match) => void
}

export function MatchListClient({
  matches,
  players,
  onEdit,
  onDelete,
}: MatchListClientProps) {

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

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[80px]">#</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Stage</TableHead>
          <TableHead>Home</TableHead>
          <TableHead>Away</TableHead>
          <TableHead className="text-center">Result</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {matches.map((match) => {
          const player1 = getPlayerById(match.player1Id);
          return (
            <TableRow key={match.id}>
              <TableCell className="font-medium">{match.matchNum}</TableCell>
              <TableCell>{format(new Date(match.timestamp), 'MMM d, yyyy')}</TableCell>
              <TableCell>
                <Badge variant="outline">{match.stageName}</Badge>
              </TableCell>
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
              <TableCell className="text-center font-bold">
                {match.result || <span className="text-muted-foreground text-xs">TBD</span>}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onEdit(match)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit Match
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => onDelete(match)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Match
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  )
}
