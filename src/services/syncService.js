import axios from 'axios';
import Bug from '../models/bugModel.js';
import Project from '../models/projectModel.js';
import User from '../models/userModel.js';
import ActivityLog from '../models/activityLogModel.js';

const VALID_PRIORITIES = ['low', 'medium', 'high', 'critical'];
const VALID_STATUSES = ['open', 'in-progress', 'resolved', 'closed', 'testing', 'reopened'];

/**
 * Sanitize issue data
 */
function sanitizeIssue(raw) {
  return {
    issueId: raw.issueId?.toString().trim(),
    title: raw.title?.toString().trim(),
    projectId: raw.projectId?.toString().trim(),
    assignedTo: raw.assignedTo?.toString().trim(),
    reportedBy: raw.reportedBy?.toString().trim(),
    priority: raw.priority?.toString().toLowerCase().trim(),
    severity: raw.severity?.toString().trim(),
    status: raw.status?.toString().toLowerCase().trim(),
    description: raw.description?.toString().trim(),
    createdAt: raw.createdAt ? new Date(raw.createdAt) : undefined,
    dueDate: raw.dueDate ? new Date(raw.dueDate) : undefined,
  };
}

/**
 * Sanitize project data
 */
function sanitizeProject(raw) {
  return {
    projectId: raw.projectId?.toString().trim(),
    title: raw.title?.toString().trim(),
    description: raw.description?.toString().trim(),
    category: raw.category?.toString().trim(),
    owner: raw.owner?.toString().trim(),
    members: Array.isArray(raw.members) ? raw.members.map(m => m?.toString().trim()).filter(Boolean) : [],
    status: raw.status?.toString().toLowerCase().trim(),
    startDate: raw.startDate ? new Date(raw.startDate) : undefined,
  };
}

/**
 * Validate issue against requirements
 */
function validateIssue(issue, validProjectIds, validUserIds) {
  if (!issue.issueId) return { valid: false, reason: 'Missing issueId' };
  if (!issue.title) return { valid: false, reason: 'Missing title' };
  if (!issue.projectId) return { valid: false, reason: 'Missing projectId' };
  
  if (!VALID_PRIORITIES.includes(issue.priority)) {
    return { valid: false, reason: `Invalid priority: ${issue.priority}` };
  }
  
  if (!VALID_STATUSES.includes(issue.status)) {
    return { valid: false, reason: `Invalid status: ${issue.status}` };
  }
  
  if (!validProjectIds.has(issue.projectId)) {
    return { valid: false, reason: `Invalid projectId: ${issue.projectId}` };
  }
  
  if (issue.assignedTo && !validUserIds.has(issue.assignedTo)) {
    return { valid: false, reason: `Invalid assignedTo user: ${issue.assignedTo}` };
  }
  
  if (issue.createdAt && isNaN(issue.createdAt.getTime())) {
    return { valid: false, reason: 'Invalid createdAt date' };
  }
  
  if (issue.dueDate && isNaN(issue.dueDate.getTime())) {
    return { valid: false, reason: 'Invalid dueDate' };
  }
  
  return { valid: true };
}

/**
 * Generic upsert helper
 */
async function upsertMany(Model, records, idField) {
  let inserted = 0;
  let duplicates = 0;
  
  for (const rec of records) {
    try {
      const filter = { [idField]: rec[idField] };
      const existing = await Model.findOne(filter);
      
      if (existing) {
        duplicates++;
        continue;
      }
      
      await Model.create(rec);
      inserted++;
    } catch (err) {
      console.error(`Error inserting record:`, err.message);
    }
  }
  
  return { inserted, duplicates };
}

/**
 * Main sync function that fetches and cleans dataset from assessment server
 */
export const syncDataset = async () => {
  const { STUDENT_ID, STUDENT_PASSWORD, STUDENT_SET, API_BASE_URL } = process.env;

  if (!STUDENT_ID || !STUDENT_PASSWORD || !STUDENT_SET || !API_BASE_URL) {
    throw new Error('Missing required environment variables for dataset sync');
  }

  try {
    // Step 1: Get authentication token
    console.log('Step 1: Authenticating with test server...');
    const tokenRes = await axios.post(`${API_BASE_URL}/public/token`, {
      studentId: STUDENT_ID,
      password: STUDENT_PASSWORD,
      set: STUDENT_SET,
    });

    const token = tokenRes.data.token;
    const dataUrl = tokenRes.data.dataUrl;

    if (!token || !dataUrl) {
      throw new Error('Failed to obtain token from test server');
    }

    // Step 2: Fetch dataset
    console.log('Step 2: Fetching dataset from test server...');
    const dataRes = await axios.get(`${API_BASE_URL}${dataUrl}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const fullData = dataRes.data.data;
    const rawIssues = fullData.issues || [];
    const rawProjects = fullData.projects || [];
    const rawUsers = fullData.users || [];
    const rawActivities = fullData.activities_log || [];

    console.log(`Fetched: ${rawIssues.length} issues, ${rawProjects.length} projects, ${rawUsers.length} users, ${rawActivities.length} activity logs`);

    // Build reference lookup sets
    const validProjectIds = new Set(rawProjects.map(p => p.projectId?.toString().trim()).filter(Boolean));
    const validUserIds = new Set(rawUsers.map(u => u.userId?.toString().trim()).filter(Boolean));

    // Step 3: Sync Users
    console.log('Step 3: Syncing users...');
    const validRoles = ['admin', 'manager', 'developer', 'tester', 'lead'];
    const cleanUsers = rawUsers
      .filter(u => u.userId && u.name && u.email)
      .map(u => ({
        userId: u.userId,
        name: u.name,
        email: u.email,
        password: u.password || 'defaultPassword123',  // Provide default if not present
        role: validRoles.includes(u.role?.toLowerCase()) ? u.role.toLowerCase() : 'developer',
        status: u.status?.toLowerCase().trim() || 'active',
      }));

    const userSync = await upsertMany(User, cleanUsers, 'userId');

    // Step 4: Sync Projects
    console.log('Step 4: Syncing projects...');
    const cleanProjects = rawProjects
      .filter(p => p.projectId && p.title)
      .map(sanitizeProject);

    const projectSync = await upsertMany(Project, cleanProjects, 'projectId');

    // Step 5: Sync Issues (with full validation)
    console.log('Step 5: Syncing and validating issues...');
    const totalFetched = rawIssues.length;
    let inserted = 0;
    let duplicates = 0;
    let rejected = 0;
    const seenInBatch = new Set();

    for (const raw of rawIssues) {
      const issue = sanitizeIssue(raw);

      // Check for duplicates in current batch
      if (seenInBatch.has(issue.issueId)) {
        duplicates++;
        continue;
      }
      seenInBatch.add(issue.issueId);

      // Validate issue
      const { valid, reason } = validateIssue(issue, validProjectIds, validUserIds);
      if (!valid) {
        rejected++;
        console.log(`Rejected issue ${issue.issueId}: ${reason}`);
        continue;
      }

      // Check for duplicates in database
      try {
        const existing = await Bug.findOne({ issueId: issue.issueId });
        if (existing) {
          duplicates++;
          continue;
        }

        await Bug.create(issue);
        inserted++;
      } catch (err) {
        rejected++;
        console.error(`Error creating issue ${issue.issueId}:`, err.message);
      }
    }

    // Step 6: Sync Activity Logs
    console.log('Step 6: Syncing activity logs...');
    const cleanActivities = rawActivities
      .filter(a => a.logId && a.issueId && a.userId)
      .map(a => ({
        ...a,
        createdAt: a.createdAt ? new Date(a.createdAt) : new Date(),
      }));

    const activitySync = await upsertMany(ActivityLog, cleanActivities, 'logId');

    console.log('Sync completed successfully!');

    return {
      totalFetched,
      inserted,
      duplicates,
      rejected,
      users: { inserted: userSync.inserted, duplicates: userSync.duplicates },
      projects: { inserted: projectSync.inserted, duplicates: projectSync.duplicates },
      activities: { inserted: activitySync.inserted, duplicates: activitySync.duplicates },
    };
  } catch (error) {
    console.error('Sync error:', error.message);
    throw error;
  }
};
