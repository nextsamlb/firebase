

// This file contains mock data for the PIFA LEAGUE Stats app.
// In a real application, this data would be fetched from a database like Firestore.
import { collection, getDocs, getFirestore, addDoc, deleteDoc, doc, query, where, updateDoc, increment, arrayUnion, getDoc, setDoc, writeBatch } from 'firebase/firestore';
import { app } from './firebase';

export interface PlayerStats {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  assists: number;
}

export interface Player {
  id: string;
  name:string;
  nickname: string;
  email: string;
  password?: string;
  role: 'admin' | 'player';
  avatar: string;
  balance: number;
  stats: PlayerStats;
  bestPlayerVotes: number;
  worstPlayerVotes: number;
  registrationDate?: string;
  bio?: string;
  position?: string;
  nationality?: string;
  dateOfBirth?: string;
  height?: number;
  weight?: number;
  preferredFoot?: 'Left' | 'Right' | 'Both';
  socialMedia?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
  };
  isActive?: boolean;
}

export interface Match {
  id: string;
  matchNum: number;
  stageName: string;
  player1Id: string; // Home player
  player2Id?: string; // Away player (for 1v1)
  player2Ids?: string[]; // Away players (for 1vN)
  result: string | null; // e.g., "3-1"
  matchType: string;
  bestPlayerVoteId: string | null;
  worstPlayerVoteId: string | null;
  votes: { [userId: string]: { best: string, worst: string } }; // Updated vote structure
  timestamp: string;
  preMatchAnalysis?: string | null;
  postMatchCommentary?: string | null;
  matchImage?: string | null;
}

export interface Message {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  timestamp: string;
  read: boolean;
}

export interface MediaItem {
    id: string;
    src: string;
    title: string;
    description: string;
    hint: string;
}

export interface NewsItem {
    title: string;
    excerpt: string;
    timestamp: string;
}

export interface AppSettings {
    newsTicker: NewsItem[];
}


const db = getFirestore(app);
const POINTS_FOR_WIN = 3;
const POINTS_FOR_DRAW = 1;

// Player Functions
export async function getPlayers(): Promise<Player[]> {
    const playersCol = collection(db, 'players');
    const playerSnapshot = await getDocs(playersCol);
    const playerList = playerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Player));
    return playerList;
}

export async function addPlayer(playerData: Omit<Player, 'id'>): Promise<Player> {
    const playerRef = doc(collection(db, 'players'));
    const newPlayerId = playerRef.id;

    // Ensure all fields are present, especially non-optional ones from the updated interface
    const fullPlayerData: Player = {
        id: newPlayerId, // IMPORTANT: Include the ID in the document data
        nickname: playerData.name,
        avatar: `https://picsum.photos/seed/${newPlayerId}/200/200`,
        balance: 50000000,
        stats: { played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0, assists: 0 },
        bestPlayerVotes: 0,
        worstPlayerVotes: 0,
        registrationDate: new Date().toISOString(),
        bio: "New player ready to make their mark.",
        position: "Midfielder",
        nationality: "Unknown",
        dateOfBirth: new Date(1998, 0, 1).toISOString(),
        height: 180,
        weight: 75,
        preferredFoot: 'Right',
        socialMedia: { instagram: `@${playerData.name.toLowerCase()}`},
        isActive: true,
        ...playerData
    };
    await setDoc(playerRef, fullPlayerData);
    return fullPlayerData;
}

export async function updatePlayer(playerData: Player): Promise<Player> {
    const playerRef = doc(db, 'players', playerData.id);
    const { id, ...dataToUpdate } = playerData;
    await updateDoc(playerRef, dataToUpdate);
    return playerData;
}


export async function deletePlayer(playerId: string): Promise<void> {
    const playerRef = doc(db, 'players', playerId);
    await deleteDoc(playerRef);
}


// Match Functions
export async function getMatches(): Promise<Match[]> {
    const matchesCol = collection(db, 'matches');
    const matchSnapshot = await getDocs(matchesCol);
    const matchList = matchSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
    return matchList;
}

export async function addMatch(matchData: Omit<Match, 'id'>): Promise<Match> {
    const matchRef = doc(collection(db, 'matches'));
    const newMatch = { ...matchData, id: matchRef.id };
    await setDoc(matchRef, newMatch);
    return newMatch;
}

export async function updateMatch(matchData: Match): Promise<Match> {
    const matchRef = doc(db, 'matches', matchData.id);
    const { id, ...dataToUpdate } = matchData;
    await updateDoc(matchRef, dataToUpdate);
    return matchData;
}

export async function deleteMatch(matchId: string): Promise<void> {
    const matchRef = doc(db, 'matches', matchId);
    await deleteDoc(matchRef);
}


// Message Functions
export async function getMessages(userId: string): Promise<Message[]> {
  const messagesCol = collection(db, 'messages');
  
  const sentQuery = query(messagesCol, where('from', '==', userId));
  const receivedQuery = query(messagesCol, where('to', '==', userId));

  const [sentSnapshot, receivedSnapshot] = await Promise.all([
    getDocs(sentQuery),
    getDocs(receivedQuery),
  ]);

  const sentMessages = sentSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Message));
  const receivedMessages = receivedSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Message));
  
  const allMessages = [...sentMessages, ...receivedMessages];
  const uniqueMessages = Array.from(new Map(allMessages.map(m => [m.id, m])).values());
  
  return uniqueMessages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function sendMessage(message: Omit<Message, 'id'>): Promise<Message> {
    const messagesCol = collection(db, 'messages');
    const docRef = await addDoc(messagesCol, message);
    const sentMessage = { id: docRef.id, ...message, read: false, timestamp: new Date(message.timestamp).toISOString() } as Message;
    return sentMessage;
}

export async function deleteMessage(messageId: string): Promise<void> {
    const messageRef = doc(db, 'messages', messageId);
    await deleteDoc(messageRef);
}


// Media Hub Functions
export async function getMediaItems(): Promise<MediaItem[]> {
    const mediaCol = collection(db, 'mediaHubItems');
    const mediaSnapshot = await getDocs(mediaCol);
    return mediaSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MediaItem));
}

export async function addMediaItem(itemData: Omit<MediaItem, 'id'>): Promise<MediaItem> {
    const docRef = await addDoc(collection(db, 'mediaHubItems'), itemData);
    return { id: docRef.id, ...itemData };
}

export async function deleteMediaItem(itemId: string): Promise<void> {
    await deleteDoc(doc(db, 'mediaHubItems', itemId));
}

export async function clearMediaItems(): Promise<void> {
    const mediaCol = collection(db, 'mediaHubItems');
    const snapshot = await getDocs(mediaCol);
    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
}


// App Settings Functions
export async function getAppSettings(): Promise<AppSettings | null> {
    const settingsRef = doc(db, 'app_settings', 'config');
    const docSnap = await getDoc(settingsRef);
    if (docSnap.exists()) {
        return docSnap.data() as AppSettings;
    }
    return null;
}

export async function updateAppSettings(settings: Partial<AppSettings>): Promise<void> {
    const settingsRef = doc(db, 'app_settings', 'config');
    await setDoc(settingsRef, settings, { merge: true });
}

// Other Functions
export async function submitVote(
  matchId: string,
  votingUserId: string,
  bestPlayerId: string,
  worstPlayerId: string,
): Promise<void> {
    const batch = writeBatch(db);
    const matchRef = doc(db, 'matches', matchId);
    const bestPlayerRef = doc(db, 'players', bestPlayerId);
    const worstPlayerRef = doc(db, 'players', worstPlayerId);

    const matchUpdatePayload = {
      [`votes.${votingUserId}`]: {
        best: bestPlayerId,
        worst: worstPlayerId
      }
    };
    
    batch.update(matchRef, matchUpdatePayload);
    batch.update(bestPlayerRef, { bestPlayerVotes: increment(1) });
    batch.update(worstPlayerRef, { worstPlayerVotes: increment(1) });

    await batch.commit();
}


export async function updateMatchScore(matchId: string, newScore: string | null): Promise<Match> {
    const batch = writeBatch(db);
    const matchRef = doc(db, 'matches', matchId);

    const matchDoc = await getDoc(matchRef);
    if (!matchDoc.exists()) {
        throw new Error("Match not found.");
    }
    const matchData = matchDoc.data() as Match;
    const isTeamMatch = (matchData.player2Ids?.length || 0) > 1;

    // Do nothing if score is the same or being cleared without a previous score
    if (matchData.result === newScore || (!matchData.result && !newScore)) {
        return { id: matchId, ...matchData, result: newScore };
    }
    
    // Revert stats if a score is being cleared
    if (matchData.result && !newScore) {
        const playerIdsToRevert = [matchData.player1Id, ...(matchData.player2Ids || (matchData.player2Id ? [matchData.player2Id] : []))];
        const scores = matchData.result.split('-').map(Number);
        const player1Won = scores[0] > scores[1];
        const player2Won = scores[1] > scores[0];
        const isDraw = scores[0] === scores[1];

        for (const playerId of playerIdsToRevert) {
            const playerRef = doc(db, 'players', playerId);
            const isPlayer1 = playerId === matchData.player1Id;
            
            const statsUpdate: any = { 'stats.played': increment(-1) };
            
            if (!isTeamMatch) {
                statsUpdate['stats.goalsFor'] = increment(-(isPlayer1 ? scores[0] : scores[1]));
                statsUpdate['stats.goalsAgainst'] = increment(-(isPlayer1 ? scores[1] : scores[0]));
                statsUpdate['stats.goalDifference'] = increment(-((isPlayer1 ? scores[0] : scores[1]) - (isPlayer1 ? scores[1] : scores[0])));
            }

            if (isDraw) {
                statsUpdate['stats.draws'] = increment(-1);
                statsUpdate['stats.points'] = increment(-POINTS_FOR_DRAW);
            } else if ((isPlayer1 && player1Won) || (!isPlayer1 && player2Won)) {
                statsUpdate['stats.wins'] = increment(-1);
                statsUpdate['stats.points'] = increment(-POINTS_FOR_WIN);
            } else {
                statsUpdate['stats.losses'] = increment(-1);
            }
             batch.update(playerRef, statsUpdate);
        }
    }


    batch.update(matchRef, { result: newScore });

    // Apply new stats if a new score is set
    if (newScore) {
        const scores = newScore.split('-').map(Number);
        const player1Ref = doc(db, 'players', matchData.player1Id);
        const opponentIds = matchData.player2Ids || (matchData.player2Id ? [matchData.player2Id] : []);

        const player1Won = scores[0] > scores[1];
        const opponentWon = scores[1] > scores[0];
        const isDraw = scores[0] === scores[1];

        // Update Player 1 stats
        const player1StatsUpdate: any = {
            'stats.played': increment(1),
            'stats.goalsFor': increment(scores[0]),
            'stats.goalsAgainst': increment(scores[1]),
            'stats.goalDifference': increment(scores[0] - scores[1]),
            'stats.wins': increment(player1Won ? 1 : 0),
            'stats.losses': increment(opponentWon ? 1 : 0),
            'stats.draws': increment(isDraw ? 1 : 0),
            'stats.points': increment(player1Won ? POINTS_FOR_WIN : isDraw ? POINTS_FOR_DRAW : 0)
        };
        batch.update(player1Ref, player1StatsUpdate);

        // Update Opponent stats
        for (const opponentId of opponentIds) {
            const opponentRef = doc(db, 'players', opponentId);
            const opponentStatsUpdate: any = {
                'stats.played': increment(1),
                'stats.wins': increment(opponentWon ? 1 : 0),
                'stats.losses': increment(player1Won ? 1 : 0),
                'stats.draws': increment(isDraw ? 1 : 0),
                'stats.points': increment(opponentWon ? POINTS_FOR_WIN : isDraw ? POINTS_FOR_DRAW : 0)
            };
            
            // For 1v1 matches, update goal stats for opponent as well
            if (!isTeamMatch) {
                opponentStatsUpdate['stats.goalsFor'] = increment(scores[1]);
                opponentStatsUpdate['stats.goalsAgainst'] = increment(scores[0]);
                opponentStatsUpdate['stats.goalDifference'] = increment(scores[1] - scores[0]);
            }

            batch.update(opponentRef, opponentStatsUpdate);
        }
    }
    
    await batch.commit();

    const updatedDoc = await getDoc(matchRef);
    return { id: updatedDoc.id, ...updatedDoc.data() } as Match;
}

    