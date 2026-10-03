/**
 * RatingService handles the logic for calculating player match ratings
 * based on goals, assists, and MVP awards, enforcing the Single Responsibility Principle.
 */

// Base score just for playing
const BASE_MATCH_SCORE = 6.0;

export const calculateMatchRating = (stats, baseAttributes) => {
    let rating = BASE_MATCH_SCORE;

    // Add rating for goals (attackers might have a different weight, but we keep it simple for 5-a-side)
    rating += (stats.goals || 0) * 0.8;
    
    // Add rating for assists
    rating += (stats.assists || 0) * 0.5;

    // MVP Bonus
    if (stats.isMvp) {
        rating += 1.5;
    }

    // Normalize max rating to 10
    if (rating > 10.0) rating = 10.0;

    return parseFloat(rating.toFixed(1));
};

/**
 * Calculates the average rating from an array of match stats.
 */
export const calculateAverageRating = (matchStatsArray) => {
    if (!matchStatsArray || matchStatsArray.length === 0) return 0;

    const total = matchStatsArray.reduce((acc, curr) => acc + (curr.matchRating || 0), 0);
    return parseFloat((total / matchStatsArray.length).toFixed(1));
};
