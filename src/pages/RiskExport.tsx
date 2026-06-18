import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button, Card, Checkbox, Radio, DatePicker, Select, Space, Typography,
  Alert, message, Divider, Tag,
} from 'antd';
import {
  ArrowLeftOutlined, DownloadOutlined, FileExcelOutlined,
  FileTextOutlined, FilterOutlined,
} from '@ant-design/icons';
import { mockRisks, mockMeasures } from '@/mock/data';
import type { SecurityRisk } from '@/types/types';
import { formatDate } from '@/lib/utils';
import { RISK_LEVELS, RISK_STATUSES, RISK_CATEGORIES, RISK_SOURCES } from '@/lib/constants';

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

const EXPORT_FIELDS = [
  { label: '标题', value: 'title' },
  { label: '编号', value: 'risk_no' },
  { label: '等级', value: 'level' },
  { label: '状态', value: 'status' },
  { label: '类别', value: 'category' },
  { label: '综合分值', value: 'total_score' },
  { label: '责任人', value: 'risk_owner' },
  { label: '发现日期', value: 'discovery_date' },
  { label: '计划完成日期', value: 'plan_end_date' },
  { label: '描述', value: 'description' },
  { label: 'CVE编号', value: 'cve_id' },
  { label: 'CVSS评分', value: 'cvss_score' },
] as const;

export default function RiskExport() {
  const navigate = useNavigate();

  // 筛选条件
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);

  // 导出选项
  const [format, setFormat] = useState<'csv' | 'excel'>('csv');
  const [selectedFields, setSelectedFields] = useState<string[]>(
    EXPORT_FIELDS.map(f => f.value)
  );
  const [contentScope, setContentScope] = useState<'risk_only' | 'with_measures'>('risk_only');

  // 导出状态
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);

  // 筛选后的数据
  const filteredData = useMemo(() => {
    let data = [...mockRisks];

    if (selectedLevels.length > 0) {
      data = data.filter(r => selectedLevels.includes(r.level));
    }
    if (selectedStatuses.length > 0) {
      data = data.filter(r => selectedStatuses.includes(r.status));
    }
    if (selectedCategories.length > 0) {
      data = data.filter(r => selectedCategories.includes(r.category));
    }
    if (dateRange) {
      const [start, end] = dateRange;
      data = data.filter(r => {
        const d = r.discovery_date.split('T')[0];
        return d >= start && d <= end;
      });
    }

    return data;
  }, [selectedLevels, selectedStatuses, selectedCategories, dateRange]);

  // 是否有激活的筛选条件
  const hasActiveFilters = selectedLevels.length > 0 || selectedStatuses.length > 0
    || selectedCategories.length > 0 || dateRange !== null;

  // 重置筛选
  const handleResetFilters = useCallback(() => {
    setSelectedLevels([]);
    setSelectedStatuses([]);
    setSelectedCategories([]);
    setDateRange(null);
  }, []);

  // 模拟导出
  const handleExport = useCallback(() => {
    if (selectedFields.length === 0) {
      message.warning('请至少选择一个导出字段');
      return;
    }
    if (filteredData.length === 0) {
      message.warning('没有匹配的数据可导出');
      return;
    }

    setExporting(true);
    message.loading({ content: '正在生成导出文件...', key: 'export', duration: 0 });

    setTimeout(() => {
      setExporting(false);
      setExported(true);
      message.success({
        content: `导出完成！共 ${filteredData.length} 条数据，格式：${format.toUpperCase()}`,
        key: 'export',
      });
    }, 1500);
  }, [filteredData, selectedFields, format]);

  // 模拟下载
  const handleDownload = useCallback(() => {
    // 生成 CSV 内容用于模拟下载
    const headers = selectedFields.map(f => EXPORT_FIELDS.find(ef => ef.value === f)?.label || f);
    const rows = filteredData.map(risk => {
      return selectedFields.map(field => {
        switch (field) {
          case 'title': return risk.title;
          case 'risk_no': return risk.risk_no;
          case 'level': return risk.level;
          case 'status': return risk.status;
          case 'category': return risk.category;
          case 'total_score': return risk.total_score;
          case 'risk_owner': return risk.risk_owner?.name || '';
          case 'discovery_date': return formatDate(risk.discovery_date);
          case 'plan_end_date': return formatDate(risk.plan_end_date);
          case 'description': return risk.description;
          case 'cve_id': return risk.cve_id || '';
          case 'cvss_score': return risk.cvss_score?.toString() || '';
          default: return '';
        }
      });
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `风险导出_${new Date().toISOString().split('T')[0]}.${format}`;
    link.click();
    URL.revokeObjectURL(url);
    message.success('文件已下载');
  }, [filteredData, selectedFields, format]);

  // 全选/取消全选字段
  const handleCheckAllFields = useCallback((e: any) => {
    setSelectedFields(e.target.checked ? EXPORT_FIELDS.map(f => f.value) : []);
  }, []);

  const isAllFieldsSelected = selectedFields.length === EXPORT_FIELDS.length;
  const isIndeterminate = selectedFields.length > 0 && selectedFields.length < EXPORT_FIELDS.length;

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center gap-3">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/risks')} />
        <div>
          <Title level={4} className="!mb-0">批量导出</Title>
          <Text type="secondary">导出风险数据为 CSV 或 Excel 格式</Text>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左侧：筛选条件 */}
        <Card
          title={
            <span className="flex items-center gap-2">
              <FilterOutlined />
              筛选条件
              {hasActiveFilters && (
                <Tag color="blue">{filteredData.length} 条匹配</Tag>
              )}
            </span>
          }
          size="small"
          extra={
            hasActiveFilters && (
              <Button type="link" size="small" onClick={handleResetFilters}>
                重置
              </Button>
            )
          }
        >
          <div className="space-y-4">
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
          </div>
        </Card>

        {/* 右侧：导出选项 */}
        <Card title="导出选项" size="small">
          <div className="space-y-5">
            {/* 格式选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">导出格式</label>
              <Radio.Group
                value={format}
                onChange={e => { setFormat(e.target.value); setExported(false); }}
              >
                <Radio value="csv">
                  <FileTextOutlined className="mr-1" /> CSV
                </Radio>
                <Radio value="excel">
                  <FileExcelOutlined className="mr-1" /> Excel
                </Radio>
              </Radio.Group>
            </div>

            <Divider className="!my-3" />

            {/* 字段选择 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-600">导出字段</label>
                <Checkbox
                  checked={isAllFieldsSelected}
                  indeterminate={isIndeterminate}
                  onChange={handleCheckAllFields}
                >
                  全选
                </Checkbox>
              </div>
              <Checkbox.Group
                value={selectedFields}
                onChange={vals => setSelectedFields(vals as string[])}
                className="grid grid-cols-2 gap-2"
              >
                {EXPORT_FIELDS.map(field => (
                  <Checkbox key={field.value} value={field.value}>
                    {field.label}
                  </Checkbox>
                ))}
              </Checkbox.Group>
            </div>

            <Divider className="!my-3" />

            {/* 内容范围 */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">内容范围</label>
              <Radio.Group value={contentScope} onChange={e => setContentScope(e.target.value)}>
                <Radio value="risk_only">仅风险数据</Radio>
                <Radio value="with_measures">含处置措施</Radio>
              </Radio.Group>
            </div>

            <Divider className="!my-3" />

            {/* 预览信息 */}
            <Alert
              message={
                <div className="flex items-center justify-between">
                  <span>匹配记录数</span>
                  <Text strong className="text-lg">{filteredData.length} 条</Text>
                </div>
              }
              type="info"
              showIcon
            />

            {contentScope === 'with_measures' && (
              <Alert
                message={
                  <div className="flex items-center justify-between">
                    <span>关联处置措施数</span>
                    <Text strong className="text-lg">
                      {filteredData.reduce((sum, r) => sum + (r.measures?.length || 0), 0)} 条
                    </Text>
                  </div>
                }
                type="info"
                showIcon
              />
            )}

            {/* 导出按钮 */}
            <div className="flex gap-3 pt-2">
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                loading={exporting}
                onClick={handleExport}
                disabled={selectedFields.length === 0 || filteredData.length === 0}
                className="flex-1"
              >
                导出
              </Button>
            </div>

            {/* 导出成功后显示下载链接 */}
            {exported && (
              <Alert
                message="导出成功"
                description={
                  <div className="space-y-2">
                    <p>文件已生成，包含 {filteredData.length} 条风险数据，{selectedFields.length} 个字段。</p>
                    <Button
                      type="link"
                      icon={<DownloadOutlined />}
                      onClick={handleDownload}
                      className="!p-0"
                    >
                      下载 {format.toUpperCase()} 文件
                    </Button>
                  </div>
                }
                type="success"
                showIcon
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
