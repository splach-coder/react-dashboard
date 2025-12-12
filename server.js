import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import fs from 'fs';

// Fix __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// Path to JSON store
const DATA_FILE = path.join(__dirname, 'tracking-data.json');

// Helper to read data
const readData = () => {
  if (!fs.existsSync(DATA_FILE)) {
    return { records: [] };
  }
  const data = fs.readFileSync(DATA_FILE, 'utf8');
  return JSON.parse(data);
};

// Helper to write data
const writeData = (data) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

// API Routes
app.get('/api/tracking', (req, res) => {
  const data = readData();
  res.json({ records: data.records });
});

app.get('/api/tracking/:mrn', (req, res) => {
  const { mrn } = req.params;
  const data = readData();
  const record = data.records.find(r => r.MRN === mrn);
  res.json({ tracking_records: record ? record.tracking_records : [] });
});

app.post('/api/tracking', (req, res) => {
  const { mrn, tracking_data } = req.body;
  
  if (!mrn || !tracking_data) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const data = readData();
  let record = data.records.find(r => r.MRN === mrn);

  if (!record) {
    record = { MRN: mrn, tracking_records: [] };
    data.records.push(record);
  }

  record.tracking_records.unshift(tracking_data); // Add new record at start
  writeData(data);

  res.json({ success: true, message: 'Tracking recorded' });
});

app.post('/api/tracking/bulk', (req, res) => {
  const { records } = req.body; // Array of { mrn, tracking_data }
  
  if (!records || !Array.isArray(records)) {
    return res.status(400).json({ error: 'Invalid input containing records array' });
  }

  const data = readData();
  let updateCount = 0;

  records.forEach(({ mrn, tracking_data }) => {
    let record = data.records.find(r => r.MRN === mrn);
    if (!record) {
      record = { MRN: mrn, tracking_records: [] };
      data.records.push(record);
    }
    // Add new record at start
    record.tracking_records.unshift(tracking_data);
    updateCount++;
  });

  writeData(data);
  res.json({ success: true, message: `${updateCount} records updated successfully` });
});

// Handle SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
