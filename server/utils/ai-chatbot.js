// Lightweight AI chatbot without heavy dependencies
// Removed @xenova/transformers dependency to reduce bundle size by ~294KB

// Simple text similarity using basic string matching algorithms
function calculateTextSimilarity(text1, text2) {
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);

  // Calculate Jaccard similarity
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}



// Create knowledge base from TF2 data
function createKnowledgeBase(tf2Data) {
  const knowledgeBase = [];
  
  // Add system explanations
  const systems = [
    {
      id: 'solo_system',
      questions: [
        'explain solo system', 'what is solo queue', 'how does solo work', 
        'solo system explanation', 'tell me about solo', 'solo queue info'
      ],
      content: `**Solo Queue System:**

The solo queue system allows players to participate in 1v1 matches at the end of rounds.

**How it works:**
• Use \`!solo\` or \`sm_solo\` to join the solo queue
• At round end, solo players are moved to teams for 1v1 matches
• You can leave the queue anytime by using the command again
• Solo matches happen automatically when the round ends

**Details:** ${tf2Data?.common_questions?.solo_queue?.answer || 'Use !solo to join the solo queue for 1v1 matches at round end.'}`,
      suggestions: ['Solo + NER interaction', 'Commands list', 'Gameplay info', 'How does NER work?']
    },
    {
      id: 'ner_system',
      questions: [
        'explain ner', 'what is ner', 'how does ner work', 'never ending rounds',
        'ner system explanation', 'tell me about ner', 'continuous rounds'
      ],
      content: `**Never Ending Rounds (NER) System:**

NER toggles continuous rounds without map changes.

**How it works:**
• Use \`!votener\` or \`sm_votener\` to vote for NER toggle
• Requires weighted voting to pass (donators get 2x weight)
• When active, rounds continue indefinitely on the same map
• When disabled, normal map rotation resumes

**Voting Details:**
• Cooldown: 90 seconds between votes
• Minimum players required
• Admin override available with sm_ner`,
      suggestions: ['Solo + NER interaction', 'Voting system', 'Admin commands', 'Map voting']
    },
    {
      id: 'solo_ner_interaction',
      questions: [
        'solo with ner', 'solo ner work together', 'does solo work with ner',
        'solo system ner active', 'solo queue never ending rounds',
        'can I use solo during ner', 'solo ner compatibility'
      ],
      content: `**Solo System + NER Interaction:**

Yes, the solo queue system works perfectly with Never Ending Rounds (NER)!

**How they work together:**
• Solo queue continues to function during NER
• 1v1 matches happen at the end of each round, even in NER mode
• Players can join/leave solo queue anytime during NER
• NER keeps the same map while solo matches rotate players
• Both systems use the same weighted voting (donators get 2x weight)

**Commands:**
• \`!solo\` - Join/leave solo queue
• \`!votener\` - Vote to toggle NER mode

*This combination is great for extended play sessions with competitive 1v1s!*`,
      suggestions: ['Solo system details', 'NER system details', 'Voting system', 'Other game modes']
    },
    {
      id: 'robot_system',
      questions: [
        'robot transformation', 'how does robot work', 'robot system',
        'robot mode', 'mvm robot', 'robot feature'
      ],
      content: `**Robot Transformation** *(Donator Feature)*

Transform your player model into authentic Mann vs Machine robots!

**How to use:**
• Type \`!robot\` in chat to toggle robot mode
• Works with all TF2 classes
• Automatically switches when you change classes
• Stays active across respawns and map changes

**Requirements:** Donator status required
**Cooldown:** 30 seconds between toggles`,
      suggestions: ['Donator benefits', 'Other donator features', 'Commands', 'How to donate?']
    },
    {
      id: 'pvb_system',
      questions: [
        'player vs bot', 'pvb system', 'bot mode', 'bots',
        'how does pvb work', 'bot opponents'
      ],
      content: `**Player vs Bot (PvB) System:**

PvB mode enables bot opponents for practice or when player count is low.

**How it works:**
• Use \`!votepvb\` or \`sm_votepvb\` to vote for bot mode
• Bots are added as opponents in dodgeball matches
• Different bot difficulty modes available
• Admin can force enable with \`sm_pvb\` (ROOT required)

**Features:**
• Weighted voting system
• Bot difficulty modes
• Admin override controls`,
      suggestions: ['Bot difficulty', 'Admin commands', 'Voting system', 'Gameplay modes']
    }
  ];
  
  // Add donation info with actual links
  const donationInfo = tf2Data?.donation_system;
  if (donationInfo) {
    knowledgeBase.push({
      id: 'donations',
      questions: [
        'how to donate', 'donation info', 'become donator', 'donator benefits',
        'vip benefits', 'donation system', 'support server', 'donation links',
        'paypal', 'buy me a coffee', 'where to donate'
      ],
      content: `**Donation System:**

${donationInfo.description}

**Benefits:**
${donationInfo.benefits?.map(benefit => `• ${benefit}`).join('\n') || '• 2x vote weight\n• Premium features\n• Exclusive commands'}

**Donation Options:**
• **PayPal**: http://paypal.me/sakoacom
• **Buy Me a Coffee**: https://www.buymeacoffee.com/sakoa
• **Website**: tf2.sakoa.xyz (all options available)
• **Discord**: https://discord.gg/JuxYYVEkzc (for other methods)`,
      suggestions: ['Donator commands', 'Server connection', 'What do I get?', 'Commands']
    });
  }

  // Add server connection info
  knowledgeBase.push({
    id: 'server_connection',
    questions: [
      'server ip', 'connect to server', 'join server', 'server address',
      'how to connect', 'steam connect', 'server location'
    ],
    content: `**Server Connection:**

• **Main Server**: steam://connect/45.81.234.145:27015
• **Advanced Server**: steam://connect/37.114.54.74:27015 (Coming Soon)
• **Location**: 🇩🇪 Frankfurt, Germany
• **Live Status**: Check tf2.sakoa.xyz for current server status and player counts

**Game Mode**: TF2 Dodgeball - deflect rockets to eliminate opponents!`,
    suggestions: ['Server features', 'How to play', 'Discord info', 'Donations']
  });

  // Add Discord info
  knowledgeBase.push({
    id: 'discord',
    questions: [
      'discord', 'discord link', 'discord invite', 'discord server',
      'community', 'chat', 'support'
    ],
    content: `**Discord Server:**

• **Direct Link**: https://discord.gg/JuxYYVEkzc
• **In-Game**: Use !discord command for the invite link

Join our community for support, updates, and to connect with other players!`,
    suggestions: ['Server connection', 'Donation info', 'Commands', 'Features']
  });

  // Add AI agent info
  knowledgeBase.push({
    id: 'ai_agent',
    questions: [
      'who are you', 'what are you', 'ai', 'chatbot', 'bot', 'augment',
      'ai agent', 'assistant', 'artificial intelligence'
    ],
    content: `**About Me:**

I'm **Augment Agent** - an AI assistant powered by Augment Code's world-leading context engine!

**Base Model**: Claude Sonnet 4 by Anthropic

**I can help with:**
• Server commands and features
• Donation information and links
• Gameplay mechanics and troubleshooting
• Server connection details
• Donator benefits and access

I have access to live server data and can provide current information about the TF2 Dodgeball server!`,
    suggestions: ['Donation links', 'Server connection', 'Donator features', 'Commands']
  });
  
  // Add commands info
  const commands = tf2Data?.commands;
  if (commands) {
    knowledgeBase.push({
      id: 'commands',
      questions: [
        'show commands', 'available commands', 'command list', 'what commands',
        'server commands', 'help commands'
      ],
      content: `**Popular Commands:**

${Object.entries(commands.general_player_commands || {})
  .slice(0, 8)
  .map(([cmd, desc]) => `**${cmd}**: ${desc}`)
  .join('\n')}

*Use !help in-game for the complete list.*`,
      suggestions: ['Donator commands', 'Voting commands', 'Stats commands']
    });
  }
  
  return [...systems, ...knowledgeBase];
}

// Find best matching response using lightweight text similarity
export async function getAIResponse(userMessage, tf2Data) {
  try {
    const knowledgeBase = createKnowledgeBase(tf2Data);
    const userQuery = userMessage.toLowerCase().trim();

    let bestMatch = null;
    let bestScore = 0;

    // Compare with each knowledge base entry using text similarity
    for (const entry of knowledgeBase) {
      for (const question of entry.questions) {
        const similarity = calculateTextSimilarity(userQuery, question);

        if (similarity > bestScore) {
          bestScore = similarity;
          bestMatch = entry;
        }
      }
    }

    // Return best match if similarity is above threshold
    if (bestMatch && bestScore > 0.3) { // Lower threshold for text similarity
      return {
        response: bestMatch.content,
        suggestions: bestMatch.suggestions || [],
        confidence: bestScore,
        source: 'lightweight_ai'
      };
    }

    return null;
  } catch (error) {
    console.error('AI response generation failed:', error);
    return null;
  }
}
