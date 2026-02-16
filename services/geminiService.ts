
import { GoogleGenAI } from "@google/genai";
import { ProgressRecord, User } from "../types";

export const getJournalSummary = async (user: User, records: ProgressRecord[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const journals = records
    .filter(r => r.dayJournal)
    .slice(0, 5)
    .map(r => `Date: ${r.date}, Journal: ${r.dayJournal}`)
    .join('\n\n');

  if (!journals) return "No journal entries yet.";

  const prompt = `
    Summarize the recent mental state and progress of ${user.name} based on these journals:
    ${journals}
    
    Identify if they are feeling overwhelmed, motivated, or stagnant. Keep it concise for a Supporter/Coach.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    return "Summary unavailable.";
  }
};

export const getDailyInspiration = async (record: ProgressRecord) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    The user completed these tasks: ${record.tasksCompleted.length} tasks.
    They spent ${record.timeSpentMinutes} minutes.
    Their journal was: "${record.dayJournal}".
    
    Give them one punchy, highly encouraging sentence to keep them going tomorrow.
  `;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    return "Keep pushing forward, you're doing great!";
  }
};
