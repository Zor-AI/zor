export interface RateLimiterOptions {
  maxRequests: number;
  windowMs: number;
}

export class RateLimiter {
  private timestamps: number[] = [];
  private maxRequests: number;
  private windowMs: number;

  constructor(opts: RateLimiterOptions) {
    this.maxRequests = opts.maxRequests;
    this.windowMs = opts.windowMs;
  }

  async acquire(): Promise<void> {
    const now = Date.now();
    this.timestamps = this.timestamps.filter(t => now - t < this.windowMs);
    if (this.timestamps.length >= this.maxRequests) {
      const oldest = this.timestamps[0];
      const waitMs = this.windowMs - (now - oldest) + 10;
      await new Promise(resolve => setTimeout(resolve, waitMs));
      return this.acquire();
    }
    this.timestamps.push(now);
  }

  get remaining(): number {
    const now = Date.now();
    this.timestamps = this.timestamps.filter(t => now - t < this.windowMs);
    return this.maxRequests - this.timestamps.length;
  }
}