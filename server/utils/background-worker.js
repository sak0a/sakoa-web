import { GameDig } from 'gamedig';

/**
 * Background Query Manager for Server Queries
 * Handles server status queries asynchronously to avoid blocking main thread
 * and reduce console spam (without worker threads for better Nuxt compatibility)
 */

class BackgroundQueryManager {
  constructor() {
    this.activeQueries = new Map();
    this.queryQueue = [];
    this.isProcessingQueue = false;
    this.maxConcurrent = 3; // Limit concurrent queries
    this.runningQueries = 0;
  }

  /**
   * Query server in background (async, non-blocking)
   */
  async queryServerBackground(server, options = {}) {
    return new Promise((resolve, reject) => {
      const queryId = `${server.id}_${Date.now()}`;

      // Check if query is already in progress for this server
      if (this.activeQueries.has(server.id)) {
        // Return the existing promise
        return this.activeQueries.get(server.id);
      }

      const queryPromise = this._executeQuery(server, options, queryId);
      this.activeQueries.set(server.id, queryPromise);

      queryPromise
        .then(resolve)
        .catch(reject)
        .finally(() => {
          this.activeQueries.delete(server.id);
        });
    });
  }

  /**
   * Execute the actual query
   */
  async _executeQuery(server, options, queryId) {
    // If we're at max concurrent queries, queue this one
    if (this.runningQueries >= this.maxConcurrent) {
      return new Promise((resolve, reject) => {
        this.queryQueue.push({ server, options, queryId, resolve, reject });
        this.processQueue();
      });
    }

    return this._runQuery(server, options, queryId);
  }

  /**
   * Run the actual server query
   */
  async _runQuery(server, options, queryId) {
    this.runningQueries++;

    try {
      const { timeout = 5000, maxAttempts = 2, silent = true } = options;

      if (!silent) {
        console.log(`[Background] Querying ${server.host}:${server.port}`);
      }

      // Configure GameDig options for TF2 server
      const queryOptions = {
        type: 'teamfortress2',
        host: server.host,
        port: server.port,
        maxAttempts,
        socketTimeout: Math.min(timeout, 3000),
        attemptTimeout: timeout
      };

      const state = await GameDig.query(queryOptions);

      if (!silent) {
        console.log(`[Background] Query successful for ${server.id}: ${state.players?.length || 0} players`);
      }

      const result = {
        id: server.id,
        status: 'online',
        name: state.name || server.name,
        map: state.map || 'Unknown',
        maxplayers: state.maxplayers || 24,
        players: (state.players || []).map(player => ({
          name: player.name || 'Unknown Player',
          score: player.raw?.score || 0,
          time: player.raw?.time || 0
        })),
        location: server.location,
        connectUrl: server.connectUrl,
        comingSoon: server.comingSoon || false,
        queryTime: Date.now()
      };

      return result;

    } catch (error) {
      if (!options.silent) {
        console.warn(`[Background] Query failed for ${server.id}: ${error.message}`);
      }

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
        error: `Server offline: ${error.message}`,
        queryTime: Date.now()
      };
    } finally {
      this.runningQueries--;
      // Process queue after query completes
      this.processQueue();
    }
  }



  /**
   * Process queued queries
   */
  async processQueue() {
    if (this.isProcessingQueue || this.queryQueue.length === 0 || this.runningQueries >= this.maxConcurrent) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.queryQueue.length > 0 && this.runningQueries < this.maxConcurrent) {
      const { server, options, queryId, resolve, reject } = this.queryQueue.shift();

      try {
        const result = await this._runQuery(server, options, queryId);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Shutdown manager
   */
  async shutdown() {
    // Wait for running queries to complete
    while (this.runningQueries > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.activeQueries.clear();
    this.queryQueue.length = 0;
  }

  /**
   * Get manager status
   */
  getStatus() {
    return {
      runningQueries: this.runningQueries,
      maxConcurrent: this.maxConcurrent,
      queuedQueries: this.queryQueue.length,
      activeQueries: this.activeQueries.size
    };
  }
}

// Singleton instance
let queryManager = null;

/**
 * Get the query manager instance
 */
export function getQueryManager() {
  if (!queryManager) {
    queryManager = new BackgroundQueryManager();
  }
  return queryManager;
}

/**
 * Query server using background manager
 */
export async function queryServerInBackground(server, options = {}) {
  const manager = getQueryManager();
  return manager.queryServerBackground(server, options);
}

/**
 * Shutdown query manager (for cleanup)
 */
export async function shutdownQueryManager() {
  if (queryManager) {
    await queryManager.shutdown();
    queryManager = null;
  }
}
