
'use client'

import type { Player } from '@/lib/data'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar'
import { Badge } from '../../ui/badge'
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
import Link from 'next/link'

interface PlayerListClientProps {
  players: Player[]
  onEdit: (player: Player) => void
  onDelete: (player: Player) => void
}

export function PlayerListClient({
  players,
  onEdit,
  onDelete,
}: PlayerListClientProps) {
  const getInitials = (name: string) => {
    const names = name.split(' ')
    const initials = names.map((n) => n[0]).join('')
    return initials.toUpperCase()
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[350px]">Player</TableHead>
          <TableHead className="text-center">Played</TableHead>
          <TableHead className="text-center">Points</TableHead>
          <TableHead className="text-center">Balance</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {players.map((player) => (
          <TableRow key={player.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={player.avatar} data-ai-hint="person face" />
                  <AvatarFallback>{getInitials(player.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">
                    <Link
                      href={`/profile/${player.id}`}
                      className="hover:underline"
                    >
                      {player.name}
                    </Link>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {player.email}
                  </div>
                </div>
              </div>
            </TableCell>
            <TableCell className="text-center">{player.stats.played}</TableCell>
            <TableCell className="text-center">
              <Badge variant="default">{player.stats.points}</Badge>
            </TableCell>
             <TableCell className="text-center">
              {formatCurrency(player.balance)}
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
                  <DropdownMenuItem onClick={() => onEdit(player)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Player
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDelete(player)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Player
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
