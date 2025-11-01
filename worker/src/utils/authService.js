class AuthService {
  constructor() {
    this.domain = process.env.AUTH0_DOMAIN;
    this.clientId = process.env.AUTH0_CLIENT_ID;
    this.clientSecret = process.env.AUTH0_CLIENT_SECRET;
    this.audience = process.env.AUTH0_AUDIENCE;
    this.token = null;
    this.tokenExpiry = null;
  }

  async getToken() {
    try {
      const now = Math.floor(Date.now() / 1000);
      if (this.token && this.tokenExpiry && this.tokenExpiry > now + 60) {
        return this.token;
      }

      // ✅ fetch nativo (sin require)
      const response = await fetch(`${this.domain}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          audience: this.audience,
          grant_type: 'client_credentials',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('❌ Error Auth0:', data);
        throw new Error(`Auth0 request failed (${response.status})`);
      }

      this.token = data.access_token;
      this.tokenExpiry = now + data.expires_in;
      console.log('✅ Token obtenido correctamente');
      return this.token;
    } catch (error) {
      console.error('Error fetching token:', error.message);
      throw error;
    }
  }

  clearToken() {
    this.token = null;
    this.tokenExpiry = null;
  }
}

module.exports = new AuthService();