const OPENAI_API_KEY = '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';

if (!OPENAI_API_KEY) {
  console.warn('OpenAI API key not found. AI Recap functionality will be disabled.');
}

export interface PlayerData {
  name: string;
  likes?: string[];
  dislikes?: string[];
  notes?: string;
  meetings: Array<{
    type: string;
    amount_spent?: number;
    base?: string;
    rating?: number;
    performance_rating?: number;
    notes?: string;
    date?: string;
  }>;
  totalSpent: number;
  totalMeetings: number;
  averageRating: number;
  status?: string;
}

export async function analyzeChatConversation(conversationText: string): Promise<string> {
  if (!OPENAI_API_KEY) {
    return "Yo, the AI analysis isn't working right now - looks like the API key isn't set up. Hit up support to get this sorted! 🤖";
  }

  try {
    const prompt = `You are a smooth, confident dating coach in your mid-twenties with a slightly cheeky but charming personality. You're like that friend who always knows what to say and has serious game. Analyze this conversation and provide advice on how to respond or what the next move should be.

Your personality:
- Confident but not arrogant
- Slightly cheeky and playful
- Uses modern slang naturally (but don't overdo it)
- Gives practical, actionable advice
- Keeps things fun and light
- Like texting a friend who's really good with girls

Conversation:
${conversationText}

Give me:
1. Quick vibe check - what's the energy like?
2. Your move - what should I say/do next?
3. Any flags (red or green) I should know about

Keep it real, keep it smooth, and help me win. Write like you're texting me back with advice.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a smooth, confident dating coach in your mid-twenties with serious game. You help guys navigate dating conversations with a slightly cheeky but charming personality. Think of yourself as that friend who always knows what to say to girls and gives solid advice. Keep responses concise, practical, and engaging. Use modern language naturally but don\'t overdo the slang.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 400,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "Couldn't analyze this convo right now, bro. Try again in a sec! 😎";
  } catch (error) {
    console.error('Error analyzing chat:', error);
    return "Analysis is down right now - probably helping someone else close the deal! Try again in a bit 🔥";
  }
}

export async function generateAIRecap(playerData: PlayerData): Promise<string> {
  if (!OPENAI_API_KEY) {
    return `${playerData.name} is a ${playerData.status || 'prospect'} with ${playerData.totalMeetings} meetings recorded. No AI analysis available - OpenAI API key not configured.`;
  }

  try {
    const prompt = `Create a brief, insightful dating recap for ${playerData.name}. Use the following data to provide a concise summary that would be helpful for someone going on a date with them:

BASIC INFO:
- Status: ${playerData.status || 'prospect'}
- Total meetings: ${playerData.totalMeetings}
- Total spent: $${playerData.totalSpent}
- Average rating: ${playerData.averageRating}/10

LIKES: ${playerData.likes?.join(', ') || 'None listed'}

DISLIKES: ${playerData.dislikes?.join(', ') || 'None listed'}

NOTES: ${playerData.notes || 'No notes available'}

MEETING HISTORY:
${playerData.meetings.map(meeting => 
  `- ${meeting.type} ${meeting.base ? `at ${meeting.base}` : ''} (Rating: ${meeting.rating || 'N/A'}/10) ${meeting.amount_spent ? `- $${meeting.amount_spent}` : ''} ${meeting.notes ? `- ${meeting.notes}` : ''}`
).join('\n')}

Please provide a 2-3 sentence summary that captures their personality, preferences, and any important patterns from the meeting history. Keep it helpful and respectful.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful dating assistant that provides brief, insightful summaries about people based on their dating history and preferences. Keep responses concise, respectful, and focused on helpful insights for dating.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || `Unable to generate AI recap for ${playerData.name}.`;
  } catch (error) {
    console.error('Error generating AI recap:', error);
    return `${playerData.name} is a ${playerData.status || 'prospect'} with ${playerData.totalMeetings} meetings. AI analysis temporarily unavailable.`;
  }
}