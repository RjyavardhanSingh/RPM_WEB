/**
 * Simple token manager to store and retrieve authentication tokens
 * for API requests.
 */
export class AuthTokenManager {
  private static token: string | null = null;

  /**
   * Store the authentication token
   */
  static setToken(token: string): void {
    this.token = token;
  }

  /**
   * Get the stored authentication token
   */
  static getToken(): string | null {
    return this.token;
  }

  /**
   * Clear the stored authentication token
   */
  static clearToken(): void {
    this.token = null;
  }
}