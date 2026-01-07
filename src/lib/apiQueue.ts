// Request queue for rate limiting API calls
// Ensures requests are made sequentially with proper delays

interface QueuedRequest {
  id: string;
  url: string;
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  retries: number;
}

interface CacheEntry {
  data: any;
  timestamp: number;
  expiresAt: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
const MIN_REQUEST_INTERVAL = 350; // 350ms between requests (Jikan allows ~3/second)
const MAX_RETRIES = 2;
const RETRY_DELAY = 1500; // 1.5 seconds before retry

class APIQueue {
  private queue: QueuedRequest[] = [];
  private processing = false;
  private lastRequestTime = 0;
  private cache: Map<string, CacheEntry> = new Map();

  // Get cached data if available
  getFromCache(url: string): any | null {
    const entry = this.cache.get(url);
    if (entry && Date.now() < entry.expiresAt) {
      return entry.data;
    }
    // Clean up expired entry
    if (entry) {
      this.cache.delete(url);
    }
    return null;
  }

  // Store in cache
  setCache(url: string, data: any, duration = CACHE_DURATION): void {
    const now = Date.now();
    this.cache.set(url, {
      data,
      timestamp: now,
      expiresAt: now + duration,
    });
  }

  // Clear all cache
  clearCache(): void {
    this.cache.clear();
  }

  // Add request to queue
  async fetch(url: string): Promise<any> {
    // Check cache first
    const cached = this.getFromCache(url);
    if (cached) {
      return cached;
    }

    return new Promise((resolve, reject) => {
      const id = Math.random().toString(36).substring(7);
      this.queue.push({ id, url, resolve, reject, retries: 0 });
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const request = this.queue[0];
      
      // Wait for rate limit
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
        await this.delay(MIN_REQUEST_INTERVAL - timeSinceLastRequest);
      }

      try {
        this.lastRequestTime = Date.now();
        const response = await fetch(request.url);
        
        if (response.status === 429) {
          // Rate limited - retry after delay
          if (request.retries < MAX_RETRIES) {
            request.retries++;
            console.log(`Rate limited, retry ${request.retries}/${MAX_RETRIES} for:`, request.url);
            await this.delay(RETRY_DELAY * request.retries);
            continue; // Retry same request
          } else {
            throw new Error('Rate limit exceeded after retries');
          }
        }
        
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Cache successful response
        this.setCache(request.url, data);
        
        request.resolve(data);
        this.queue.shift(); // Remove from queue
      } catch (error) {
        if (request.retries < MAX_RETRIES) {
          request.retries++;
          await this.delay(RETRY_DELAY);
          continue; // Retry same request
        }
        
        request.reject(error);
        this.queue.shift(); // Remove from queue
      }
    }

    this.processing = false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance for Jikan API
export const jikanQueue = new APIQueue();

// Helper function for queued fetch
export const queuedFetch = (url: string) => jikanQueue.fetch(url);
