import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import AppRoutes from '@/routes';
import './index.css';

export default function App() {
  return (
    <React.StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <ConfigProvider locale={zhCN} theme={{
            token: {
              colorPrimary: '#3b82f6',
              borderRadius: 6,
            },
          }}>
            <AppRoutes />
          </ConfigProvider>
        </AuthProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
}
