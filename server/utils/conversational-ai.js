import { HfInference } from '@huggingface/inference';
import { getOllamaResponse, isOllamaAvailable } from './ollama-ai.js';

// Initialize Hugging Face client
let hfClient = null;

function initializeHuggingFace() {
  if (!process.env.HUGGINGFACE_API_KEY) {
    console.warn('HUGGINGFACE_API_KEY not found in environment variables');
    return null;
  }
  
  if (!hfClient) {
    hfClient = new HfInference(process.env.HUGGINGFACE_API_KEY);
    console.log('Hugging Face client initialized');
  }
  
  return hfClient;
}

// Create comprehensive context from TF2 data
function createServerContext(tf2Data) {
  const context = {
    serverName: "Saka's TF2 Dodgeball Server",
    gameMode: "Dodgeball",
    
    // Commands
    commands: {
      general: tf2Data?.commands?.general_player_commands || {},
      donator: tf2Data?.commands?.donator_commands || {},
      admin: tf2Data?.commands?.admin_commands || {}
    },
    
    // Donator features
    donatorFeatures: [
      "Colored footprints (!cfp) - Leave colorful trails as you walk",
      "Custom chat colors (!scc) - Customize name and text colors", 
      "Robot transformation (!robot) - Transform into MvM robot models",
      "Killstreak effects (!ks) - Set custom killstreak counters",
      "2x vote weight - Your votes count double",
      "Priority queue access"
    ],
    
    // Systems
    systems: {
      solo: "Solo queue system for 1v1 matches at round end. Use !solo to join/leave queue.",
      ner: "Never Ending Rounds - continuous rounds without map changes. Use !votener to vote.",
      voting: "Rock the Vote (!rtv), map nominations (!nominate), and weighted voting system.",
      stats: "Player statistics tracking with seasonal leaderboards and rankings."
    },
    
    // Donation info with actual links from website
    donation: {
      website: "tf2.sakoa.xyz",
      discord: "Use !discord command in-game or visit https://discord.gg/JuxYYVEkzc",
      currency: "EUR (€)",
      methods: [
        "PayPal - Direct link: https://paypal.me/sakacom",
        "Buy Me a Coffee - Direct link: https://www.buymeacoffee.com/sakoa",
        "Direct contact via Discord for other methods"
      ],
      links: {
        paypal: "https://paypal.me/sakacom",
        buymeacoffee: "https://www.buymeacoffee.com/sakoa",
        discord: "https://discord.gg/JuxYYVEkzc",
        website: "tf2.sakoa.xyz - All donation options available here"
      },
      benefits: "Access to all donator features listed above"
    },

    // Server connection info with actual details
    servers: {
      main: {
        name: "𝘴𝘢𝘬𝘢 Dodgeball Server",
        ip: "45.81.234.145:27015",
        connectUrl: "steam://connect/45.81.234.145:27015",
        location: "🇩🇪 Frankfurt"
      },
      advanced: {
        name: "𝘴𝘢𝘬𝘢 Dodgeball Server - Advanced",
        ip: "37.114.54.74:27015",
        connectUrl: "steam://connect/37.114.54.74:27015",
        location: "🇩🇪 Frankfurt",
        comingSoon: true
      }
    },
    
    // Common issues
    troubleshooting: {
      fov: "FOV range is 20-160. Use !fov [value] to set.",
      commands: "Use !help in-game for full command list",
      donator: "Contact admins via Discord for donator status issues"
    }
  };
  
  return context;
}

// Generate system prompt with server context
function createSystemPrompt(serverContext) {
  return `You are a helpful assistant for ${serverContext.serverName}, a Team Fortress 2 ${serverContext.gameMode} server.

PERSONALITY: Be friendly, concise, and player-focused. Use a casual gaming tone.

SERVER INFORMATION:
- Game Mode: ${serverContext.gameMode}
- Website: ${serverContext.donation.website}
- Currency: ${serverContext.donation.currency}

DONATOR FEATURES:
${serverContext.donatorFeatures.map(feature => `- ${feature}`).join('\n')}

KEY SYSTEMS:
- Solo System: ${serverContext.systems.solo}
- NER System: ${serverContext.systems.ner}
- Voting: ${serverContext.systems.voting}
- Stats: ${serverContext.systems.stats}

DONATION INFO:
- Website: ${serverContext.donation.website}
- Discord: ${serverContext.donation.discord}
- Benefits: ${serverContext.donation.benefits}

GUIDELINES:
1. Keep responses under 150 words
2. Be conversational and handle follow-up questions naturally
3. For donator features: explain what they do + how to get access
4. For commands: show the command and brief explanation
5. Don't show technical implementation details
6. If unsure, suggest contacting admins via Discord
7. Use bullet points for lists
8. Include relevant commands when helpful

CONVERSATION FLOW EXAMPLES:
User: "what are footprints?"
You: "Footprints are colorful trails that appear behind you as you walk! It's a donator feature that makes your movement more visible and fun."

User: "how do I get them?"
You: "Type !cfp in chat to open the footprint menu. You'll need donator status to access this feature."

User: "how do I become a donator?"
You: "Visit tf2.sakoa.xyz or contact admins through Discord (!discord command) for donation info and benefits!"`;
}

// Smart context-aware response system
export async function getConversationalResponse(userMessage, conversationHistory = [], tf2Data = {}) {
  try {
    // First, try smart pattern matching with context for known queries
    const smartResponse = getSmartContextualResponse(userMessage, conversationHistory, tf2Data);
    if (smartResponse) {
      return smartResponse;
    }

    // For unknown queries, try Ollama first (local AI), then Hugging Face
    if (await isOllamaAvailable()) {
      try {
        console.log('Trying Ollama for query:', userMessage);
        const ollamaResponse = await getOllamaResponse(userMessage, conversationHistory, tf2Data);
        if (ollamaResponse) {
          console.log('Ollama response successful');
          return ollamaResponse;
        }
        console.log('Ollama returned null response');
      } catch (ollamaError) {
        console.warn('Ollama failed, trying Hugging Face:', ollamaError.message);
      }
    }

    // Fallback to Hugging Face if Ollama not available
    const hf = initializeHuggingFace();
    if (hf && process.env.HUGGINGFACE_API_KEY) {
      try {
        console.log('Trying Hugging Face for query:', userMessage);
        const aiResponse = await tryHuggingFaceResponse(userMessage, conversationHistory, tf2Data, hf);
        if (aiResponse) {
          console.log('Hugging Face response successful');
          return aiResponse;
        }
        console.log('Hugging Face returned null response');
      } catch (hfError) {
        console.warn('Hugging Face failed, using fallback:', hfError.message);
      }
    }

    // Final fallback to enhanced pattern matching
    return getFallbackResponse(userMessage, tf2Data, conversationHistory);

  } catch (error) {
    console.error('Conversational AI error:', error);

    // Fallback to smart pattern matching
    return getFallbackResponse(userMessage, tf2Data, conversationHistory);
  }
}

// Try Hugging Face for unknown queries
async function tryHuggingFaceResponse(userMessage, conversationHistory, tf2Data, hf) {
  const serverContext = createServerContext(tf2Data);

  // Build a more focused prompt for better results
  let prompt = `You are a helpful TF2 Dodgeball Server assistant. Be concise and friendly.

Server: ${serverContext.serverName}
Donator Features: Footprints (!cfp), Chat Colors (!scc), Robot Mode (!robot), Killstreaks (!ks), 2x Vote Weight
Donation: Visit tf2.sakoa.xyz for PayPal/Buy Me a Coffee, or use !discord for other methods

Recent conversation:`;

  // Add recent context
  const recentHistory = conversationHistory.slice(-3);
  for (const msg of recentHistory) {
    if (msg.isUser) {
      prompt += `\nUser: ${msg.message}`;
    } else {
      prompt += `\nAssistant: ${msg.response}`;
    }
  }

  prompt += `\nUser: ${userMessage}\nAssistant:`;

  // Try text generation with a simple approach
  const response = await hf.textGeneration({
    model: 'HuggingFaceH4/zephyr-7b-beta',
    inputs: `You are a helpful TF2 Dodgeball Server assistant. Keep responses under 100 words.

User: ${userMessage}
Assistant:`,
    parameters: {
      max_new_tokens: 80,
      temperature: 0.7,
      do_sample: true,
      top_p: 0.9,
      return_full_text: false
    }
  });

  let botResponse = response.generated_text?.trim() || '';

  // Clean up response and make it server-focused
  botResponse = botResponse
    .replace(/^Assistant:\s*/i, '')
    .replace(/User:\s*.*$/gm, '')
    .replace(/Human:\s*.*$/gm, '')
    .trim();

  // If the response is too generic, add server context
  if (botResponse && !botResponse.toLowerCase().includes('tf2') && !botResponse.toLowerCase().includes('server')) {
    botResponse = `${botResponse}\n\nFor TF2 server help, try asking about footprints, donations, or commands!`;
  }

  // Only return if we got a decent response
  if (botResponse && botResponse.length > 15 && botResponse.length < 300) {
    return {
      response: botResponse,
      suggestions: generateSuggestions(userMessage, botResponse, tf2Data, conversationHistory),
      confidence: 0.7,
      source: 'huggingface'
    };
  }

  return null;
}

// Fuzzy matching for common typos and variations
function fuzzyMatch(text, patterns) {
  const normalizedText = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();

  // Comprehensive typos, slang, and abbreviations
  const typoMap = {
    // Common typos
    'footprint': ['footprints', 'foot print', 'foot prints', 'footstep', 'footsteps', 'footprnts', 'fotprints'],
    'donate': ['donat', 'donation', 'donating', 'donator', 'donor', 'dontion', 'donaton'],
    'color': ['colour', 'colors', 'colours', 'colr', 'colur', 'clor'],
    'robot': ['robots', 'robo', 'bot', 'robbot', 'robto'],
    'access': ['acess', 'acccess', 'acces', 'acsess', 'acces'],
    'command': ['commands', 'cmd', 'cmds', 'comand', 'commnd'],
    'benefit': ['benefits', 'benfit', 'benifit', 'benifits'],

    // Gaming slang and abbreviations
    'features': ['feat', 'feats', 'stuff', 'things', 'perks', 'bonuses'],
    'premium': ['prem', 'vip', 'paid', 'special', 'exclusive'],
    'server': ['serv', 'srv', 'game', 'tf2'],
    'player': ['plyr', 'user', 'gamer', 'person'],
    'money': ['cash', 'dough', 'bucks', '$', 'euro', '€'],

    // Casual expressions
    'awesome': ['cool', 'nice', 'sweet', 'dope', 'sick', 'lit', 'fire', 'pog', 'poggers'],
    'bad': ['sucks', 'trash', 'garbage', 'awful', 'terrible', 'shit', 'crap'],
    'good': ['great', 'amazing', 'fantastic', 'excellent', 'perfect', 'solid'],

    // Question words with typos
    'what': ['wat', 'wot', 'wht', 'whta'],
    'how': ['hw', 'hwo', 'haw'],
    'why': ['y', 'wy', 'whi'],
    'where': ['wher', 'were', 'whre'],

    // Common internet speak
    'you': ['u', 'ya', 'yah', 'ur'],
    'your': ['ur', 'yor', 'youre'],
    'are': ['r', 'ar'],
    'to': ['2', 'too', 'tto'],
    'for': ['4', 'fr', 'fer'],
    'because': ['bc', 'bcuz', 'cuz', 'cause', 'coz'],
    'with': ['w/', 'wit', 'wth'],
    'without': ['w/o', 'wo', 'wout']
  };

  for (const pattern of patterns) {
    if (normalizedText.includes(pattern)) return true;

    // Check typo variations
    for (const [correct, variations] of Object.entries(typoMap)) {
      if (pattern.includes(correct)) {
        for (const variation of variations) {
          if (normalizedText.includes(variation)) return true;
        }
      }
    }
  }

  return false;
}

// Intent detection system
function detectIntent(message, context) {
  const intents = {
    // Question intents
    WHAT_IS: ['what is', 'what are', 'what does', 'explain', 'tell me about', 'describe'],
    HOW_TO: ['how to', 'how do i', 'how can i', 'how does', 'where do i', 'where can i'],
    WHY: ['why', 'why do', 'why does', 'why cant', 'why don\'t', 'why not'],
    CAN_I: ['can i', 'am i able', 'is it possible', 'do i have'],

    // Action intents
    SHOW_ME: ['show me', 'give me', 'list', 'display'],
    HELP: ['help', 'assist', 'support'],

    // Topic intents
    DONATION: ['donat', 'pay', 'money', 'support server', 'contribute'],
    FEATURES: ['feature', 'benefit', 'perk', 'get as donator'],
    COMMANDS: ['command', 'cmd', '!', 'sm_'],
    ACCESS: ['access', 'permission', 'cant use', 'don\'t have']
  };

  const detectedIntents = [];

  for (const [intent, patterns] of Object.entries(intents)) {
    if (fuzzyMatch(message, patterns)) {
      detectedIntents.push(intent);
    }
  }

  // Detect emotional tone
  const tone = detectTone(message);

  return {
    primary: detectedIntents[0] || 'UNKNOWN',
    all: detectedIntents,
    tone: tone,
    confidence: detectedIntents.length > 0 ? 0.8 : 0.2
  };
}

// Emotional tone detection for better responses
function detectTone(message) {
  const tones = {
    FRUSTRATED: ['wtf', 'what the hell', 'stupid', 'dumb', 'annoying', 'sucks', 'hate', 'pissed', 'angry', 'mad', 'bullshit', 'bs'],
    EXCITED: ['awesome', 'cool', 'amazing', 'love', 'great', 'fantastic', 'perfect', 'yes', 'yay', 'woohoo', 'pog', 'poggers'],
    CONFUSED: ['confused', 'lost', 'dont understand', 'don\'t understand', 'what', 'huh', 'unclear', 'no idea', 'clueless'],
    POLITE: ['please', 'thank you', 'thanks', 'appreciate', 'kindly', 'could you', 'would you', 'may i'],
    CASUAL: ['yo', 'hey', 'sup', 'dude', 'bro', 'man', 'mate', 'buddy', 'lol', 'lmao'],
    URGENT: ['asap', 'quickly', 'fast', 'urgent', 'now', 'immediately', 'hurry', 'quick']
  };

  for (const [tone, patterns] of Object.entries(tones)) {
    if (patterns.some(pattern => message.toLowerCase().includes(pattern))) {
      return tone;
    }
  }

  return 'NEUTRAL';
}

// Response templates for more natural responses
function getResponseTemplate(intent, topic, context) {
  const templates = {
    WHAT_IS: {
      footprints: [
        "Footprints are {description}! {usage}",
        "{description} - that's what footprints are! {usage}",
        "Great question! Footprints are {description}. {usage}"
      ],
      chat_colors: [
        "Chat colors let you {description}! {usage}",
        "{description} - that's what custom chat colors do! {usage}"
      ]
    },
    HOW_TO: {
      access: [
        "To get access, you need {requirement}. {steps}",
        "Here's how: {requirement}, then {steps}",
        "Simple! {requirement} and {steps}"
      ],
      donate: [
        "You can donate through: {methods}",
        "Here are your donation options: {methods}",
        "Easy! {methods}"
      ]
    }
  };

  const intentTemplates = templates[intent.primary];
  if (intentTemplates && intentTemplates[topic]) {
    const templateOptions = intentTemplates[topic];
    return templateOptions[Math.floor(Math.random() * templateOptions.length)];
  }

  return null;
}

// Enhanced slang and casual language detection
function detectSlangPatterns(message) {
  const slangPatterns = {
    // Casual ways to ask "how to get/become donator"
    getDonator: [
      /yo.*how.*get.*donat/i,
      /hey.*how.*become.*donat/i,
      /sup.*how.*get.*vip/i,
      /how.*get.*donat.*status/i,
      /how.*become.*donat/i,
      /how.*get.*vip/i,
      /how.*donate/i,
      /where.*donate/i,
      /wanna.*donate/i,
      /want.*donate/i,
      /need.*donate/i,
      /can.*donate/i,
      /yo.*donate/i,
      /hey.*donate/i,
      /sup.*donate/i
    ],

    // Casual ways to ask about features
    getFeatures: [
      /yo.*what.*get/i,
      /hey.*what.*benefits/i,
      /sup.*what.*features/i,
      /what.*donator.*get/i,
      /what.*vip.*get/i,
      /what.*perks/i,
      /what.*benefits/i,
      /yo.*features/i,
      /hey.*perks/i
    ],

    // Casual ways to ask about server connection
    serverConnect: [
      /yo.*how.*connect/i,
      /hey.*server.*ip/i,
      /sup.*join.*server/i,
      /how.*join/i,
      /server.*address/i,
      /yo.*ip/i,
      /hey.*connect/i,
      /wanna.*join/i,
      /want.*play/i
    ],

    // Casual ways to ask about commands
    commands: [
      /yo.*commands/i,
      /hey.*help/i,
      /sup.*cmd/i,
      /what.*commands/i,
      /show.*commands/i,
      /list.*commands/i,
      /yo.*help/i,
      /need.*help/i
    ],

    // Casual ways to ask about specific features
    footprints: [
      /yo.*footprint/i,
      /hey.*footprint/i,
      /sup.*footprint/i,
      /what.*footprint/i,
      /how.*footprint/i,
      /yo.*trail/i,
      /colored.*trail/i
    ],

    robot: [
      /yo.*robot/i,
      /hey.*robot/i,
      /sup.*robot/i,
      /what.*robot/i,
      /how.*robot/i,
      /transform.*robot/i
    ],

    colors: [
      /yo.*color/i,
      /hey.*color/i,
      /sup.*color/i,
      /chat.*color/i,
      /name.*color/i,
      /custom.*color/i
    ]
  };

  // Check each pattern category
  for (const [category, patterns] of Object.entries(slangPatterns)) {
    for (const pattern of patterns) {
      if (pattern.test(message)) {
        return category;
      }
    }
  }

  return null;
}

// Handle slang queries with appropriate casual responses
function handleSlangQuery(slangType, originalMessage, serverContext) {
  const responses = {
    getDonator: {
      responses: [
        `Yo! Here's how to donate:\n\n• **PayPal**: ${serverContext.donation.links.paypal}\n• **Buy Me a Coffee**: ${serverContext.donation.links.buymeacoffee}\n• **Website**: ${serverContext.donation.website}\n• **Discord**: ${serverContext.donation.links.discord}\n\nPick whatever works for you!`,
        `Hey! Want to become a donator? Easy!\n\n• **PayPal**: ${serverContext.donation.links.paypal}\n• **Buy Me a Coffee**: ${serverContext.donation.links.buymeacoffee}\n• **All options**: ${serverContext.donation.website}\n\nYou'll get some sick features!`,
        `Sup! To get donator status:\n\n• **PayPal**: ${serverContext.donation.links.paypal}\n• **Buy Me a Coffee**: ${serverContext.donation.links.buymeacoffee}\n• **Discord**: ${serverContext.donation.links.discord} (for other methods)\n\nTotally worth it for the perks!`
      ],
      suggestions: ['What do I get?', 'Show me features', 'Server connection', 'Commands']
    },

    getFeatures: {
      responses: [
        `Yo! As a donator you get some dope stuff:\n\n🎨 **Colored Footprints** - Leave sick trails (!cfp)\n🌈 **Custom Chat Colors** - Pimp your name/text (!scc)\n🤖 **Robot Mode** - Transform into MvM robots (!robot)\n⚡ **Killstreaks** - Custom counters (!ks)\n🗳️ **2x Vote Weight** - Your votes count double\n\nPretty sweet deal!`,
        `Hey! Donator perks are fire:\n\n• **Footprints** - Colorful trails as you walk\n• **Chat Colors** - Customize your look\n• **Robot Transform** - Become a robot\n• **Killstreaks** - Show off your skills\n• **Double Votes** - More voting power\n\nDefinitely worth it!`,
        `Sup! Here's what donators get:\n\n✨ Colored footprints with !cfp\n✨ Custom chat colors with !scc\n✨ Robot transformation with !robot\n✨ Killstreak effects with !ks\n✨ 2x vote weight in all votes\n✨ Priority access to features\n\nPretty awesome stuff!`
      ],
      suggestions: ['How to donate?', 'Show me links', 'Commands', 'Server info']
    },

    serverConnect: {
      responses: [
        `Yo! Here's how to connect:\n\n• **Main Server**: steam://connect/45.81.234.145:27015\n• **Advanced**: steam://connect/37.114.54.74:27015 (Coming Soon)\n• **Location**: 🇩🇪 Frankfurt\n\nCheck ${serverContext.donation.website} for live status!`,
        `Hey! Jump in here:\n\n🎮 **Main**: steam://connect/45.81.234.145:27015\n🎮 **Advanced**: steam://connect/37.114.54.74:27015 (Soon)\n📍 **Location**: Frankfurt, Germany\n\nSee you in-game!`,
        `Sup! Server details:\n\n• **IP**: 45.81.234.145:27015 (main)\n• **IP**: 37.114.54.74:27015 (advanced, coming soon)\n• **Steam**: Use the steam:// links above\n• **Status**: Check ${serverContext.donation.website}\n\nLet's play!`
      ],
      suggestions: ['Server features', 'How to play', 'Discord', 'Donations']
    },

    commands: {
      responses: [
        `Yo! Here are the popular commands:\n\n• **!help** - Full command list\n• **!solo** - Join 1v1 queue\n• **!stats** - Your performance\n• **!rtv** - Rock the vote\n• **!nominate** - Suggest maps\n• **!fov [value]** - Set field of view\n\n**Donator commands**: !cfp, !scc, !robot, !ks`,
        `Hey! Command rundown:\n\n🎮 **!solo** - 1v1 matches\n📊 **!stats** - Check your stats\n🗳️ **!rtv** - Change map\n🎯 **!nominate** - Pick next map\n👁️ **!fov** - Adjust view\n💬 **!discord** - Get Discord link\n\nDonators get extra commands too!`,
        `Sup! Most used commands:\n\n• !help (full list)\n• !solo (1v1 queue)\n• !stats (your performance)\n• !rtv (vote map change)\n• !nominate (suggest maps)\n• !discord (community link)\n\nDonators unlock !cfp, !scc, !robot, !ks!`
      ],
      suggestions: ['Donator commands', 'How to donate?', 'Server connection', 'Features']
    },

    footprints: {
      responses: [
        `Yo! Footprints are sick - they leave colorful trails behind you as you walk! It's a donator feature, so you need to donate first. Then use !cfp to customize your colors!`,
        `Hey! Footprints = colorful trails that follow you around! Super cool donator perk. Get donator status, then type !cfp in chat to set them up!`,
        `Sup! Footprints make you leave colored trails when you move - looks awesome! It's for donators only though. Donate, then use !cfp to pick your colors!`
      ],
      suggestions: ['How to donate?', 'Other donator features', 'Donation links', 'Commands']
    },

    robot: {
      responses: [
        `Yo! Robot mode transforms you into Mann vs Machine robot models - looks badass! It's a donator feature. Get donator status, then use !robot to toggle it on/off!`,
        `Hey! Robot transformation turns you into MvM robots - super cool! Donator perk only. Donate first, then type !robot in chat to become a robot!`,
        `Sup! Robot mode makes you look like those MvM robots - pretty sick! Need donator status though. Once you donate, use !robot to transform!`
      ],
      suggestions: ['How to donate?', 'Other donator features', 'Donation links', 'Commands']
    },

    colors: {
      responses: [
        `Yo! Chat colors let you customize your name and text colors in chat - makes you stand out! It's a donator feature. Get donator status, then use !scc to set them up!`,
        `Hey! Custom chat colors = pimp your name and text in chat! Donator perk only. Donate first, then type !scc to open the color menu!`,
        `Sup! Chat colors let you personalize your chat appearance - name colors, text colors, all that! Need donator status. Once you donate, use !scc!`
      ],
      suggestions: ['How to donate?', 'Other donator features', 'Donation links', 'Commands']
    }
  };

  const responseData = responses[slangType];
  if (responseData) {
    const randomResponse = responseData.responses[Math.floor(Math.random() * responseData.responses.length)];
    return {
      response: randomResponse,
      suggestions: responseData.suggestions,
      confidence: 0.95,
      source: 'slang_detection'
    };
  }

  return null;
}

// Smart contextual response system
function getSmartContextualResponse(userMessage, conversationHistory, tf2Data) {
  const message = userMessage.toLowerCase().trim();
  const serverContext = createServerContext(tf2Data);

  // Check for slang patterns first
  const slangMatch = detectSlangPatterns(message);
  if (slangMatch) {
    return handleSlangQuery(slangMatch, message, serverContext);
  }

  // Get conversation context
  const context = getConversationContext(conversationHistory);

  // Detect user intent
  const intent = detectIntent(message, context);

  // Handle follow-up questions based on context
  if (context.lastTopic) {
    // MASSIVELY enhanced patterns for follow-up questions
    const followUpPatterns = {
      // How to get/access patterns - many variants
      HOW_TO_GET: [
        'how', 'where', 'when', 'what do i', 'steps', 'way to', 'method',
        'get them', 'get it', 'get this', 'get that', 'obtain', 'acquire',
        'access them', 'access it', 'use them', 'use it', 'enable',
        'unlock', 'activate', 'turn on', 'make work'
      ],

      // Why can't I patterns - frustrated user
      WHY_CANT: [
        'why cant', 'why can\'t', 'why dont', 'why don\'t', 'why not',
        'why no', 'how come', 'whats wrong', 'not working', 'broken',
        'no access', 'cant use', 'can\'t use', 'wont work', 'won\'t work',
        'denied', 'blocked', 'restricted', 'locked out'
      ],

      // What else patterns - wanting more info
      WHAT_ELSE: [
        'what else', 'anything else', 'other', 'more', 'additional',
        'also get', 'else do i get', 'other features', 'other benefits',
        'what more', 'whats included', 'what\'s included', 'full list'
      ],

      // Show me patterns - direct requests
      SHOW_LINKS: [
        'show', 'give', 'send', 'link', 'url', 'website', 'page',
        'where to', 'direct me', 'take me', 'find', 'locate'
      ]
    };

    // Check if message matches any follow-up pattern
    const matchesFollowUp = (patterns) => {
      return patterns.some(pattern =>
        message.includes(pattern.toLowerCase()) ||
        message.replace(/[^\w\s]/g, ' ').toLowerCase().includes(pattern.toLowerCase())
      );
    };

    if (matchesFollowUp(followUpPatterns.HOW_TO_GET)) {

      if (context.lastTopic === 'footprints') {
        // Adapt response based on user's tone
        let response = "You need donator status to access footprints! Once you're a donator, just type !cfp in chat to open the color selection menu.";

        if (intent.tone === 'FRUSTRATED') {
          response = "I know it's frustrating! Footprints require donator status, but it's easy to get - just visit tf2.sakoa.xyz for PayPal/Buy Me a Coffee options.";
        } else if (intent.tone === 'EXCITED') {
          response = "Awesome that you're interested! You'll need donator status for footprints - totally worth it! Use !cfp once you're a donator.";
        } else if (intent.tone === 'CONFUSED') {
          response = "No worries, let me explain! Footprints are a donator-only feature. Once you donate, you can use !cfp to customize your trail colors.";
        }

        return {
          response,
          suggestions: ['How to become donator?', 'Donation methods', 'Other donator features', 'Donation links'],
          confidence: 0.9,
          source: 'smart_context'
        };
      }

      if (context.lastTopic === 'chat_colors') {
        return {
          response: "You need donator status for custom chat colors! Once you're a donator, type !scc in chat to open the color customization menu.",
          suggestions: ['How to become donator?', 'Donation methods', 'Other donator features', 'Donation links'],
          confidence: 0.9,
          source: 'smart_context'
        };
      }

      if (context.lastTopic === 'robot') {
        return {
          response: "You need donator status for robot transformation! Once you're a donator, type !robot in chat to toggle robot mode.",
          suggestions: ['How to become donator?', 'Donation methods', 'Other donator features', 'Donation links'],
          confidence: 0.9,
          source: 'smart_context'
        };
      }
    }

    // "how to donate?" or "how can I donate?"
    if (message.includes('how') && (message.includes('donat') || message.includes('become donator'))) {
      return {
        response: `You can donate through multiple methods:\n\n• **PayPal** - Visit tf2.sakoa.xyz and click the PayPal button\n• **Buy Me a Coffee** - Visit tf2.sakoa.xyz and click the Buy Me a Coffee button\n• **Contact admins** - Use !discord in-game for other payment methods\n\nAll donation options are available on tf2.sakoa.xyz!`,
        suggestions: ['Show me the links', 'Donation benefits', 'Discord info', 'What do I get as donator?'],
        confidence: 0.95,
        source: 'smart_context'
      };
    }

    // "links" or "show me links" or "give me links"
    if (message.includes('link') || message.includes('url') || (message.includes('show') && message.includes('me'))) {
      return {
        response: `Here are the donation links:\n\n🌐 **Main Website**: tf2.sakoa.xyz\n💳 **PayPal**: Available on tf2.sakoa.xyz (click PayPal button)\n☕ **Buy Me a Coffee**: Available on tf2.sakoa.xyz (click Buy Me a Coffee button)\n💬 **Discord**: Use !discord in-game for invite link\n\nAll donation methods are conveniently located on the main website!`,
        suggestions: ['Donation benefits', 'What do I get?', 'Discord info', 'Other questions'],
        confidence: 0.95,
        source: 'smart_context'
      };
    }

    // "what else do I get" or "what do I get as donator" or "donator benefits"
    if ((message.includes('what') && (message.includes('get') || message.includes('benefit'))) ||
        message.includes('donator benefit') || message.includes('vip benefit') ||
        (message.includes('what') && message.includes('else')) ||
        (message.includes('what') && message.includes('donator')) ||
        message.includes('other donator features') || message.includes('other features')) {
      return {
        response: `As a donator you get access to:\n\n🎨 **Colored Footprints** - Leave colorful trails (!cfp)\n🌈 **Custom Chat Colors** - Personalize your name/text colors (!scc)\n🤖 **Robot Transformation** - Turn into MvM robot models (!robot)\n⚡ **Killstreak Effects** - Custom killstreak counters (!ks)\n🗳️ **2x Vote Weight** - Your votes count double\n🎯 **Priority Features** - Access to exclusive commands\n\nAll these features make your gameplay more fun and personalized!`,
        suggestions: ['How to donate?', 'Donation methods', 'Show me the links', 'Commands'],
        confidence: 0.95,
        source: 'smart_context'
      };
    }

    // Handle "why don't I have access" or "why can't I use"
    if ((message.includes('why') && (message.includes('dont') || message.includes("don't") || message.includes('cant') || message.includes("can't"))) ||
        (message.includes('why') && message.includes('access')) ||
        message.includes('no access') || message.includes('cant access')) {

      if (context.lastTopic === 'footprints' || context.mentionedFeatures.includes('footprints')) {
        return {
          response: "You don't have access to footprints because they're a donator-only feature. You need donator status to use !cfp and customize your footprint colors.",
          suggestions: ['How to become donator?', 'Donation methods', 'What do I get as donator?', 'Show me the links'],
          confidence: 0.9,
          source: 'smart_context'
        };
      }

      return {
        response: "Most premium features like footprints, chat colors, and robot transformation require donator status. This helps support the server and gives donators special perks!",
        suggestions: ['How to donate?', 'What do I get as donator?', 'Donation methods', 'Show me the links'],
        confidence: 0.8,
        source: 'smart_context'
      };
    }
  }

  // Simple Q&A pairs for common quick questions
  const simpleQA = getSimpleQuestionAnswers(message, context);
  if (simpleQA) {
    return simpleQA;
  }

  return null;
}

// Simple question/answer pairs for quick responses
function getSimpleQuestionAnswers(message, context) {
  const simpleQuestions = {
    // Enhanced greetings with more slang
    greetings: {
      patterns: [
        'hi', 'hello', 'hey', 'yo', 'sup', 'wassup', 'whats up', 'good morning', 'good evening',
        'howdy', 'hiya', 'heya', 'ey', 'ayy', 'yoo', 'waddup', 'whassup', 'heyy', 'hii',
        'morning', 'evening', 'afternoon', 'greetings', 'salutations'
      ],
      responses: [
        "Hey there! I can help with TF2 server questions, donations, and commands!",
        "Hello! Ask me about footprints, donations, or server features!",
        "Hi! What would you like to know about the server?",
        "Yo! What's up? I can help with server info, donations, and commands!",
        "Hey! Need help with the TF2 server? Ask me anything!"
      ],
      suggestions: ['What are footprints?', 'How to donate?', 'Server commands', 'Donator features']
    },

    // Quick yes/no style questions
    quick_questions: {
      'is it free': {
        response: "The server is free to play! Some premium features require donator status.",
        suggestions: ['Donator features', 'How to donate?', 'What do I get?']
      },
      'how much': {
        response: "Donations are flexible - any amount helps! Visit tf2.sakoa.xyz for PayPal/Buy Me a Coffee options.",
        suggestions: ['Show me links', 'Donation benefits', 'What do I get?']
      },
      'is it worth it': {
        response: "Donators get colored footprints, chat colors, robot mode, killstreaks, 2x vote weight, and more!",
        suggestions: ['How to donate?', 'Show me links', 'Other features']
      },
      'how long': {
        response: "Donator status is permanent once you donate! No monthly fees or expiration.",
        suggestions: ['How to donate?', 'What do I get?', 'Show me links']
      }
    },

    // One-word questions
    one_word: {
      'footprints': "Colorful trails behind you as you walk! Donator feature. Use !cfp to customize colors.",
      'colors': "Custom chat colors for your name and text! Donator feature. Use !scc to customize.",
      'robot': "Transform into Mann vs Machine robot models! Donator feature. Use !robot to toggle.",
      'donate': `Donate here:\n• PayPal: https://paypal.me/sakacom\n• Buy Me a Coffee: https://www.buymeacoffee.com/sakoa\n• Or visit tf2.sakoa.xyz for all options!`,
      'commands': "Use !help in-game for full list. Popular ones: !solo, !rtv, !nominate, !stats",
      'solo': "1v1 matches at round end! Use !solo to join/leave the queue.",
      'help': "I can help with server features, donations, commands, and gameplay questions!",
      'discord': "Join our Discord: https://discord.gg/JuxYYVEkzc or use !discord in-game for the link.",
      'server': "TF2 Dodgeball servers in Frankfurt! Check tf2.sakoa.xyz for live status.",
      'ip': `Server IPs:\n• Main: 45.81.234.145:27015\n• Advanced: 37.114.54.74:27015 (Coming Soon)`,
      'connect': `Connect via Steam:\n• Main: steam://connect/45.81.234.145:27015\n• Advanced: steam://connect/37.114.54.74:27015\nOr visit tf2.sakoa.xyz for live status!`,
      'ai': "I'm an AI assistant powered by Augment Agent! I help with server questions, commands, and features.",
      'chatbot': "I'm here to help with TF2 server questions! Ask about commands, donations, or gameplay features.",
      'bot': "I'm an AI chatbot that can help with server info, commands, donations, and more! What do you need?",
      'stats': "Check your performance with !stats, !rank, !topspeed. View leaderboards on tf2.sakoa.xyz!"
    },

    // Casual/slang responses
    casual: {
      patterns: ['cool', 'nice', 'awesome', 'sweet', 'dope', 'sick', 'lit', 'fire'],
      responses: [
        "Glad you like it! Anything else you want to know?",
        "Right? The server has some cool features! What else interests you?",
        "Thanks! Ask me about other features too!"
      ],
      suggestions: ['Other features', 'How to donate?', 'Commands', 'Solo system']
    },

    // Confused/frustrated responses
    confused: {
      patterns: ['confused', 'dont understand', 'don\'t understand', 'what', 'huh', 'unclear', 'lost'],
      responses: [
        "No worries! Let me explain it simpler. What specifically are you confused about?",
        "I'll help clarify! What part would you like me to explain better?",
        "Let me break it down for you! What's the main thing you want to know?"
      ],
      suggestions: ['What are footprints?', 'How to donate?', 'Basic commands', 'Start over']
    }
  };

  // Check one-word questions first
  const singleWord = message.trim();
  if (simpleQuestions.one_word[singleWord]) {
    return {
      response: simpleQuestions.one_word[singleWord],
      suggestions: ['How do I get this?', 'Other features', 'How to donate?'],
      confidence: 0.9,
      source: 'simple_qa'
    };
  }

  // Check greetings
  if (simpleQuestions.greetings.patterns.some(pattern => message.includes(pattern))) {
    const responses = simpleQuestions.greetings.responses;
    return {
      response: responses[Math.floor(Math.random() * responses.length)],
      suggestions: simpleQuestions.greetings.suggestions,
      confidence: 0.8,
      source: 'simple_qa'
    };
  }

  // Check quick questions
  for (const [key, data] of Object.entries(simpleQuestions.quick_questions)) {
    if (message.includes(key)) {
      return {
        response: data.response,
        suggestions: data.suggestions,
        confidence: 0.85,
        source: 'simple_qa'
      };
    }
  }

  // Check casual responses
  if (simpleQuestions.casual.patterns.some(pattern => message.includes(pattern))) {
    const responses = simpleQuestions.casual.responses;
    return {
      response: responses[Math.floor(Math.random() * responses.length)],
      suggestions: simpleQuestions.casual.suggestions,
      confidence: 0.7,
      source: 'simple_qa'
    };
  }

  // Check confused responses
  if (simpleQuestions.confused.patterns.some(pattern => message.includes(pattern))) {
    const responses = simpleQuestions.confused.responses;
    return {
      response: responses[Math.floor(Math.random() * responses.length)],
      suggestions: simpleQuestions.confused.suggestions,
      confidence: 0.8,
      source: 'simple_qa'
    };
  }

  return null;
}

// Get conversation context from history
function getConversationContext(conversationHistory) {
  const context = {
    lastTopic: null,
    recentTopics: [],
    mentionedDonation: false,
    mentionedFeatures: []
  };

  // Analyze last few messages for context
  const recentMessages = conversationHistory.slice(-4);

  for (const msg of recentMessages) {
    const text = (msg.message || msg.response || '').toLowerCase();

    // Detect topics
    if (text.includes('footprint')) {
      context.lastTopic = 'footprints';
      context.recentTopics.push('footprints');
      context.mentionedFeatures.push('footprints');
    }
    if (text.includes('chat color') || text.includes('name color')) {
      context.lastTopic = 'chat_colors';
      context.recentTopics.push('chat_colors');
      context.mentionedFeatures.push('chat_colors');
    }
    if (text.includes('robot')) {
      context.lastTopic = 'robot';
      context.recentTopics.push('robot');
      context.mentionedFeatures.push('robot');
    }
    if (text.includes('donat') || text.includes('vip')) {
      context.mentionedDonation = true;
      context.recentTopics.push('donation');
    }
    if (text.includes('solo')) {
      context.lastTopic = 'solo';
      context.recentTopics.push('solo');
    }
  }

  return context;
}

// Improved fallback response system
function getFallbackResponse(userMessage, tf2Data, conversationHistory = []) {
  const message = userMessage.toLowerCase();
  const context = getConversationContext(conversationHistory);
  const serverContext = createServerContext(tf2Data);

  // Context-aware responses
  if (context.lastTopic && (message.includes('how') || message.includes('get') || message.includes('access'))) {
    if (context.lastTopic === 'footprints') {
      return {
        response: "You need donator status to access footprints! Type !cfp in chat once you're a donator.",
        suggestions: ['How to donate?', 'Donation methods', 'Other donator features'],
        confidence: 0.7,
        source: 'context_fallback'
      };
    }
  }

  // Enhanced topic queries with multiple response variations
  if (message.includes('footprint')) {
    const footprintResponses = [
      "Footprints are colorful trails that appear behind you as you walk around the map! It's a donator feature that makes your movement more visible and fun.",
      "Think of footprints like colorful paint trails that follow your character! Donators can customize the colors using !cfp.",
      "Footprints leave cool colored trails as you move around - it's one of the popular donator perks!",
      "Ever wanted to leave a colorful trail behind you? That's what footprints do! Donator feature with customizable colors."
    ];

    return {
      response: footprintResponses[Math.floor(Math.random() * footprintResponses.length)],
      suggestions: ['How do I get them?', 'Other donator features', 'How to donate?'],
      confidence: 0.7,
      source: 'fallback'
    };
  }

  if (message.includes('chat color') || message.includes('name color')) {
    return {
      response: "Custom chat colors let you personalize your name and text colors in chat! It's a donator feature that helps you stand out.",
      suggestions: ['How do I get them?', 'Other donator features', 'How to donate?'],
      confidence: 0.7,
      source: 'fallback'
    };
  }

  if (message.includes('robot')) {
    return {
      response: "Robot transformation lets you turn into authentic Mann vs Machine robot models! It's a donator feature that works with all TF2 classes.",
      suggestions: ['How do I get it?', 'Other donator features', 'How to donate?'],
      confidence: 0.7,
      source: 'fallback'
    };
  }

  // Check for donator benefits questions BEFORE donation questions
  if ((message.includes('what') && (message.includes('get') || message.includes('benefit'))) ||
      message.includes('donator benefit') || message.includes('vip benefit') ||
      (message.includes('what') && message.includes('else')) ||
      (message.includes('what') && message.includes('donator') && !message.includes('how'))) {
    return {
      response: `As a donator you get access to:\n\n🎨 **Colored Footprints** - Leave colorful trails (!cfp)\n🌈 **Custom Chat Colors** - Personalize your name/text colors (!scc)\n🤖 **Robot Transformation** - Turn into MvM robot models (!robot)\n⚡ **Killstreak Effects** - Custom killstreak counters (!ks)\n🗳️ **2x Vote Weight** - Your votes count double\n🎯 **Priority Features** - Access to exclusive commands\n\nAll these features make your gameplay more fun and personalized!`,
      suggestions: ['How to donate?', 'Donation methods', 'Show me the links', 'Commands'],
      confidence: 0.9,
      source: 'fallback'
    };
  }

  if (message.includes('donat') || message.includes('vip') || (message.includes('how') && message.includes('donate'))) {
    return {
      response: `You can donate through:\n\n• **PayPal** - Visit tf2.sakoa.xyz\n• **Buy Me a Coffee** - Visit tf2.sakoa.xyz\n• **Discord** - Use !discord for other methods\n\nAll options available on tf2.sakoa.xyz!`,
      suggestions: ['Show me the links', 'What do I get?', 'Donation benefits'],
      confidence: 0.8,
      source: 'fallback'
    };
  }

  if (message.includes('link') || message.includes('url')) {
    return {
      response: `🌐 **Website**: tf2.sakoa.xyz\n💳 **PayPal**: Available on website\n☕ **Buy Me a Coffee**: Available on website\n💬 **Discord**: Use !discord in-game\n\nAll donation methods are on tf2.sakoa.xyz!`,
      suggestions: ['Donation benefits', 'What do I get?', 'Other questions'],
      confidence: 0.8,
      source: 'fallback'
    };
  }

  if (message.includes('solo')) {
    return {
      response: "Solo queue lets you participate in 1v1 matches at round end! Use !solo to join/leave the queue. Must be on Red/Blue team and not during active rounds.",
      suggestions: ['NER system', 'Voting', 'Commands'],
      confidence: 0.7,
      source: 'fallback'
    };
  }

  // Default response
  return {
    response: "I can help with server features, donations, commands, and gameplay! Try asking about footprints, chat colors, donations, or the solo system.",
    suggestions: ['What are footprints?', 'How to donate?', 'Solo system', 'Commands'],
    confidence: 0.4,
    source: 'fallback'
  };
}

// Generate contextual suggestions
function generateSuggestions(userMessage, botResponse, tf2Data, conversationHistory = []) {
  const message = userMessage.toLowerCase();
  const response = botResponse.toLowerCase();
  const context = getConversationContext(conversationHistory);

  // Context-aware suggestions based on conversation flow
  if (message.includes('footprint') || response.includes('footprint')) {
    if (response.includes('donator') || response.includes('need')) {
      return ['How do I get them?', 'How to donate?', 'Donation methods', 'Other donator features'];
    }
    return ['How to become donator?', 'Other donator features', 'Chat colors', 'Robot transformation'];
  }

  if (message.includes('chat color') || response.includes('chat color')) {
    if (response.includes('donator') || response.includes('need')) {
      return ['How do I get them?', 'How to donate?', 'Donation methods', 'Other donator features'];
    }
    return ['How to become donator?', 'Other donator features', 'Footprints', 'Robot transformation'];
  }

  if (message.includes('robot') || response.includes('robot')) {
    if (response.includes('donator') || response.includes('need')) {
      return ['How do I get it?', 'How to donate?', 'Donation methods', 'Other donator features'];
    }
    return ['How to become donator?', 'Other donator features', 'Footprints', 'Chat colors'];
  }

  if (message.includes('donat') || response.includes('donat') || message.includes('how') && message.includes('donate')) {
    if (response.includes('paypal') || response.includes('coffee') || response.includes('website')) {
      return ['Show me the links', 'What do I get as donator?', 'Donation benefits', 'Discord info'];
    }
    return ['Donation methods', 'Show me the links', 'What do I get?', 'Discord info'];
  }

  if (message.includes('link') || message.includes('url') || response.includes('tf2.sakoa.xyz')) {
    return ['What do I get as donator?', 'Donation benefits', 'Discord info', 'Other questions'];
  }

  if (message.includes('solo') || response.includes('solo')) {
    return ['NER system', 'Voting system', 'Commands', 'Stats'];
  }

  if (message.includes('command') || response.includes('command')) {
    return ['Donator commands', 'Voting commands', 'Stats commands', 'Help'];
  }

  // Default suggestions based on context
  if (context.mentionedDonation) {
    return ['Donation benefits', 'Show me the links', 'What do I get?', 'Other features'];
  }

  if (context.mentionedFeatures.length > 0) {
    return ['How to donate?', 'Donation methods', 'Other donator features', 'Commands'];
  }

  // Default suggestions
  return ['What are footprints?', 'How to donate?', 'Solo system', 'Commands'];
}

// Initialize on startup
initializeHuggingFace();
