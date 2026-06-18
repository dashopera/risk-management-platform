import initSqlJs, { type Database } from 'sql.js';

import initSqlContent from './init.sql?raw';
import seedSqlContent from './seed.sql?raw';

let db: Database | null = null;

export async function getDatabase(): Promise<Database> {
  if (db) return db;

  const SQL = await initSqlJs({
    locateFile: (file: string) => `/${file}`
  });

  // 从 localStorage 加载数据库（持久化）
  const savedDb = localStorage.getItem('risk_management_db');
  if (savedDb) {
    const buf = Uint8Array.from(atob(savedDb), c => c.charCodeAt(0));
    db = new SQL.Database(buf);
  } else {
    db = new SQL.Database();
  }

  return db;
}

export async function initDatabase(): Promise<void> {
  const database = await getDatabase();

  // 检查是否已初始化
  const result = database.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
  if (result.length > 0 && result[0].values.length > 0) {
    return; // 已初始化
  }

  // 执行建表（exec 支持多语句和触发器中的分号）
  database.exec(initSqlContent);

  // 执行插入数据
  database.exec(seedSqlContent);

  saveDatabase();
}

export function saveDatabase(): void {
  if (!db) return;
  const data = db.export();
  const buf = data.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
  localStorage.setItem('risk_management_db', btoa(buf));
}

// 关闭时保存
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    saveDatabase();
  });
}
