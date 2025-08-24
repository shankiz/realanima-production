
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
  try {
    // Verify user authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { character } = await req.json();

    if (!character) {
      return NextResponse.json({ error: 'Character is required' }, { status: 400 });
    }

    // Initialize Gemini with scenario generation key
    const scenarioApiKey = process.env.SCENARIO_GEMINI_KEY;
    if (!scenarioApiKey) {
      console.error('SCENARIO_GEMINI_KEY not found in environment');
      return NextResponse.json({ error: 'Scenario generation service unavailable' }, { status: 503 });
    }

    const genAI = new GoogleGenerativeAI(scenarioApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    // Get character information
    const characterNames: Record<string, string> = {
      'gojo': 'Gojo Satoru from Jujutsu Kaisen',
      'mikasa': 'Mikasa Ackerman from Attack on Titan',
      'megumin': 'Megumin from KonoSuba',
      'eren': 'Eren Yeager from Attack on Titan',
      'tanjiro': 'Tanjiro Kamado from Demon Slayer',
      'zenitsu': 'Zenitsu Agatsuma from Demon Slayer',
      'levi': 'Levi Ackerman from Attack on Titan',
      'nezuko': 'Nezuko Kamado from Demon Slayer',
      'light': 'Light Yagami from Death Note',
      'lawliet': 'L (Lawliet) from Death Note',
      'edward': 'Edward Elric from Fullmetal Alchemist',
      'spike': 'Spike Spiegel from Cowboy Bebop',
      'kenshin': 'Kenshin Himura from Rurouni Kenshin',
      'sailor': 'Sailor Moon from Sailor Moon',
      'inuyasha': 'Inuyasha from Inuyasha',
      'kagome': 'Kagome Higurashi from Inuyasha',
      'yusuke': 'Yusuke Urameshi from Yu Yu Hakusho',
      'killua': 'Killua Zoldyck from Hunter x Hunter',
      'gon': 'Gon Freecss from Hunter x Hunter',
      'hisoka': 'Hisoka from Hunter x Hunter',
      'kaneki': 'Kaneki Ken from Tokyo Ghoul',
      'itachi': 'Itachi Uchiha from Naruto',
      'todoroki': 'Shoto Todoroki from My Hero Academia',
      'bakugo': 'Katsuki Bakugo from My Hero Academia',
      'deku': 'Izuku Midoriya from My Hero Academia',
      'rimuru': 'Rimuru Tempest from That Time I Got Reincarnated as a Slime',
      'senku': 'Senku Ishigami from Dr. Stone',
      'reigen': 'Reigen Arataka from Mob Psycho 100',
      'mob': 'Shigeo Kageyama from Mob Psycho 100'
    };

    const characterName = characterNames[character] || 'the character';

    const prompt = `Generate exactly 2 unique and engaging conversation scenarios for chatting with ${characterName}. 

Requirements:
- Each scenario should be 1-2 sentences long
- Make them creative, fun, and true to the character's personality
- Include different types of scenarios (action, slice of life, mystery, adventure, etc.)
- Make them engaging conversation starters that would lead to interesting roleplay
- Format as a simple JSON array: ["scenario 1", "scenario 2"]

Examples of good scenarios:
- "You find yourself trapped in an elevator with [character] during a power outage."
- "You wake up in [character's world] with no memory of how you got there."
- "[Character] challenges you to a competition in their specialty."
- "You discover [character] working at a modern coffee shop in disguise."

Generate 2 scenarios now:`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Parse the JSON response
    let scenarios: string[];
    try {
      // Clean the response to extract JSON
      const cleanedText = text.replace(/```json\s*|\s*```/g, '').trim();
      scenarios = JSON.parse(cleanedText);
      
      if (!Array.isArray(scenarios) || scenarios.length !== 2) {
        throw new Error('Invalid scenario format');
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', text);
      // Fallback scenarios
      scenarios = [
        `You find yourself in an unexpected situation with ${characterName.split(' from ')[0]} - what do you do?`,
        `${characterName.split(' from ')[0]} needs your help with something important. What's the situation?`
      ];
    }

    return NextResponse.json({
      success: true,
      scenarios: scenarios
    });

  } catch (error) {
    console.error('Error generating scenarios:', error);
    return NextResponse.json(
      { error: 'Failed to generate scenarios' },
      { status: 500 }
    );
  }
}
