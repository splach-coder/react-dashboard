const BASE_URL = "https://functionapp-python-api-atfnhbf0b7c2b0ds.westeurope-01.azurewebsites.net/api/logs";

export async function getUploads(companyName = "", options = {}) {
  const {
    limit = 50,
    status = null,
    recent = true
  } = options;

  // Build query parameters
  const params = new URLSearchParams({
    code: import.meta.env.VITE_API_MAIN_KEY,
    recent: recent.toString(),
    limit: limit.toString()
  });

  if (status) params.append('status', status);
  if (companyName) params.append('company', companyName);

  // Build URL
  const url = companyName ? 
    `${BASE_URL}/${companyName}?${params}` : 
    `${BASE_URL}?${params}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);

  const data = await res.json();

  // Handle new optimized response format
  if (data.logs) {
    // New format from optimized API
    return {
      logs: data.logs,
      total: data.total || data.logs.length,
      timedOut: data.timedOutWorkflows || [],
      cached: data.cached || false
    };
  } else {
    // Fallback for old format (plain array)
    console.warn("Using fallback format - API may not be optimized yet");
    return {
      logs: Array.isArray(data) ? data : [],
      total: Array.isArray(data) ? data.length : 0,
      timedOut: [],
      cached: false
    };
  }
}