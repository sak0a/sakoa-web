import fs from 'fs';
import path from 'path';
import { getConversationalResponse } from '../utils/conversational-ai.js';

// Get the absolute path to the project root directory
const projectRoot = process.cwd().includes('.output/server')
  ? path.join(process.cwd(), '../../')
  : process.cwd();
const tf2DataPath = path.join(projectRoot, 'server/data/tf2_server_data.json');
const settingsPath = path.join(projectRoot, 'server/data/settings.json');

// Load TF2 server data
async function loadTF2Data() {
  try {
    const data = await fs.promises.readFile(tf2DataPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load TF2 server data:', error);
    return null;
  }
}

// Check if chatbot is enabled in settings
async function isChatbotEnabled() {
  try {
    const data = await fs.promises.readFile(settingsPath, 'utf8');
    const settings = JSON.parse(data);
    return settings.chatbot?.enabled !== false; // Default to true if not set
  } catch (error) {
    console.error('Failed to load settings for chatbot check:', error);
    return true; // Default to enabled if settings can't be loaded
  }
}

// Casual/slang detection for better recognition of informal queries
function detectCasualPatterns(message) {
  const casualPatterns = [
    // Casual donation queries - handles "yo how to get donator" etc.
    { pattern: /yo.*how.*(get|become).*(donat|vip)/i, type: 'donation', confidence: 0.95 },
    { pattern: /hey.*how.*(get|become).*(donat|vip)/i, type: 'donation', confidence: 0.95 },
    { pattern: /sup.*how.*(get|become).*(donat|vip)/i, type: 'donation', confidence: 0.95 },
    { pattern: /(yo|hey|sup|wassup).*donat/i, type: 'donation', confidence: 0.85 },
    { pattern: /(wanna|want|need).*donat/i, type: 'donation', confidence: 0.85 },
    { pattern: /where.*donat/i, type: 'donation', confidence: 0.85 },
    { pattern: /how.*get.*vip/i, type: 'donation', confidence: 0.9 },

    // Casual server connection queries
    { pattern: /(yo|hey|sup).*how.*(connect|join)/i, type: 'connection', confidence: 0.9 },
    { pattern: /(yo|hey|sup).*(server|ip)/i, type: 'connection', confidence: 0.8 },
    { pattern: /(wanna|want).*join/i, type: 'connection', confidence: 0.8 },
    { pattern: /(wanna|want).*play/i, type: 'connection', confidence: 0.8 },

    // Casual feature queries
    { pattern: /(yo|hey|sup).*what.*(get|benefit|perk)/i, type: 'features', confidence: 0.9 },
    { pattern: /(yo|hey|sup).*(footprint|robot|color)/i, type: 'features', confidence: 0.8 },
    { pattern: /what.*donator.*get/i, type: 'features', confidence: 0.9 },

    // Casual command queries
    { pattern: /(yo|hey|sup).*(command|help|cmd)/i, type: 'commands', confidence: 0.8 },
    { pattern: /need.*help/i, type: 'commands', confidence: 0.7 },
    { pattern: /show.*command/i, type: 'commands', confidence: 0.8 },

    // Casual AI queries
    { pattern: /(yo|hey|sup).*who.*you/i, type: 'ai', confidence: 0.8 },
    { pattern: /(yo|hey|sup).*what.*you/i, type: 'ai', confidence: 0.8 }
  ];

  for (const { pattern, type, confidence } of casualPatterns) {
    if (pattern.test(message)) {
      return { type, confidence, matched: true };
    }
  }

  return { matched: false };
}

// Handle casual queries with appropriate responses
function handleCasualQuery(type, message, tf2Data) {
  switch (type) {
    case 'donation':
      return {
        response: `Yo! Here's how to donate:\n\n• **PayPal**: https://paypal.me/sakacom\n• **Buy Me a Coffee**: https://www.buymeacoffee.com/sakoa\n• **Website**: tf2.sakoa.xyz (all options)\n• **Discord**: https://discord.gg/JuxYYVEkzc\n\nYou'll get sick donator features like footprints, chat colors, robot mode, and more!`,
        suggestions: ['What do I get?', 'Show me features', 'Server connection', 'Commands']
      };

    case 'connection':
      return {
        response: `Hey! Here's how to connect:\n\n• **Main Server**: steam://connect/45.81.234.145:27015\n• **Advanced**: steam://connect/37.114.54.74:27015 (Coming Soon)\n• **Location**: 🇩🇪 Frankfurt\n\nCheck tf2.sakoa.xyz for live status!`,
        suggestions: ['Server features', 'How to play', 'Discord', 'Donations']
      };

    case 'features':
      return {
        response: `Yo! Donator perks are fire:\n\n🎨 **Colored Footprints** - Leave sick trails (!cfp)\n🌈 **Custom Chat Colors** - Pimp your name/text (!scc)\n🤖 **Robot Mode** - Transform into MvM robots (!robot)\n⚡ **Killstreaks** - Custom counters (!ks)\n🗳️ **2x Vote Weight** - Your votes count double\n\nTotally worth it!`,
        suggestions: ['How to donate?', 'Show me links', 'Commands', 'Server info']
      };

    case 'commands':
      return {
        response: `Hey! Popular commands:\n\n• **!help** - Full command list\n• **!solo** - Join 1v1 queue\n• **!stats** - Your performance\n• **!rtv** - Rock the vote\n• **!nominate** - Suggest maps\n• **!discord** - Get Discord link\n\n**Donator commands**: !cfp, !scc, !robot, !ks`,
        suggestions: ['Donator commands', 'How to donate?', 'Server connection', 'Features']
      };

    case 'ai':
      return {
        response: `Yo! I'm **Augment Agent** - an AI assistant powered by Augment Code! I help with TF2 server questions, donations, commands, and features. What's up?`,
        suggestions: ['Donation links', 'Server connection', 'Donator features', 'Commands']
      };

    default:
      return null;
  }
}

// Enhanced natural language understanding
function matchQuery(userMessage, tf2Data) {
  const message = userMessage.toLowerCase().trim();

  // Check for casual/slang patterns first (handles "yo how to get donator" etc.)
  const casualMatch = detectCasualPatterns(message);
  if (casualMatch.matched) {
    console.log(`🎯 Casual pattern detected: "${message}" -> ${casualMatch.type} (confidence: ${casualMatch.confidence})`);
    return handleCasualQuery(casualMatch.type, message, tf2Data);
  }

  // Create semantic patterns for better matching
  const patterns = {
    // Solo system patterns
    solo: [
      'solo', 'solo queue', 'solo system', '1v1', 'one vs one', 'one on one'
    ],
    soloQuestions: [
      'explain', 'what is', 'how does', 'tell me about', 'info about', 'describe'
    ],

    // NER system patterns
    ner: [
      'ner', 'never ending', 'continuous rounds', 'endless rounds', 'no map change'
    ],

    // Interaction patterns
    interaction: [
      'work together', 'work with', 'compatible', 'during', 'when active', 'if active', 'while'
    ],

    // Robot patterns
    robot: [
      'robot', 'robot mode', 'robot transformation', 'mvm robot', 'mann vs machine'
    ],

    // PvB patterns
    pvb: [
      'pvb', 'player vs bot', 'bot mode', 'bots', 'bot opponents'
    ],

    // Donation patterns with typing variants and slang
    donation: [
      'donate', 'donation', 'donator', 'vip', 'support', 'benefits',
      'donat', 'dontion', 'donaton', 'donor', 'donating',
      'how to get donator', 'how to become donator', 'how get vip',
      'wanna donate', 'want to donate', 'need to donate', 'can i donate',
      'where donate', 'where to donate', 'donation links'
    ],

    // Command patterns with variants
    commands: [
      'command', 'commands', 'available commands', 'help', 'list',
      'cmd', 'cmds', 'comand', 'commnd', 'comandos'
    ],

    // Server connection patterns
    connection: [
      'connect', 'join', 'server ip', 'ip address', 'steam connect',
      'conect', 'conectt', 'connct', 'connet', 'enter', 'access'
    ],

    // Discord patterns
    discord: [
      'discord', 'discord link', 'discord invite', 'discord server',
      'discrd', 'disc', 'ds'
    ],

    // AI/Chatbot patterns
    ai: [
      'who are you', 'what are you', 'ai', 'chatbot', 'bot', 'augment',
      'ai agent', 'assistant', 'artificial intelligence'
    ],

    // Specific feature patterns with variants
    chatColors: [
      'chat color', 'chat colors', 'name color', 'name colors', 'custom colors', 'color chat',
      'colour', 'colours', 'colr', 'colur', 'clor'
    ],

    footprints: [
      'footprint', 'footprints', 'colored footprint', 'colored footprints',
      'foot print', 'foot prints', 'footstep', 'footsteps', 'footprnts', 'fotprints'
    ],

    killstreaks: [
      'killstreak', 'killstreaks', 'ks', 'kill streak', 'streak'
    ],

    fov: [
      'fov', 'field of view', 'change fov', 'set fov'
    ],

    thirdPerson: [
      'third person', 'tp', 'third-person', 'camera view'
    ],

    stats: [
      'stats', 'statistics', 'my stats', 'rank', 'ranking', 'leaderboard position'
    ],

    voting: [
      'vote', 'voting', 'rtv', 'rock the vote', 'map vote', 'nominate'
    ]
  };

  // Helper function to check if message contains any pattern
  const containsPattern = (patternArray) => {
    return patternArray.some(pattern => message.includes(pattern));
  };

  // Helper function to check if message is asking a question
  const isQuestion = () => {
    return patterns.soloQuestions.some(q => message.includes(q)) ||
           message.includes('how') || message.includes('what') ||
           message.includes('can i') || message.includes('does') ||
           message.includes('tell me') || message.includes('explain');
  };

  // Check for system interactions first (highest priority)
  if (containsPattern(patterns.solo) && containsPattern(patterns.ner)) {
    return handleSoloNERInteraction(message, tf2Data);
  }

  if (containsPattern(patterns.solo) && containsPattern(patterns.interaction)) {
    return handleSoloNERInteraction(message, tf2Data);
  }

  // Check for specific system queries
  if (containsPattern(patterns.solo) && isQuestion()) {
    return handleSoloSystemQuery(message, tf2Data);
  }

  if (containsPattern(patterns.ner) && isQuestion()) {
    return handleNERQuery(message, tf2Data);
  }

  if (containsPattern(patterns.robot) && isQuestion()) {
    return handleRobotQuery(message, tf2Data);
  }

  if (containsPattern(patterns.pvb) && isQuestion()) {
    return handlePvBQuery(message, tf2Data);
  }

  if (containsPattern(patterns.donation) && isQuestion()) {
    return handleDonationQuery(message, tf2Data);
  }

  if (containsPattern(patterns.commands) && isQuestion()) {
    return handleCommandQuery(message, tf2Data);
  }

  // Check for specific feature queries
  if (containsPattern(patterns.chatColors) && isQuestion()) {
    return handleChatColorsQuery(message, tf2Data);
  }

  if (containsPattern(patterns.footprints) && isQuestion()) {
    return handleFootprintsQuery(message, tf2Data);
  }

  if (containsPattern(patterns.killstreaks) && isQuestion()) {
    return handleKillstreaksQuery(message, tf2Data);
  }

  if (containsPattern(patterns.fov) && isQuestion()) {
    return handleFOVQuery(message, tf2Data);
  }

  if (containsPattern(patterns.thirdPerson) && isQuestion()) {
    return handleThirdPersonQuery(message, tf2Data);
  }

  if (containsPattern(patterns.stats) && isQuestion()) {
    return handleStatsQuery(message, tf2Data);
  }

  if (containsPattern(patterns.voting) && isQuestion()) {
    return handleVotingQuery(message, tf2Data);
  }

  // AI/Chatbot queries with enhanced pattern matching
  if (containsPattern(patterns.ai)) {
    return handleAIQuery(message, tf2Data);
  }

  // Server connection queries
  if (containsPattern(patterns.connection) || message.includes('server') || message.includes('status')) {
    return handleServerQuery(message, tf2Data);
  }

  // Discord queries
  if (containsPattern(patterns.discord)) {
    return handleServerQuery(message, tf2Data); // Discord is handled in server query
  }

  // Command queries
  if (containsPattern(patterns.commands) || message.includes('!') || message.includes('sm_')) {
    return handleCommandQuery(message, tf2Data);
  }

  // Donation queries with enhanced patterns
  if (containsPattern(patterns.donation) || message.includes('tier') || message.includes('benefit')) {
    return handleDonationQuery(message, tf2Data);
  }

  // Statistics queries
  if (message.includes('stat') || message.includes('rank') || message.includes('leaderboard') || message.includes('season')) {
    return handleStatsQuery(message, tf2Data);
  }

  // Gameplay queries
  if (message.includes('how to play') || message.includes('dodgeball') || message.includes('gameplay') || message.includes('rules')) {
    return handleGameplayQuery(message, tf2Data);
  }

  // Voting queries
  if (message.includes('vote') || message.includes('rtv') || message.includes('map') || message.includes('nominate')) {
    return handleVotingQuery(message, tf2Data);
  }

  // Common questions with better matching
  const commonQuestions = tf2Data?.common_questions || {};
  for (const [key, qa] of Object.entries(commonQuestions)) {
    const keyWords = key.replace(/_/g, ' ').split(' ');
    const questionWords = qa.question.toLowerCase().split(' ');

    // Check if message contains key concepts from the question
    if (keyWords.some(word => message.includes(word)) ||
        questionWords.some(word => word.length > 3 && message.includes(word))) {
      return {
        response: qa.answer,
        suggestions: ['More help', 'Commands', 'Other questions']
      };
    }
  }

  // Troubleshooting
  if (message.includes('not working') || message.includes('problem') || message.includes('issue') || message.includes('help')) {
    return handleTroubleshootingQuery(message, tf2Data);
  }

  // Enhanced default response with context
  return {
    response: "I can help you with specific server features and questions! Try asking about:\n\n• **Solo System** - \"Explain the solo system\"\n• **Commands** - \"What commands are available?\"\n• **Donations** - \"What are donator benefits?\"\n• **Gameplay** - \"How does dodgeball work?\"\n• **Voting** - \"How does RTV work?\"\n\nWhat would you like to know more about?",
    suggestions: [
      "Explain solo system",
      "Show me commands",
      "Donator benefits",
      "How does voting work?"
    ]
  };
}

function handleCommandQuery(message, tf2Data) {
  const commands = tf2Data?.commands || {};
  
  // Specific command lookup
  const commandMatch = message.match(/(!?\w+|sm_\w+)/);
  if (commandMatch) {
    const cmd = commandMatch[0].replace('!', 'sm_');
    
    // Search in all command categories
    for (const [category, cmdList] of Object.entries(commands)) {
      if (typeof cmdList === 'object') {
        for (const [command, description] of Object.entries(cmdList)) {
          if (command === cmd || command.includes(cmd.replace('sm_', ''))) {
            return {
              response: `**${command}**: ${description}`,
              suggestions: ['Show all commands', 'Donator commands', 'Admin commands']
            };
          }
        }
      }
    }
  }
  
  // Category-specific requests
  if (message.includes('donator') || message.includes('donor')) {
    const donatorCmds = commands.donator_only_commands || {};
    const cmdList = Object.entries(donatorCmds)
      .map(([cmd, desc]) => `**${cmd}**: ${desc}`)
      .join('\n');
    
    return {
      response: `**Donator Commands:**\n${cmdList}\n\n*Note: These commands require donator status.*`,
      suggestions: ['How to become donator?', 'Check donator status', 'General commands']
    };
  }
  
  if (message.includes('admin')) {
    return {
      response: "Admin commands are available to server administrators only. Use !help in-game for your available commands.",
      suggestions: ['General commands', 'Donator commands', 'How to play']
    };
  }
  
  // General commands
  const generalCmds = commands.general_player_commands || {};
  const topCommands = Object.entries(generalCmds)
    .slice(0, 8)
    .map(([cmd, desc]) => `**${cmd}**: ${desc}`)
    .join('\n');
  
  return {
    response: `**Popular Commands:**\n${topCommands}\n\n*Use !help in-game for the complete list.*`,
    suggestions: ['Donator commands', 'Voting commands', 'Stats commands']
  };
}

function handleDonationQuery(message, tf2Data) {
  const donationSystem = tf2Data?.donation_system || {};
  const benefits = donationSystem.benefits || [];

  // Handle donation links requests
  if (message.includes('link') || message.includes('url') || message.includes('where') || message.includes('show me')) {
    return {
      response: `**Donation Links:**\n\n• **PayPal**: http://paypal.me/sakoacom\n• **Revolut**: https://revolut.me/laurinnoel\n• **Buy Me a Coffee**: https://www.buymeacoffee.com/sakoa\n• **Website**: tf2.sakoa.xyz (all options available)\n• **Discord**: https://discord.gg/JuxYYVEkzc (for other methods)\n\n**Note**: Processing fees vary between payment methods. Only the net amount received counts toward donation tiers.\n\nAll donation options are conveniently located on the main website!`,
      suggestions: ['Donator benefits', 'What do I get?', 'Server connection', 'Commands']
    };
  }

  if (message.includes('benefit') || message.includes('what do i get')) {
    const benefitList = benefits.map(benefit => `• ${benefit}`).join('\n');
    return {
      response: `**Donator Benefits:**\n${benefitList}\n\n**Donate via:**\n• PayPal: https://paypal.me/sakacom\n• Buy Me a Coffee: https://www.buymeacoffee.com/sakoa\n• Visit: tf2.sakoa.xyz`,
      suggestions: ['Donation links', 'How to donate?', 'Donator commands']
    };
  }

  if (message.includes('how') || message.includes('become')) {
    return {
      response: `**How to Donate:**\n\n• **PayPal**: https://paypal.me/sakacom\n• **Buy Me a Coffee**: https://www.buymeacoffee.com/sakoa\n• **Website**: tf2.sakoa.xyz (all options)\n• **Discord**: https://discord.gg/JuxYYVEkzc (for other methods)\n\nChoose any method that works best for you!`,
      suggestions: ['Donator benefits', 'What do I get?', 'Discord info', 'Server connection']
    };
  }

  if (message.includes('check') || message.includes('status')) {
    return {
      response: "To check if you're a donator, try using any donator-only command like !robot or !cfp. If you have access, you're a donator!",
      suggestions: ['Donator commands', 'Donator benefits', 'How to donate?']
    };
  }

  return {
    response: `**Donation System:**\n${donationSystem.description}\n\n**Quick Links:**\n• PayPal: http://paypal.me/sakoacom\n• Revolut: https://revolut.me/laurinnoel\n• Buy Me a Coffee: https://www.buymeacoffee.com/sakoa\n• Website: tf2.sakoa.xyz\n\n**Important**: Processing fees vary between payment methods. Only the net amount received counts toward donation tiers.\n\nBenefits include 2x vote weight, premium features, and exclusive commands!`,
    suggestions: ['Donator benefits', 'What do I get?', 'Donation links', 'Commands']
  };
}

function handleAIQuery(message, tf2Data) {
  const aiInfo = tf2Data?.ai_agent_info || {};

  if (message.includes('who are you') || message.includes('what are you')) {
    return {
      response: `I'm **${aiInfo.name || 'Augment Agent'}** - an AI assistant powered by Augment Code's world-leading context engine!\n\n**Base Model**: ${aiInfo.base_model || 'Claude Sonnet 4 by Anthropic'}\n\n**I can help with:**\n• Server commands and features\n• Donation information and links\n• Gameplay mechanics and troubleshooting\n• Server connection details\n• Donator benefits and access\n\nI have access to live server data and can provide current information about the TF2 Dodgeball server!`,
      suggestions: ['Donation links', 'Server connection', 'Donator features', 'Commands']
    };
  }

  if (message.includes('capabilities') || message.includes('what can you do')) {
    const capabilities = aiInfo.capabilities || [];
    const capabilityList = capabilities.map(cap => `• ${cap}`).join('\n');
    return {
      response: `**My Capabilities:**\n${capabilityList}\n\n**Knowledge Sources:**\n• Live website data (tf2.sakoa.xyz)\n• Server configuration and settings\n• Plugin documentation and commands\n• Player statistics and leaderboards\n• Donation system and donor information\n\nAsk me anything about the TF2 Dodgeball server!`,
      suggestions: ['Donation info', 'Server connection', 'Commands', 'Features']
    };
  }

  return {
    response: `I'm **Augment Agent** - your AI assistant for the TF2 Dodgeball server! I can help with server info, commands, donations, and more. What would you like to know?`,
    suggestions: ['Donation links', 'Server connection', 'Donator features', 'Commands']
  };
}

function handleServerQuery(message, tf2Data) {
  const serverInfo = tf2Data?.server_info || {};
  const features = serverInfo.features || [];

  if (message.includes('connect') || message.includes('ip') || message.includes('join')) {
    return {
      response: `**Server Connection:**\n\n• **Main Server**: steam://connect/45.81.234.145:27015\n• **Advanced Server**: steam://connect/37.114.54.74:27015 (Coming Soon)\n• **Location**: 🇩🇪 Frankfurt, Germany\n• **Game Mode**: ${serverInfo.game_mode}\n\n**Live Status**: Check tf2.sakoa.xyz for current server status and player counts!`,
      suggestions: ['Server features', 'How to play', 'Discord info', 'Donations']
    };
  }

  if (message.includes('discord')) {
    return {
      response: `**Discord Server:**\n\n• **Direct Link**: https://discord.gg/JuxYYVEkzc\n• **In-Game**: Use !discord command for the invite link\n\nJoin our community for support, updates, and to connect with other players!`,
      suggestions: ['Server connection', 'Donation info', 'Commands', 'Features']
    };
  }

  const featureList = features.map(feature => `• ${feature}`).join('\n');
  return {
    response: `**${serverInfo.name}**\n${featureList}\n\n**Connection**: Visit tf2.sakoa.xyz for live server status and Steam connect links.`,
    suggestions: ['Connect to server', 'How to play', 'Commands', 'Donations']
  };
}

function handleStatsQuery(message, tf2Data) {
  const statsSystem = tf2Data?.statistics_system || {};
  const tracked = statsSystem.tracked_statistics || {};
  
  if (message.includes('season')) {
    const seasonal = statsSystem.seasonal_system || {};
    return {
      response: `**Seasonal System:**\n• ${seasonal.season_length}\n• ${seasonal.transition}\n• Previous seasons archived\n• Custom names preserved\n\nUse !season command in-game for current season info.`,
      suggestions: ['Check my stats', 'Leaderboard info', 'Commands']
    };
  }
  
  const statsList = Object.entries(tracked)
    .map(([stat, desc]) => `• **${stat}**: ${desc}`)
    .join('\n');
  
  return {
    response: `**Statistics Tracking:**\n${statsList}\n\nUse !stats or !rank commands in-game to view your statistics.`,
    suggestions: ['Season info', 'Leaderboard', 'Stats commands']
  };
}

function handleGameplayQuery(message, tf2Data) {
  const gameplay = tf2Data?.gameplay_mechanics?.dodgeball || {};
  const features = gameplay.features || [];
  
  const featureList = features.map(feature => `• ${feature}`).join('\n');
  
  return {
    response: `**TF2 Dodgeball:**\n${gameplay.description}\n\n**Features:**\n${featureList}\n\nUse !solo to join solo queue for 1v1 matches!`,
    suggestions: ['Commands', 'Solo queue info', 'Voting system']
  };
}

function handleVotingQuery(message, tf2Data) {
  const voting = tf2Data?.voting_systems || {};
  const types = voting.types || [];
  
  if (message.includes('rtv') || message.includes('rock')) {
    return {
      response: "**Rock the Vote (!rtv)**: Vote to change the current map. Requires 50% of weighted votes to pass. Donators get 2x vote weight!",
      suggestions: ['Map nominations', 'Voting system', 'Donator benefits']
    };
  }
  
  if (message.includes('nominate')) {
    return {
      response: "**Map Nominations (!nominate)**: Nominate maps for voting. Use !nominate [mapname] or just !nominate for a menu. Use 'listmaps' to see available maps.",
      suggestions: ['Rock the vote', 'Available maps', 'Voting system']
    };
  }
  
  const typeList = types.map(type => `• ${type}`).join('\n');
  
  return {
    response: `**Voting System:**\n${voting.description}\n\n**Vote Types:**\n${typeList}`,
    suggestions: ['Rock the vote', 'Map nominations', 'Donator benefits']
  };
}

function handleSoloSystemQuery(message, tf2Data) {
  let response = "**Solo Queue System**\n\n";

  response += "Join the solo queue to participate in 1v1 matches at the end of rounds!\n\n";

  response += "**How to use:**\n";
  response += "• Type `!solo` in chat to join/leave the solo queue\n";
  response += "• When the round ends, solo players are moved to teams for 1v1 matches\n";
  response += "• You can leave the queue anytime by using the command again\n\n";

  response += "**Requirements:**\n";
  response += "• Must be on Red or Blue team (not spectator)\n";
  response += "• Cannot join during active rounds\n";
  response += "• Cannot be the only player on your team\n\n";

  response += "**Note:** Solo is automatically disabled when NER (Never Ending Rounds) is active.";

  return {
    response,
    suggestions: ['Solo + NER interaction', 'Commands list', 'How does NER work?', 'Gameplay info']
  };
}

function handleNERQuery(message, tf2Data) {
  const nerImpl = tf2Data?.plugin_implementations?.sakaNER;

  let response = "**Never Ending Rounds (NER) System:**\n\n";

  if (nerImpl) {
    response += `${nerImpl.description}\n\n`;

    response += "**Commands:**\n";
    const voteCmd = nerImpl.commands.sm_votener;
    response += `• \`${voteCmd.syntax}\` - ${voteCmd.description}\n`;
    response += `• **Cooldown:** ${voteCmd.cooldown}\n`;
    response += `• \`sm_ner\` - Admin override command\n\n`;

    response += "**Requirements:**\n";
    voteCmd.requirements.forEach(req => {
      response += `• ${req}\n`;
    });

    response += "\n**Voting System:**\n";
    const voting = nerImpl.voting_system;
    response += `• ${voting.type}\n`;
    response += `• Vote duration: ${voting.duration}\n`;
    response += `• ${voting.donator_weight}\n`;
    response += `• ${voting.tie_handling}\n\n`;

    response += "**Integration:**\n";
    response += `• ${nerImpl.integration.solo_system}\n`;
    response += `• ${nerImpl.integration.dodgeball}`;
  } else {
    response += "NER toggles continuous rounds without map changes.\n\n";
    response += "**How it works:**\n";
    response += "• Use `!votener` or `sm_votener` to vote for NER toggle\n";
    response += "• Requires weighted voting to pass (donators get 2x weight)\n";
    response += "• When active, rounds continue indefinitely on the same map\n";
    response += "• When disabled, normal map rotation resumes";
  }

  return {
    response,
    suggestions: ['Solo + NER interaction', 'Voting system', 'Admin commands', 'Map voting']
  };
}

function handlePvBQuery(message, tf2Data) {
  const pvbInfo = tf2Data?.voting_mechanics?.pvb_voting;

  let response = "**Player vs Bot (PvB) System:**\n\n";
  response += "PvB mode enables bot opponents for practice or when player count is low.\n\n";
  response += "**How it works:**\n";
  response += "• Use `!votepvb` or `sm_votepvb` to vote for bot mode\n";
  response += "• Bots are added as opponents in dodgeball matches\n";
  response += "• Different bot difficulty modes available\n";
  response += "• Admin can force enable with `sm_pvb` (ROOT required)\n\n";

  if (pvbInfo) {
    response += "**Features:**\n";
    pvbInfo.features.forEach(feature => {
      response += `• ${feature}\n`;
    });
  }

  return {
    response,
    suggestions: ['Bot difficulty', 'Admin commands', 'Voting system', 'Gameplay modes']
  };
}

function handleRobotQuery(message, tf2Data) {
  let response = "**Robot Transformation** *(Donator Feature)*\n\n";

  response += "Transform your player model into authentic Mann vs Machine robots!\n\n";

  response += "**How to use:**\n";
  response += "• Type `!robot` in chat to toggle robot mode\n";
  response += "• Works with all TF2 classes\n";
  response += "• Automatically switches when you change classes\n";
  response += "• Stays active across respawns and map changes\n\n";

  response += "**Requirements:** Donator status required\n";
  response += "**Cooldown:** 30 seconds between toggles";

  return {
    response,
    suggestions: ['Chat colors', 'Footprints', 'Other donator features', 'How to donate?']
  };
}

function handleSoloNERInteraction(message, tf2Data) {
  return {
    response: "**Solo System + NER Interaction:**\n\n" +
             "Yes, the solo queue system works perfectly with Never Ending Rounds (NER)!\n\n" +
             "**How they work together:**\n" +
             "• Solo queue continues to function during NER\n" +
             "• 1v1 matches happen at the end of each round, even in NER mode\n" +
             "• Players can join/leave solo queue anytime during NER\n" +
             "• NER keeps the same map while solo matches rotate players\n" +
             "• Both systems use the same weighted voting (donators get 2x weight)\n\n" +
             "**Commands:**\n" +
             "• `!solo` - Join/leave solo queue\n" +
             "• `!votener` - Vote to toggle NER mode\n\n" +
             "*This combination is great for extended play sessions with competitive 1v1s!*",
    suggestions: ['Solo system details', 'NER system details', 'Voting system', 'Other game modes']
  };
}

function handleChatColorsQuery(message, tf2Data) {
  let response = "**Custom Chat Colors** *(Donator Feature)*\n\n";

  response += "Customize your name and chat text colors to stand out!\n\n";

  response += "**How to use:**\n";
  response += "• Type `!scc` in chat to open the color menu\n";
  response += "• Choose from preset group colors or create custom colors\n";
  response += "• Customize both your name color and chat text color\n\n";

  response += "**Requirements:** Donator status required\n\n";
  response += "**Note:** Custom name tags require admin approval - contact admins for special requests.";

  return {
    response,
    suggestions: ['How to donate?', 'Contact admins', 'Other donator features', 'Footprints']
  };
}

function handleFootprintsQuery(message, tf2Data) {
  let response = "**Colored Footprints** *(Donator Feature)*\n\n";

  response += "Leave colorful trails behind you as you walk around the map!\n\n";

  response += "**How to use:**\n";
  response += "• Type `!cfp` or `!footprints` in chat\n";
  response += "• Choose from different colors in the menu\n";
  response += "• Your setting is saved automatically\n\n";

  response += "**Requirements:** Donator status required";

  return {
    response,
    suggestions: ['Killstreaks', 'Chat colors', 'Other donator features', 'How to donate?']
  };
}

function handleKillstreaksQuery(message, tf2Data) {
  let response = "**Killstreak System** *(Donator Feature)*\n\n";

  response += "Customize your killstreak counter for visual effects!\n\n";

  response += "**How to use:**\n";
  response += "• Type `!ks [amount]` to set your killstreak (0-100)\n";
  response += "• Example: `!ks 25` sets killstreak to 25\n";
  response += "• Use `!ks 0` to disable killstreak effects\n";
  response += "• Your setting is saved automatically\n\n";

  response += "**Requirements:** Donator status required";

  return {
    response,
    suggestions: ['Footprints', 'Chat colors', 'Other donator features', 'How to donate?']
  };
}

function handleFOVQuery(message, tf2Data) {
  const commands = tf2Data?.commands?.general_player_commands;

  let response = "**Field of View (FOV) Settings:**\n\n";
  response += "Customize your field of view for better gameplay.\n\n";

  response += "**Command:**\n";
  if (commands?.['sm_fov [value]']) {
    response += `• \`sm_fov [value]\` - ${commands['sm_fov [value]']}\n`;
  } else {
    response += "• `!fov [value]` or `sm_fov [value]` - Set your Field of View (20-160)\n";
  }

  response += "\n**Usage:**\n";
  response += "• Valid range: 20-160\n";
  response += "• Example: `!fov 90` sets FOV to 90\n";
  response += "• Higher values = wider view\n";
  response += "• Lower values = narrower/zoomed view\n";
  response += "• Setting is saved automatically\n\n";

  if (tf2Data?.common_questions?.fov_not_working) {
    response += "**Troubleshooting:**\n";
    response += tf2Data.common_questions.fov_not_working.answer;
  }

  return {
    response,
    suggestions: ['Third person view', 'Other commands', 'Gameplay settings', 'Help']
  };
}

function handleThirdPersonQuery(message, tf2Data) {
  const commands = tf2Data?.commands?.general_player_commands;

  let response = "**Third Person View:**\n\n";
  response += "Switch between first-person and third-person camera views.\n\n";

  response += "**Commands:**\n";
  if (commands?.['sm_tp']) {
    response += `• \`sm_tp\` - ${commands['sm_tp']}\n`;
  }
  if (commands?.['sm_fp']) {
    response += `• \`sm_fp\` - ${commands['sm_fp']}\n`;
  }

  if (!commands?.['sm_tp'] && !commands?.['sm_fp']) {
    response += "• `!tp` or `sm_tp` - Toggle third-person view\n";
    response += "• `!fp` or `sm_fp` - Switch to first-person view\n";
  }

  response += "\n**How it works:**\n";
  response += "• Third-person gives you a wider view of your character\n";
  response += "• Useful for dodgeball to see rockets coming from different angles\n";
  response += "• First-person is the default TF2 view\n";
  response += "• You can switch anytime during gameplay\n";
  response += "• Setting persists across respawns";

  return {
    response,
    suggestions: ['FOV settings', 'Other commands', 'Gameplay tips', 'Solo queue']
  };
}

function handleTroubleshootingQuery(message, tf2Data) {
  const troubleshooting = tf2Data?.troubleshooting || {};

  // Match specific issues
  if (message.includes('command') && (message.includes('not working') || message.includes('not found'))) {
    const issue = troubleshooting.command_not_found;
    if (issue) {
      const solutions = issue.solutions.map(sol => `• ${sol}`).join('\n');
      return {
        response: `**${issue.issue}:**\n${solutions}`,
        suggestions: ['Commands list', 'Donator status', 'Help']
      };
    }
  }

  if (message.includes('vote') && message.includes('not working')) {
    const issue = troubleshooting.voting_issues;
    if (issue) {
      const solutions = issue.solutions.map(sol => `• ${sol}`).join('\n');
      return {
        response: `**${issue.issue}:**\n${solutions}`,
        suggestions: ['Voting system', 'Donator benefits', 'Commands']
      };
    }
  }

  return {
    response: "For technical issues, try:\n• Use !help command in-game\n• Check if you need donator status\n• Join Discord for support (!discord)\n• Visit tf2.sakoa.xyz for server status",
    suggestions: ['Commands', 'Discord info', 'Server status']
  };
}

export default defineEventHandler(async (event) => {
  if (getMethod(event) !== 'POST') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method not allowed'
    });
  }

  try {
    // Check if chatbot is enabled in admin settings
    const chatbotEnabled = await isChatbotEnabled();
    if (!chatbotEnabled) {
      return {
        success: false,
        response: "The AI chatbot is currently disabled by the administrator.",
        error: 'Chatbot disabled',
        disabled: true
      };
    }

    const { message, conversationHistory = [] } = await readBody(event);

    if (!message || typeof message !== 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Message is required'
      });
    }

    const tf2Data = await loadTF2Data();

    // If TF2 data fails to load, try casual pattern matching as fallback
    if (!tf2Data) {
      console.warn('TF2 data failed to load, using fallback pattern matching');

      // Try casual pattern detection even without full data
      const casualMatch = detectCasualPatterns(message);
      if (casualMatch.matched) {
        const fallbackResponse = handleCasualQuery(casualMatch.type, message, {});
        if (fallbackResponse) {
          return {
            success: true,
            response: fallbackResponse.response,
            suggestions: fallbackResponse.suggestions || [],
            confidence: casualMatch.confidence,
            source: 'fallback_casual'
          };
        }
      }

      return {
        success: false,
        response: "Sorry, I'm having trouble accessing server information right now. Please try again later.",
        error: 'Data loading failed'
      };
    }

    // Try conversational AI first
    try {
      const aiResult = await getConversationalResponse(message, conversationHistory, tf2Data);

      return {
        success: true,
        response: aiResult.response,
        suggestions: aiResult.suggestions || [],
        confidence: aiResult.confidence,
        source: aiResult.source
      };
    } catch (aiError) {
      console.warn('Conversational AI failed, falling back to pattern matching:', aiError.message);

      // Fallback to original pattern matching
      const result = matchQuery(message, tf2Data);

      return {
        success: true,
        response: result.response,
        suggestions: result.suggestions || [],
        confidence: 0.5,
        source: 'fallback'
      };
    }

  } catch (error) {
    console.error('Chatbot API error:', error);

    return {
      success: false,
      response: "Sorry, I encountered an error processing your request. Please try again.",
      error: error.message
    };
  }
});
