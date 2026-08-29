export class ProxyError extends Error {
  constructor(message, originalError) {
    super(message);
    this.name = "ProxyError";
    this.originalError = originalError;
  }
}

/**
 * Proxy HTTP requests from Gateway to internal microservices
 *
 * @param {string} targetUrl Full target URL including path
 * @param {import("express").Request} req Express request object
 * @param {object} [options] Custom fetch options (method, body, headers)
 * @returns {Promise<{ status: number, data: unknown }>}
 */
export async function proxyRequest(targetUrl, req, options = {}) {
  const method = options.method || req.method;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  // Forward original Authorization header if available
  if (req.headers?.authorization) {
    headers["Authorization"] = req.headers.authorization;
  } else if (req.auth?.idToken) {
    headers["Authorization"] = `Bearer ${req.auth.idToken}`;
  }

  // Forward X-Request-ID if available
  if (req.headers?.["x-request-id"] || req.requestId) {
    headers["X-Request-ID"] = req.headers?.["x-request-id"] || req.requestId;
  }

  const fetchOptions = {
    method,
    headers,
  };

  // Attach body for methods that allow payloads
  if (["POST", "PATCH", "PUT"].includes(method.toUpperCase())) {
    if (options.body !== undefined) {
      fetchOptions.body = typeof options.body === "string" ? options.body : JSON.stringify(options.body);
    } else if (req.body && Object.keys(req.body).length > 0) {
      fetchOptions.body = JSON.stringify(req.body);
    }
  }

  const startTime = Date.now();

  try {
    const response = await fetch(targetUrl, fetchOptions);
    const duration = Date.now() - startTime;

    // Log request forwarding cleanly (WITHOUT sensitive auth tokens or passwords)
    console.log(`[Proxy] ${method} ${targetUrl} -> ${response.status} (${duration}ms)`);

    let data;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { success: response.ok, message: text };
    }

    const responseHeaders = {};
    if (response.headers.get("server-timing")) {
      responseHeaders["server-timing"] = response.headers.get("server-timing");
    }
    if (response.headers.get("x-verification-duration-ms")) {
      responseHeaders["x-verification-duration-ms"] = response.headers.get("x-verification-duration-ms");
    }
    if (response.headers.get("x-request-id")) {
      responseHeaders["x-request-id"] = response.headers.get("x-request-id");
    }

    const result = {
      status: response.status,
      data,
    };

    if (Object.keys(responseHeaders).length > 0 || options.includeHeaders) {
      result.headers = responseHeaders;
    }

    return result;

  } catch (error) {
    console.error(`[Proxy Failure] ${method} ${targetUrl}: ${error.message}`);
    throw new ProxyError(`Failed to reach downstream service at ${targetUrl}`, error);
  }
}


