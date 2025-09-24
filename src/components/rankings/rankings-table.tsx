
'use client'

import React, { useState } from 'react'
import type { Player } from '@/lib/data'
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
import Link from 'next/link'
import { Button } from '../ui/button'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface RankingsTableProps {
  players: Player[]
}

const FormGuide = ({ form }: { form: string[] }) => (
    <div className="flex gap-1">
        {form.map((res, i) => {
            let color = 'bg-yellow-500';
            if (res === 'W') color = 'bg-green-500';
            if (res === 'L') color = 'bg-red-500';
            return <span key={i} className={`w-4 h-4 rounded-full ${color} text-white text-xs flex items-center justify-center font-bold`} title={res}></span>
        })}
    </div>
);


export function RankingsTable({ players }: RankingsTableProps) {
    const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);

  const getInitials = (name: string) => {
    const names = name.split(' ')
    const initials = names.map((n) => n[0]).join('')
    return initials.toUpperCase()
  }

  const getRankBadgeVariant = (rank: number) => {
    if (rank === 1) return 'default'
    if (rank <= 3) return 'secondary'
    return 'outline'
  }
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
   const togglePlayerRow = (playerName: string) => {
    setExpandedPlayer(expandedPlayer === playerName ? null : playerName);
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50px]">Rank</TableHead>
          <TableHead className="w-[250px]">Player</TableHead>
          <TableHead className="text-center">Points</TableHead>
          <TableHead className="text-center">Played</TableHead>
          <TableHead className="text-center">W-D-L</TableHead>
          <TableHead className="text-center">GD</TableHead>
          <TableHead className="text-center">Balance</TableHead>
          <TableHead className="text-center w-[50px]">Details</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {players.map((player, index) => (
          <React.Fragment key={player.id}>
          <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => togglePlayerRow(player.name)}>
            <TableCell>
              <Badge
                variant={getRankBadgeVariant(index + 1)}
                className="w-8 h-8 flex items-center justify-center text-base"
              >
                {index + 1}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={player.avatar} data-ai-hint="person face" />
                  <AvatarFallback>{getInitials(player.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">
                     <Link href={`/profile/${player.id}`} className="hover:underline text-accent-blue" onClick={(e) => e.stopPropagation()}>
                        {player.nickname || player.name}
                     </Link>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {player.name}
                  </div>
                </div>
              </div>
            </TableCell>
            <TableCell className="text-center font-bold text-lg text-accent-gold">{player.stats.points}</TableCell>
            <TableCell className="text-center">{player.stats.played}</TableCell>
            <TableCell className="text-center">
                <span className="text-green-500">{player.stats.wins}</span>-
                <span className="text-yellow-500">{player.stats.draws}</span>-
                <span className="text-red-500">{player.stats.losses}</span>
            </TableCell>
            <TableCell className="text-center font-semibold">{player.stats.goalDifference}</TableCell>
            <TableCell className="text-center">{formatCurrency(player.balance)}</TableCell>
            <TableCell className="text-center">
                <Button variant="ghost" size="icon">
                    {expandedPlayer === player.name ? <ChevronUp /> : <ChevronDown />}
                </Button>
            </TableCell>
          </TableRow>
           {expandedPlayer === player.name && (
                <TableRow className="bg-muted/5">
                    <TableCell colSpan={8} className="p-4">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h4 className="font-bold text-primary mb-2">Performance Breakdown</h4>
                                <ul className="text-sm space-y-1 text-muted-foreground">
                                    <li className="flex justify-between"><span>Win Rate:</span> <span className="font-semibold text-foreground">{player.stats.played > 0 ? ((player.stats.wins / player.stats.played) * 100).toFixed(1) : "0.0"}%</span></li>
                                    <li className="flex justify-between"><span>Avg Goals For:</span> <span className="font-semibold text-foreground">{player.stats.played > 0 ? (player.stats.goalsFor / player.stats.played).toFixed(2) : "0.00"}</span></li>
                                    <li className="flex justify-between"><span>Avg Goals Against:</span> <span className="font-semibold text-foreground">{player.stats.played > 0 ? (player.stats.goalsAgainst / player.stats.played).toFixed(2) : "0.00"}</span></li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-bold text-primary mb-2">League Votes</h4>
                                 <ul className="text-sm space-y-1 text-muted-foreground">
                                    <li className="flex justify-between"><span>'Best Player' Votes:</span> <span className="font-semibold text-green-500">{player.bestPlayerVotes}</span></li>
                                    <li className="flex justify-between"><span>'Worst Player' Votes:</span> <span className="font-semibold text-red-500">{player.worstPlayerVotes}</span></li>
                                </ul>
                            </div>
                         </div>
                    </TableCell>
                </TableRow>
           )}
           </React.Fragment>
        ))}
      </TableBody>
    </Table>
  )
}
