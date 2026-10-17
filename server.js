require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Task = require('./models/Task');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/task_manager_24cs051';

// ==========================================
// 1. Connect to MongoDB using Mongoose
// ==========================================
mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log(`=========================================`);
    console.log(`MongoDB connected successfully`);
    console.log(`Database: ${mongoose.connection.name}`);
    console.log(`Host: ${mongoose.connection.host}`);
    console.log(`=========================================`);
    await resetAndSeedTasks();
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
  });

// Seed helper with distinct Practical 5 Mongoose tasks
async function resetAndSeedTasks() {
  try {
    // Refresh collection so distinct Practical 5 tasks with Mongoose ObjectIds are loaded
    await Task.deleteMany({});
    console.log('Seeding fresh Practical 5 MongoDB tasks...');
    await Task.insertMany([
      {
        title: 'Design Task Schema with Mongoose Constraints',
        description: 'Define field types, required constraints, and default values in models/Task.js',
        completed: true,
        priority: 'high',
        category: 'Schema Design',
      },
      {
        title: 'Implement Pre-Save Whitespace Trimming Hook',
        description: 'Mongoose middleware automatically sanitizes and trims title strings before saving.',
        completed: true,
        priority: 'high',
        category: 'Mongoose Hooks',
      },
      {
        title: 'Enforce Priority Enum Constraint [low, medium, high]',
        description: 'Schema-level validation restricting priority values and returning structured JSON on failure.',
        completed: false,
        priority: 'medium',
        category: 'Validation',
      },
      {
        title: 'Test MongoDB CRUD Endpoints in Postman / Browser',
        description: 'Verify persistence of Task.find, create, findById, update, and delete in MongoDB database.',
        completed: false,
        priority: 'medium',
        category: 'Testing',
      },
      {
        title: 'Capture Output Screenshots for Practical 5 Report',
        description: 'Document schema validation errors, 404 responses, and live MongoDB documents.',
        completed: false,
        priority: 'low',
        category: 'Submission',
      },
    ]);
    console.log('Practical 5 MongoDB tasks seeded successfully!');
  } catch (err) {
    console.error('Error seeding tasks:', err.message);
  }
}

// ==========================================
// 2. Global Middleware Pipeline
// ==========================================
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

// Route-specific middleware validating MongoDB ObjectId format
const validateObjectId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid ID format: Provided ID must be a valid 24-character hexadecimal MongoDB ObjectId',
      receivedId: req.params.id,
    });
  }
  next();
};

// ==========================================
// 3. Interactive Web Test Console (Browser Friendly)
// ==========================================
app.get('/', (req, res) => {
  // If request specifically accepts HTML (browser), render the interactive test console
  if (req.headers.accept && req.headers.accept.includes('text/html')) {
    return res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Practical 5 - MongoDB & Mongoose API Test Console</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background-color: #0f172a; color: #f8fafc; padding: 2rem; max-width: 1000px; margin: 0 auto; }
    header { border-bottom: 2px solid #334155; padding-bottom: 1.5rem; margin-bottom: 2rem; }
    h1 { color: #60a5fa; font-size: 1.75rem; margin-bottom: 0.5rem; }
    .badge { display: inline-block; background-color: #065f46; color: #34d399; padding: 0.25rem 0.65rem; border-radius: 4px; font-size: 0.85rem; font-weight: 600; }
    .actions-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    button { background-color: #1e293b; color: #f8fafc; border: 1px solid #475569; padding: 0.85rem 1rem; border-radius: 6px; font-weight: 600; cursor: pointer; text-align: left; transition: all 0.2s; }
    button:hover { background-color: #2563eb; border-color: #3b82f6; transform: translateY(-2px); }
    button small { display: block; font-weight: 400; font-size: 0.75rem; color: #94a3b8; margin-top: 0.25rem; }
    button:hover small { color: #dbeafe; }
    .btn-danger { border-color: #ef4444; }
    .btn-danger:hover { background-color: #dc2626; border-color: #ef4444; }
    .console-box { background-color: #020617; border: 1px solid #1e293b; border-radius: 8px; padding: 1.25rem; }
    .console-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e293b; padding-bottom: 0.75rem; margin-bottom: 0.75rem; font-size: 0.9rem; color: #94a3b8; }
    .status-pill { font-weight: 700; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.8rem; }
    .status-200, .status-201 { background-color: #064e3b; color: #34d399; }
    .status-400, .status-404 { background-color: #7f1d1d; color: #f87171; }
    pre { background-color: #090d16; padding: 1rem; border-radius: 6px; overflow-x: auto; color: #38bdf8; font-size: 0.88rem; line-height: 1.5; font-family: ui-monospace, Consolas, monospace; }
  </style>
</head>
<body>
  <header>
    <h1>Practical 5: MongoDB Integration & Mongoose Schema Test Console</h1>
    <p>Student: <strong>Aayush Malhotra (24CS051)</strong> &bull; Database: <span class="badge">Connected to MongoDB</span></p>
  </header>

  <section class="actions-grid">
    <button onclick="fetchAllTasks()">
      📄 1. GET /tasks
      <small>Fetch all tasks from MongoDB collection</small>
    </button>
    <button onclick="fetchTaskById()">
      🔍 2. GET /tasks/:id
      <small>Fetch single task by MongoDB ObjectId</small>
    </button>
    <button onclick="createTask()">
      ➕ 3. POST /tasks (Valid)
      <small>Create task & test pre-save trimming hook</small>
    </button>
    <button class="btn-danger" onclick="triggerValidationError()">
      ⚠️ 4. Test Validation Error
      <small>Missing title & invalid priority enum (400)</small>
    </button>
    <button class="btn-danger" onclick="test404NotFound()">
      ❌ 5. Test 404 Not Found
      <small>Request non-existent MongoDB ObjectId (404)</small>
    </button>
    <button onclick="updateTask()">
      ✏️ 6. PUT /tasks/:id
      <small>Update task completed status in MongoDB</small>
    </button>
  </section>

  <div class="console-box">
    <div class="console-header">
      <span id="req-info">Active Request: Ready</span>
      <span id="res-status" class="status-pill status-200">HTTP 200 Ready</span>
    </div>
    <pre id="output-display">// Click any button above to execute a real Mongoose operation against MongoDB and inspect the response!</pre>
  </div>

  <script>
    let sampleId = '';

    async function executeApi(method, url, body = null, desc = '') {
      document.getElementById('req-info').innerText = method + ' ' + url + ' (' + desc + ')';
      const options = { method, headers: { 'Accept': 'application/json' } };
      if (body) {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
      }
      try {
        const res = await fetch(url, options);
        const data = await res.json();
        const statusEl = document.getElementById('res-status');
        statusEl.innerText = 'HTTP ' + res.status + ' ' + res.statusText;
        statusEl.className = 'status-pill status-' + (res.status < 300 ? '200' : res.status);
        document.getElementById('output-display').innerText = JSON.stringify(data, null, 2);
        if (data.data && Array.isArray(data.data) && data.data.length > 0) {
          sampleId = data.data[0]._id;
        } else if (data.data && data.data._id) {
          sampleId = data.data._id;
        }
      } catch (err) {
        document.getElementById('output-display').innerText = 'Fetch error: ' + err.message;
      }
    }

    function fetchAllTasks() {
      executeApi('GET', '/tasks', null, 'Read All Tasks');
    }

    function fetchTaskById() {
      const idToFetch = sampleId || '6ad30676f1fa482c4d060d5e';
      executeApi('GET', '/tasks/' + idToFetch, null, 'Read Single Task by ObjectId');
    }

    function createTask() {
      executeApi('POST', '/tasks', {
        title: '   Build Full-Stack MERN Integration (Prac 6)   ',
        description: 'Demonstrating pre-save hook trimming whitespace and saving to MongoDB',
        priority: 'high',
        completed: false
      }, 'Create Document with Pre-Save Hook');
    }

    function triggerValidationError() {
      executeApi('POST', '/tasks', {
        description: 'Invalid document missing title with illegal priority',
        priority: 'ultra-critical'
      }, 'Schema Validation Failure');
    }

    function test404NotFound() {
      executeApi('GET', '/tasks/6ad3070db7a59c63bd4964ff', null, 'Non-Existent ObjectId');
    }

    function updateTask() {
      const idToUpdate = sampleId || '6ad30676f1fa482c4d060d5e';
      executeApi('PUT', '/tasks/' + idToUpdate, {
        completed: true,
        priority: 'low'
      }, 'Update Task in MongoDB');
    }

    // Auto load on start
    fetchAllTasks();
  </script>
</body>
</html>
    `);
  }

  // Fallback for API clients requesting JSON
  res.status(200).json({
    message: 'Task Management MongoDB API - ITUE301 Practical 5',
    student: 'Aayush Malhotra (24CS051)',
    database: mongoose.connection.readyState === 1 ? 'Connected to MongoDB' : 'Disconnected',
    endpoints: {
      getAllTasks: 'GET /tasks',
      getTaskById: 'GET /tasks/:id',
      createTask: 'POST /tasks',
      updateTask: 'PUT /tasks/:id',
      deleteTask: 'DELETE /tasks/:id',
    },
  });
});

// GET /tasks - Fetch all tasks using Task.find()
app.get('/tasks', async (req, res, next) => {
  try {
    const { completed, priority, search } = req.query;
    const filter = {};

    if (completed !== undefined) {
      filter.completed = completed === 'true';
    }

    if (priority) {
      filter.priority = priority.toLowerCase();
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const tasks = await Task.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (err) {
    next(err);
  }
});

// GET /tasks/:id - Fetch single task using Task.findById() with 404 handling
app.get('/tasks/:id', validateObjectId, async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: `Task not found with ID ${req.params.id}`,
      });
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (err) {
    next(err);
  }
});

// POST /tasks - Create a new task using Task.create()
app.post('/tasks', async (req, res, next) => {
  try {
    const newTask = await Task.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Task successfully created and saved in MongoDB',
      data: newTask,
    });
  } catch (err) {
    next(err);
  }
});

// PUT /tasks/:id - Update an existing task using Task.findByIdAndUpdate()
app.put('/tasks/:id', validateObjectId, async (req, res, next) => {
  try {
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true, // return updated document
        runValidators: true, // enforce Mongoose schema validation on updates
      }
    );

    if (!updatedTask) {
      return res.status(404).json({
        success: false,
        error: `Task not found with ID ${req.params.id}`,
      });
    }

    res.status(200).json({
      success: true,
      message: `Task ${req.params.id} updated successfully`,
      data: updatedTask,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /tasks/:id - Delete a task using Task.findByIdAndDelete()
app.delete('/tasks/:id', validateObjectId, async (req, res, next) => {
  try {
    const deletedTask = await Task.findByIdAndDelete(req.params.id);

    if (!deletedTask) {
      return res.status(404).json({
        success: false,
        error: `Task not found with ID ${req.params.id}`,
      });
    }

    res.status(200).json({
      success: true,
      message: `Task ${req.params.id} deleted successfully from MongoDB`,
      data: deletedTask,
    });
  } catch (err) {
    next(err);
  }
});

// ==========================================
// 4. Undefined Route (404) Handler
// ==========================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    method: req.method,
    path: req.originalUrl,
  });
});

// ==========================================
// 5. Centralized Structured Error Handling Middleware
// ==========================================
// Formats Mongoose ValidationErrors and CastErrors into clean, structured JSON
app.use((err, req, res, next) => {
  console.error(`[Error Handler] ${err.name}: ${err.message}`);

  // Handle Mongoose Schema Validation Errors (400 Bad Request)
  if (err.name === 'ValidationError') {
    const formattedErrors = Object.keys(err.errors).reduce((acc, key) => {
      acc[key] = err.errors[key].message;
      return acc;
    }, {});

    return res.status(400).json({
      success: false,
      error: 'Schema Validation Error',
      message: 'One or more required fields failed Mongoose schema validation',
      validationErrors: formattedErrors,
    });
  }

  // Handle Mongoose CastError (e.g. malformed ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: 'Cast Error',
      message: `Invalid format for field "${err.path}": value "${err.value}" is not valid`,
    });
  }

  // Generic internal server error
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error',
    statusCode,
  });
});

// ==========================================
// 6. Server Listener
// ==========================================
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`API URL: http://localhost:${PORT}/tasks`);
  console.log(`MongoDB URI: ${MONGO_URI}`);
});
