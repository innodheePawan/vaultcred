import crypto from 'crypto';

const API = {
  USER_CREDENTIALS: '/api/v1/UserCredentials',
};

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface ClientConfig {
  hostUrl: string;
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  certificate?: string | null;
  timeout?: number;
}

export class IntegrationSuiteClient {
  private config: ClientConfig;

  constructor(config: ClientConfig) {
    this.config = {
      timeout: 30000,
      ...config,
    };
  }

  /**
   * Performs Client Credentials OAuth authentication against SAP token endpoint.
   * Rejects immediately on failure without retries.
   */
  async authenticate(): Promise<{ accessToken: string; duration: number }> {
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout ?? 30000);

    try {
      const params = new URLSearchParams();
      params.append('grant_type', 'client_credentials');

      const authHeader = 'Basic ' + Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');

      const response = await fetch(this.config.tokenUrl, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: params.toString(),
        signal: controller.signal,
      });

      const duration = Date.now() - startTime;

      if (!response.ok) {
        let errorCode = 'AuthenticationFailed';
        let errorDesc = `HTTP error ${response.status}`;
        try {
          const data = await response.json();
          errorCode = data.error || errorCode;
          errorDesc = data.error_description || errorDesc;
        } catch {
          try {
            const text = await response.text();
            errorDesc = text || errorDesc;
          } catch {}
        }
        throw { httpStatus: response.status, code: errorCode, message: errorDesc };
      }

      const data = await response.json();
      if (!data.access_token) {
        throw { httpStatus: 200, code: 'InvalidResponse', message: 'No access token returned in response' };
      }

      return {
        accessToken: data.access_token,
        duration,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Queries the API root endpoint with X-CSRF-Token: Fetch to fetch token.
   * Performs up to 2 retries on 5xx server errors.
   */
  async fetchCsrfToken(accessToken: string): Promise<{ csrfToken: string; cookies: string[]; duration: number; httpStatus: number }> {
    const url = `${this.config.hostUrl}/api/v1/`;
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout ?? 30000);

    try {
      let response: Response | null = null;
      let lastError: any = null;
      const maxRetries = 2;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          response = await fetch(url, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'X-CSRF-Token': 'Fetch',
              'Accept': 'application/json',
            },
            signal: controller.signal,
          });

          if (response.status < 500) {
            break;
          }

          if (attempt < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
          }
        } catch (err: any) {
          lastError = err;
          if (attempt < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
          } else {
            throw err;
          }
        }
      }

      if (!response) {
        throw lastError || new Error('Connection failed');
      }

      const duration = Date.now() - startTime;
      const httpStatus = response.status;

      if (httpStatus >= 400) {
        let errorMsg = `HTTP Error ${httpStatus}`;
        try {
          const body = await response.text();
          errorMsg = body || errorMsg;
        } catch {}
        throw { httpStatus, message: errorMsg };
      }

      const csrfToken = response.headers.get('x-csrf-token') || '';
      const setCookieHeader = response.headers.get('set-cookie');
      const cookies = setCookieHeader ? [setCookieHeader] : [];

      return {
        csrfToken,
        cookies,
        duration,
        httpStatus,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Deterministic SHA-256 configuration hash computation.
   */
  static computeConfigHash(config: { hostUrl: string; tokenUrl: string; clientId: string; clientSecret: string; certificate: string | null }): string {
    const raw = JSON.stringify({
      hostUrl: config.hostUrl,
      tokenUrl: config.tokenUrl,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      certificate: config.certificate || null,
    });
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  /**
   * Helper to extract a friendly default tenant label from hostUrl.
   */
  static extractTenant(hostUrl: string): string {
    try {
      const url = new URL(hostUrl);
      const hostname = url.hostname;
      const parts = hostname.split('.');
      if (parts.length > 0) {
        // e.g. abcd1234.cfapps.eu10.hana.ondemand.com -> abcd1234
        return parts[0];
      }
      return hostname;
    } catch {
      return 'SAP BTP';
    }
  }

  /**
   * Executes a generic HTTP request against the host.
   */
  async execute(
    method: HttpMethod,
    path: string,
    headers: Record<string, string>,
    body?: string
  ): Promise<{ status: number; text: string; headers: Headers }> {
    const url = `${this.config.hostUrl}${path}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout ?? 30000);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body,
        signal: controller.signal,
      });

      const text = await response.text();
      return {
        status: response.status,
        text,
        headers: response.headers,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

