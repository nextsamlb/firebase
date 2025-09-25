

'use server'

import {
  getUserSummary as getUserSummaryFlow,
  type UserSummaryInput,
} from '@/ai/flows/admin-dashboard-user-summary'
import {
  draftReply as draftReplyFlow,
  type DraftReplyInput,
} from '@/ai/flows/draft-reply-flow'
import {
    generateMatchCommentary as generateMatchCommentaryFlow,
    type GenerateMatchCommentaryInput,
} from '@/ai/flows/generate-match-commentary'
import {
    generateActivitySummary as generateActivitySummaryFlow,
    type GenerateActivitySummaryInput,
} from '@/ai/flows/generate-activity-summary'
import {
    generatePlayerReport as generatePlayerReportFlow,
    type GeneratePlayerReportInput,
} from '@/ai/flows/generate-player-report'
import {
    generateTeamAnalysis as generateTeamAnalysisFlow,
    type TeamStats,
} from '@/ai/flows/generate-team-analysis';
import {
    generateMatchupAnalysis as generateMatchupAnalysisFlow,
    type MatchupData,
} from '@/ai/flows/generate-matchup-analysis';
import {
    generateBullyingReport as generateBullyingReportFlow,
    type BullyingReportInput,
} from '@/ai/flows/generate-bullying-report';
import {
    generateMostImprovedReport as generateMostImprovedReportFlow,
    type MostImprovedReportInput,
} from '@/ai/flows/generate-most-improved-report';
import {
    generateImage as generateImageFlow,
} from '@/ai/flows/generate-image-flow';

import {
    updateMatchScore as updateMatchScoreData,
    addPlayer as addPlayerData,
    updatePlayer as updatePlayerData,
    addMatch as addMatchData,
    updateMatch as updateMatchData,
    getPlayers,
    getMatches,
    Match,
    Player,
    getAppSettings,
    updateAppSettings,
    getMediaItems,
    addMediaItem
} from '@/lib/data'
import { z } from 'zod'
import { generateNewsTicker } from './actions/league-actions'

const UserSummaryInputSchema = z.object({
  email: z.string().email(),
  role: z.string(),
  registrationDate: z.string(),
})

export async function getUserSummary(
  input: UserSummaryInput
): Promise<{ summary: string } | { error: string }> {
  const parsed = UserSummaryInputSchema.safeParse(input)
  if (!parsed.success) {
    return { error: 'Invalid input.' }
  }

  try {
    const result = await getUserSummaryFlow(parsed.data)
    return result
  } catch (error) {
    console.error('Error in getUserSummary flow:', error)
    return { error: 'Failed to generate summary.' }
  }
}

const DraftReplyInputSchema = z.object({
  originalSubject: z.string(),
  originalBody: z.string(),
})

export async function draftReply(
  input: DraftReplyInput
): Promise<{ replyBody: string } | { error: string }> {
  const parsed = DraftReplyInputSchema.safeParse(input)
  if (!parsed.success) {
    return { error: 'Invalid input.' }
  }

  try {
    const result = await draftReplyFlow(parsed.data)
    return result
  } catch (error) {
    console.error('Error in draftReply flow:', error)
    return { error: 'Failed to generate reply.' }
  }
}

const GenerateMatchCommentaryInputSchema = z.object({
    player1Name: z.string(),
    player2Name: z.string(),
    result: z.string(),
    stageName: z.string(),
    language: z.string().optional(),
});

export async function generateMatchCommentary(
    input: GenerateMatchCommentaryInput
): Promise<{ commentary: string } | { error: string }> {
    const parsed = GenerateMatchCommentaryInputSchema.safeParse(input);
    if (!parsed.success) {
        return { error: 'Invalid input.' };
    }

    try {
        const result = await generateMatchCommentaryFlow(parsed.data);
        return result;
    } catch (error) {
        console.error('Error in generateMatchCommentary flow:', error);
        return { error: 'Failed to generate commentary.' };
    }
}

const MatchEventSchema = z.object({
  matchId: z.string(),
  stageName: z.string(),
  player1Name: z.string(),
  player2Name: z.string(),
  result: z.string(),
  timestamp: z.string(),
});

const TransferEventSchema = z.object({
  playerName: z.string(),
  fromTeam: z.string(),
  toTeam: z.string(),
  value: z.number(),
  timestamp: z.string(),
});

const GenerateActivitySummaryInputSchema = z.object({
  matches: z.array(MatchEventSchema),
  transfers: z.array(TransferEventSchema),
  language: z.string().optional(),
});


export async function generateActivitySummary(
    input: GenerateActivitySummaryInput
): Promise<{ summary: string } | { error: string }> {
    const parsed = GenerateActivitySummaryInputSchema.safeParse(input);
    if (!parsed.success) {
        return { error: 'Invalid input: ' + JSON.stringify(parsed.error) };
    }

    try {
        const result = await generateActivitySummaryFlow(parsed.data);
        return result;
    } catch (error) {
        console.error('Error in generateActivitySummary flow:', error);
        return { error: 'Failed to generate summary.' };
    }
}

const GeneratePlayerReportInputSchema = z.object({
    name: z.string(),
    nickname: z.string(),
    matchesPlayed: z.number(),
    wins: z.number(),
    goals: z.number(),
    assists: z.number(),
    winRate: z.string(),
    language: z.string().optional(),
});

export async function generatePlayerReport(
    input: GeneratePlayerReportInput
): Promise<{ report: string } | { error: string }> {
    const parsed = GeneratePlayerReportInputSchema.safeParse(input);
    if (!parsed.success) {
        return { error: 'Invalid input.' };
    }

    try {
        const result = await generatePlayerReportFlow(parsed.data);
        return result;
    } catch (error) {
        console.error('Error in generatePlayerReport flow:', error);
        return { error: 'Failed to generate player report.' };
    }
}

export { type TeamStats } from '@/ai/flows/generate-team-analysis';
export { type MatchupData } from '@/ai/flows/generate-matchup-analysis';

export async function generateTeamAnalysis(
  input: TeamStats
): Promise<{ analysis: string } | { error: string }> {
  try {
    const result = await generateTeamAnalysisFlow(input);
    return result;
  } catch (e) {
    console.error('Error in generateTeamAnalysis flow:', e);
    return { error: 'Failed to generate team analysis.' };
  }
}

export async function generateMatchupAnalysis(
  input: MatchupData
): Promise<{ analysis: string } | { error: string }> {
  try {
    const result = await generateMatchupAnalysisFlow(input);
    return result;
  } catch (e) {
    console.error('Error in generateMatchupAnalysis flow:', e);
    return { error: 'Failed to generate matchup analysis.' };
  }
}

async function triggerPostMatchContentGeneration(matchId: string, language: 'en' | 'ar') {
    console.log(`Triggering background content generation for match ${matchId} in ${language}...`);
    try {
        const [players, matches] = await Promise.all([getPlayers(), getMatches()]);
        const match = matches.find(m => m.id === matchId);

        if (!match || !match.result) {
            console.error("Match not found or result is missing.");
            return;
        }

        const player1 = players.find(p => p.id === match.player1Id);
        const opponentIds = match.player2Ids || (match.player2Id ? [match.player2Id] : []);
        const opponents = opponentIds.map(id => players.find(p => p.id === id)).filter(Boolean) as Player[];

        if (!player1 || opponents.length === 0) {
            console.error("Players for the match not found.");
            return;
        }

        // 1. Generate Commentary
        const commentaryResult = await generateMatchCommentaryFlow({
            player1Name: player1.name,
            player2Name: opponents.map(p => p.name).join(' & '),
            result: match.result,
            stageName: match.stageName,
            language
        });

        if ('error' in commentaryResult) throw new Error(commentaryResult.error);
        
        await updateMatch({ ...match, postMatchCommentary: commentaryResult.commentary });

        // 2. Generate Image Prompt from Commentary
        const imagePrompt = `Soccer match moment: ${commentaryResult.commentary}. Players are ${player1.name} vs ${opponents.map(p=>p.name).join(' & ')}.`;
        const imageResult = await generateImageFlow({ prompt: imagePrompt });
        
        if ('error' in imageResult) throw new Error(imageResult.error);

        // 3. Save the generated image URL to the match and also to the media hub
        await updateMatch({ ...match, postMatchCommentary: commentaryResult.commentary, matchImage: imageResult.imageUrl });
        await addMediaItem({
            title: `Highlight from ${player1.name} vs ${opponents.map(p=>p.name).join(' & ')}`,
            description: commentaryResult.commentary,
            src: imageResult.imageUrl,
            hint: 'soccer football match'
        })
        
        // 4. Trigger news generation in the background, don't await it
        triggerNewsGenerationOnScoreUpdate(language);

        console.log(`Background content generation for match ${matchId} complete.`);
    } catch (e) {
        console.error(`Error during background content generation for match ${matchId}:`, e);
    }
}


const UpdateMatchScoreInputSchema = z.object({
    matchId: z.string(),
    newScore: z.string().regex(/^\d+-\d+$/, { message: "Score must be in 'X-Y' format." }).nullable(),
    language: z.enum(['en', 'ar'])
});

export async function updateMatchScore(
    input: z.infer<typeof UpdateMatchScoreInputSchema>
): Promise<{ updatedMatch: Match } | { error: string }> {
    const parsed = UpdateMatchScoreInputSchema.safeParse(input);
    if (!parsed.success) {
        return { error: 'Invalid input: ' + parsed.error.flatten().fieldErrors.newScore?.join(', ') };
    }

    try {
        const updatedMatch = await updateMatchScoreData(parsed.data.matchId, parsed.data.newScore);
        
        if (parsed.data.newScore) {
            triggerPostMatchContentGeneration(parsed.data.matchId, parsed.data.language);
        }

        return { updatedMatch };
    } catch (error) {
        console.error('Error in updateMatchScore action:', error);
        const errorMessage = (error instanceof Error) ? error.message : 'Failed to update match score.';
        return { error: errorMessage };
    }
}


async function triggerNewsGenerationOnScoreUpdate(language: 'en' | 'ar') {
    console.log(`Triggering background news generation in ${language}...`);
    try {
        const [players, matches] = await Promise.all([getPlayers(), getMatches()]);
        const recentMatches = matches.filter(m => m.result).slice(0, 5);
        const topPlayers = players.filter(p => p.role === 'player').sort((a,b) => b.stats.points - a.stats.points).slice(0,3);

        await generateNewsTicker({
            matches: recentMatches.map(m => ({ player1Id: m.player1Id, result: m.result })),
            players: topPlayers.map(p => ({ name: p.name, stats: { points: p.stats.points, goalsFor: p.stats.goalsFor }})),
            language
        });
        
        console.log("Background news generation complete.");
    } catch (e) {
        console.error("Error during background news generation:", e);
    }
}

// Admin Player Actions
export async function addPlayer(player: Omit<Player, 'id'>): Promise<{ player: Player } | { error: string }> {
    try {
        // In a real app, you would have more robust validation here
        const newPlayer = await addPlayerData(player);
        return { player: newPlayer };
    } catch (error) {
        console.error('Error in addPlayer action:', error);
        return { error: 'Failed to add player.' };
    }
}

export async function updatePlayer(player: Player): Promise<{ player: Player } | { error: string }> {
    try {
        const updatedPlayer = await updatePlayerData(player);
        return { player: updatedPlayer };
    } catch (error) {
        console.error('Error in updatePlayer action:', error);
        return { error: 'Failed to update player.' };
    }
}

// Admin Match Actions
export async function addMatch(match: Match): Promise<{ match: Match } | { error: string }> {
    try {
        const newMatch = await addMatchData(match);
        return { match: newMatch };
    } catch (error) {
        console.error('Error in addMatch action:', error);
        return { error: 'Failed to add match.' };
    }
}

export async function updateMatch(match: Match): Promise<{ match: Match } | { error: string }> {
    if (match.result) {
        const scoreUpdateResult = await updateMatchScore({ matchId: match.id, newScore: match.result, language: 'en' }); // Defaulting to 'en' here
         if ('error' in scoreUpdateResult) {
            return { error: scoreUpdateResult.error };
        }
        return { match: scoreUpdateResult.updatedMatch };
    } else {
        try {
            const updatedMatch = await updateMatchData(match);
            return { match: updatedMatch };
        } catch (error) {
            console.error('Error in updateMatch action:', error);
            return { error: 'Failed to update match.' };
        }
    }
}


export async function generateBullyingReport(input: BullyingReportInput): Promise<{ success: boolean, report?: any } | { error: string }> {
    try {
        const report = await generateBullyingReportFlow(input);
        
        // Add the generated report to the news ticker
        const appSettings = await getAppSettings();
        const currentNews = appSettings?.newsTicker || [];
        
        const newNewsItem = {
            title: report.report.title,
            excerpt: report.report.summary,
            timestamp: new Date().toISOString(),
        };

        await updateAppSettings({ newsTicker: [newNewsItem, ...currentNews] });

        return { success: true, report: report.report };
    } catch (error) {
        console.error('Error in generateBullyingReport action:', error);
        return { error: 'Failed to generate bullying report.' };
    }
}

export async function generateMostImprovedReport(input: MostImprovedReportInput): Promise<{ report: string } | { error: string }> {
    try {
        const result = await generateMostImprovedReportFlow(input);
        return result;
    } catch (error) {
        console.error('Error in generateMostImprovedReport flow:', error);
        return { error: 'Failed to generate most improved report.' };
    }
}
