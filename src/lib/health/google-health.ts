/**
 * Google Health / Fitness API scaffold.
 * Real integration needs OAuth (Google Fit or Health Connect on Android via companion).
 */

export type GoogleHealthTokens = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
};

export type DistanceSample = {
  date: string;       // YYYY-MM-DD
  distanceKm: number;
  steps?: number;
  source: "google_health";
};

/**
 * Build Google OAuth URL for Fitness scopes.
 */
export function getGoogleHealthAuthUrl(state: string, redirectUri: string): string {
  const clientId = process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_HEALTH_CLIENT_ID || "";
  const scope = encodeURIComponent(
    "https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.location.read",
  );
  return (
    `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code&scope=${scope}&access_type=offline&prompt=consent&state=${state}`
  );
}

/**
 * Exchange auth code for tokens (scaffold).
 */
export async function exchangeGoogleHealthCode(
  code: string,
  redirectUri: string,
): Promise<GoogleHealthTokens> {
  // Real: POST https://oauth2.googleapis.com/token
  return {
    accessToken: `mock_access_${code.slice(0, 8)}`,
    refreshToken: `mock_refresh_${Date.now()}`,
    expiresAt: Date.now() + 3600 * 1000,
  };
}

/**
 * Pull recent distance / steps (scaffold returns empty / mock data).
 */
export async function fetchGoogleDistance(
  tokens: GoogleHealthTokens,
  days = 7,
): Promise<DistanceSample[]> {
  if (!process.env.AUTH_GOOGLE_ID && !process.env.GOOGLE_HEALTH_CLIENT_ID) {
    // Dev mock
    const samples: DistanceSample[] = [];
    for (let i = 0; i < Math.min(days, 3); i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      samples.push({
        date: d.toISOString().slice(0, 10),
        distanceKm: Math.round((3 + Math.random() * 5) * 10) / 10,
        steps: Math.floor(4000 + Math.random() * 6000),
        source: "google_health",
      });
    }
    return samples;
  }

  // Real: call Fitness API aggregate endpoint
  // https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate
  return [];
}
