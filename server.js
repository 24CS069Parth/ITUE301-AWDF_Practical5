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
    // Seed initial connected coursework tasks if empty
    await seedInitialTasks();
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
  });

// Seed helper ensuring initial coursework data is present
async function seedInitialTasks() {
  try {
    const count = await Task.countDocuments();
    if (count === 0) {
      console.log('Seeding initial coursework tasks into MongoDB...');
      await Task.insertMany([
        {
          title: 'Set up Vite React Portfolio & Reusable Components',
          description: 'Construct modular Header, About, Skills, and Footer architecture with prop validation.',
          completed: true,
          priority: 'high',
          category: 'Practical 1',
        },
        {
          title: 'Implement React Router v6 & Reactive State',
          description: 'Client-side SPA navigation without full page reload, controlled forms, and dark mode.',
          completed: true,
          priority: 'high',
          category: 'Practical 2',
        },
        {
          title: 'Integrate GitHub REST API with Async States',
          description: 'Consume live GitHub public endpoints on mount using useEffect with spinner and error boundaries.',
          completed: true,
          priority: 'high',
          category: 'Practical 3',
        },
        {
          title: 'Design RESTful Express Backend & Middleware',
          description: 'Build complete CRUD endpoints with custom request logging, ID validator, and centralized error handler.',
          completed: true,
          priority: 'high',
          category: 'Practical 4',
        },
        {
          title: 'Integrate MongoDB with Mongoose Schema & Validation',
          description: 'Connect persistent NoSQL database, enforce schema constraints, enum restrictions, and pre-save hooks.',
          completed: false,
          priority: 'high',
          category: 'Practical 5',
        },
      ]);
      console.log('Seeding completed successfully!');
    }
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
// 3. RESTful CRUD Endpoints with Mongoose
// ==========================================

// GET / - API Info & Documentation
app.get('/', (req, res) => {
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
      validationTest: 'POST /tasks (with invalid data to test schema validation)',
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
