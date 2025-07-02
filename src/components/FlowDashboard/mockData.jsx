export const mockFlowRuns = [
    {
      id: 'run-001',
      projectName: 'Email Processing Pipeline',
      triggerTime: '2025-06-17 14:30:22',
      status: 'success',
      lastCompletedStep: 'Excel File Dropped',
      steps: [
        { id: '1', status: 'success', timestamp: '2025-06-17 14:30:22', message: 'Email received successfully from john@company.com' },
        { id: '2', status: 'success', timestamp: '2025-06-17 14:30:45', message: 'Email content and attachments analyzed. Found 1 PDF attachment.' },
        { id: '3', status: 'success', timestamp: '2025-06-17 14:31:12', message: 'Extracted 156 records from PDF tables successfully.' },
        { id: '4', status: 'success', timestamp: '2025-06-17 14:31:34', message: 'Excel file generated and uploaded to shared folder.' }
      ]
    },
    {
      id: 'run-002',
      projectName: 'Invoice Processing Flow',
      triggerTime: '2025-06-17 13:15:33',
      status: 'failed',
      lastCompletedStep: 'Data Extracted',
      steps: [
        { id: '1', status: 'success', timestamp: '2025-06-17 13:15:33', message: 'Email received successfully from billing@vendor.com' },
        { id: '2', status: 'success', timestamp: '2025-06-17 13:15:56', message: 'Email content analyzed. Invoice PDF detected.' },
        { id: '3', status: 'success', timestamp: '2025-06-17 13:16:23', message: 'Invoice data extracted: Amount $2,450.00, Due: 2025-07-01' },
        { id: '4', status: 'failed', timestamp: '2025-06-17 13:16:45', message: 'Error: Unable to connect to file server. Connection timeout after 30s.' }
      ]
    },
    {
      id: 'run-003',
      projectName: 'Customer Data Import',
      triggerTime: '2025-06-17 12:45:11',
      status: 'success',
      lastCompletedStep: 'Excel File Dropped',
      steps: [
        { id: '1', status: 'success', timestamp: '2025-06-17 12:45:11', message: 'Email received from customer-service@client.com' },
        { id: '2', status: 'success', timestamp: '2025-06-17 12:45:34', message: 'Customer list CSV file identified and validated.' },
        { id: '3', status: 'success', timestamp: '2025-06-17 12:46:01', message: 'Processed 89 customer records, normalized phone numbers and addresses.' },
        { id: '4', status: 'success', timestamp: '2025-06-17 12:46:18', message: 'Excel file created and saved to customer database folder.' }
      ]
    },
    {
      id: 'run-004',
      projectName: 'Report Generation',
      triggerTime: '2025-06-17 11:20:44',
      status: 'failed',
      lastCompletedStep: 'Email/File Understood',
      steps: [
        { id: '1', status: 'success', timestamp: '2025-06-17 11:20:44', message: 'Scheduled email trigger activated.' },
        { id: '2', status: 'failed', timestamp: '2025-06-17 11:21:12', message: 'Error: Unable to parse attachment. File appears to be corrupted.' },
        { id: '3', status: 'pending', timestamp: null, message: 'Waiting for previous step to complete.' },
        { id: '4', status: 'pending', timestamp: null, message: 'Waiting for previous step to complete.' }
      ]
    }
  ];
  