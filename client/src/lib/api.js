// Shared API helpers.
// - serverApi: used in Server Components; talks to Express directly via API_URL.
// - clientApi: used in the browser; goes through the Next.js /api rewrite so cookies stay first-party.

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function handle(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    throw new ApiError(res.status, data.message || `Request failed (${res.status})`, data.details);
  }
  return data;
}

export async function serverApi(path) {
  const base = process.env.API_URL || 'http://localhost:5000';
  const res = await fetch(`${base}/api${path}`);
  return handle(res);
}

export async function clientApi(path, { method = 'GET', body } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  return handle(res);
}

// Turns an ApiError into a readable message, including field-level details
export function errorMessage(err) {
  if (err?.details?.length) return err.details.map((d) => d.message).join('. ');
  return err?.message || 'Something went wrong';
}
