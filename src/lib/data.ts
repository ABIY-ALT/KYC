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

export type BranchPerformanceData = {
  id: string;
  name: string;
  totalSubmissions: number;
  approvalRate: number;
  amendmentCount: number;
  avgTurnaroundTime: number; // in days
  slaCompliance: number; // as a percentage
};

export const branchPerformanceData: BranchPerformanceData[] = [
  { id: 'branch-01', name: 'Downtown', totalSubmissions: 450, approvalRate: 85, amendmentCount: 45, avgTurnaroundTime: 1.2, slaCompliance: 98 },
  { id: 'branch-02', name: 'Uptown', totalSubmissions: 320, approvalRate: 92, amendmentCount: 15, avgTurnaroundTime: 0.8, slaCompliance: 99 },
  { id: 'branch-03', name: 'Eastside', totalSubmissions: 280, approvalRate: 78, amendmentCount: 60, avgTurnaroundTime: 2.1, slaCompliance: 95 },
  { id: 'branch-04', name: 'Westend', totalSubmissions: 150, approvalRate: 88, amendmentCount: 20, avgTurnaroundTime: 1.5, slaCompliance: 97 },
  { id: 'branch-05', name: 'North', totalSubmissions: 510, approvalRate: 95, amendmentCount: 10, avgTurnaroundTime: 0.7, slaCompliance: 100 },
];

export type DistrictPerformanceData = {
  id: string;
  name: string;
  totalSubmissions: number;
  approvalRate: number;
  avgTurnaroundTime: number; // in days
  slaCompliance: number; // as a percentage
  branchCount: number;
};

export const districtPerformanceData: DistrictPerformanceData[] = [
  { id: 'dist-01', name: 'Metro District', totalSubmissions: 770, approvalRate: 88, avgTurnaroundTime: 1.0, slaCompliance: 98, branchCount: 2 },
  { id: 'dist-02', name: 'Suburban District', totalSubmissions: 430, approvalRate: 85, avgTurnaroundTime: 1.8, slaCompliance: 96, branchCount: 2 },
  { id: 'dist-03', name: 'Northern District', totalSubmissions: 510, approvalRate: 95, avgTurnaroundTime: 0.7, slaCompliance: 100, branchCount: 1 },
];


export type OfficerPerformanceData = {
  id: string;
  name: string;
  casesReviewed: number;
  approvalRate: number; // percentage
  amendmentRate: number; // percentage
  escalationRate: number; // percentage
  avgProcessingTime: number; // in hours
};

export const officerPerformanceData: OfficerPerformanceData[] = [
  { id: 'off-001', name: 'Charlie Davis', casesReviewed: 152, approvalRate: 95, amendmentRate: 3, escalationRate: 2, avgProcessingTime: 4.5 },
  { id: 'off-002', name: 'Diana Prince', casesReviewed: 181, approvalRate: 98, amendmentRate: 1, escalationRate: 1, avgProcessingTime: 3.2 },
  { id: 'off-003', name: 'Ethan Hunt', casesReviewed: 124, approvalRate: 90, amendmentRate: 7, escalationRate: 3, avgProcessingTime: 6.1 },
  { id: 'off-004', name: 'Fiona Glenanne', casesReviewed: 203, approvalRate: 92, amendmentRate: 5, escalationRate: 3, avgProcessingTime: 5.5 },
  { id: 'off-005', name: 'George Mason', casesReviewed: 95, approvalRate: 88, amendmentRate: 10, escalationRate: 2, avgProcessingTime: 7.3 },
  { id: 'off-006', name: 'Hannah Wells', casesReviewed: 133, approvalRate: 91, amendmentRate: 6, escalationRate: 3, avgProcessingTime: 5.9 },
];

export type DepartmentKpi = {
  label: string;
  value: string;
  change: number;
  unit: string;
  icon?: 'TrendingUp' | 'Clock' | 'AlertOctagon' | 'CheckCheck';
};

export const departmentKpiData: DepartmentKpi[] = [
    { label: "Overall Approval Rate", value: "88.2%", change: 1.2, unit: "% vs last period", icon: 'TrendingUp' },
    { label: "Average Turnaround Time", value: "1.9 Days", change: -0.3, unit: " Days vs last period", icon: 'Clock' },
    { label: "Total Escalations", value: "18", change: 5, unit: " cases vs last period", icon: 'AlertOctagon' },
    { label: "SLA Compliance", value: "97.5%", change: 0.5, unit: "% vs last period", icon: 'CheckCheck' },
];

export const statusDistributionData = [
  { status: 'Approved', count: 982, fill: 'hsl(var(--chart-1))' },
  { status: 'Pending', count: 78, fill: 'hsl(var(--chart-2))' },
  { status: 'Amendment', count: 153, fill: 'hsl(var(--chart-3))' },
  { status: 'Rejected', count: 21, fill: 'hsl(var(--chart-4))' },
  { status: 'Escalated', count: 18, fill: 'hsl(var(--chart-5))' },
];

export type Notification = {
  id: string;
  type: 'New Submission' | 'Amendment Request' | 'Approval' | 'Escalation' | 'SLA Warning';
  message: string;
  timestamp: string;
  isRead: boolean;
  linkTo: string; // e.g., /review-queue/SUB001
};

export const notifications: Notification[] = [
  {
    id: 'notif-001',
    type: 'New Submission',
    message: 'New KYC submission from Alice Johnson (SUB001).',
    timestamp: '2023-10-27T11:55:00Z',
    isRead: false,
    linkTo: '/review-queue/SUB001',
  },
  {
    id: 'notif-002',
    type: 'Escalation',
    message: 'Case SUB004 for David Green has been escalated for review.',
    timestamp: '2023-10-27T10:00:00Z',
    isRead: false,
    linkTo: '/review-queue/SUB004',
  },
  {
    id: 'notif-003',
    type: 'Approval',
    message: 'Your submission for Bob Williams (SUB002) has been approved.',
    timestamp: '2023-10-27T04:00:00Z',
    isRead: true,
    linkTo: '/review-queue/SUB002',
  },
  {
    id: 'notif-004',
    type: 'Amendment Request',
    message: 'Amendment requested for Carol White (SUB003).',
    timestamp: '2023-10-26T12:00:00Z',
    isRead: true,
    linkTo: '/review-queue/SUB003',
  },
  {
    id: 'notif-005',
    type: 'SLA Warning',
    message: 'Submission SUB006 is nearing its SLA deadline.',
    timestamp: '2023-10-27T11:30:00Z',
    isRead: false,
    linkTo: '/review-queue/SUB006',
  },
  {
    id: 'notif-006',
    type: 'New Submission',
    message: 'New KYC submission from Grace Hall (SUB007).',
    timestamp: '2023-10-27T09:00:00Z',
    isRead: true,
    linkTo: '/review-queue/SUB007',
  },
];

export type User = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'Admin' | 'Supervisor' | 'Officer' | 'Branch Manager';
  branch: string;
  district: string;
  status: 'Active' | 'Inactive';
};

export const users: User[] = [
  { id: 'usr-admin', username: 'aray', firstName: 'Alex', lastName: 'Ray', email: 'alex.ray@kycflow.com', role: 'Admin', branch: 'Corporate', district: 'Corporate', status: 'Active' },
  { id: 'off-001', username: 'cdavis', firstName: 'Charlie', lastName: 'Davis', email: 'charlie.davis@kycflow.com', role: 'Officer', branch: 'Downtown', district: 'Metro District', status: 'Active' },
  { id: 'off-002', username: 'dprince', firstName: 'Diana', lastName: 'Prince', email: 'diana.prince@kycflow.com', role: 'Officer', branch: 'Uptown', district: 'Metro District', status: 'Active' },
  { id: 'usr-sup-1', username: 'sjones', firstName: 'Samuel', lastName: 'Jones', email: 'samuel.jones@kycflow.com', role: 'Supervisor', branch: 'Downtown', district: 'Metro District', status: 'Active' },
  { id: 'usr-man-1', username: 'mgarcia', firstName: 'Maria', lastName: 'Garcia', email: 'maria.garcia@kycflow.com', role: 'Branch Manager', branch: 'Eastside', district: 'Suburban District', status: 'Inactive' },
  { id: 'off-003', username: 'ehunt', firstName: 'Ethan', lastName: 'Hunt', email: 'ethan.hunt@kycflow.com', role: 'Officer', branch: 'Eastside', district: 'Suburban District', status: 'Active' },
  { id: 'off-004', username: 'fglenanne', firstName: 'Fiona', lastName: 'Glenanne', email: 'fiona.glenanne@kycflow.com', role: 'Officer', branch: 'Westend', district: 'Suburban District', status: 'Active' },
];

export type AuditLog = {
  id: string;
  timestamp: string;
  userId: string;
  userName:string;
  userAvatar: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
};

export const auditLogs: AuditLog[] = [
  {
    id: 'log-001',
    timestamp: '2023-10-27T14:30:00Z',
    userId: 'usr-admin',
    userName: 'Alex Ray',
    userAvatar: 'user-avatar-3',
    action: 'USER_LOGIN_SUCCESS',
    entityType: 'User',
    entityId: 'usr-admin',
    details: 'User logged in from IP: 192.168.1.100',
  },
  {
    id: 'log-002',
    timestamp: '2023-10-27T14:05:00Z',
    userId: 'off-001',
    userName: 'Charlie Davis',
    userAvatar: 'user-avatar-1',
    action: 'UPDATE_SUBMISSION_STATUS',
    entityType: 'Submission',
    entityId: 'SUB002',
    details: 'Changed status from "Pending" to "Approved"',
  },
  {
    id: 'log-003',
    timestamp: '2023-10-27T13:45:00Z',
    userId: 'usr-admin',
    userName: 'Alex Ray',
    userAvatar: 'user-avatar-3',
    action: 'CREATE_USER',
    entityType: 'User',
    entityId: 'off-006',
    details: 'Created new user: Hannah Wells (off-006) with role Officer',
  },
  {
    id: 'log-004',
    timestamp: '2023-10-27T12:10:00Z',
    userId: 'off-002',
    userName: 'Diana Prince',
    userAvatar: 'user-avatar-2',
    action: 'REQUEST_AMENDMENT',
    entityType: 'Submission',
    entityId: 'SUB003',
    details: 'Reason: "The provided ID is blurry. Please upload a clearer copy."',
  },
  {
    id: 'log-005',
    timestamp: '2023-10-27T11:00:00Z',
    userId: 'usr-sup-1',
    userName: 'Samuel Jones',
    userAvatar: 'user-avatar-4',
    action: 'ESCALATE_SUBMISSION',
    entityType: 'Submission',
    entityId: 'SUB004',
    details: 'Escalated due to expired document.',
  },
  {
    id: 'log-006',
    timestamp: '2023-10-26T18:00:00Z',
    userId: 'usr-admin',
    userName: 'Alex Ray',
    userAvatar: 'user-avatar-3',
    action: 'UPDATE_SYSTEM_SETTING',
    entityType: 'System',
    entityId: 'sla-thresholds',
    details: 'Changed Review SLA from 24 hours to 36 hours.',
  },
   {
    id: 'log-007',
    timestamp: '2023-10-26T17:30:00Z',
    userId: 'usr-admin',
    userName: 'Alex Ray',
    userAvatar: 'user-avatar-3',
    action: 'DEACTIVATE_USER',
    entityType: 'User',
    entityId: 'usr-man-1',
    details: 'Deactivated user: Maria Garcia (usr-man-1)',
  },
];
    