# TS-Batch-Processor

![NPM Version](https://img.shields.io/npm/v/ts-batch-processor)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/jassu225/ts-batch/publish.yaml?color=f7643b)

A simple, powerful, event-driven batch processor for JavaScript/TypeScript that runs in both Node.js and browsers. Process multiple tasks concurrently with built-in error handling, progress tracking, and comprehensive event system.

## ✨ Features

- 🚀 **Concurrent Processing**: Control how many tasks run simultaneously
- 📊 **Progress Tracking**: Real-time progress updates with detailed statistics
- 🎯 **Event-Driven**: Listen to start, progress, and completion events
- 🛡️ **Error Handling**: Graceful error handling with detailed error information
- 🔄 **Promise-Based**: Modern async/await support
- 🌐 **Universal**: Works in both Node.js and browsers
- 📦 **TypeScript**: Full TypeScript support with comprehensive type definitions
- 🧩 **Zero Dependencies**: No external dependencies

## 📦 Installation

```bash
npm install ts-batch-processor
```

## 🚀 Quick Start

### Basic Usage

```javascript
import Batch from "ts-batch-processor";

// Create a batch processor with 3 concurrent tasks
const batch = new Batch({ concurrency: 3 });

// Add tasks (add() returns void, not a promise)
batch.add(() => fetch("/api/data/1").then((r) => r.json()));
batch.add(() => fetch("/api/data/2").then((r) => r.json()));
batch.add(() => fetch("/api/data/3").then((r) => r.json()));

// Process all tasks (this returns a Promise)
// Results will be in the same order as tasks were added
const results = await batch.process();
console.log("All tasks completed:", results);
```

### Advanced Usage with Event Handling

```javascript
import Batch from "ts-batch-processor";
import { TaskResponseStatus } from "ts-batch-processor/task";

const batch = new Batch({ concurrency: 2 });

// Listen to events
batch.addEventListener("start", (event) => {
  console.log(`Starting to process ${event.detail.totalTasks} tasks`);
  console.log("Started at:", event.detail.timestamp);
});

batch.addEventListener("progress", (event) => {
  const { progress, completedTasks, totalTasks, lastCompletedTaskResult } =
    event.detail;
  console.log(
    `Progress: ${progress.toFixed(1)}% (${completedTasks}/${totalTasks})`
  );
  console.log("Latest task result:", lastCompletedTaskResult);
  console.log("Timestamp:", event.detail.timestamp);
});

batch.addEventListener("complete", (event) => {
  console.log("All tasks completed!");
  console.log("Final results:", event.detail.taskResults);
  console.log("Completed at:", event.detail.timestamp);
});

// Add various tasks (add() returns void)
batch.add(async () => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return "Task 1 completed";
});

batch.add(async () => {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  return "Task 2 completed";
});

batch.add(() => {
  throw new Error("Task 3 failed");
});

// Process and handle results
try {
  const results = await batch.process();

  // Results are guaranteed to be in the same order as tasks were added
  results.forEach((result, index) => {
    if (result.responseStatus === TaskResponseStatus.SUCCESS) {
      console.log(`Task ${index + 1} succeeded:`, result.response);
    } else {
      console.log(`Task ${index + 1} failed:`, result.error?.message);
    }
  });
} catch (error) {
  console.error("Batch processing failed:", error);
}
```

## 🧪 Testing

TS-Batch-Processor includes a comprehensive Jest test suite with **58 passing tests** covering all functionality:

### Test Coverage

- ✅ **Constructor & Configuration**: Validates concurrency settings and error handling
- ✅ **Task Management**: Tests for adding synchronous/asynchronous tasks and validation
- ✅ **Processing Logic**: Verifies correct execution order, concurrency limits, and promise reuse
- ✅ **Event System**: Validates start, progress, and complete event emissions
- ✅ **Error Handling**: Tests graceful task failure handling and edge cases
- ✅ **Performance**: Stress tests with 1000+ tasks and high concurrency scenarios
- ✅ **State Management**: Tests for processing state tracking and batch reset functionality

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests for CI (coverage + no watch)
npm run test:ci
```

### Test Results

- **58/58 tests passing** (100% success rate)
- **Comprehensive coverage** of all public APIs and edge cases
- **Performance validated** with large datasets and high concurrency
- **Cross-platform compatibility** tested

## 📚 API Reference

### Exports

```typescript
// Main exports
import Batch from "ts-batch-processor";
import type { BatchConfig } from "ts-batch-processor";

// Task-related imports
import { TaskResponseStatus } from "ts-batch-processor/task";
import type { Task, TaskResult } from "ts-batch-processor/task";

// Event-related imports
import {
  StartEvent,
  ProgressEvent,
  CompleteEvent,
} from "ts-batch-processor/events";
import type {
  ProgressStats,
  StartEventDetail,
  ProgressEventDetail,
  CompleteEventDetail,
} from "ts-batch-processor/events";

// Error constants (some extend custom error classes for better error handling)
import {
  CANNOT_ADD_TASK_DURING_PROCESSING_ERROR, // AddTaskError
  CANNOT_RESET_DURING_PROCESSING_ERROR, // Error
  NO_TASKS_ERROR, // Error
  TASK_MUST_BE_FUNCTION_ERROR, // AddTaskError
  TASK_TIMEOUT_ERROR, // Error
} from "ts-batch-processor/errors";
```

### `new Batch(config?)`

Creates a new batch processor instance.

#### Parameters

- `config` (optional): Configuration object
  - `concurrency` (number, optional): Maximum number of concurrent tasks. Defaults to `navigator.hardwareConcurrency` in browsers or 10 otherwise.

#### Example

```javascript
// Use default concurrency (auto-detected or 10)
const batch1 = new Batch();

// Set custom concurrency
const batch2 = new Batch({ concurrency: 5 });
```

### Methods

#### `add(task: () => Promise<unknown> | unknown): void`

Adds a task to the batch queue.

- `task`: A function that returns a value or Promise (synchronous or asynchronous)
- **Returns**: `void` (does not return a promise)
- **Throws**: `ADD_TASK_ERROR` if called during processing
- **Throws**: `Error` if task is not a function

#### `process(): Promise<Readonly<TaskResult>[]>`

Processes all queued tasks and returns results.

- **Returns**: Promise that resolves to an array of `TaskResult` objects **in the exact same order as tasks were added**
- **Order Guarantee**: Results maintain their original order regardless of which tasks complete first
- Can be safely called multiple times (returns the same promise if already processing)
- **Returns**: A rejected Promise with `NO_TASKS_ERROR` if no tasks were added
- Emits `start`, `progress`, and `complete` events during processing

#### `reset(): void`

Resets the batch processor to initial state for re-use.

- Clears all tasks and results
- **Returns**: `void`
- **Throws**: `Error` if called during processing

### Properties

#### `isProcessing: boolean` (readonly)

Indicates whether the batch is currently processing tasks.

#### `progress: number` (readonly)

Returns current progress as a percentage between 0 and 100 (with up to 2 decimal places).

### Events

The batch processor emits three types of events. The `addEventListener` method is type-safe and will only accept valid event types (`"start"`, `"progress"`, or `"complete"`). You can use string literals or the static `type` properties from event classes (e.g., `StartEvent.type`).

#### `start` Event

Fired when batch processing begins.

```javascript
// Using string literal (type-safe)
batch.addEventListener("start", (event) => {
  console.log("Started processing", event.detail.totalTasks, "tasks");
  console.log("Started at:", event.detail.timestamp);
});

// Or using event class static property for better refactoring safety
import { StartEvent } from "ts-batch-processor/events";
batch.addEventListener(StartEvent.type, (event) => {
  console.log("Started processing", event.detail.totalTasks, "tasks");
  console.log("Started at:", event.detail.timestamp);
});
```

#### `progress` Event

Fired after each task completes.

```javascript
// Using string literal (type-safe)
batch.addEventListener("progress", (event) => {
  const {
    totalTasks,
    completedTasks,
    pendingTasks,
    progress,
    lastCompletedTaskResult,
    timestamp,
  } = event.detail;

  console.log(`Progress: ${progress}%`);
  console.log("Latest result:", lastCompletedTaskResult);
});

// Or using event class static property
import { ProgressEvent } from "ts-batch-processor/events";
batch.addEventListener(ProgressEvent.type, (event) => {
  console.log(`Progress: ${event.detail.progress}%`);
});
```

#### `complete` Event

Fired when all tasks are finished.

```javascript
// Using string literal (type-safe)
batch.addEventListener("complete", (event) => {
  console.log("All tasks completed!");
  console.log("Results:", event.detail.taskResults);
  console.log("Completed at:", event.detail.timestamp);
});

// Or using event class static property
import { CompleteEvent } from "ts-batch-processor/events";
batch.addEventListener(CompleteEvent.type, (event) => {
  console.log("All tasks completed!");
  console.log("Results:", event.detail.taskResults);
});
```

### Types

#### `TaskResult`

```typescript
import { TaskResponseStatus } from "ts-batch-processor/task";

type TaskResult = {
  index: number; // Original task index
  responseStatus: TaskResponseStatus; // "success" | "error"
  response: unknown | null; // Task return value (if successful)
  error: Error | null; // Error object (if failed)
};

// TaskResponseStatus enum values:
enum TaskResponseStatus {
  SUCCESS = "success",
  ERROR = "error",
}
```

## 📖 Usage Examples

### Example 1: API Calls with Rate Limiting

```javascript
import Batch from "ts-batch-processor";
import { TaskResponseStatus } from "ts-batch-processor/task";

const batch = new Batch({ concurrency: 2 }); // Limit to 2 concurrent requests

const userIds = [1, 2, 3, 4, 5];

// Add API calls
userIds.forEach((id) => {
  batch.add(async () => {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  });
});

// Track progress
batch.addEventListener("progress", (event) => {
  console.log(
    `Fetched user ${event.detail.completedTasks}/${event.detail.totalTasks}`
  );
});

const results = await batch.process();
const users = results
  .filter((result) => result.responseStatus === TaskResponseStatus.SUCCESS)
  .map((result) => result.response);

console.log("Successfully fetched users:", users);
```

### Example 2: Image Processing

```javascript
import Batch from "ts-batch-processor";

async function processImage(imageUrl) {
  const response = await fetch(imageUrl);
  const blob = await response.blob();

  // Simulate image processing
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    url: imageUrl,
    size: blob.size,
    processed: true,
  };
}

const batch = new Batch({ concurrency: 4 });

const imageUrls = [
  "https://example.com/image1.jpg",
  "https://example.com/image2.jpg",
  "https://example.com/image3.jpg",
];

imageUrls.forEach((url) => {
  batch.add(() => processImage(url));
});

// Real-time progress updates
batch.addEventListener("progress", (event) => {
  const percent = event.detail.progress.toFixed(1);
  console.log(`Processing images... ${percent}%`);
});

const results = await batch.process();
console.log("Image processing complete!", results);
```

### Example 3: Error Handling and Retry Logic

```javascript
import Batch from "ts-batch-processor";
import { TaskResponseStatus } from "ts-batch-processor/task";

function createTaskWithRetry(fn, maxRetries = 3) {
  return async () => {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    throw lastError;
  };
}

const batch = new Batch({ concurrency: 2 });

// Add tasks with retry logic
batch.add(
  createTaskWithRetry(async () => {
    const response = await fetch("/api/unreliable-endpoint");
    if (!response.ok) throw new Error("Request failed");
    return response.json();
  })
);

const results = await batch.process();
console.log("Results with retry logic:", results);
```

## 🔧 Error Handling

The batch processor handles errors gracefully:

- **Individual task errors**: Don't stop the entire batch
- **Task validation**: Ensures all tasks are functions
- **State management**: Prevents invalid operations (e.g., adding tasks during processing)
- **Order preservation**: Results are always returned in the same order as tasks were added

```javascript
import Batch from "ts-batch-processor";
import { TaskResponseStatus } from "ts-batch-processor/task";

const batch = new Batch();

batch.add(() => "Success");
batch.add(() => {
  throw new Error("Failed task");
});
batch.add(() => "Another success");

const results = await batch.process();

results.forEach((result, index) => {
  console.log(
    `Task ${index + 1}:`,
    result.responseStatus === TaskResponseStatus.SUCCESS
      ? result.response
      : result.error.message
  );
});

// Output:
// Task 1: Success
// Task 2: Failed task
// Task 3: Another success
```

## ⚡ Performance Tips

1. **Choose appropriate concurrency**: Too high can overwhelm resources, too low underutilizes them
2. **Consider task duration**: Mix of short and long tasks may benefit from higher concurrency
3. **Memory usage**: Large result sets are kept in memory until processing completes
4. **Event listeners**: Remove listeners when done to prevent memory leaks

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🐛 Issues

Found a bug or have a feature request? Please create an issue on GitHub.
