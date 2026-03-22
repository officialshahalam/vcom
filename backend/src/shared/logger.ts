export function logInfo(message: string, meta?: unknown): void {
  if (meta !== undefined) {
    console.log(`[INFO] ${message}`, meta);
    return;
  }
  console.log(`[INFO] ${message}`);
}

export function logError(message: string, error?: unknown): void {
  if (error !== undefined) {
    console.error(`[ERROR] ${message}`, error);
    return;
  }
  console.error(`[ERROR] ${message}`);
}
