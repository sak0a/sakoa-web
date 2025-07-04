import { GameDig } from 'gamedig';
import fs from 'fs';
import path from 'path';

// Get the absolute path to the project root directory
// In production, we need to go up from .output/server to the root
const projectRoot = process.cwd().includes('.output/server')
  ? path.join(process.cwd(), '../../')
  : process.cwd();
const serversFilePath = path.join(projectRoot, 'server/data/servers.json');

// Helper function to read servers data
async function getServersData() {
  try {
    const data = await fs.promises.readFile(serversFilePath, 'utf8');
    const serversData = JSON.parse(data);
    return serversData.servers || [];
  } catch (error) {
    console.error('Error reading servers data:', error);
    console.error('Attempted to read from:', serversFilePath);

    // Fallback to hardcoded servers if file doesn't exist
    return [
      {
        id: 'main',
        name: "𝘴𝘢𝘬𝘢 Dodgeball Server",
        host: '45.81.234.145',
        port: 27015,
        location: '🇩🇪 Frankfurt',
        connectUrl: 'steam://connect/45.81.234.145:27015',
        comingSoon: false
      },
      {
        id: 'advanced',
        name: "𝘴𝘢𝘬𝘢 Dodgeball Server - Advanced",
        host: '37.114.54.74',
        port: 27015,
        location: '🇩🇪 Frankfurt',
        connectUrl: 'steam://connect/37.114.54.74:27015',
        comingSoon: true
      }
    ];
  }
}

async function queryServer(server) {
  console.log(`Attempting to query TF2 server at ${server.host}:${server.port}`);

  // Query all servers normally, but mark coming soon servers

  try {
    // Try multiple game types and increased timeout
    const queryOptions = [
      { type: 'teamfortress2', host: server.host, port: server.port, maxAttempts: 2, socketTimeout: 10000, attemptTimeout: 15000 },
    ];

    let lastError = null;

    for (const options of queryOptions) {
      try {
        console.log(`Trying query with type: ${options.type}`);
        const state = await GameDig.query(options);

        console.log('Server query successful:', {
          name: state.name,
          map: state.map,
          players: state.players?.length || 0
        });

        return {
          id: server.id,
          status: 'online',
          name: state.name || server.name,
          map: state.map || 'Unknown',
          maxplayers: state.maxplayers || 24,
          players: (state.players || []).map(player => ({
            name: player.name || 'Unknown Player',
            score: player.score || 0,
            time: player.time || 0
          })),
          location: server.location,
          connectUrl: server.connectUrl,
          comingSoon: server.comingSoon || false
        };
      } catch (queryError) {
        console.warn(`Query failed with type ${options.type}:`, queryError.message);
        lastError = queryError;
        continue;
      }
    }

    // All query attempts failed, return offline status
    console.error('All server query attempts failed:', {
      message: lastError?.message || 'Unknown error',
      code: lastError?.code,
      host: server.host,
      port: server.port
    });

    return {
      id: server.id,
      status: 'offline',
      name: server.name,
      map: 'Unknown',
      maxplayers: 24,
      players: [],
      location: server.location,
      connectUrl: server.connectUrl,
      comingSoon: server.comingSoon || false,
      error: `Server is offline or unreachable: ${lastError?.message || 'Connection failed'}`
    };

  } catch (error) {
    console.error('Unexpected error in server status query:', {
      message: error.message,
      code: error.code,
      host: server.host,
      port: server.port
    });

    // Return offline status for any unexpected errors
    return {
      id: server.id,
      status: 'offline',
      name: server.name,
      map: 'Unknown',
      maxplayers: 24,
      players: [],
      location: server.location,
      connectUrl: server.connectUrl,
      comingSoon: server.comingSoon || false,
      error: `Server is offline or unreachable: ${error.message}`
    };
  }
}

export default defineEventHandler(async (event) => {
  try {
    // Get servers from file
    const servers = await getServersData();

    // Query all servers in parallel
    const serverPromises = servers.map(server => queryServer(server));
    const serverResults = await Promise.all(serverPromises);

    return {
      servers: serverResults
    };
  } catch (error) {
    console.error('Unexpected error querying servers:', error);

    // Get servers from file for fallback
    const servers = await getServersData();

    return {
      servers: servers.map(server => ({
        id: server.id,
        status: 'offline',
        name: server.name,
        map: 'Unknown',
        maxplayers: 24,
        players: [],
        location: server.location,
        connectUrl: server.connectUrl,
        comingSoon: server.comingSoon || false,
        error: 'Failed to query server status'
      }))
    };
  }
});
