import fs from "node:fs/promises";
import path from "node:path";
import { emptyData, MemoryStore, type MemoryData } from "./memory";

// Development storage: one JSON file on this computer (default .data/store.json,
// git-ignored). No database needed. Not for Vercel (its disk is read-only).
//
// Every operation reads the file, then writes it back if something changed,
// one operation at a time. Slower than memory but safe when Next.js reloads
// code during development.

const queues = new Map<string, Promise<unknown>>();

export class FileStore extends MemoryStore {
  override readonly kind = "file" as const;
  private file: string;

  constructor(dir: string) {
    super();
    this.file = path.resolve(dir, "store.json");
  }

  private async read(): Promise<MemoryData> {
    try {
      return { ...emptyData(), ...JSON.parse(await fs.readFile(this.file, "utf8")) };
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return emptyData();
      throw err;
    }
  }

  private async write(data: MemoryData): Promise<void> {
    await fs.mkdir(path.dirname(this.file), { recursive: true });
    // Write a temp file first so a crash never leaves a half-written file.
    const tmp = `${this.file}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(data), "utf8");
    await fs.rename(tmp, this.file);
  }

  protected override run<T>(mutates: boolean, fn: (data: MemoryData) => T): Promise<T> {
    const previous = queues.get(this.file) ?? Promise.resolve();
    const next = previous.then(async () => {
      const data = await this.read();
      const result = fn(data);
      if (mutates) await this.write(data);
      return result;
    });
    // Keep the queue going even if this operation fails.
    queues.set(
      this.file,
      next.catch(() => undefined),
    );
    return next;
  }
}
