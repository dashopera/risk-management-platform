import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, format: string = 'YYYY-MM-DD'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getLevelColor(level: string): string {
  const colors: Record<string, string> = {
    '严重': 'bg-red-600 text-white',
    '高危': 'bg-orange-500 text-white',
    '中危': 'bg-yellow-500 text-white',
    '低危': 'bg-green-500 text-white',
  };
  return colors[level] || 'bg-gray-500 text-white';
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    '待处置': 'bg-orange-100 text-orange-700',
    '处置中': 'bg-blue-100 text-blue-700',
    '已修复': 'bg-green-100 text-green-700',
    '已接受': 'bg-purple-100 text-purple-700',
    '已转移': 'bg-cyan-100 text-cyan-700',
    '已关闭': 'bg-gray-100 text-gray-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}

export function getTaskStatusColor(status: string): string {
  const colors: Record<string, string> = {
    '未开始': 'bg-gray-100 text-gray-700',
    '进行中': 'bg-blue-100 text-blue-700',
    '已完成': 'bg-green-100 text-green-700',
    '已逾期': 'bg-red-100 text-red-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}

export function getDaysRemaining(planEndDate: string): number {
  const now = new Date();
  const end = new Date(planEndDate);
  const diff = end.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function generateRiskNo(discoveryDate: string, existingCount: number): string {
  const year = new Date(discoveryDate).getFullYear();
  const seq = String(existingCount + 1).padStart(3, '0');
  return `SEC-${year}-${seq}`;
}
