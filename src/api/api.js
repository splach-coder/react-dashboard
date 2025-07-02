const BASE_URL = "https://functionapp-python-api-atfnhbf0b7c2b0ds.westeurope-01.azurewebsites.net/api/logs";

export async function getUploads(companyName = "") {
  const url = companyName
    ? `${BASE_URL}/${companyName}?code=${import.meta.env.VITE_API_MAIN_KEY}`
    : `${BASE_URL}?code=${import.meta.env.VITE_API_MAIN_KEY}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);

  const data = await res.json();

  // Optional: verify data shape here to debug
  if (!Array.isArray(data)) {
    console.warn("API returned unexpected data format", data);
  }

  return data;
}
