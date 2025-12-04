const BASE_URL = "https://functionapp-python-api-atfnhbf0b7c2b0ds.westeurope-01.azurewebsites.net/api/logs";
// Logic App Configuration for Arrivals
const LOGIC_APP_URL = "https://prod-243.westeurope.logic.azure.com:443/workflows/35c2398954db4915a9c7767fc068166d/triggers/When_an_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=yrdQOz1v19Tq4fCCUISH7WwHFm3kfkbjl-mYiy6Yk3Y";
const CONTAINER_NAME = "document-intelligence";
const MASTER_FILE_PATH = "MasterData/MRN_Master_Records.json";

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

export async function getMasterRecords() {
  const payload = {
    container: CONTAINER_NAME,
    filepath: MASTER_FILE_PATH
  };
  
  try {
    const response = await fetch(LOGIC_APP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch master records: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Handle new optimized response format
    return {
      records: Array.isArray(data) ? data : [],
      total: Array.isArray(data) ? data.length : 0
    };
    
  } catch (error) {
    console.error('Error fetching master records:', error);
    throw error;
  }
}