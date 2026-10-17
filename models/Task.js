const mongoose = require('mongoose');

// Task Schema definition enforcing types, required constraints, and defaults
const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      minlength: [3, 'Task title must be at least 3 characters long'],
      maxlength: [120, 'Task title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    completed: {
      type: Boolean,
      default: false,
    },
    // Supplementary Problem 1: Priority field restricted to enum
    priority: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high'],
        message: '{VALUE} is not a valid priority. Must be low, medium, or high',
      },
      default: 'medium',
      lowercase: true,
    },
    category: {
      type: String,
      default: 'Coursework',
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

// Supplementary Problem 2: Pre-save hook that automatically trims whitespace from the title field
taskSchema.pre('save', function (next) {
  if (this.title) {
    this.title = this.title.trim();
  }
  if (typeof next === 'function') {
    next();
  }
});

// Also trim title on findOneAndUpdate
taskSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update && update.title && typeof update.title === 'string') {
    update.title = update.title.trim();
  }
  if (typeof next === 'function') {
    next();
  }
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
