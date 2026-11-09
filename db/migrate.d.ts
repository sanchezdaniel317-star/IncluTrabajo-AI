type Exec = (sql: string) => Promise<void>;
type Query = (sql: string, params?: unknown[]) => Promise<any[]>;
export function migrate(db: { exec: Exec; query: Query }): Promise<string[]>;
export function seedDemo(db: { exec: Exec; query: Query }, opciones?: { reset?: boolean }): Promise<boolean>;
