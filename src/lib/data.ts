export type Submission = {
  id: string;
  customerName: string;
  branch: string;
  submittedAt: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Amendment' | 'Escalated';
  officer: string;
  documentType: 'Passport' | "Driver's License" | 'National ID' | 'Utility Bill';
  documentUrl: string; // URL to the document image
  details: string; // The text content of the document for AI processing
};

export const submissions: Submission[] = [
  { 
    id: 'SUB001', 
    customerName: 'Alice Johnson', 
    branch: 'Downtown', 
    submittedAt: '2023-10-26T10:00:00Z', 
    status: 'Pending', 
    officer: 'N/A', 
    documentType: 'Passport', 
    documentUrl: 'https://picsum.photos/seed/doc1/800/1100',
    details: 'Passport\nName: Alice Johnson\nDOB: 1990-05-15\nExpiry: 2028-08-20\nCountry: USA'
  },
  { 
    id: 'SUB002', 
    customerName: 'Bob Williams', 
    branch: 'Uptown', 
    submittedAt: '2023-10-26T11:30:00Z', 
    status: 'Approved', 
    officer: 'Charlie Davis',
    documentType: "Driver's License", 
    documentUrl: 'https://picsum.photos/seed/doc2/800/1100',
    details: 'Driver\'s License\nName: Bob Williams\nDOB: 1985-11-02\nExpiry: 2025-10-30'
  },
  { 
    id: 'SUB003', 
    customerName: 'Carol White', 
    branch: 'Eastside', 
    submittedAt: '2023-10-25T14:00:00Z', 
    status: 'Amendment', 
    officer: 'Diana Prince',
    documentType: 'National ID',
    documentUrl: 'https://picsum.photos/seed/doc3/800/1100',
    details: 'National ID\nName: Carol White\nDOB: 1992-03-10\nExpiry: 2030-01-01'
  },
  { 
    id: 'SUB004', 
    customerName: 'David Green', 
    branch: 'Westend', 
    submittedAt: '2023-10-25T09:15:00Z', 
    status: 'Escalated', 
    officer: 'Charlie Davis',
    documentType: 'Passport',
    documentUrl: 'https://picsum.photos/seed/doc4/800/1100',
    details: 'Passport\nName: David Green\nDOB: 1978-07-22\nExpiry: 2023-01-15\nNote: Document is expired.'
  },
  { 
    id: 'SUB005', 
    customerName: 'Eve Black', 
    branch: 'Downtown', 
    submittedAt: '2023-10-24T16:45:00Z', 
    status: 'Rejected', 
    officer: 'Diana Prince',
    documentType: 'Utility Bill',
    documentUrl: 'https://picsum.photos/seed/doc5/800/1100',
    details: 'Utility Bill\nName: E. Black\nAddress: 123 Main St\nNote: Name does not match full registered name.'
  },
  { 
    id: 'SUB006', 
    customerName: 'Frank Blue', 
    branch: 'Uptown', 
    submittedAt: '2023-10-27T08:00:00Z', 
    status: 'Pending', 
    officer: 'N/A',
    documentType: "Driver's License",
    documentUrl: 'https://picsum.photos/seed/doc6/800/1100',
    details: 'Driver\'s License\nName: Frank Blue\nDOB: 1995-09-09\nExpiry: 2029-09-08'
  },
  { 
    id: 'SUB007', 
    customerName: 'Grace Hall', 
    branch: 'Eastside', 
    submittedAt: '2023-10-27T09:00:00Z', 
    status: 'Pending', 
    officer: 'N/A',
    documentType: 'National ID',
    documentUrl: 'https://picsum.photos/seed/doc7/800/1100',
    details: 'National ID\nName: Grace Hall\nDOB: 2000-01-20\nExpiry: 2032-01-19'
  },
];

export type PerformanceMetric = {
  label: string;
  value: number;
  change: number;
};

export const kpiData: PerformanceMetric[] = [
    { label: 'Total Submissions', value: 1254, change: 12.5 },
    { label: 'Pending Review', value: 78, change: -5.2 },
    { label: 'Approved', value: 982, change: 8.1 },
    { label: 'Requires Amendment', value: 153, change: 20.3 },
];

export const submissionTrendData = [
    { date: 'Jan', submissions: 400 },
    { date: 'Feb', submissions: 300 },
    { date: 'Mar', submissions: 500 },
    { date: 'Apr', submissions: 450 },
    { date: 'May', submissions: 600 },
    { date: 'Jun', submissions: 700 },
];
