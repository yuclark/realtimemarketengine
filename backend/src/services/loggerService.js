export const systemLogs = [];

export function pushLog(message, type = "info") {
  const timestamp = new Date().toLocaleTimeString();
  systemLogs.unshift({ id: Math.random().toString(36).substr(2, 9), timestamp, message, type });
  if (systemLogs.length > 15) systemLogs.pop();
}

pushLog("Systemic logger service successfully decoupled.", "system");