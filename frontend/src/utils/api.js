async function request(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const error = new Error(payload.message || 'Request failed');
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }
  return response.json();
}

export function apiGet(url) {
  return request(url);
}

export function apiPost(url, body) {
  return request(url, { method: 'POST', body: JSON.stringify(body) });
}

export function apiPut(url, body) {
  return request(url, { method: 'PUT', body: JSON.stringify(body) });
}

export function apiPatch(url, body) {
  return request(url, { method: 'PATCH', body: JSON.stringify(body) });
}

export function apiDelete(url) {
  return request(url, { method: 'DELETE' });
}
