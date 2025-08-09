# JS-Batch

A powerful, event-driven batch processor for JavaScript/TypeScript that runs in both Node.js and browsers. Process multiple tasks concurrently with built-in error handling, progress tracking, and comprehensive event system.

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
npm install js-batch
```

## 🚀 Quick Start

### Basic Usage

```javascript
import Batch from "js-batch";

// Create a batch processor with 3 concurrent tasks
const batch = new Batch({ concurrency: 3 });

// Add tasks
batch.add(() => fetch("/api/data/1").then((r) => r.json()));
batch.add(() => fetch("/api/data/2").then((r) => r.json()));
batch.add(() => fetch("/api/data/3").then((r) => r.json()));

// Process all tasks
const results = await batch.process();
console.log("All tasks completed:", results);
```

### Advanced Usage with Event Handling

```javascript
import Batch from "js-batch";

const batch = new Batch({ concurrency: 2 });

// Listen to events
batch.addEventListener("start", (event) => {
  console.log(`Starting to process ${event.detail.totalTasks} tasks`);
});

batch.addEventListener("progress", (event) => {
  const { progress, completedTasks, totalTasks, taskResult } = event.detail;
  console.log(
    `Progress: ${(progress * 100).toFixed(
      1
    )}% (${completedTasks}/${totalTasks})`
  );
  console.log("Latest task result:", taskResult);
});

batch.addEventListener("complete", (event) => {
  console.log("All tasks completed!");
  console.log("Final results:", event.detail.taskResults);
});

// Add various tasks
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

  results.forEach((result, index) => {
    if (result.responseStatus === "success") {
      console.log(`Task ${index + 1} succeeded:`, result.response);
    } else {
      console.log(`Task ${index + 1} failed:`, result.error?.message);
    }
  });
} catch (error) {
  console.error("Batch processing failed:", error);
}
```

## 📚 API Reference

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

- `task`: A function that returns a value or Promise
- Throws error if called during processing
- Throws error if task is not a function

#### `process(): Promise<Readonly<TaskResult>[]>`

Processes all queued tasks and returns results.

- Returns array of `TaskResult` objects in the same order as tasks were added
- Can be called multiple times (returns the same promise if already processing)
- Throws error if no tasks were added

#### `reset(): void`

Resets the batch processor to initial state.

- Clears all tasks and results
- Throws error if called during processing

### Properties

#### `isProcessing: boolean` (readonly)

Indicates whether the batch is currently processing tasks.

#### `progress: number` (readonly)

Returns current progress as a number between 0 and 1.

### Events

The batch processor extends `EventTarget` and emits three types of events:

#### `start` Event

Fired when batch processing begins.

```javascript
batch.addEventListener("start", (event) => {
  console.log("Started processing", event.detail.totalTasks, "tasks");
  console.log("Started at:", event.detail.timestamp);
});
```

#### `progress` Event

Fired after each task completes.

```javascript
batch.addEventListener("progress", (event) => {
  const {
    totalTasks,
    completedTasks,
    pendingTasks,
    progress,
    taskResult,
    timestamp,
  } = event.detail;

  console.log(`Progress: ${(progress * 100).toFixed(1)}%`);
  console.log("Latest result:", taskResult);
});
```

#### `complete` Event

Fired when all tasks are finished.

```javascript
batch.addEventListener("complete", (event) => {
  console.log("All tasks completed!");
  console.log("Results:", event.detail.taskResults);
  console.log("Completed at:", event.detail.timestamp);
});
```

### Types

#### `TaskResult`

```typescript
type TaskResult = {
  index: number; // Original task index
  responseStatus: "success" | "error" | "timeout";
  response: unknown | null; // Task return value (if successful)
  error: Error | null; // Error object (if failed)
};
```

## 📖 Usage Examples

### Example 1: File Processing

```javascript
import Batch from "js-batch";
import fs from "fs/promises";

const batch = new Batch({ concurrency: 3 });

const files = ["file1.txt", "file2.txt", "file3.txt"];

// Add file reading tasks
files.forEach((filename) => {
  batch.add(async () => {
    const content = await fs.readFile(filename, "utf-8");
    return { filename, content, size: content.length };
  });
});

const results = await batch.process();

results.forEach((result) => {
  if (result.responseStatus === "success") {
    console.log(`${result.response.filename}: ${result.response.size} bytes`);
  } else {
    console.error(`Failed to read file: ${result.error.message}`);
  }
});
```

### Example 2: API Calls with Rate Limiting

```javascript
import Batch from "js-batch";

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
  .filter((result) => result.responseStatus === "success")
  .map((result) => result.response);

console.log("Successfully fetched users:", users);
```

### Example 3: Image Processing

```javascript
import Batch from "js-batch";

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
  const percent = (event.detail.progress * 100).toFixed(1);
  console.log(`Processing images... ${percent}%`);
});

const results = await batch.process();
console.log("Image processing complete!", results);
```

### Example 4: Error Handling and Retry Logic

```javascript
import Batch from "js-batch";

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

```javascript
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
    result.responseStatus === "success" ? result.response : result.error.message
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
