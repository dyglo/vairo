import logger from './logger';

/**
 * Anomaly Detection System
 * 
 * Tracks suspicious user behavior and assigns risk scores:
 * - Rapid-fire requests (more than 10 requests per minute)
 * - Multiple failed login attempts (more than 3 in 5 minutes)
 * - Sudden IP address changes
 * - High-risk patterns (score > 70)
 * 
 * Features:
 * - Modular risk scoring
 * - Gradual score decay (resets 5% per minute)
 * - Account locking at threshold (score >= 80)
 * - Configurable thresholds
 */

export interface AnomalyUser {
  userId: string;
  email: string;
  riskScore: number;
  lastRiskUpdate: number;
  isLocked: boolean;
  lockExpiresAt?: number;
  failedLoginAttempts: { timestamp: number; ip: string }[];
  requestTimestamps: number[];
  lastKnownIPs: { ip: string; timestamp: number }[];
}

export interface AnomalyConfig {
  RISK_THRESHOLD: number; // Score at which to lock account
  WARNING_THRESHOLD: number; // Score for warnings
  MAX_RISK_SCORE: number; // Maximum possible score
  RAPID_REQUEST_THRESHOLD: number; // Requests per minute to trigger
  FAILED_LOGIN_THRESHOLD: number; // Failed attempts to trigger
  FAILED_LOGIN_WINDOW: number; // Time window in ms
  IP_CHANGE_PENALTY: number; // Risk points for IP change
  RAPID_REQUEST_PENALTY: number; // Risk points for rapid requests
  FAILED_LOGIN_PENALTY: number; // Risk points per failed attempt
  DECAY_RATE: number; // Score decay per minute (percentage: 0-1)
  LOCK_DURATION: number; // Account lock duration in ms
}

// Configuration - can be overridden via environment variables or config file
const DEFAULT_CONFIG: AnomalyConfig = {
  RISK_THRESHOLD: 80, // Lock account at 80 points
  WARNING_THRESHOLD: 50, // Warn at 50 points
  MAX_RISK_SCORE: 100,
  RAPID_REQUEST_THRESHOLD: 10, // More than 10 requests/minute
  FAILED_LOGIN_THRESHOLD: 3, // More than 3 failed attempts
  FAILED_LOGIN_WINDOW: 5 * 60 * 1000, // 5 minutes
  IP_CHANGE_PENALTY: 15, // Points for IP change
  RAPID_REQUEST_PENALTY: 20, // Points for rapid requests
  FAILED_LOGIN_PENALTY: 10, // Points per failed attempt
  DECAY_RATE: 0.05, // 5% decay per minute
  LOCK_DURATION: 15 * 60 * 1000, // 15 minutes
};

class AnomalyDetectionSystem {
  private userProfiles: Map<string, AnomalyUser> = new Map();
  private config: AnomalyConfig;
  private decayInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<AnomalyConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startDecayTimer();
  }

  /**
   * Get or create user anomaly profile
   */
  private getOrCreateProfile(userId: string, email: string): AnomalyUser {
    if (!this.userProfiles.has(userId)) {
      const profile: AnomalyUser = {
        userId,
        email,
        riskScore: 0,
        lastRiskUpdate: Date.now(),
        isLocked: false,
        failedLoginAttempts: [],
        requestTimestamps: [],
        lastKnownIPs: [],
      };
      this.userProfiles.set(userId, profile);
    }
    return this.userProfiles.get(userId)!;
  }

  /**
   * Detect rapid requests (user making too many requests quickly)
   */
  private detectRapidRequests(profile: AnomalyUser): boolean {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;

    // Remove old timestamps
    profile.requestTimestamps = profile.requestTimestamps.filter(
      (ts) => ts > oneMinuteAgo
    );

    // Check if exceeds threshold
    if (profile.requestTimestamps.length >= this.config.RAPID_REQUEST_THRESHOLD) {
      return true;
    }

    return false;
  }

  /**
   * Detect multiple failed login attempts
   */
  private detectMultipleFailedLogins(profile: AnomalyUser): number {
    const now = Date.now();
    const window = this.config.FAILED_LOGIN_WINDOW;

    // Remove old attempts
    profile.failedLoginAttempts = profile.failedLoginAttempts.filter(
      (attempt) => attempt.timestamp > now - window
    );

    // Return count of failed attempts in window
    return Math.max(0, profile.failedLoginAttempts.length - (this.config.FAILED_LOGIN_THRESHOLD - 1));
  }

  /**
   * Detect sudden IP change
   */
  private detectIPChange(profile: AnomalyUser, newIP: string): boolean {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    // Remove old IP records
    profile.lastKnownIPs = profile.lastKnownIPs.filter(
      (record) => record.timestamp > oneHourAgo
    );

    // Check if this is a new IP different from recent ones
    const knownIPs = new Set(profile.lastKnownIPs.map((r) => r.ip));

    if (profile.lastKnownIPs.length > 0 && !knownIPs.has(newIP)) {
      return true;
    }

    return false;
  }

  /**
   * Apply risk points to user
   */
  private applyRiskPoints(
    profile: AnomalyUser,
    points: number,
    reason: string
  ): void {
    const oldScore = profile.riskScore;
    profile.riskScore = Math.min(
      this.config.MAX_RISK_SCORE,
      profile.riskScore + points
    );
    profile.lastRiskUpdate = Date.now();

    logger.warn('Risk score increased', {
      userId: profile.userId,
      oldScore,
      newScore: profile.riskScore,
      pointsAdded: points,
      reason,
      action: 'RISK_SCORE_UPDATED',
    });
  }

  /**
   * Decay risk score over time (called by timer)
   */
  private decayScores(): void {
    const now = Date.now();

    for (const profile of this.userProfiles.values()) {
      if (profile.riskScore <= 0) continue;

      const timeSinceUpdate = now - profile.lastRiskUpdate;
      const minutesPassed = timeSinceUpdate / (60 * 1000);
      const decayAmount = profile.riskScore * this.config.DECAY_RATE * minutesPassed;
      const newScore = Math.max(0, profile.riskScore - decayAmount);

      if (decayAmount > 0.1) {
        // Only log significant decays
        logger.info('Risk score decayed', {
          userId: profile.userId,
          oldScore: profile.riskScore,
          newScore,
          decayAmount: decayAmount.toFixed(2),
          action: 'RISK_SCORE_DECAYED',
        });
      }

      profile.riskScore = newScore;
      profile.lastRiskUpdate = now;

      // Check if unlock is needed
      if (profile.isLocked && profile.lockExpiresAt && now > profile.lockExpiresAt) {
        this.unlockAccount(profile.userId);
      }
    }
  }

  /**
   * Lock account due to high risk
   */
  private lockAccount(userId: string): void {
    const profile = this.userProfiles.get(userId);
    if (!profile) return;

    profile.isLocked = true;
    profile.lockExpiresAt = Date.now() + this.config.LOCK_DURATION;

    logger.warn('Account locked due to high risk', {
      userId,
      riskScore: profile.riskScore,
      lockExpiresAt: new Date(profile.lockExpiresAt).toISOString(),
      action: 'ACCOUNT_LOCKED',
    });
  }

  /**
   * Unlock account
   */
  private unlockAccount(userId: string): void {
    const profile = this.userProfiles.get(userId);
    if (!profile) return;

    profile.isLocked = false;
    profile.lockExpiresAt = undefined;

    logger.info('Account unlocked', {
      userId,
      action: 'ACCOUNT_UNLOCKED',
    });
  }

  /**
   * Start background decay timer
   */
  private startDecayTimer(): void {
    // Run decay every minute
    this.decayInterval = setInterval(() => {
      this.decayScores();
    }, 60 * 1000) as unknown as NodeJS.Timeout;
  }

  /**
   * Stop decay timer (cleanup)
   */
  public stopDecayTimer(): void {
    if (this.decayInterval) {
      clearInterval(this.decayInterval);
      this.decayInterval = null;
    }
  }

  /**
   * PUBLIC API: Track login attempt (success or failure)
   */
  public trackLoginAttempt(
    userId: string,
    email: string,
    ipAddress: string,
    success: boolean
  ): { riskScore: number; isLocked: boolean; reason?: string } {
    const profile = this.getOrCreateProfile(userId, email);

    // Check if already locked
    if (profile.isLocked) {
      if (profile.lockExpiresAt && Date.now() < profile.lockExpiresAt) {
        return {
          riskScore: profile.riskScore,
          isLocked: true,
          reason: 'Account temporarily locked due to suspicious activity',
        };
      } else {
        this.unlockAccount(userId);
      }
    }

    if (!success) {
      // Failed login attempt
      profile.failedLoginAttempts.push({
        timestamp: Date.now(),
        ip: ipAddress,
      });

      const excessFailures = this.detectMultipleFailedLogins(profile);
      if (excessFailures > 0) {
        const penaltyPoints = excessFailures * this.config.FAILED_LOGIN_PENALTY;
        this.applyRiskPoints(profile, penaltyPoints, 'Multiple failed login attempts');
      }
    } else {
      // Successful login - reset failed attempts
      profile.failedLoginAttempts = [];
    }

    // Track IP change
    if (this.detectIPChange(profile, ipAddress)) {
      this.applyRiskPoints(profile, this.config.IP_CHANGE_PENALTY, 'IP address changed');
    }

    // Add new IP
    profile.lastKnownIPs.push({ ip: ipAddress, timestamp: Date.now() });

    // Check if should lock
    if (profile.riskScore >= this.config.RISK_THRESHOLD) {
      this.lockAccount(userId);
    }

    // Log warning if approaching threshold
    if (
      !profile.isLocked &&
      profile.riskScore >= this.config.WARNING_THRESHOLD &&
      profile.riskScore < this.config.RISK_THRESHOLD
    ) {
      logger.warn('Account approaching lock threshold', {
        userId,
        riskScore: profile.riskScore,
        threshold: this.config.RISK_THRESHOLD,
      });
    }

    return {
      riskScore: profile.riskScore,
      isLocked: profile.isLocked,
    };
  }

  /**
   * PUBLIC API: Track user request/action
   */
  public trackUserAction(userId: string, email: string): {
    riskScore: number;
    isLocked: boolean;
    reason?: string;
  } {
    const profile = this.getOrCreateProfile(userId, email);

    // Check if locked
    if (profile.isLocked) {
      if (profile.lockExpiresAt && Date.now() < profile.lockExpiresAt) {
        return {
          riskScore: profile.riskScore,
          isLocked: true,
          reason: 'Account temporarily locked due to suspicious activity',
        };
      } else {
        this.unlockAccount(userId);
      }
    }

    // Track request timestamp
    profile.requestTimestamps.push(Date.now());

    // Detect rapid requests
    if (this.detectRapidRequests(profile)) {
      this.applyRiskPoints(profile, this.config.RAPID_REQUEST_PENALTY, 'Rapid requests detected');
    }

    // Check if should lock
    if (profile.riskScore >= this.config.RISK_THRESHOLD) {
      this.lockAccount(userId);
    }

    return {
      riskScore: profile.riskScore,
      isLocked: profile.isLocked,
    };
  }

  /**
   * PUBLIC API: Get user's current anomaly status
   */
  public getUserAnomalyStatus(userId: string): Partial<AnomalyUser> | null {
    const profile = this.userProfiles.get(userId);
    if (!profile) return null;

    return {
      userId: profile.userId,
      email: profile.email,
      riskScore: profile.riskScore,
      isLocked: profile.isLocked,
      lockExpiresAt: profile.lockExpiresAt,
      failedLoginAttempts: profile.failedLoginAttempts,
    };
  }

  /**
   * PUBLIC API: Manually reset user risk score (for admins)
   */
  public resetUserRiskScore(userId: string, reason: string = 'Admin reset'): void {
    const profile = this.userProfiles.get(userId);
    if (!profile) return;

    logger.info('Risk score reset', {
      userId,
      previousScore: profile.riskScore,
      reason,
      action: 'RISK_SCORE_RESET',
    });

    profile.riskScore = 0;
    profile.failedLoginAttempts = [];
    this.unlockAccount(userId);
  }

  /**
   * PUBLIC API: Manually unlock account (for admins)
   */
  public unlockUserAccount(userId: string, reason: string = 'Admin unlock'): void {
    logger.info('Account unlocked manually', {
      userId,
      reason,
      action: 'ACCOUNT_UNLOCKED_MANUAL',
    });

    this.unlockAccount(userId);
  }

  /**
   * PUBLIC API: Get system config
   */
  public getConfig(): AnomalyConfig {
    return { ...this.config };
  }

  /**
   * PUBLIC API: Update config (for production, consider using env vars instead)
   */
  public updateConfig(newConfig: Partial<AnomalyConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('Anomaly detection config updated', { config: this.config });
  }

  /**
   * PUBLIC API: Get metrics for monitoring
   */
  public getMetrics(): {
    totalUsers: number;
    lockedAccounts: number;
    highRiskUsers: number;
    averageRiskScore: number;
  } {
    const profiles = Array.from(this.userProfiles.values());

    return {
      totalUsers: profiles.length,
      lockedAccounts: profiles.filter((p) => p.isLocked).length,
      highRiskUsers: profiles.filter(
        (p) => p.riskScore >= this.config.WARNING_THRESHOLD && !p.isLocked
      ).length,
      averageRiskScore:
        profiles.length > 0
          ? profiles.reduce((sum, p) => sum + p.riskScore, 0) / profiles.length
          : 0,
    };
  }
}

// Singleton instance
const anomalyDetection = new AnomalyDetectionSystem();

export default anomalyDetection;
