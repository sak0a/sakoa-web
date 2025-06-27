import fs from 'fs';
import path from 'path';

// Get the absolute path to the project root directory
// In production, we need to go up from .output/server to the root
const projectRoot = process.cwd().includes('.output/server')
  ? path.join(process.cwd(), '../../')
  : process.cwd();
const serversFilePath = path.join(projectRoot, 'server/data/servers.json');

// Helper function to check admin authentication
function checkAdminAuth(event) {
  const sessionCookie = getCookie(event, 'admin-session');
  if (sessionCookie !== 'authenticated') {
    console.error('Admin authentication failed - invalid or missing session cookie');
    throw createError({
      statusCode: 401,
      statusMessage: 'Admin password not found. Please log in again.'
    });
  }
}

// Helper function to read servers data
async function readServersData() {
  try {
    const data = await fs.promises.readFile(serversFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading servers data:', error);
    return { servers: [] };
  }
}

// Helper function to write servers data
async function writeServersData(data) {
  try {
    await fs.promises.writeFile(serversFilePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing servers data:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to save servers data'
    });
  }
}

// Helper function to validate server data
function validateServer(server) {
  const errors = [];
  
  if (!server.id || typeof server.id !== 'string' || server.id.trim().length === 0) {
    errors.push('ID is required and must be a non-empty string');
  }
  
  if (!server.name || typeof server.name !== 'string' || server.name.trim().length === 0) {
    errors.push('Name is required and must be a non-empty string');
  }
  
  if (!server.host || typeof server.host !== 'string' || server.host.trim().length === 0) {
    errors.push('Host is required and must be a non-empty string');
  }
  
  if (!server.port || typeof server.port !== 'number' || server.port <= 0 || server.port > 65535) {
    errors.push('Port is required and must be a valid port number (1-65535)');
  }
  
  if (!server.location || typeof server.location !== 'string' || server.location.trim().length === 0) {
    errors.push('Location is required and must be a non-empty string');
  }
  
  if (!server.connectUrl || typeof server.connectUrl !== 'string' || server.connectUrl.trim().length === 0) {
    errors.push('Connect URL is required and must be a non-empty string');
  }
  
  if (server.comingSoon !== undefined && typeof server.comingSoon !== 'boolean') {
    errors.push('Coming Soon must be a boolean value');
  }
  
  return errors;
}

export default defineEventHandler(async (event) => {
  const method = getMethod(event);
  
  // Check admin authentication for all methods
  checkAdminAuth(event);
  
  if (method === 'GET') {
    // Get all servers
    const serversData = await readServersData();
    return serversData;
  } else if (method === 'POST') {
    // Add new server
    try {
      const body = await readBody(event);
      const { server } = body;
      
      if (!server) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Server data is required'
        });
      }
      
      // Validate server data
      const validationErrors = validateServer(server);
      if (validationErrors.length > 0) {
        throw createError({
          statusCode: 400,
          statusMessage: `Validation failed: ${validationErrors.join(', ')}`
        });
      }
      
      // Read current data
      const serversData = await readServersData();
      
      // Check for duplicate ID
      if (serversData.servers.some(s => s.id === server.id.trim())) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Server ID already exists'
        });
      }
      
      // Add new server
      const newServer = {
        id: server.id.trim(),
        name: server.name.trim(),
        host: server.host.trim(),
        port: parseInt(server.port),
        location: server.location.trim(),
        connectUrl: server.connectUrl.trim(),
        comingSoon: server.comingSoon || false
      };
      
      serversData.servers.push(newServer);
      
      // Save updated data
      await writeServersData(serversData);
      
      return {
        success: true,
        message: 'Server added successfully',
        server: newServer
      };
    } catch (error) {
      if (error.statusCode) {
        throw error;
      }
      
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to add server'
      });
    }
  } else if (method === 'PUT') {
    // Update existing server
    try {
      const body = await readBody(event);
      const { index, server } = body;
      
      if (typeof index !== 'number' || index < 0) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Valid index is required'
        });
      }
      
      if (!server) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Server data is required'
        });
      }
      
      // Validate server data
      const validationErrors = validateServer(server);
      if (validationErrors.length > 0) {
        throw createError({
          statusCode: 400,
          statusMessage: `Validation failed: ${validationErrors.join(', ')}`
        });
      }
      
      // Read current data
      const serversData = await readServersData();
      
      if (index >= serversData.servers.length) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Server not found'
        });
      }
      
      // Check for duplicate ID (excluding current server)
      if (serversData.servers.some((s, i) => i !== index && s.id === server.id.trim())) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Server ID already exists'
        });
      }
      
      // Update server
      const updatedServer = {
        id: server.id.trim(),
        name: server.name.trim(),
        host: server.host.trim(),
        port: parseInt(server.port),
        location: server.location.trim(),
        connectUrl: server.connectUrl.trim(),
        comingSoon: server.comingSoon || false
      };
      
      serversData.servers[index] = updatedServer;
      
      // Save updated data
      await writeServersData(serversData);
      
      return {
        success: true,
        message: 'Server updated successfully',
        server: updatedServer
      };
    } catch (error) {
      if (error.statusCode) {
        throw error;
      }
      
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to update server'
      });
    }
  } else if (method === 'DELETE') {
    // Delete server
    try {
      const query = getQuery(event);
      const index = parseInt(query.index);
      
      if (isNaN(index) || index < 0) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Valid index is required'
        });
      }
      
      // Read current data
      const serversData = await readServersData();
      
      if (index >= serversData.servers.length) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Server not found'
        });
      }
      
      // Remove server
      const deletedServer = serversData.servers.splice(index, 1)[0];
      
      // Save updated data
      await writeServersData(serversData);
      
      return {
        success: true,
        message: 'Server deleted successfully',
        deletedServer
      };
    } catch (error) {
      if (error.statusCode) {
        throw error;
      }
      
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to delete server'
      });
    }
  } else {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method not allowed'
    });
  }
});
