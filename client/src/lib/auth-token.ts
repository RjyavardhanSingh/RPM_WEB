// Simple token manager that doesn't use React hooks
class AuthTokenManager {
  private static token: string = '';

  static setToken(newToken: string) {
    this.token = newToken;
  }

  static getToken(): string {
    return this.token;
  }

  static async fetchToken(): Promise<string> {
    if (typeof window !== 'undefined' && window.Clerk) {
      try {
        const token = await window.Clerk.session?.getToken();
        if (token) {
          this.token = token;
          return token;
        }
      } catch (error) {
        console.error('Error fetching token from Clerk:', error);
      }
    }
    return this.token;
  }
}

export default AuthTokenManager;