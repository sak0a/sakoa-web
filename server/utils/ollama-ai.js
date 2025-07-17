// Ollama integration for local AI
export async function getOllamaResponse(userMessage, conversationHistory = [], tf2Data = {}) {
  try {
    // Check if Ollama is available
    const healthCheck = await fetch('http://localhost:11434/api/tags');
    if (!healthCheck.ok) {
      throw new Error('Ollama not available');
    }
    
    const serverContext = createServerContext(tf2Data);
    
    // Build conversation context
    let prompt = `You are a helpful assistant for ${serverContext.serverName}, a Team Fortress 2 Dodgeball server.

KEEP RESPONSES UNDER 100 WORDS AND BE CONVERSATIONAL.

Server Info:
- Donator Features: Colored Footprints (!cfp), Custom Chat Colors (!scc), Robot Mode (!robot), Killstreaks (!ks), 2x Vote Weight
- Donation Methods: PayPal and Buy Me a Coffee on tf2.sakoa.xyz, or Discord (!discord)
- Solo System: Use !solo for 1v1 matches at round end
- Commands: Use !help in-game for full list

Recent conversation:`;

    // Add conversation history
    const recentHistory = conversationHistory.slice(-4);
    for (const msg of recentHistory) {
      if (msg.isUser) {
        prompt += `\nUser: ${msg.message}`;
      } else {
        prompt += `\nAssistant: ${msg.response}`;
      }
    }
    
    prompt += `\nUser: ${userMessage}\nAssistant:`;
    
    // Call Ollama API
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'phi3:mini',
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 150,
          stop: ['User:', 'Human:', '\n\nUser:', '\n\nHuman:']
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }
    
    const data = await response.json();
    let botResponse = data.response?.trim() || '';
    
    // Clean up response
    botResponse = botResponse
      .replace(/^Assistant:\s*/i, '')
      .replace(/User:\s*.*$/gm, '')
      .replace(/Human:\s*.*$/gm, '')
      .trim();
    
    // Validate response quality
    if (botResponse && botResponse.length > 10 && botResponse.length < 400) {
      return {
        response: botResponse,
        suggestions: generateContextualSuggestions(userMessage, botResponse),
        confidence: 0.8,
        source: 'ollama'
      };
    }
    
    return null;
    
  } catch (error) {
    console.error('Ollama error:', error);
    return null;
  }
}

// Create server context (simplified version)
function createServerContext(tf2Data) {
  return {
    serverName: "Saka's TF2 Dodgeball Server",
    features: [
      "Colored Footprints (!cfp)",
      "Custom Chat Colors (!scc)", 
      "Robot Transformation (!robot)",
      "Killstreak Effects (!ks)",
      "2x Vote Weight"
    ],
    donation: {
      methods: ["PayPal", "Buy Me a Coffee"],
      website: "tf2.sakoa.xyz"
    }
  };
}

// Enhanced pattern matching for natural conversation variants
function matchesPattern(message, patterns) {
  const normalizedMsg = message.toLowerCase().replace(/[^\w\s]/g, ' ').trim();

  return patterns.some(pattern => {
    // Direct match
    if (normalizedMsg.includes(pattern.toLowerCase())) return true;

    // Word boundary match for better accuracy
    const words = normalizedMsg.split(/\s+/);
    const patternWords = pattern.toLowerCase().split(/\s+/);

    // Check if all pattern words exist in message (order doesn't matter for some cases)
    if (patternWords.length <= 2) {
      return patternWords.every(word => words.some(msgWord => msgWord.includes(word)));
    }

    return false;
  });
}

// Comprehensive question variants and asking styles
function detectQuestionType(message) {
  const questionTypes = {
    // What questions - many variants
    WHAT_IS: [
      'what is', 'what are', 'what does', 'whats', 'wat is', 'wat are',
      'explain', 'tell me about', 'describe', 'define',
      'i dont know what', 'i dunno what', 'no idea what',
      'never heard of', 'what the hell is', 'wtf is'
    ],

    // How questions - different styles
    HOW_TO: [
      'how to', 'how do i', 'how can i', 'how does', 'how would i',
      'where do i', 'where can i', 'where to', 'when do i',
      'steps to', 'way to', 'method to', 'process to',
      'guide to', 'tutorial', 'instructions'
    ],

    // Why questions - frustrated/curious styles
    WHY: [
      'why', 'why do', 'why does', 'why cant', 'why can\'t', 'why dont', 'why don\'t',
      'why not', 'why is', 'why are', 'how come', 'whats the reason',
      'why the hell', 'why tf', 'wtf why', 'makes no sense'
    ],

    // Permission/ability questions
    CAN_I: [
      'can i', 'am i able', 'is it possible', 'do i have', 'may i',
      'allowed to', 'permission to', 'able to', 'possible to',
      'let me', 'will it let me'
    ],

    // Request/show me styles
    SHOW_ME: [
      'show me', 'give me', 'list', 'display', 'tell me',
      'i want', 'i need', 'gimme', 'lemme see', 'let me see',
      'where are', 'find me', 'get me'
    ],

    // Help requests - different urgency levels
    HELP: [
      'help', 'assist', 'support', 'stuck', 'confused', 'lost',
      'dont understand', 'don\'t understand', 'no clue', 'clueless',
      'having trouble', 'problem with', 'issue with', 'broken'
    ],

    // Casual/slang styles
    CASUAL: [
      'yo', 'hey', 'sup', 'wassup', 'whats good', 'whats up',
      'dude', 'bro', 'man', 'mate', 'buddy'
    ]
  };

  for (const [type, patterns] of Object.entries(questionTypes)) {
    if (matchesPattern(message, patterns)) {
      return type;
    }
  }

  return 'UNKNOWN';
}

// Generate suggestions based on response
function generateContextualSuggestions(userMessage, botResponse) {
  const message = userMessage.toLowerCase();
  const response = botResponse.toLowerCase();

  if (message.includes('footprint') || response.includes('footprint')) {
    return ['How do I get them?', 'How to donate?', 'Other donator features'];
  }

  if (message.includes('donat') || response.includes('donat')) {
    return ['Show me the links', 'What do I get?', 'Donation benefits'];
  }

  if (message.includes('robot') || response.includes('robot')) {
    return ['How do I get it?', 'Other donator features', 'How to donate?'];
  }

  return ['Donator features', 'How to donate?', 'Commands', 'Solo system'];
}

// Check if Ollama is available
export async function isOllamaAvailable() {
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    return response.ok;
  } catch {
    return false;
  }
}

// Get available models
export async function getOllamaModels() {
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    if (response.ok) {
      const data = await response.json();
      return data.models || [];
    }
  } catch (error) {
    console.error('Failed to get Ollama models:', error);
  }
  return [];
}
