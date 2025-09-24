

import { collection, getDocs, writeBatch, getFirestore, doc } from 'firebase/firestore';
import { app } from './firebase';
import type { Player, Match, MediaItem, AppSettings, Competition } from './data';
import * as rawData from './raw-data.json';

async function seedDatabase() {
    try {
        const db = getFirestore(app);
        const batch = writeBatch(db);
        console.log('Starting database seed...');

        // 1. Clear existing collections
        console.log('Clearing existing players, matches, mediaHubItems, app_settings, and competitions...');
        const collectionsToClear = ['players', 'matches', 'mediaHubItems', 'app_settings', 'competitions'];
        for (const col of collectionsToClear) {
            const ref = collection(db, col);
            const snapshot = await getDocs(ref);
            snapshot.docs.forEach((doc) => batch.delete(doc.ref));
        }
        console.log('Cleared existing data.');

        // 2. Add Competitions & get first competition ID
        console.log('Preparing competitions...');
        const competitions: Omit<Competition, 'id'>[] = [
            {
                name: 'PIFA League Season 1',
                status: 'active',
                players: 5,
                maxPlayers: 5,
                entryFee: 0,
                prizePool: 1000,
            },
            {
                name: 'Summer Knockout Cup',
                status: 'registration',
                players: 2,
                maxPlayers: 8,
                entryFee: 100,
                prizePool: 800,
            },
        ];
        const competitionRefs = competitions.map(comp => {
            const compDocRef = doc(collection(db, 'competitions'));
            batch.set(compDocRef, {id: compDocRef.id, ...comp});
            return compDocRef;
        });
        const competitionId = competitionRefs[0].id;
        console.log(`Prepared ${competitions.length} competitions.`);
        

        // 3. Prepare new player data
        const data = rawData.currentLeagueData;
        
        // 4. Transform and add players
        console.log('Preparing new player data...');
        const playerNameToId: { [key: string]: string } = {};
        
        data.players.forEach((p: any, index: number) => {
            const playerDocRef = doc(collection(db, 'players'));
            const newId = playerDocRef.id;
            playerNameToId[p.name] = newId;

            const newPlayer: Player = {
                id: newId, // IMPORTANT: Save the ID within the document
                name: p.name,
                nickname: p.nickname || p.name,
                email: `${p.name.toLowerCase().replace(/\s/g, '')}@pifa.com`,
                password: 'password123', // Default password
                role: 'player',
                avatar: p.image,
                balance: p.balance,
                bestPlayerVotes: p.bestPlayerVotes || 0,
                worstPlayerVotes: p.worstPlayerVotes || 0,
                registrationDate: new Date().toISOString(),
                stats: {
                    played: p.played,
                    wins: p.wins,
                    draws: p.draws,
                    losses: p.losses,
                    goalsFor: p.goalsFor,
                    goalsAgainst: p.goalsAgainst,
                    goalDifference: p.goalDifference,
                    points: p.points,
                    assists: Math.floor(p.goalsFor / 2) // Mock assists
                },
                bio: `An experienced player in the PIFA league, known for their tactical play and dedication on the virtual pitch.`,
                position: ['Forward', 'Midfielder', 'Defender', 'Goalkeeper', 'Winger'][index % 5],
                nationality: ['USA', 'Brazil', 'Germany', 'Argentina', 'France'][index % 5],
                dateOfBirth: new Date(1995 - (index % 10), index % 12, (index % 28) + 1).toISOString(),
                height: 175 + (index % 15),
                weight: 70 + (index % 10),
                preferredFoot: index % 2 === 0 ? 'Right' : 'Left',
                socialMedia: {
                    instagram: `@${p.name.toLowerCase()}_pifa`,
                    twitter: `@${p.name.toLowerCase()}_pifa`,
                },
                isActive: true,
            };
            batch.set(playerDocRef, newPlayer);
        });
        console.log(`Prepared ${data.players.length} players.`);

        // Add a dedicated admin user
        console.log('Adding admin user...');
        const adminDocRef = doc(collection(db, 'players'));
        const adminId = adminDocRef.id;
        const adminUser: Player = {
            id: adminId,
            name: 'Admin',
            nickname: 'The Admin',
            email: 'admin@pifa.com',
            password: 'admin',
            role: 'admin',
            avatar: `https://picsum.photos/seed/admin/200/200`,
            balance: 99999999,
            stats: { played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0, assists: 0 },
            bestPlayerVotes: 0,
            worstPlayerVotes: 0,
            registrationDate: new Date().toISOString(),
            bio: "League administrator.",
            position: "Manager",
            nationality: "System",
            dateOfBirth: new Date().toISOString(),
            height: 180,
            weight: 80,
            preferredFoot: 'Both',
            socialMedia: {},
            isActive: true,
        };
        batch.set(adminDocRef, adminUser);
        console.log('Added admin user.');


        // 5. Transform and add matches
        console.log('Preparing new match data...');
        const newMatches: Omit<Match, 'id'>[] = [];
        data.allMatches.forEach((m: any) => {
            const matchDocRef = doc(collection(db, 'matches'));
            const matchId = matchDocRef.id;
            const player1Name = m.player1;
            const player1Id = playerNameToId[player1Name];
            
            if (!player1Id) {
                console.warn(`Could not find ID for player1 in match: ${m.player1}`);
                return;
            }

            const newMatch: Match = {
                id: matchId, // IMPORTANT: Save the ID within the document
                matchNum: m.matchNum,
                stageName: m.stageName, // Use stage name from raw data
                player1Id: player1Id,
                result: m.status === 'upcoming' ? null : m.result,
                matchType: m.matchType,
                bestPlayerVoteId: null,
                worstPlayerVoteId: null,
                votes: {},
                timestamp: new Date(m.createdAt).toISOString(),
                competitionId: competitionId, // Link match to the first competition
            };

            const opponentNames = m.player2.split(' + ').map((name: string) => name.trim());
            const opponentIds = opponentNames.map((name: string) => playerNameToId[name]).filter(Boolean);

            if(opponentIds.length > 1){
                newMatch.player2Ids = opponentIds;
            } else if (opponentIds.length === 1) {
                newMatch.player2Id = opponentIds[0];
            } else {
                console.warn(`Could not find any valid opponents for match:`, m);
                return;
            }
            
            batch.set(matchDocRef, newMatch);
            newMatches.push(newMatch);
        });
        console.log(`Prepared ${newMatches.length} matches.`);

        // 6. Add Media Hub Items
        console.log('Preparing Media Hub items...');
        const mediaItems: Omit<MediaItem, 'id'>[] = Array.from({ length: 12 }, (_, i) => ({
            src: `https://picsum.photos/seed/media${i+1}/800/600`,
            title: `Match Highlight ${i + 1}`,
            description: `An amazing moment from one of the recent matches.`,
            hint: `match highlight`
        }));
        mediaItems.forEach(item => {
            const mediaDocRef = doc(collection(db, 'mediaHubItems'));
            batch.set(mediaDocRef, {id: mediaDocRef.id, ...item});
        });
        console.log(`Prepared ${mediaItems.length} media items.`);
        
       

        // 7. Add default App Settings
        console.log('Preparing default app settings...');
        const defaultSettings: AppSettings = {
            newsTicker: [
                { title: "New Season Kicks Off!", excerpt: "The PIFA 2025 season has officially started with thrilling opening matches.", timestamp: new Date().toISOString() },
                { title: "Player 'Sameh' Breaks Goal Record", excerpt: "A stunning performance sees a new league record for most goals in a single match.", timestamp: new Date().toISOString() },
                { title: "Transfer Window Opens", excerpt: "Teams are now able to make offers and build their ultimate squad.", timestamp: new Date().toISOString() }
            ]
        };
        const settingsRef = doc(db, 'app_settings', 'config');
        batch.set(settingsRef, defaultSettings);
        console.log('Prepared default app settings.');

        // 8. Commit the batch
        console.log('Committing batch to Firestore...');
        await batch.commit();
        
        console.log('-------------------------------------------');
        console.log('✅ Database seeded successfully!');
        console.log(`   - Added ${data.players.length} players.`);
        console.log(`   - Added 1 admin user.`);
        console.log(`   - Added ${newMatches.length} matches.`);
        console.log(`   - Added ${mediaItems.length} media items.`);
        console.log(`   - Added ${competitions.length} competitions.`);
        console.log('   - Added default app settings.');
        console.log('-------------------------------------------');

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
}

seedDatabase().then(() => {
    console.log('Script finished.');
    process.exit(0);
});
