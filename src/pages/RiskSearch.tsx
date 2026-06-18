import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button, Card, Input, Select, Checkbox, DatePicker, Space, Typography,
  Tag, Empty, Radio, Switch, Collapse,
} from 'antd';
import {
  SearchOutlined, DownOutlined, UpOutlined,
  HistoryOutlined, ClearOutlined,
} from '@ant-design/icons';
import { mockRisks, mockUsers } from '@/mock/data';
import type { SecurityRisk } from '@/types/types';
import { formatDate, getLevelColor, getStatusColor } from '@/lib/utils';
import {
  RISK_LEVELS, RISK_STATUSES, RISK_CATEGORIES, RISK_SOURCES,
  MEASURE_TYPES, TASK_STATUSES,
} from '@/lib/constants';

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;
const { Search } = Input;

const STORAGE_KEY = 'risk_search_history';

interface SearchHistoryItem {
  keyword: string;
  timestamp: number;
}

type SortOption = 'relevance' | 'discovery_date' | 'plan_end_date' | 'level' | 'total_score';

// 关键词高亮组件
function HighlightText({ text, keyword }: { text: string; keyword: string }) {
  if (!keyword.trim()) return <>{text}</>;

  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-200 text-yellow-900 px-0.5 rounded">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

// 等级排序权重
const levelWeight: Record<string, number> = {
  '严重': 4,
  '高危': 3,
  '中危': 2,
  '低危': 1,
};

export default function RiskSearch() {
  const navigate = useNavigate();
  const searchInputRef = useRef<any>(null);

  // 搜索状态
  const [keyword, setKeyword] = useState('');
  const [searchedKeyword, setSearchedKeyword] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // 高级筛选
  const [advancedVisible, setAdvancedVisible] = useState(false);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [selectedOwner, setSelectedOwner] = useState<number | undefined>(undefined);
  const [selectedMeasureTypes, setSelectedMeasureTypes] = useState<string[]>([]);
  const [selectedTaskStatuses, setSelectedTaskStatuses] = useState<string[]>([]);
  const [cveOnly, setCveOnly] = useState(false);

  // 排序
  const [sortBy, setSortBy] = useState<SortOption>('relevance');

  // 搜索历史
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);

  // 加载搜索历史
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSearchHistory(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  // 保存搜索历史
  const saveHistory = useCallback((kw: string) => {
    if (!kw.trim()) return;
    const newItem: SearchHistoryItem = { keyword: kw.trim(), timestamp: Date.now() };
    const updated = [newItem, ...searchHistory.filter(h => h.keyword !== kw.trim())].slice(0, 10);
    setSearchHistory(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }, [searchHistory]);

  // 清空搜索历史
  const clearHistory = useCallback(() => {
    setSearchHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  // 计算相关度分数
  const computeRelevance = useCallback((risk: SecurityRisk, kw: string): number => {
    if (!kw.trim()) return 0;
    const lower = kw.toLowerCase();
    let score = 0;

    // 标题匹配（权重最高）
    if (risk.title.toLowerCase().includes(lower)) score += 10;
    // 编号匹配
    if (risk.risk_no.toLowerCase().includes(lower)) score += 8;
    // 描述匹配
    if (risk.description.toLowerCase().includes(lower)) score += 5;
    // CVE 匹配
    if (risk.cve_id?.toLowerCase().includes(lower)) score += 8;
    // 类别匹配
    if (risk.category.toLowerCase().includes(lower)) score += 3;
    // 来源匹配
    if (risk.source.toLowerCase().includes(lower)) score += 2;
    // 责任人匹配
    if (risk.risk_owner?.name.toLowerCase().includes(lower)) score += 3;
    // 处置人匹配
    if (risk.handler?.name.toLowerCase().includes(lower)) score += 2;

    return score;
  }, []);

  // 搜索结果
  const searchResults = useMemo(() => {
    if (!hasSearched || !searchedKeyword.trim()) return [];

    let data = [...mockRisks];
    const kw = searchedKeyword.trim().toLowerCase();

    // 全文检索过滤
    data = data.filter(risk => {
      const fields = [
        risk.title, risk.risk_no, risk.description,
        risk.category, risk.source, risk.cve_id || '',
        risk.risk_owner?.name || '', risk.handler?.name || '',
      ];
      return fields.some(f => f.toLowerCase().includes(kw));
    });

    // 高级筛选
    if (selectedLevels.length > 0) {
      data = data.filter(r => selectedLevels.includes(r.level));
    }
    if (selectedStatuses.length > 0) {
      data = data.filter(r => selectedStatuses.includes(r.status));
    }
    if (selectedCategories.length > 0) {
      data = data.filter(r => selectedCategories.includes(r.category));
    }
    if (selectedSources.length > 0) {
      data = data.filter(r => selectedSources.includes(r.source));
    }
    if (dateRange) {
      const [start, end] = dateRange;
      data = data.filter(r => {
        const d = r.discovery_date.split('T')[0];
        return d >= start && d <= end;
      });
    }
    if (selectedOwner !== undefined) {
      data = data.filter(r => r.risk_owner_id === selectedOwner);
    }
    if (selectedMeasureTypes.length > 0) {
      data = data.filter(r =>
        r.measures?.some(m => selectedMeasureTypes.includes(m.measure_type))
      );
    }
    if (selectedTaskStatuses.length > 0) {
      data = data.filter(r =>
        r.measures?.some(m => selectedTaskStatuses.includes(m.task_status))
      );
    }
    if (cveOnly) {
      data = data.filter(r => !!r.cve_id);
    }

    // 排序
    data.sort((a, b) => {
      switch (sortBy) {
        case 'relevance':
          return computeRelevance(b, searchedKeyword) - computeRelevance(a, searchedKeyword);
        case 'discovery_date':
          return new Date(b.discovery_date).getTime() - new Date(a.discovery_date).getTime();
        case 'plan_end_date':
          return new Date(a.plan_end_date).getTime() - new Date(b.plan_end_date).getTime();
        case 'level':
          return (levelWeight[b.level] || 0) - (levelWeight[a.level] || 0);
        case 'total_score':
          return b.total_score - a.total_score;
        default:
          return 0;
      }
    });

    return data;
  }, [hasSearched, searchedKeyword, selectedLevels, selectedStatuses, selectedCategories,
    selectedSources, dateRange, selectedOwner, selectedMeasureTypes, selectedTaskStatuses,
    cveOnly, sortBy, computeRelevance]);

  // 执行搜索
  const handleSearch = useCallback((value?: string) => {
    const kw = value ?? keyword;
    setSearchedKeyword(kw);
    setHasSearched(true);
    if (kw.trim()) {
      saveHistory(kw);
    }
  }, [keyword, saveHistory]);

  // 快速搜索（点击历史记录）
  const handleQuickSearch = useCallback((kw: string) => {
    setKeyword(kw);
    setSearchedKeyword(kw);
    setHasSearched(true);
  }, []);

  // 重置筛选
  const handleResetFilters = useCallback(() => {
    setSelectedLevels([]);
    setSelectedStatuses([]);
    setSelectedCategories([]);
    setSelectedSources([]);
    setDateRange(null);
    setSelectedOwner(undefined);
    setSelectedMeasureTypes([]);
    setSelectedTaskStatuses([]);
    setCveOnly(false);
  }, []);

  // 是否有激活的高级筛选
  const hasAdvancedFilters = selectedLevels.length > 0 || selectedStatuses.length > 0
    || selectedCategories.length > 0 || selectedSources.length > 0
    || dateRange !== null || selectedOwner !== undefined
    || selectedMeasureTypes.length > 0 || selectedTaskStatuses.length > 0
    || cveOnly;

  // 回车搜索
  const handlePressEnter = useCallback(() => {
    handleSearch();
  }, [handleSearch]);

  return (
    <div className="p-6 space-y-6">
      {/* 搜索引擎风格顶部 */}
      <div className="flex flex-col items-center pt-8 pb-6">
        <Title level={3} className="!mb-2">风险高级检索</Title>
        <Text type="secondary" className="mb-6">全文检索安全风险数据，支持多条件组合筛选</Text>

        <div className="w-full max-w-2xl">
          <Search
            ref={searchInputRef}
            placeholder="输入关键词搜索风险标题、描述、编号、CVE..."
            allowClear
            enterButton={
              <Button type="primary" icon={<SearchOutlined />}>
                搜索
              </Button>
            }
            size="large"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onSearch={handleSearch}
            onPressEnter={handlePressEnter}
          />
        </div>

        {/* 搜索历史 */}
        {searchHistory.length > 0 && !hasSearched && (
          <div className="w-full max-w-2xl mt-4">
            <div className="flex items-center justify-between mb-2">
              <Text type="secondary" className="text-xs">
                <HistoryOutlined className="mr-1" />
                搜索历史
              </Text>
              <Button type="link" size="small" onClick={clearHistory} className="!text-xs">
                <ClearOutlined /> 清空
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {searchHistory.map((item, index) => (
                <Tag
                  key={index}
                  className="cursor-pointer hover:bg-blue-50 transition-colors"
                  onClick={() => handleQuickSearch(item.keyword)}
                >
                  {item.keyword}
                </Tag>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 高级筛选面板 */}
      <Card size="small">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setAdvancedVisible(v => !v)}
        >
          <span className="flex items-center gap-2 font-medium text-gray-700">
            <SearchOutlined />
            高级筛选
            {hasAdvancedFilters && <Tag color="blue">已启用</Tag>}
          </span>
          {advancedVisible ? <UpOutlined /> : <DownOutlined />}
        </div>

        {advancedVisible && (
          <div className="mt-4 pt-4 border-t border-gray-200">
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

              {/* 日期范围 */}
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
                <label className="block text-sm font-medium text-gray-600 mb-1">责任人</label>
                <Select
                  placeholder="全部"
                  allowClear
                  value={selectedOwner}
                  onChange={val => setSelectedOwner(val)}
                  style={{ width: '100%' }}
                  options={mockUsers.map(u => ({ label: u.name, value: u.id }))}
                />
              </div>

              {/* 处置方式 */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">处置方式</label>
                <Checkbox.Group
                  options={MEASURE_TYPES.map(t => ({ label: t, value: t }))}
                  value={selectedMeasureTypes}
                  onChange={vals => setSelectedMeasureTypes(vals as string[])}
                />
              </div>

              {/* 任务状态 */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">任务状态</label>
                <Checkbox.Group
                  options={TASK_STATUSES.map(t => ({ label: t, value: t }))}
                  value={selectedTaskStatuses}
                  onChange={vals => setSelectedTaskStatuses(vals as string[])}
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
                  <span className="text-sm text-gray-600">仅含 CVE 编号</span>
                </div>
              </div>
            </div>

            {hasAdvancedFilters && (
              <div className="mt-4 pt-3 border-t border-gray-100">
                <Button size="small" onClick={handleResetFilters}>
                  重置筛选条件
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* 排序选项 & 结果统计 */}
      {hasSearched && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Text type="secondary">
            找到 <Text strong className="text-gray-800">{searchResults.length}</Text> 条相关结果
            {searchedKeyword && (
              <span>（关键词："<Text strong className="text-blue-600">{searchedKeyword}</Text>"）</span>
            )}
          </Text>
          <Space>
            <Text type="secondary" className="text-sm">排序：</Text>
            <Radio.Group
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              size="small"
              optionType="button"
              buttonStyle="solid"
            >
              <Radio.Button value="relevance">相关度</Radio.Button>
              <Radio.Button value="discovery_date">发现日期</Radio.Button>
              <Radio.Button value="plan_end_date">计划完成</Radio.Button>
              <Radio.Button value="level">风险等级</Radio.Button>
              <Radio.Button value="total_score">综合分值</Radio.Button>
            </Radio.Group>
          </Space>
        </div>
      )}

      {/* 搜索结果列表 */}
      {hasSearched && searchResults.length === 0 && (
        <Empty
          description={
            <div>
              <p>未找到匹配的风险数据</p>
              <Text type="secondary">请尝试更换关键词或调整筛选条件</Text>
            </div>
          }
        />
      )}

      {hasSearched && searchResults.length > 0 && (
        <div className="space-y-4">
          {searchResults.map(risk => (
            <Card
              key={risk.id}
              hoverable
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/risks/${risk.id}`)}
            >
              <div className="space-y-3">
                {/* 标题行 */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-blue-600">{risk.risk_no}</span>
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getLevelColor(risk.level)}`}>
                        {risk.level}
                      </span>
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(risk.status)}`}>
                        {risk.status}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-gray-800">
                      <HighlightText text={risk.title} keyword={searchedKeyword} />
                    </h3>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${
                        risk.total_score >= 70 ? 'text-red-600' :
                        risk.total_score >= 40 ? 'text-orange-500' :
                        risk.total_score >= 20 ? 'text-yellow-500' : 'text-green-600'
                      }`}>
                        {risk.total_score}
                      </div>
                      <div className="text-xs text-gray-500">综合分值</div>
                    </div>
                  </div>
                </div>

                {/* 描述摘要 */}
                <p className="text-sm text-gray-600 line-clamp-2">
                  <HighlightText text={risk.description} keyword={searchedKeyword} />
                </p>

                {/* 底部信息 */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                  <span>类别：{risk.category}</span>
                  <span>来源：{risk.source}</span>
                  <span>责任人：{risk.risk_owner?.name || '-'}</span>
                  <span>发现日期：{formatDate(risk.discovery_date)}</span>
                  {risk.cve_id && (
                    <Tag color="red" className="text-xs">{risk.cve_id}</Tag>
                  )}
                  {risk.cvss_score && (
                    <span>CVSS: {risk.cvss_score}</span>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 未搜索时的空状态 */}
      {!hasSearched && (
        <div className="flex flex-col items-center py-16">
          <SearchOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />
          <p className="mt-4 text-gray-400 text-lg">输入关键词开始搜索</p>
          <p className="mt-1 text-gray-400 text-sm">支持搜索风险标题、描述、编号、CVE 等字段</p>
        </div>
      )}
    </div>
  );
}
