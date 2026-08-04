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
      hostUrl: config.hostUrl.replace(/\/+$/, ''),
      tokenUrl: config.tokenUrl.replace(/\/+$/, ''),
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
      console.log(`[IntegrationSuiteClient] OAuth Request to URL: ${this.config.tokenUrl}`);
      const params = new URLSearchParams();
      params.append('grant_type', 'client_credentials');

      const authHeader = 'Basic ' + Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');
      
      console.log(`[IntegrationSuiteClient] OAuth Request Headers:`, JSON.stringify({
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      }, null, 2));
      console.log(`[IntegrationSuiteClient] OAuth Request Body:`, params.toString());

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
      
      const responseClone = response.clone();
      const responseHeaders: any = {};
      response.headers.forEach((v, k) => { responseHeaders[k] = v; });
      console.log(`[IntegrationSuiteClient] OAuth Response Status: ${response.status}`);
      console.log(`[IntegrationSuiteClient] OAuth Response Headers:`, JSON.stringify(responseHeaders, null, 2));
      try {
        const responseText = await responseClone.text();
        console.log(`[IntegrationSuiteClient] OAuth Response Body:`, responseText);
      } catch {}

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
        console.error(`[IntegrationSuiteClient] OAuth authentication failed. Status: ${response.status}. Reason: ${errorDesc}`);
        throw { httpStatus: response.status, code: errorCode, message: errorDesc, endpoint: this.config.tokenUrl };
      }

      const data = await response.json();
      if (!data.access_token) {
        console.error(`[IntegrationSuiteClient] OAuth authentication returned invalid response structure.`);
        throw { httpStatus: 200, code: 'InvalidResponse', message: 'No access token returned in response', endpoint: this.config.tokenUrl };
      }

      console.log(`[IntegrationSuiteClient] OAuth authentication successful. Duration: ${duration}ms`);
      return {
        accessToken: data.access_token,
        duration,
      };
    } catch (err: any) {
      if (err.code && typeof err.code === 'string') throw err;
      throw {
        code: 'OAuthConnectionError',
        message: err.message || String(err),
        endpoint: this.config.tokenUrl,
        cause: err,
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
      console.log(`[IntegrationSuiteClient] Fetching CSRF token from: ${url}`);
      let response: Response | null = null;
      let lastError: any = null;
      const maxRetries = 2;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          console.log(`[IntegrationSuiteClient] CSRF attempt ${attempt + 1}/${maxRetries + 1} to GET ${url}`);
          console.log(`[IntegrationSuiteClient] CSRF Request Headers:`, JSON.stringify({
            'Authorization': `Bearer ${accessToken}`,
            'X-CSRF-Token': 'Fetch',
            'Accept': 'application/json',
          }, null, 2));

          response = await fetch(url, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'X-CSRF-Token': 'Fetch',
              'Accept': 'application/json',
            },
            signal: controller.signal,
          });

          console.log(`[IntegrationSuiteClient] CSRF attempt ${attempt + 1} responded with status: ${response.status}`);
          const responseHeaders: any = {};
          response.headers.forEach((v, k) => { responseHeaders[k] = v; });
          console.log(`[IntegrationSuiteClient] CSRF Response Headers:`, JSON.stringify(responseHeaders, null, 2));
          try {
            const responseClone = response.clone();
            const responseText = await responseClone.text();
            console.log(`[IntegrationSuiteClient] CSRF Response Body:`, responseText);
          } catch {}
          if (response.status < 500) {
            break;
          }

          if (attempt < maxRetries) {
            console.log(`[IntegrationSuiteClient] CSRF attempt ${attempt + 1} returned 5xx status. Retrying in ${1000 * (attempt + 1)}ms...`);
            await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
          }
        } catch (err: any) {
          lastError = err;
          console.error(`[IntegrationSuiteClient] CSRF attempt ${attempt + 1} caught error: ${err.message || err}`);
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
        let body = '';
        try {
          body = await response.text();
          errorMsg = body || errorMsg;
        } catch {}
        console.error(`[IntegrationSuiteClient] CSRF Fetch failed with status ${httpStatus}. URL: ${url}. Response: ${body}`);
        throw { httpStatus, message: errorMsg, endpoint: url, responseBody: body };
      }

      const csrfToken = response.headers.get('x-csrf-token') || '';
      const setCookieHeader = response.headers.get('set-cookie');
      const cookies = setCookieHeader ? [setCookieHeader] : [];

      console.log(`[IntegrationSuiteClient] CSRF Fetch successful. Status: ${httpStatus}, CSRF Token Present: ${!!csrfToken}, Cookies Count: ${cookies.length}. Duration: ${duration}ms`);
      return {
        csrfToken,
        cookies,
        duration,
        httpStatus,
      };
    } catch (err: any) {
      if (err.httpStatus) throw err;
      throw {
        code: 'CsrfConnectionError',
        message: err.message || String(err),
        endpoint: url,
        cause: err,
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
      console.log(`[IntegrationSuiteClient] Executing OData Request: ${method} ${url}`);
      console.log(`[IntegrationSuiteClient] OData Request Headers:`, JSON.stringify(headers, null, 2));
      if (body) {
        console.log(`[IntegrationSuiteClient] OData Request Body:`, body);
      }

      const response = await fetch(url, {
        method,
        headers,
        body,
        signal: controller.signal,
      });

      const responseHeaders: any = {};
      response.headers.forEach((v, k) => { responseHeaders[k] = v; });
      console.log(`[IntegrationSuiteClient] OData Response Status: ${response.status}`);
      console.log(`[IntegrationSuiteClient] OData Response Headers:`, JSON.stringify(responseHeaders, null, 2));

      const responseClone = response.clone();
      const text = await response.text();
      console.log(`[IntegrationSuiteClient] OData Response Body:`, text);

      if (!response.ok) {
        throw {
          httpStatus: response.status,
          message: text || `HTTP error ${response.status}`,
          endpoint: url,
          responseBody: text,
          headers: response.headers,
        };
      }

      return {
        status: response.status,
        text,
        headers: response.headers,
      };
    } catch (err: any) {
      if (err.httpStatus) throw err;
      console.error(`[IntegrationSuiteClient] OData Request ${method} ${url} failed. Error: ${err.message || err}`);
      throw {
        code: 'ODataConnectionError',
        message: err.message || String(err),
        endpoint: url,
        cause: err,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
