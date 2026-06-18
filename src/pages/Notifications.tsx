import { useState, useEffect, useMemo } from 'react';
import { Button, Tabs, Empty, Popconfirm, message } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  BellOutlined,
  InfoCircleOutlined,
  AlertOutlined,
  LinkOutlined,
  CheckOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { mockNotifications } from '@/mock/data';
import { useAppStore } from '@/stores/appStore';
import type { Notification } from '@/types/types';

// 消息类型图标映射
const TYPE_ICON_MAP: Record<string, React.ReactNode> = {
  '到期提醒': <ClockCircleOutlined className="text-orange-500" />,
  '超期警示': <ExclamationCircleOutlined className="text-red-500" />,
  '审批通知': <CheckCircleOutlined className="text-green-500" />,
  '系统通知': <BellOutlined className="text-blue-500" />,
  '风险状态变更': <AlertOutlined className="text-purple-500" />,
};

// 消息类型背景色映射
const TYPE_BG_MAP: Record<string, string> = {
  '到期提醒': 'bg-orange-50 border-orange-200',
  '超期警示': 'bg-red-50 border-red-200',
  '审批通知': 'bg-green-50 border-green-200',
  '系统通知': 'bg-blue-50 border-blue-200',
  '风险状态变更': 'bg-purple-50 border-purple-200',
};

// 相对时间格式化
function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return '刚刚';
  if (diffMinutes < 60) return `${diffMinutes} 分钟前`;
  if (diffHours < 24) return `${diffHours} 小时前`;
  if (diffDays < 30) return `${diffDays} 天前`;
  return `${Math.floor(diffDays / 30)} 个月前`;
}

export default function Notifications() {
  const { notifications, setNotifications, markAsRead, markAllAsRead } = useAppStore();
  const [activeTab, setActiveTab] = useState('all');

  // 初始化通知数据到 store
  useEffect(() => {
    if (notifications.length === 0) {
      setNotifications(mockNotifications);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- 按时间倒序 ----------
  const sortedNotifications = useMemo(() => {
    return [...notifications].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [notifications]);

  // ---------- Tab 过滤 ----------
  const filteredNotifications = useMemo(() => {
    if (activeTab === 'unread') return sortedNotifications.filter((n) => !n.is_read);
    if (activeTab === 'read') return sortedNotifications.filter((n) => n.is_read);
    return sortedNotifications;
  }, [sortedNotifications, activeTab]);

  // ---------- 删除已读 ----------
  const handleDeleteRead = () => {
    const readCount = notifications.filter((n) => n.is_read).length;
    if (readCount === 0) {
      message.info('没有已读消息可删除');
      return;
    }
    setNotifications(notifications.filter((n) => !n.is_read));
    message.success(`已删除 ${readCount} 条已读消息`);
  };

  // ---------- Tab 项 ----------
  const tabItems = [
    {
      key: 'all',
      label: `全部 (${notifications.length})`,
    },
    {
      key: 'unread',
      label: `未读 (${notifications.filter((n) => !n.is_read).length})`,
    },
    {
      key: 'read',
      label: `已读 (${notifications.filter((n) => n.is_read).length})`,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">消息中心</h1>
        <p className="text-gray-500 mt-1">查看系统通知与风险提醒</p>
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center gap-3">
        <Popconfirm
          title="确认标记全部已读？"
          description="所有未读消息将被标记为已读状态。"
          onConfirm={() => {
            markAllAsRead();
            message.success('已全部标记为已读');
          }}
          okText="确认"
          cancelText="取消"
        >
          <Button icon={<CheckOutlined />}>全部标记已读</Button>
        </Popconfirm>
        <Popconfirm
          title="确认删除已读消息？"
          description="所有已读消息将被永久删除，此操作不可撤销。"
          onConfirm={handleDeleteRead}
          okText="确认删除"
          cancelText="取消"
        >
          <Button icon={<DeleteOutlined />} danger>
            删除已读
          </Button>
        </Popconfirm>
      </div>

      {/* Tab 切换 */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
      />

      {/* 消息列表 */}
      {filteredNotifications.length === 0 ? (
        <Empty description="暂无消息" className="py-16" />
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onMarkRead={markAsRead}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== 消息卡片组件 ====================
interface NotificationCardProps {
  notification: Notification;
  onMarkRead: (id: number) => void;
}

function NotificationCard({ notification, onMarkRead }: NotificationCardProps) {
  const isUnread = !notification.is_read;

  return (
    <div
      className={`rounded-xl border p-4 transition-all hover:shadow-md cursor-pointer ${
        TYPE_BG_MAP[notification.type] || 'bg-gray-50 border-gray-200'
      } ${isUnread ? 'ring-1 ring-blue-200' : 'opacity-80'}`}
      onClick={() => {
        if (isUnread) onMarkRead(notification.id);
      }}
    >
      <div className="flex items-start gap-3">
        {/* 未读圆点 */}
        <div className="flex items-center gap-3 pt-0.5">
          {isUnread && (
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
          )}
          <span className="text-xl shrink-0">
            {TYPE_ICON_MAP[notification.type] || <InfoCircleOutlined className="text-gray-500" />}
          </span>
        </div>

        {/* 消息内容 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${isUnread ? 'text-gray-900' : 'text-gray-600'}`}>
                {notification.title}
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-white/60 text-gray-500">
                {notification.type}
              </span>
            </div>
            <span className="text-xs text-gray-400 shrink-0">
              {formatRelativeTime(notification.created_at)}
            </span>
          </div>

          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {notification.content}
          </p>

          {/* 关联风险链接 */}
          {notification.risk_id && (
            <div className="mt-2">
              <a
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                onClick={(e) => {
                  e.stopPropagation();
                  // 跳转到风险详情
                  window.location.hash = `/risks/${notification.risk_id}`;
                }}
              >
                <LinkOutlined className="w-3 h-3" />
                查看关联风险 SEC-{String(notification.risk_id).padStart(3, '0')}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
