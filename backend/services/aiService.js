/**
 * Gemini AI Service
 * Handles all Google Gemini API calls for the five-a-side manager.
 */

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

/**
 * Core helper — sends a prompt to Gemini and returns the text response.
 */
async function callGemini(prompt) {
    const response = await fetch(`${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 512
            }
        })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Gemini API error: ${response.status} — ${err}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
}

/**
 * AI Feature 2 — Player Performance Report
 * Generates a natural-language performance summary for a single player.
 */
export async function getAiPlayerReport(player) {
    const trend = player.performanceTrend || 'stable';
    const stats = player.stats || {};

    const prompt = `
You are a football analyst for a 5-a-side football manager app.

Player: ${player.name}
Position: ${player.position}
Overall Rating: ${player.overallRating || 'N/A'}/99
Performance Trend: ${trend}

Season Stats:
- Matches Played: ${stats.matchesPlayed || 0}
- Goals: ${stats.goals || 0}
- Assists: ${stats.assists || 0}
- MVP Awards: ${stats.mvpAwards || 0}

Attributes (out of 99):
${Object.entries(player.attributes || {}).map(([k, v]) => `  ${k}: ${v}`).join('\n')}

Write a concise 2–3 sentence performance summary for this player. Be specific, insightful, and encouraging. Mention their strongest attribute and their trend. Do not use bullet points.
`;

    return await callGemini(prompt);
}

/**
 * AI Feature 3 — MVP Suggestion
 * Suggests the most valuable player based on match stats.
 */
export async function getAiMvpSuggestion(playerStats, players) {
    const playerMap = Object.fromEntries(players.map(p => [p._id.toString(), p.name]));

    const statsText = playerStats.map(s => {
        const name = playerMap[s.playerId?.toString()] || 'Unknown';
        return `  ${name}: ${s.goals || 0} goals, ${s.assists || 0} assists`;
    }).join('\n');

    const prompt = `
You are a football analyst for a 5-a-side football manager app.

Match just ended. Here are the player stats:
${statsText}

Based purely on goals and assists, suggest the MVP. Respond in exactly one sentence like:
"🏆 Suggested MVP: [Player Name] — [brief reason]."
`;

    return await callGemini(prompt);
}

/**
 * AI Feature 4 — Scheduling Conflict Detection
 * Checks for time/location conflicts and suggests an alternative slot if needed.
 */
export async function checkSchedulingConflict(existingMatches, newMatch) {
    if (existingMatches.length === 0) return null;

    const newDate = new Date(newMatch.date);
    const newDateStr = newDate.toISOString().split('T')[0];

    // Check for same-day matches first (cheap check before calling AI)
    const sameDayMatches = existingMatches.filter(m => {
        const mDate = new Date(m.date).toISOString().split('T')[0];
        return mDate === newDateStr;
    });

    if (sameDayMatches.length === 0) return null;

    const existingText = sameDayMatches.map(m =>
        `  Date: ${new Date(m.date).toDateString()}, Time: ${m.time}, Place: ${m.place}`
    ).join('\n');

    const prompt = `
You are a scheduling assistant for a 5-a-side football manager.

The manager is trying to create a new match:
  Date: ${new Date(newMatch.date).toDateString()}
  Time: ${newMatch.time}
  Place: ${newMatch.place}

Existing upcoming matches on that day:
${existingText}

Check if there is a potential conflict (same time or very close times). 
If there IS a conflict, respond with a short warning and suggest an alternative time slot.
If there is NO conflict, respond with exactly: "NO_CONFLICT"
Keep the response under 2 sentences.
`;

    const result = await callGemini(prompt);
    return result === 'NO_CONFLICT' ? null : result;
}
