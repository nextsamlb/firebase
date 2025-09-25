'use server'

import { PlayersPageClient } from "@/components/players/players-page-client"
import { getPlayers } from "@/lib/data"


export default async function PlayersPage() {
    const allUsers = await getPlayers();
    const players = allUsers.filter(p => p.role === 'player');
    return <PlayersPageClient initialPlayers={players} />
}
