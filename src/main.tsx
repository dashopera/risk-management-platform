import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initDatabase } from '@/db/database.ts'

// 先初始化数据库，再渲染应用
initDatabase().then(() => {
  console.log('Database initialized successfully');
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}).catch((err) => {
  console.error('Failed to initialize database:', err);
  // 即使数据库初始化失败，也渲染应用（降级到无数据库模式）
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
