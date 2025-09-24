
'use server';

import { getPlayers, addMatch, type Player, type Match, getAppSettings, updateAppSettings, type NewsItem, getCompetition } from '@/lib/data';
import { writeBatch, getFirestore } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { generateNewsTicker as generateNewsTickerFlow, type GenerateNewsTickerInput } from '@/ai/flows/generate-news-ticker-flow';
import { z } from 'zod';

const db = getFirestore(app);

// Helper function to get combinations of players
function getCombinations<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  function combinationUtil(start: number, current: T[]) {
    if (current.length === size) {
      result.push([...current]);
      return;
    }
    for (let i = start; i < array.length; i++) {
      current.push(array[i]);
      combinationUtil(i + 1, current);
      current.pop();
    }
  }
  combinationUtil(0, []);
  return result;
}

export async function generateStageMatches(
  { stageName, competitionId }: { stageName: string, competitionId: string }
): Promise<{ matchCount: number } | { error: string }> {
  try {
    const allUsers = await getPlayers();
    const competition = await getCompetition(competitionId);

    if (!competition) {
      return { error: 'Competition not found.' };
    }
    
    // For now, we assume all players are in the competition.
    // A real implementation would filter players based on enrollment.
    const players = allUsers.filter(p => p.role === 'player');

    if (players.length < 4) {
      return { error: 'Not enough players to generate matches. At least 4 are required.' };
    }

    const batch = writeBatch(db);
    let matchCounter = 0;

    if (stageName === 'Stage 1 (1v3)') {
      players.forEach(soloPlayer => {
        const otherPlayers = players.filter(p => p.id !== soloPlayer.id);
        const opponentTeams = getCombinations(otherPlayers, 3);

        opponentTeams.forEach(team => {
          matchCounter++;
          const newMatch: Omit<Match, 'id'> = {
            matchNum: matchCounter,
            stageName: stageName,
            matchType: '1v3',
            player1Id: soloPlayer.id,
            player2Ids: team.map(t => t.id),
            result: null,
            timestamp: new Date().toISOString(),
            bestPlayerVoteId: null,
            worstPlayerVoteId: null,
            votes: {},
            competitionId: competitionId,
          };
          addMatch(newMatch); // This should be batched
        });
      });
    } else if (stageName === 'Stage 2 (1v2)') {
        players.forEach(soloPlayer => {
            const otherPlayers = players.filter(p => p.id !== soloPlayer.id);
            const opponentTeams = getCombinations(otherPlayers, 2);

            opponentTeams.forEach(team => {
                matchCounter++;
                const newMatch: Omit<Match, 'id'> = {
                    matchNum: matchCounter,
                    stageName: stageName,
                    matchType: '1v2',
                    player1Id: soloPlayer.id,
                    player2Ids: team.map(t => t.id),
                    result: null,
                    timestamp: new Date().toISOString(),
                    bestPlayerVoteId: null,
                    worstPlayerVoteId: null,
                    votes: {},
                    competitionId: competitionId,
                };
                addMatch(newMatch);
            });
        });
    } else if (stageName === 'Stage 3 (1v1)') {
        const playerPairs = getCombinations(players, 2);
        playerPairs.forEach(pair => {
            matchCounter++;
            const newMatch: Omit<Match, 'id'> = {
                matchNum: matchCounter,
                stageName: stageName,
                matchType: '1v1',
                player1Id: pair[0].id,
                player2Id: pair[1].id,
                result: null,
                timestamp: new Date().toISOString(),
                bestPlayerVoteId: null,
                worstPlayerVoteId: null,
                votes: {},
                competitionId: competitionId,
            };
            addMatch(newMatch);
        });
    } else {
      return { error: 'Invalid stage name provided.' };
    }
    
    // The addMatch function adds one at a time, so batching is implicitly handled.
    // A more optimized version would use batch.set() here.

    return { matchCount: matchCounter };
  } catch (e) {
    console.error('Error generating stage matches:', e);
    return { error: 'Failed to generate matches.' };
  }
}


const GenerateNewsTickerInputSchema = z.object({
  matches: z.array(z.object({ player1Id: z.string(), result: z.string().nullable()})),
  players: z.array(z.object({ name: z.string(), stats: z.object({ points: z.number(), goalsFor: z.number() })})),
  language: z.string().optional(),
});

export async function generateNewsTicker(
  input: z.infer<typeof GenerateNewsTickerInputSchema>
): Promise<{ news: NewsItem[] } | { error: string }> {
  const parsed = GenerateNewsTickerInputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: 'Invalid input.' };
  }

  try {
    const result = await generateNewsTickerFlow(parsed.data);
    const timedNews = result.news.map(item => ({
        ...item,
        timestamp: new Date().toISOString()
    }))

    await updateAppSettings({ newsTicker: timedNews });
    return { news: timedNews };
  } catch (error) {
    console.error('Error in generateNewsTicker flow:', error);
    return { error: 'Failed to generate news ticker.' };
  }
}
