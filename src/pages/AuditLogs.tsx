import { useState, useMemo } from 'react';
import { Table, Tag, Select, DatePicker, Space, Card } from 'antd';
import { FilterOutlined } from '@ant-design/icons';
import { mockAuditLogs, mockUsers } from '@/mock/data';
import { formatDate } from '@/lib/utils';
import type { AuditLog } from '@/types/types';

const { RangePicker } = DatePicker;

// 操作类型标签颜色映射
const ACTION_TYPE_COLORS: Record<string, string> = {
  create_risk: 'blue',
  assign_handler: 'cyan',
  update_status: 'green',
  update_user: 'orange',
  accept_risk: 'purple',
  export_data: 'default',
  system_config: 'geekblue',
};

// 操作类型标签文案映射
const ACTION_TYPE_LABELS: Record<string, string> = {
  create_risk: '创建风险',
  assign_handler: '分配处置人',
  update_status: '更新状态',
  update_user: '更新用户',
  accept_risk: '接受风险',
  export_data: '导出数据',
  system_config: '系统配置',
};

export default function AuditLogs() {
  const [actionType, setActionType] = useState<string | undefined>(undefined);
  const [operatorId, setOperatorId] = useState<number | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);

  // ---------- 筛选后的日志 ----------
  const filteredLogs = useMemo(() => {
    let result = [...mockAuditLogs];

    if (actionType) {
      result = result.filter((log) => log.action_type === actionType);
    }

    if (operatorId) {
      result = result.filter((log) => log.operator_id === operatorId);
    }

    if (dateRange) {
      const [start, end] = dateRange;
      result = result.filter((log) => {
        const logTime = log.created_at;
        return logTime >= start && logTime <= end;
      });
    }

    // 按时间倒序
    result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return result;
  }, [actionType, operatorId, dateRange]);

  // ---------- 获取操作类型选项 ----------
  const actionTypeOptions = useMemo(() => {
    const types = [...new Set(mockAuditLogs.map((log) => log.action_type))];
    return types.map((t) => ({
      value: t,
      label: ACTION_TYPE_LABELS[t] || t,
    }));
  }, []);

  // ---------- 获取操作人选项 ----------
  const operatorOptions = useMemo(() => {
    const operatorIds = [...new Set(mockAuditLogs.map((log) => log.operator_id))];
    return operatorIds.map((id) => {
      const user = mockUsers.find((u) => u.id === id);
      return {
        value: id,
        label: user?.name || `用户${id}`,
      };
    });
  }, []);

  // ---------- 表格列定义 ----------
  const columns = [
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date: string) => formatDate(date, 'YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作类型',
      dataIndex: 'action_type',
      key: 'action_type',
      width: 130,
      render: (type: string) => (
        <Tag color={ACTION_TYPE_COLORS[type] || 'default'}>
          {ACTION_TYPE_LABELS[type] || type}
        </Tag>
      ),
    },
    {
      title: '操作人',
      dataIndex: 'operator_name',
      key: 'operator_name',
      width: 120,
    },
    {
      title: '目标标题',
      dataIndex: 'target_title',
      key: 'target_title',
      ellipsis: { showTitle: true },
      render: (text: string) => text || '-',
    },
    {
      title: '变更详情',
      key: 'changes',
      width: 120,
      align: 'center' as const,
      render: (_: unknown, record: AuditLog) => {
        if (!record.old_values && !record.new_values) return '-';
        return (
          <a
            onClick={(e) => {
              e.preventDefault();
              const expandedRow = document.getElementById(`audit-detail-${record.id}`);
              if (expandedRow) {
                expandedRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }}
          >
            查看详情
          </a>
        );
      },
    },
  ];

  // ---------- 展开行渲染（JSON Diff）----------
  const expandedRowRender = (record: AuditLog) => {
    if (!record.old_values && !record.new_values) {
      return <div className="text-gray-400 p-2">无变更详情</div>;
    }

    return (
      <div id={`audit-detail-${record.id}`} className="space-y-3 p-2">
        {record.old_values && (
          <div>
            <div className="text-sm font-medium text-red-600 mb-1">变更前 (old_values):</div>
            <pre className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm overflow-x-auto">
              <code>{JSON.stringify(record.old_values, null, 2)}</code>
            </pre>
          </div>
        )}
        {record.new_values && (
          <div>
            <div className="text-sm font-medium text-green-600 mb-1">变更后 (new_values):</div>
            <pre className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm overflow-x-auto">
              <code>{JSON.stringify(record.new_values, null, 2)}</code>
            </pre>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">审计日志</h1>
        <p className="text-gray-500 mt-1">查看系统操作记录与变更历史</p>
      </div>

      {/* 筛选栏 */}
      <Card className="rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 flex-wrap">
          <FilterOutlined className="text-gray-400" />
          <Select
            placeholder="操作类型"
            value={actionType}
            onChange={(val) => setActionType(val)}
            allowClear
            style={{ width: 160 }}
            options={actionTypeOptions}
          />
          <Select
            placeholder="操作人"
            value={operatorId}
            onChange={(val) => setOperatorId(val)}
            allowClear
            style={{ width: 160 }}
            options={operatorOptions}
          />
          <RangePicker
            showTime
            onChange={(_, dateStrings) => {
              if (dateStrings[0] && dateStrings[1]) {
                setDateRange([dateStrings[0], dateStrings[1]]);
              } else {
                setDateRange(null);
              }
            }}
          />
        </div>
      </Card>

      {/* 日志表格 */}
      <div className="rounded-xl bg-white shadow-sm border border-gray-100">
        <Table<AuditLog>
          columns={columns}
          dataSource={filteredLogs}
          rowKey="id"
          expandable={{
            expandedRowRender,
            rowExpandable: (record) => !!(record.old_values || record.new_values),
          }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          size="middle"
          scroll={{ x: 800 }}
        />
      </div>
    </div>
  );
}
