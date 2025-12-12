// API endpoints for error/waiting tracking system
// Using local server endpoint via Vite proxy
const TRACKING_API_BASE = "/api/tracking";

/**
 * Get tracking records for a specific MRN
 * @param {string} mrn - The MRN to get tracking for
 * @returns {Promise<Array>} Array of tracking records
 */
export async function getTrackingRecords(mrn) {
  try {
    const response = await fetch(`${TRACKING_API_BASE}/${encodeURIComponent(mrn)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch tracking records: ${response.status}`);
    }

    const data = await response.json();
    return data.tracking_records || [];
  } catch (error) {
    console.error('Error fetching tracking records:', error);
    return [];
  }
}

/**
 * Get ALL tracking records
 * @returns {Promise<Array>} Array of all tracking records
 */
export async function getAllTrackingRecords() {
  try {
    const response = await fetch(TRACKING_API_BASE, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch all tracking records: ${response.status}`);
    }

    const data = await response.json();
    return data.records || [];
  } catch (error) {
    // console.error('Error fetching all tracking records:', error);
    return []; // Return empty if fails (e.g. server not running)
  }
}

/**
 * Add a tracking record (check/note) for an MRN
 * @param {string} mrn - The MRN
 * @param {Object} trackingData - Tracking data
 * @returns {Promise<Object>} Response data
 */
export async function addTrackingRecord(mrn, trackingData) {
  const payload = {
    mrn: mrn,
    tracking_data: {
      ...trackingData,
      timestamp: new Date().toISOString(),
    }
  };

  try {
    const response = await fetch(TRACKING_API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to add tracking record: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error adding tracking record:', error);
    throw error;
  }
}

/**
 * Add multiple tracking records at once
 * @param {Array} records - Array of { mrn, tracking_data }
 * @returns {Promise<Object>} Response data
 */
export async function addBulkTrackingRecords(records) {
  try {
    const response = await fetch(`${TRACKING_API_BASE}/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ records })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to add bulk records: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error adding bulk records:', error);
    throw error;
  }
}

/**
 * Generate email draft for waiting/error status
 * @param {Object} arrival - The arrival record
 * @param {number} daysWaiting - Number of days waiting
 * @returns {Object} Email draft with subject and body
 */
export function generateEmailDraft(arrival, daysWaiting) {
  const subject = `Action Required: MRN ${arrival.MRN} - Waiting for Outbounds (${daysWaiting} days)`;
  
  const body = `Dear Team,

This is an automated notification regarding a customs declaration that requires attention.

**Declaration Details:**
- MRN: ${arrival.MRN}
- Declaration ID: ${arrival.DECLARATIONID}
- Commercial Reference: ${arrival.COMMERCIALREFERENCE || 'N/A'}
- Released Date: ${arrival.GDSREL_DATETIME ? new Date(arrival.GDSREL_DATETIME).toLocaleDateString() : 'N/A'}
- Days Waiting: ${daysWaiting} days

**Current Status:**
- Total Packages: ${arrival.TOTAL_PACKAGES || 0}
- Saldo (Remaining): ${arrival.saldo || 0} packages
- Outbounds Declared: ${arrival.Outbounds?.length || 0}

**Issue:**
This shipment has been waiting for outbound declarations for ${daysWaiting} days. The saldo indicates ${arrival.saldo} package(s) still need to be declared for outbound.

**Required Action:**
Please review this declaration and:
1. Verify if outbound declarations are pending
2. Check for any documentation issues
3. Contact the relevant parties if necessary
4. Update the system once resolved

Best regards,
Customs Dashboard System`;

  return { subject, body };
}

/**
 * Calculate days since release
 * @param {string} releaseDate - Release date string
 * @returns {number} Number of days
 */
export function calculateDaysSinceRelease(releaseDate) {
  if (!releaseDate) return 0;
  
  const release = new Date(releaseDate);
  const now = new Date();
  const diffTime = Math.abs(now - release);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}
