import { useState } from 'react';
import { Card, Button, Table, Upload, Select, Alert, Space, Tag, message, Popconfirm } from 'antd';
import {
  CloudUploadOutlined,
  DownloadOutlined,
  HistoryOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  InboxOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { formatDate, formatFileSize } from '@/lib/utils';

// Mock 备份历史数据
interface BackupRecord {
  id: number;
  backup_time: string;
  file_name: string;
  file_size: number;
  type: 'auto' | 'manual';
  status: 'success' | 'failed';
}

const mockBackupHistory: BackupRecord[] = [
  {
    id: 1,
    backup_time: '2026-06-18T02:00:00Z',
    file_name: 'backup_2026-06-18_020000.tar.gz',
    file_size: 256 * 1024 * 1024,
    type: 'auto',
    status: 'success',
  },
  {
    id: 2,
    backup_time: '2026-06-17T02:00:00Z',
    file_name: 'backup_2026-06-17_020000.tar.gz',
    file_size: 254 * 1024 * 1024,
    type: 'auto',
    status: 'success',
  },
  {
    id: 3,
    backup_time: '2026-06-16T14:30:00Z',
    file_name: 'backup_2026-06-16_143000_manual.tar.gz',
    file_size: 253 * 1024 * 1024,
    type: 'manual',
    status: 'success',
  },
  {
    id: 4,
    backup_time: '2026-06-16T02:00:00Z',
    file_name: 'backup_2026-06-16_020000.tar.gz',
    file_size: 251 * 1024 * 1024,
    type: 'auto',
    status: 'success',
  },
  {
    id: 5,
    backup_time: '2026-06-15T02:00:00Z',
    file_name: 'backup_2026-06-15_020000.tar.gz',
    file_size: 248 * 1024 * 1024,
    type: 'auto',
    status: 'success',
  },
];

export default function DataBackup() {
  const [backupHistory, setBackupHistory] = useState<BackupRecord[]>(mockBackupHistory);
  const [restoreMode, setRestoreMode] = useState<string>('overwrite');
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [lastBackupTime, setLastBackupTime] = useState('2026-06-18T02:00:00Z');

  // ---------- 立即备份 ----------
  const handleBackup = () => {
    setIsBackingUp(true);
    setTimeout(() => {
      const newBackup: BackupRecord = {
        id: Math.max(...backupHistory.map((b) => b.id)) + 1,
        backup_time: new Date().toISOString(),
        file_name: `backup_${formatDate(new Date(), 'YYYY-MM-DD_HHmmss')}_manual.tar.gz`,
        file_size: 256 * 1024 * 1024,
        type: 'manual',
        status: 'success',
      };
      setBackupHistory((prev) => [newBackup, ...prev]);
      setLastBackupTime(newBackup.backup_time);
      setIsBackingUp(false);
      message.success('备份创建成功');
    }, 2000);
  };

  // ---------- 下载备份 ----------
  const handleDownload = (record: BackupRecord) => {
    message.info(`开始下载 ${record.file_name}`);
  };

  // ---------- 恢复备份 ----------
  const handleRestore = () => {
    message.success('恢复任务已提交，请稍后查看恢复进度');
  };

  // ---------- 备份历史表格列 ----------
  const historyColumns = [
    {
      title: '备份时间',
      dataIndex: 'backup_time',
      key: 'backup_time',
      width: 180,
      render: (time: string) => formatDate(time, 'YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '文件名',
      dataIndex: 'file_name',
      key: 'file_name',
      ellipsis: { showTitle: true },
    },
    {
      title: '大小',
      dataIndex: 'file_size',
      key: 'file_size',
      width: 120,
      render: (size: number) => formatFileSize(size),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      align: 'center' as const,
      render: (type: string) => (
        <Tag color={type === 'auto' ? 'blue' : 'green'}>
          {type === 'auto' ? '自动' : '手动'}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      align: 'center' as const,
      render: (status: string) => (
        <Tag color={status === 'success' ? 'green' : 'red'}>
          {status === 'success' ? '成功' : '失败'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      align: 'center' as const,
      render: (_: unknown, record: BackupRecord) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(record)}
          >
            下载
          </Button>
          {record.status === 'success' && (
            <Popconfirm
              title="确认恢复此备份？"
              description="恢复操作将覆盖当前数据，请确认已做好当前数据备份。"
              onConfirm={handleRestore}
              okText="确认恢复"
              cancelText="取消"
            >
              <Button type="link" size="small" danger>
                恢复
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">数据备份与恢复</h1>
        <p className="text-gray-500 mt-1">管理系统数据备份、恢复与存储策略</p>
      </div>

      {/* 备份区域 */}
      <Card
        className="rounded-xl shadow-sm border border-gray-100"
        title={
          <div className="flex items-center gap-2">
            <SafetyCertificateOutlined className="text-blue-500" />
            <span>备份管理</span>
          </div>
        }
      >
        <div className="space-y-6">
          {/* 自动备份状态 */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">自动备份</span>
                <Tag color="green">已启用</Tag>
              </div>
              <div className="text-sm text-gray-500">
                每日自动备份，保留 30 天
              </div>
              <div className="text-sm text-gray-500">
                最近备份时间：<span className="font-medium text-gray-700">
                  {formatDate(lastBackupTime, 'YYYY-MM-DD HH:mm:ss')}
                </span>
              </div>
            </div>
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              loading={isBackingUp}
              onClick={handleBackup}
            >
              立即备份
            </Button>
          </div>

          {/* 备份历史 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <HistoryOutlined className="text-gray-400" />
              <span className="text-sm font-medium text-gray-700">备份历史</span>
            </div>
            <Table<BackupRecord>
              columns={historyColumns}
              dataSource={backupHistory}
              rowKey="id"
              pagination={false}
              size="small"
              scroll={{ x: 800 }}
            />
          </div>
        </div>
      </Card>

      {/* 恢复区域 */}
      <Card
        className="rounded-xl shadow-sm border border-gray-100"
        title={
          <div className="flex items-center gap-2">
            <CloudUploadOutlined className="text-orange-500" />
            <span>数据恢复</span>
          </div>
        }
      >
        <div className="space-y-6">
          {/* 上传备份文件 */}
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">上传备份文件</div>
            <Upload.Dragger
              name="file"
              accept=".tar.gz,.zip,.bak"
              maxCount={1}
              beforeUpload={() => {
                message.info('文件已选择，请确认恢复方式后点击恢复');
                return false; // 阻止自动上传
              }}
            >
              <p className="text-4xl text-gray-300 mb-2">
                <InboxOutlined />
              </p>
              <p className="text-sm text-gray-500">
                点击或拖拽备份文件到此区域上传
              </p>
              <p className="text-xs text-gray-400 mt-1">
                支持 .tar.gz / .zip / .bak 格式
              </p>
            </Upload.Dragger>
          </div>

          {/* 恢复方式选择 */}
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">恢复方式</div>
            <Select
              value={restoreMode}
              onChange={setRestoreMode}
              style={{ width: 300 }}
              options={[
                {
                  value: 'overwrite',
                  label: '全量覆盖 — 用备份文件完全替换当前数据',
                },
                {
                  value: 'merge',
                  label: '合并导入 — 将备份数据合并到当前数据中',
                },
              ]}
            />
          </div>

          {/* 恢复前警告 */}
          <Alert
            type="warning"
            showIcon
            icon={<WarningOutlined />}
            message="恢复操作警告"
            description={
              <ul className="list-disc list-inside mt-1 space-y-1 text-sm">
                <li>恢复操作将不可撤销，请确保已做好当前数据的备份</li>
                <li>恢复过程中系统将暂时不可用</li>
                <li>全量覆盖模式将清除当前所有数据并替换为备份数据</li>
                <li>建议在非业务高峰期执行恢复操作</li>
              </ul>
            }
          />

          {/* 确认恢复按钮 */}
          <Popconfirm
            title="确认执行数据恢复？"
            description="此操作将影响系统所有数据，请确认已做好充分准备。"
            onConfirm={handleRestore}
            okText="确认恢复"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button type="primary" danger size="large">
              确认恢复
            </Button>
          </Popconfirm>
        </div>
      </Card>
    </div>
  );
}
