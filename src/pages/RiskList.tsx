import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button, Card, Table, Tag, Input, Space, Checkbox, Select,
  DatePicker, Switch, Tooltip, Popconfirm, message,
} from 'antd';
import type { TableProps, TableColumnType } from 'antd';
import {
  PlusOutlined, ImportOutlined, ExportOutlined,
  SearchOutlined, EyeOutlined, EditOutlined, DeleteOutlined,
  FilterOutlined, DownOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/contexts/AuthContext';
import { mockRisks, mockUsers } from '@/mock/data';
import type { SecurityRisk } from '@/types/types';
import { formatDate, getLevelColor, getStatusColor, getDaysRemaining } from '@/lib/utils';
import { RISK_LEVELS, RISK_STATUSES, RISK_CATEGORIES, RISK_SOURCES } from '@/lib/constants';

const { RangePicker } = DatePicker;

export default function RiskList() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // 搜索与筛选状态
  const [searchText, setSearchText] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [selectedOwner, setSelectedOwner] = useState<number | undefined>(undefined);
  const [cveOnly, setCveOnly] = useState(false);

  // 分页状态
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20 });

  // 排序状态
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'ascend' | 'descend' | null>(null);

  // 数据隔离：根据角色过滤
  const filteredByRole = useMemo(() => {
    if (!user) return [];
    if (user.role === 'admin' || user.role === 'security_team') return mockRisks;
    if (user.role === 'risk_owner') return mockRisks.filter(r => r.risk_owner_id === user.id);
    if (user.role === 'handler') return mockRisks.filter(r => r.handler_id === user.id);
    return mockRisks;
  }, [user]);

  // 综合过滤
  const filteredData = useMemo(() => {
    let data = [...filteredByRole];

    // 关键字搜索
    if (searchText.trim()) {
      const kw = searchText.trim().toLowerCase();
      data = data.filter(
        r => r.title.toLowerCase().includes(kw) || r.risk_no.toLowerCase().includes(kw)
      );
    }

    // 等级筛选
    if (selectedLevels.length > 0) {
      data = data.filter(r => selectedLevels.includes(r.level));
    }

    // 状态筛选
    if (selectedStatuses.length > 0) {
      data = data.filter(r => selectedStatuses.includes(r.status));
    }

    // 类别筛选
    if (selectedCategories.length > 0) {
      data = data.filter(r => selectedCategories.includes(r.category));
    }

    // 来源筛选
    if (selectedSources.length > 0) {
      data = data.filter(r => selectedSources.includes(r.source));
    }

    // 日期范围筛选
    if (dateRange) {
      const [start, end] = dateRange;
      data = data.filter(r => {
        const d = r.discovery_date;
        return d >= start && d <= end;
      });
    }

    // 责任人筛选
    if (selectedOwner !== undefined) {
      data = data.filter(r => r.risk_owner_id === selectedOwner);
    }

    // CVE 筛选
    if (cveOnly) {
      data = data.filter(r => !!r.cve_id);
    }

    // 排序
    if (sortField && sortOrder) {
      const dir = sortOrder === 'ascend' ? 1 : -1;
      data.sort((a, b) => {
        const aVal = (a as Record<string, unknown>)[sortField];
        const bVal = (b as Record<string, unknown>)[sortField];
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return (aVal - bVal) * dir;
        }
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return aVal.localeCompare(bVal) * dir;
        }
        return 0;
      });
    }

    return data;
  }, [filteredByRole, searchText, selectedLevels, selectedStatuses, selectedCategories,
    selectedSources, dateRange, selectedOwner, cveOnly, sortField, sortOrder]);

  // 判断是否超期
  const isOverdue = useCallback((risk: SecurityRisk) => {
    return !risk.actual_end_date && getDaysRemaining(risk.plan_end_date) < 0 && risk.status !== '已关闭';
  }, []);

  // 删除操作
  const handleDelete = useCallback((_id: number) => {
    message.success('风险已删除（Mock）');
  }, []);

  // 重置筛选
  const handleResetFilters = useCallback(() => {
    setSelectedLevels([]);
    setSelectedStatuses([]);
    setSelectedCategories([]);
    setSelectedSources([]);
    setDateRange(null);
    setSelectedOwner(undefined);
    setCveOnly(false);
  }, []);

  // 是否有激活的筛选条件
  const hasActiveFilters = selectedLevels.length > 0 || selectedStatuses.length > 0
    || selectedCategories.length > 0 || selectedSources.length > 0
    || dateRange !== null || selectedOwner !== undefined || cveOnly;

  // 表格列定义
  const columns: TableColumnType<SecurityRisk>[] = [
    {
      title: '风险编号',
      dataIndex: 'risk_no',
      key: 'risk_no',
      width: 150,
      fixed: 'left',
      sorter: true,
      sortOrder: sortField === 'risk_no' ? sortOrder : null,
      render: (text: string) => (
        <span className="font-mono text-sm text-blue-600">{text}</span>
      ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <span className="font-medium">{text}</span>
        </Tooltip>
      ),
    },
    {
      title: '等级',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      filters: RISK_LEVELS.map(l => ({ text: l, value: l })),
      onFilter: (value, record) => record.level === value,
      render: (level: string) => (
        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getLevelColor(level)}`}>
          {level}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      filters: RISK_STATUSES.map(s => ({ text: s, value: s })),
      onFilter: (value, record) => record.status === value,
      render: (status: string) => (
        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(status)}`}>
          {status}
        </span>
      ),
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      width: 100,
    },
    {
      title: '综合分值',
      dataIndex: 'total_score',
      key: 'total_score',
      width: 100,
      sorter: true,
      sortOrder: sortField === 'total_score' ? sortOrder : null,
      render: (score: number) => {
        const color = score >= 70 ? 'text-red-600' : score >= 40 ? 'text-orange-500' : score >= 20 ? 'text-yellow-500' : 'text-green-600';
        return <span className={`font-bold ${color}`}>{score}</span>;
      },
    },
    {
      title: '责任人',
      key: 'risk_owner',
      width: 100,
      render: (_: unknown, record: SecurityRisk) => record.risk_owner?.name || '-',
    },
    {
      title: '发现日期',
      dataIndex: 'discovery_date',
      key: 'discovery_date',
      width: 120,
      sorter: true,
      sortOrder: sortField === 'discovery_date' ? sortOrder : null,
      render: (date: string) => formatDate(date),
    },
    {
      title: '计划完成',
      dataIndex: 'plan_end_date',
      key: 'plan_end_date',
      width: 120,
      render: (date: string, record: SecurityRisk) => {
        const overdue = isOverdue(record);
        return (
          <span className={overdue ? 'text-red-600 font-medium' : ''}>
            {formatDate(date)}
            {overdue && <span className="ml-1 text-xs">(超期)</span>}
          </span>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_: unknown, record: SecurityRisk) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={(e) => { e.stopPropagation(); navigate(`/risks/${record.id}`); }}
            />
          </Tooltip>
          {(user?.role === 'admin' || user?.role === 'security_team') && (
            <Tooltip title="编辑">
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={(e) => { e.stopPropagation(); navigate(`/risks/${record.id}/edit`); }}
              />
            </Tooltip>
          )}
          {(user?.role === 'admin' || user?.role === 'security_team') && (
            <Popconfirm
              title="确定要删除该风险吗？"
              onConfirm={(e) => { e?.stopPropagation(); handleDelete(record.id); }}
              onCancel={(e) => e?.stopPropagation()}
            >
              <Tooltip title="删除">
                <Button
                  type="link"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={(e) => e.stopPropagation()}
                />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  // 表格排序变化
  const handleTableChange: TableProps['onChange'] = (paginationConfig, _filters, sorter) => {
    setPagination({
      current: paginationConfig.current || 1,
      pageSize: paginationConfig.pageSize || 20,
    });

    if (sorter && !Array.isArray(sorter) && sorter.columnKey) {
      setSortField(sorter.columnKey as string);
      setSortOrder(sorter.order as 'ascend' | 'descend' | null);
    } else {
      setSortField(null);
      setSortOrder(null);
    }
  };

  return (
    <div className="p-6 space-y-4">
      {/* 顶部操作栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">风险管理</h1>
          <p className="text-gray-500 text-sm mt-1">安全风险列表与全生命周期管理</p>
        </div>
        <Space wrap>
          {(user?.role === 'admin' || user?.role === 'security_team') && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/risks/new')}
            >
              新增风险
            </Button>
          )}
          <Button icon={<ImportOutlined />} onClick={() => navigate('/risks/import')}>
            批量导入
          </Button>
          <Button icon={<ExportOutlined />} onClick={() => navigate('/risks/export')}>
            批量导出
          </Button>
        </Space>
      </div>

      {/* 搜索栏 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="搜索风险标题或编号..."
          prefix={<SearchOutlined />}
          allowClear
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          style={{ maxWidth: 360 }}
        />
        <Button
          icon={<FilterOutlined />}
          onClick={() => setFilterVisible(v => !v)}
          type={hasActiveFilters ? 'primary' : 'default'}
        >
          筛选条件
          {hasActiveFilters && <span className="ml-1">({selectedLevels.length + selectedStatuses.length + selectedCategories.length + selectedSources.length + (dateRange ? 1 : 0) + (selectedOwner !== undefined ? 1 : 0) + (cveOnly ? 1 : 0)})</span>}
        </Button>
        {hasActiveFilters && (
          <Button onClick={handleResetFilters}>重置筛选</Button>
        )}
      </div>

      {/* 筛选面板 */}
      {filterVisible && (
        <Card size="small" className="border-blue-200 bg-blue-50/30">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* 风险等级 */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">风险等级</label>
              <Checkbox.Group
                options={RISK_LEVELS.map(l => ({ label: l, value: l }))}
                value={selectedLevels}
                onChange={vals => setSelectedLevels(vals as string[])}
              />
            </div>
            {/* 风险状态 */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">风险状态</label>
              <Checkbox.Group
                options={RISK_STATUSES.map(s => ({ label: s, value: s }))}
                value={selectedStatuses}
                onChange={vals => setSelectedStatuses(vals as string[])}
              />
            </div>
            {/* 风险类别 */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">风险类别</label>
              <Checkbox.Group
                options={RISK_CATEGORIES.map(c => ({ label: c, value: c }))}
                value={selectedCategories}
                onChange={vals => setSelectedCategories(vals as string[])}
              />
            </div>
            {/* 风险来源 */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">风险来源</label>
              <Checkbox.Group
                options={RISK_SOURCES.map(s => ({ label: s, value: s }))}
                value={selectedSources}
                onChange={vals => setSelectedSources(vals as string[])}
              />
            </div>
            {/* 发现日期范围 */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">发现日期范围</label>
              <RangePicker
                onChange={(_, dateStrings) => {
                  if (dateStrings[0] && dateStrings[1]) {
                    setDateRange([dateStrings[0], dateStrings[1]]);
                  } else {
                    setDateRange(null);
                  }
                }}
                style={{ width: '100%' }}
              />
            </div>
            {/* 责任人 */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">风险责任人</label>
              <Select
                placeholder="全部"
                allowClear
                value={selectedOwner}
                onChange={val => setSelectedOwner(val)}
                style={{ width: '100%' }}
                options={mockUsers.map(u => ({ label: u.name, value: u.id }))}
              />
            </div>
            {/* 是否含 CVE */}
            <div className="flex items-end">
              <div className="flex items-center gap-2">
                <Switch
                  size="small"
                  checked={cveOnly}
                  onChange={setCveOnly}
                />
                <span className="text-sm text-gray-600">仅显示含 CVE 编号</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 风险列表表格 */}
      <Card bodyStyle={{ padding: 0 }}>
        <Table<SecurityRisk>
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: filteredData.length,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
          rowClassName={(record) => {
            if (isOverdue(record)) return 'bg-red-50 hover:bg-red-100';
            return 'hover:bg-blue-50/50';
          }}
          onRow={(record) => ({
            onClick: () => navigate(`/risks/${record.id}`),
            style: { cursor: 'pointer' },
          })}
          size="middle"
        />
      </Card>
    </div>
  );
}
