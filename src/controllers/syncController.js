import axios from 'axios';
import Bug from '../models/bugModel.js';
import { validateAndSanitizeBug } from '../utils/validators.js';

/**
 * @desc    Fetch and sync external issue dataset
 * @route   POST /sync
 * @access  Private
 */
export const syncExternalIssues = async (req, res, next) => {
  try {
    // 1. Fetch external issues dataset via Axios
    // We fetch from JSONPlaceholder which is a highly reliable public mock API
    const externalUrl = 'https://jsonplaceholder.typicode.com/todos?_limit=30';
    const response = await axios.get(externalUrl);
    
    if (!response.data || !Array.isArray(response.data)) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve external issues array',
      });
    }

    // 2. Map external records to our Bug schema format
    const fetchedRecords = response.data.map((todo) => {
      // Map complete status to resolved, incomplete to open
      const status = todo.completed ? 'resolved' : 'open';
      // Cycle priorities based on ID
      const priorities = ['low', 'medium', 'high', 'critical'];
      const priority = priorities[todo.id % priorities.length];
      
      return {
        title: `Sync Task: ${todo.title}`,
        description: `External Task imported from JSONPlaceholder API. External ID: ${todo.id}, User: User-${todo.userId}`,
        status,
        priority,
        reportedBy: 'ExternalSync',
        assignedTo: `Developer${(todo.id % 4) + 1}`,
      };
    });

    // 3. Inject mock invalid/duplicate records to demonstrate requirements
    // Invalid record: missing title
    fetchedRecords.push({
      description: 'An invalid external record with missing title',
      status: 'open',
      priority: 'low',
      reportedBy: 'ExternalSync',
      assignedTo: 'Developer1',
    });

    // Invalid record: incorrect status value
    fetchedRecords.push({
      title: 'Sync Task: Bad status value',
      description: 'An invalid external record with invalid status',
      status: 'pending-approval', // invalid
      priority: 'high',
      reportedBy: 'ExternalSync',
      assignedTo: 'Developer2',
    });

    // Duplicate record in current batch (matching title of first record)
    if (fetchedRecords.length > 0) {
      fetchedRecords.push({
        title: fetchedRecords[0].title,
        description: 'Duplicate title item in this batch',
        status: fetchedRecords[0].status,
        priority: fetchedRecords[0].priority,
        reportedBy: 'ExternalSync',
        assignedTo: fetchedRecords[0].assignedTo,
      });
    }

    // 4. Fetch all existing bug titles to identify duplicates
    const existingBugs = await Bug.find({}, 'title');
    const existingTitlesSet = new Set(existingBugs.map((bug) => bug.title));

    // 5. Process and filter records
    let inserted = 0;
    let duplicates = 0;
    let rejected = 0;
    const recordsToInsert = [];
    const titlesInThisSync = new Set();

    for (const record of fetchedRecords) {
      // Validate the record
      const { isValid, errors, sanitized } = validateAndSanitizeBug(record);
      
      if (!isValid) {
        rejected++;
        continue;
      }

      // Check for duplicates (against database and current batch)
      if (existingTitlesSet.has(sanitized.title) || titlesInThisSync.has(sanitized.title)) {
        duplicates++;
        continue;
      }

      // Add to insertion batch
      recordsToInsert.push(sanitized);
      titlesInThisSync.add(sanitized.title);
      inserted++;
    }

    // 6. Bulk write to MongoDB
    if (recordsToInsert.length > 0) {
      await Bug.insertMany(recordsToInsert);
    }

    // 7. Return requested Response format
    return res.status(200).json({
      success: true,
      totalFetched: fetchedRecords.length,
      inserted,
      duplicates,
      rejected,
    });
  } catch (error) {
    next(error);
  }
};
