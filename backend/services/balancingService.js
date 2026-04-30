const balanceTeams = (players) => {
    let teamA = [];
    let teamB = [];
    let totalRatingA = 0;
    let totalRatingB = 0;

    // Shallow copy to not mutate original array, and convert Mongoose docs to objects if needed
    let availablePlayers = players.map(p => p._doc ? { ...p._doc } : { ...p });

    // Edge Case: If no GK, auto-assign the highest 'defending' stat player as temporary GK
    const hasGK = availablePlayers.some(p => p.position === 'GK');
    if (!hasGK && availablePlayers.length > 0) {
        let bestDef = -1;
        let bestDefIndex = -1;
        availablePlayers.forEach((p, idx) => {
            if (p.attributes && p.attributes.defending > bestDef) {
                bestDef = p.attributes.defending;
                bestDefIndex = idx;
            }
        });
        if (bestDefIndex !== -1) {
            availablePlayers[bestDefIndex].position = 'GK';
            availablePlayers[bestDefIndex].isTemporaryGK = true; // Optional flag
        }
    }

    // Group players by position
    const grouped = {
        GK: [],
        DEF: [],
        MID: [],
        FWD: []
    };

    availablePlayers.forEach(p => {
        if (grouped[p.position]) {
            grouped[p.position].push(p);
        } else {
            grouped.MID.push(p); // Fallback
        }
    });

    // Sort descending by overallRating within each position group
    for (const pos in grouped) {
        grouped[pos].sort((a, b) => b.overallRating - a.overallRating);
    }

    // Distribute alternating between teamA and teamB comparing total ratings.
    const distribute = (player) => {
        // If teams have different number of players, add to the smaller team
        if (teamA.length < teamB.length) {
            teamA.push(player);
            totalRatingA += player.overallRating;
        } else if (teamB.length < teamA.length) {
            teamB.push(player);
            totalRatingB += player.overallRating;
        } else {
            // Equal sizes -> assign to the team with lower total rating
            if (totalRatingA <= totalRatingB) {
                teamA.push(player);
                totalRatingA += player.overallRating;
            } else {
                teamB.push(player);
                totalRatingB += player.overallRating;
            }
        }
    };

    ['GK', 'DEF', 'MID', 'FWD'].forEach(pos => {
        grouped[pos].forEach(player => distribute(player));
    });

    return { teamA, teamB, totalRatingA, totalRatingB };
};

module.exports = { balanceTeams };
