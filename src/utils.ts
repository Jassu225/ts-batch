export const validateConcurrency = (concurrency: number) => {
  if (!concurrency || concurrency <= 0) {
    throw new Error("Concurrency must be greater than 0");
  }
};
