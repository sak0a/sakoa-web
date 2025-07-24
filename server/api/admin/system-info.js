import os from 'os';
import fs from 'fs';
import { promisify } from 'util';

// Helper function to check admin authentication
function checkAdminAuth(event) {
  const sessionCookie = getCookie(event, 'admin-session');
  if (sessionCookie !== 'authenticated') {
    throw createError({
      statusCode: 401,
      statusMessage: 'Admin authentication required'
    });
  }
}

// Helper function to get disk usage (cross-platform)
async function getDiskUsage() {
  try {
    const stats = await promisify(fs.statvfs || fs.stat)('.');
    if (stats.bavail !== undefined) {
      // Unix-like systems
      const free = stats.bavail * stats.frsize;
      const total = stats.blocks * stats.frsize;
      const used = total - free;
      return {
        total: Math.round(total / (1024 * 1024 * 1024) * 100) / 100, // GB
        used: Math.round(used / (1024 * 1024 * 1024) * 100) / 100, // GB
        free: Math.round(free / (1024 * 1024 * 1024) * 100) / 100, // GB
        percentage: Math.round((used / total) * 100)
      };
    }
  } catch (error) {
    // Fallback for systems where statvfs is not available
    return {
      total: 'N/A',
      used: 'N/A',
      free: 'N/A',
      percentage: 'N/A'
    };
  }
}

// Helper function to format bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Helper function to format uptime
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  let result = '';
  if (days > 0) result += `${days}d `;
  if (hours > 0) result += `${hours}h `;
  if (minutes > 0) result += `${minutes}m `;
  result += `${secs}s`;
  
  return result.trim();
}

export default defineEventHandler(async (event) => {
  const method = getMethod(event);
  
  // Check admin authentication
  checkAdminAuth(event);
  
  if (method === 'GET') {
    try {
      // Get system information
      const cpus = os.cpus();
      const memoryUsage = process.memoryUsage();
      const diskUsage = await getDiskUsage();
      
      const systemInfo = {
        // Operating System
        os: {
          platform: os.platform(),
          type: os.type(),
          release: os.release(),
          arch: os.arch(),
          hostname: os.hostname(),
          uptime: formatUptime(os.uptime())
        },
        
        // Node.js Process
        process: {
          version: process.version,
          platform: process.platform,
          arch: process.arch,
          uptime: formatUptime(process.uptime()),
          pid: process.pid,
          cwd: process.cwd(),
          nodeEnv: process.env.NODE_ENV || 'development'
        },
        
        // CPU Information
        cpu: {
          model: cpus[0]?.model || 'Unknown',
          cores: cpus.length,
          speed: cpus[0]?.speed || 'Unknown'
        },
        
        // Memory Information
        memory: {
          total: formatBytes(os.totalmem()),
          free: formatBytes(os.freemem()),
          used: formatBytes(os.totalmem() - os.freemem()),
          percentage: Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100),
          process: {
            rss: formatBytes(memoryUsage.rss),
            heapTotal: formatBytes(memoryUsage.heapTotal),
            heapUsed: formatBytes(memoryUsage.heapUsed),
            external: formatBytes(memoryUsage.external)
          }
        },
        
        // Disk Information
        disk: diskUsage,
        
        // Network Interfaces
        network: Object.entries(os.networkInterfaces()).reduce((acc, [name, interfaces]) => {
          acc[name] = interfaces?.filter(iface => !iface.internal).map(iface => ({
            address: iface.address,
            family: iface.family,
            mac: iface.mac
          })) || [];
          return acc;
        }, {}),
        
        // Load Average (Unix-like systems only)
        loadAverage: os.loadavg(),
        
        // Timestamp
        timestamp: new Date().toISOString()
      };
      
      return {
        success: true,
        data: systemInfo
      };
      
    } catch (error) {
      console.error('Error getting system information:', error);
      return {
        success: false,
        error: {
          message: 'Failed to get system information',
          details: error.message,
          timestamp: new Date().toISOString()
        }
      };
    }
  } else {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method not allowed'
    });
  }
});
