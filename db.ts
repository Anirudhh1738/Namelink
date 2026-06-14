import fs from "fs/promises";
import path from "path";

export interface LinkEntry {
  id: string;
  name: string;
  ip: string;
  description?: string;
  approved: boolean;
  createdAt: string;
}

const DB_FILE = path.join(process.cwd(), "data", "links.json");

// Direct IP format validation regex
const IP_REGEX = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?::\d{1,5})?$/;

export async function initDb(): Promise<void> {
  try {
    await fs.mkdir(path.dirname(DB_FILE), { recursive: true });
    try {
      await fs.access(DB_FILE);
    } catch {
      // Seed initial sample data so the app isn't bare
      const initialData: LinkEntry[] = [
        {
          id: "seed-1",
          name: "myshop",
          ip: "192.168.1.100",
          description: "Local shop POS server prototype",
          approved: true,
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        },
        {
          id: "seed-2",
          name: "dev-hub",
          ip: "10.0.0.12",
          description: "Internal team orchestration dashboard",
          approved: true,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: "seed-3",
          name: "iot-cam",
          ip: "192.168.1.50:8081",
          description: "Smart monitoring camera feed (unapproved)",
          approved: false,
          createdAt: new Date().toISOString(),
        }
      ];
      await fs.writeFile(DB_FILE, JSON.stringify(initialData, null, 2), "utf-8");
    }
  } catch (error) {
    console.error("Failed to initialize database file:", error);
  }
}

export async function readEntries(): Promise<LinkEntry[]> {
  try {
    await initDb();
    const data = await fs.readFile(DB_FILE, "utf-8");
    return JSON.parse(data) as LinkEntry[];
  } catch {
    return [];
  }
}

export async function writeEntries(entries: LinkEntry[]): Promise<void> {
  await fs.mkdir(path.dirname(DB_FILE), { recursive: true });
  await fs.writeFile(DB_FILE, JSON.stringify(entries, null, 2), "utf-8");
}

export function validateIp(ip: string): boolean {
  return IP_REGEX.test(ip.trim());
}

export function validateName(name: string): boolean {
  const cleanName = name.trim().toLowerCase();
  // Name must be alphanumeric, dashes, or highlights; between 1 and 30 characters
  return /^[a-z0-9-_]{1,30}$/.test(cleanName);
}
