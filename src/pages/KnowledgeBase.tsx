import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button, Card, Input, Select, Tag, Space, Typography, Modal,
  Empty, message, Popconfirm, Tooltip,
} from 'antd';
import {
  PlusOutlined, SyncOutlined, RobotOutlined,
  FileSearchOutlined, SearchOutlined, DownOutlined, UpOutlined,
  EyeOutlined, EditOutlined, DeleteOutlined, CopyOutlined,
  BookOutlined, UserOutlined, ClockCircleOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { mockKnowledgeBase, mockRisks, mockUsers } from '@/mock/data';
import type { KnowledgeBaseArticle } from '@/types/types';
import { formatDate } from '@/lib/utils';
import { KB_CATEGORIES } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { TextArea } = Input;

const SOURCE_TYPE_OPTIONS = [
  { label: '手动录入', value: 'manual' },
  { label: '自动提取', value: 'auto_extract' },
  { label: '外部 CVE', value: 'external_cve' },
  { label: 'AI 生成', value: 'ai_generated' },
];

const SOURCE_TYPE_LABELS: Record<string, string> = {
  manual: '手动录入',
  auto_extract: '自动提取',
  external_cve: '外部 CVE',
  ai_generated: 'AI 生成',
};

const SOURCE_TYPE_COLORS: Record<string, string> = {
  manual: 'blue',
  auto_extract: 'green',
  external_cve: 'red',
  ai_generated: 'purple',
};

// 收集所有标签
const ALL_TAGS = Array.from(
  new Set(mockKnowledgeBase.flatMap(article => article.tags))
).sort();

export default function KnowledgeBase() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'security_team';

  // 列表筛选
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [selectedSourceType, setSelectedSourceType] = useState<string | undefined>(undefined);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filterVisible, setFilterVisible] = useState(false);

  // 详情 Modal
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeBaseArticle | null>(null);

  // 新增/编辑 Modal
  const [formVisible, setFormVisible] = useState(false);
  const [editingArticle, setEditingArticle] = useState<KnowledgeBaseArticle | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    category: KB_CATEGORIES[0] as string,
    tags: [] as string[],
    content: '',
    source_type: 'manual' as KnowledgeBaseArticle['source_type'],
    source_ref: '',
  });

  // 筛选后的数据
  const filteredArticles = useMemo(() => {
    let data = [...mockKnowledgeBase];

    if (searchText.trim()) {
      const kw = searchText.trim().toLowerCase();
      data = data.filter(a =>
        a.title.toLowerCase().includes(kw) ||
        a.content.toLowerCase().includes(kw) ||
        a.tags.some(t => t.toLowerCase().includes(kw))
      );
    }

    if (selectedCategory) {
      data = data.filter(a => a.category === selectedCategory);
    }

    if (selectedSourceType) {
      data = data.filter(a => a.source_type === selectedSourceType);
    }

    if (selectedTags.length > 0) {
      data = data.filter(a => selectedTags.some(t => a.tags.includes(t)));
    }

    return data;
  }, [searchText, selectedCategory, selectedSourceType, selectedTags]);

  // 查看详情
  const handleViewDetail = useCallback((article: KnowledgeBaseArticle) => {
    setSelectedArticle(article);
    setDetailVisible(true);
  }, []);

  // 新增文章
  const handleAdd = useCallback(() => {
    setEditingArticle(null);
    setFormData({
      title: '',
      category: KB_CATEGORIES[0],
      tags: [],
      content: '',
      source_type: 'manual',
      source_ref: '',
    });
    setFormVisible(true);
  }, []);

  // 编辑文章
  const handleEdit = useCallback((article: KnowledgeBaseArticle) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      category: article.category,
      tags: article.tags,
      content: article.content,
      source_type: article.source_type,
      source_ref: article.source_ref || '',
    });
    setFormVisible(true);
  }, []);

  // 保存文章（Mock）
  const handleSave = useCallback(() => {
    if (!formData.title.trim()) {
      message.warning('请输入标题');
      return;
    }
    if (!formData.content.trim()) {
      message.warning('请输入内容');
      return;
    }
    message.success(editingArticle ? '文章已更新（Mock）' : '文章已创建（Mock）');
    setFormVisible(false);
  }, [formData, editingArticle]);

  // 删除文章（Mock）
  const handleDelete = useCallback(() => {
    message.success('文章已删除（Mock）');
    setDetailVisible(false);
  }, []);

  // 引用为处置模板
  const handleUseAsTemplate = useCallback(() => {
    message.success('已引用为处置模板（Mock）');
  }, []);

  // 同步 CVE（Mock）
  const handleSyncCve = useCallback(() => {
    message.loading({ content: '正在同步 CVE 数据...', key: 'sync', duration: 2 });
    setTimeout(() => {
      message.success({ content: 'CVE 数据同步完成，新增 3 篇文章（Mock）', key: 'sync' });
    }, 2000);
  }, []);

  // 自动提取案例（Mock）
  const handleAutoExtract = useCallback(() => {
    message.loading({ content: '正在从已关闭风险中提取案例...', key: 'extract', duration: 2 });
    setTimeout(() => {
      message.success({ content: '自动提取完成，新增 2 篇案例文章（Mock）', key: 'extract' });
    }, 2000);
  }, []);

  // AI 生成建议（Mock）
  const handleAiGenerate = useCallback(() => {
    message.loading({ content: 'AI 正在分析风险数据并生成建议...', key: 'ai', duration: 3 });
    setTimeout(() => {
      message.success({ content: 'AI 已生成 5 条安全建议文章（Mock）', key: 'ai' });
    }, 3000);
  }, []);

  // 重置筛选
  const handleResetFilters = useCallback(() => {
    setSelectedCategory(undefined);
    setSelectedSourceType(undefined);
    setSelectedTags([]);
  }, []);

  // 获取创建人名称
  const getCreatorName = useCallback((userId: number) => {
    return mockUsers.find(u => u.id === userId)?.name || '未知';
  }, []);

  // 获取关联风险
  const getRelatedRisks = useCallback((riskIds: number[]) => {
    return mockRisks.filter(r => riskIds.includes(r.id));
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Title level={4} className="!mb-0">风险知识库</Title>
          <Text type="secondary">安全知识文章管理与检索</Text>
        </div>
        {isAdmin && (
          <Space wrap>
            <Button icon={<PlusOutlined />} type="primary" onClick={handleAdd}>
              新增文章
            </Button>
            <Button icon={<SyncOutlined />} onClick={handleSyncCve}>
              同步 CVE
            </Button>
            <Button icon={<FileSearchOutlined />} onClick={handleAutoExtract}>
              自动提取案例
            </Button>
            <Button icon={<RobotOutlined />} onClick={handleAiGenerate}>
              AI 生成建议
            </Button>
          </Space>
        )}
      </div>

      {/* 搜索栏 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Search
          placeholder="搜索文章标题、内容、标签..."
          allowClear
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          style={{ maxWidth: 400 }}
        />
        <Button
          icon={<DownOutlined />}
          onClick={() => setFilterVisible(v => !v)}
          type={(selectedCategory || selectedSourceType || selectedTags.length > 0) ? 'primary' : 'default'}
        >
          筛选
        </Button>
        {(selectedCategory || selectedSourceType || selectedTags.length > 0) && (
          <Button onClick={handleResetFilters}>重置筛选</Button>
        )}
      </div>

      {/* 筛选面板 */}
      {filterVisible && (
        <Card size="small" className="border-blue-200 bg-blue-50/30">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 分类 */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">分类</label>
              <Select
                placeholder="全部分类"
                allowClear
                value={selectedCategory}
                onChange={val => setSelectedCategory(val)}
                style={{ width: '100%' }}
                options={KB_CATEGORIES.map(c => ({ label: c, value: c }))}
              />
            </div>

            {/* 来源类型 */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">来源类型</label>
              <Select
                placeholder="全部来源"
                allowClear
                value={selectedSourceType}
                onChange={val => setSelectedSourceType(val)}
                style={{ width: '100%' }}
                options={SOURCE_TYPE_OPTIONS}
              />
            </div>

            {/* 标签 */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">标签</label>
              <Select
                mode="multiple"
                placeholder="选择标签"
                allowClear
                value={selectedTags}
                onChange={vals => setSelectedTags(vals)}
                style={{ width: '100%' }}
                options={ALL_TAGS.map(t => ({ label: t, value: t }))}
                maxTagCount="responsive"
              />
            </div>
          </div>
        </Card>
      )}

      {/* 知识列表 */}
      {filteredArticles.length === 0 ? (
        <Empty description="暂无知识文章" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredArticles.map(article => (
            <Card
              key={article.id}
              hoverable
              className="flex flex-col"
              onClick={() => handleViewDetail(article)}
            >
              <div className="flex-1 space-y-3">
                {/* 标题 + 标签 */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Tag color="blue">{article.category}</Tag>
                    <Tag color={SOURCE_TYPE_COLORS[article.source_type] || 'default'}>
                      {SOURCE_TYPE_LABELS[article.source_type] || article.source_type}
                    </Tag>
                  </div>
                  <h3 className="text-base font-semibold text-gray-800 line-clamp-2">
                    {article.title}
                  </h3>
                </div>

                {/* 内容摘要 */}
                <p className="text-sm text-gray-600 line-clamp-3">
                  {article.content.length > 150
                    ? article.content.slice(0, 150) + '...'
                    : article.content}
                </p>

                {/* 标签列表 */}
                <div className="flex flex-wrap gap-1">
                  {article.tags.map(tag => (
                    <Tag key={tag} className="text-xs">{tag}</Tag>
                  ))}
                </div>
              </div>

              {/* 底部信息 */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
                <div className="flex items-center gap-4">
                  <Tooltip title="浏览次数">
                    <span className="flex items-center gap-1">
                      <EyeOutlined /> {article.view_count}
                    </span>
                  </Tooltip>
                  <Tooltip title="引用次数">
                    <span className="flex items-center gap-1">
                      <UnorderedListOutlined /> {article.reference_count}
                    </span>
                  </Tooltip>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <UserOutlined /> {getCreatorName(article.created_by)}
                  </span>
                  <span className="flex items-center gap-1">
                    <ClockCircleOutlined /> {formatDate(article.updated_at)}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 知识详情 Modal */}
      <Modal
        title={selectedArticle?.title}
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        width={720}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>,
          <Button
            key="template"
            icon={<CopyOutlined />}
            onClick={handleUseAsTemplate}
          >
            引用为处置模板
          </Button>,
          ...(isAdmin ? [
            <Button
              key="edit"
              icon={<EditOutlined />}
              onClick={() => {
                if (selectedArticle) handleEdit(selectedArticle);
              }}
            >
              编辑
            </Button>,
            <Popconfirm
              key="delete"
              title="确定要删除这篇文章吗？"
              onConfirm={handleDelete}
            >
              <Button danger icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>,
          ] : []),
        ]}
      >
        {selectedArticle && (
          <div className="space-y-4">
            {/* 元信息 */}
            <div className="flex flex-wrap items-center gap-2">
              <Tag color="blue">{selectedArticle.category}</Tag>
              <Tag color={SOURCE_TYPE_COLORS[selectedArticle.source_type] || 'default'}>
                {SOURCE_TYPE_LABELS[selectedArticle.source_type] || selectedArticle.source_type}
              </Tag>
              {selectedArticle.source_ref && (
                <Tag icon={<BookOutlined />}>{selectedArticle.source_ref}</Tag>
              )}
              <span className="text-xs text-gray-500 ml-2">
                浏览 {selectedArticle.view_count} 次 | 引用 {selectedArticle.reference_count} 次
              </span>
            </div>

            {/* 标签 */}
            <div className="flex flex-wrap gap-1">
              {selectedArticle.tags.map(tag => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </div>

            {/* Markdown 内容区 */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans leading-relaxed">
                {selectedArticle.content}
              </pre>
            </div>

            {/* 关联风险列表 */}
            {selectedArticle.related_risk_ids.length > 0 && (
              <div>
                <Text strong className="text-sm">关联风险</Text>
                <div className="mt-2 space-y-2">
                  {getRelatedRisks(selectedArticle.related_risk_ids).map(risk => (
                    <div
                      key={risk.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors"
                      onClick={() => {
                        setDetailVisible(false);
                        navigate(`/risks/${risk.id}`);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-blue-600">{risk.risk_no}</span>
                        <span className="text-sm">{risk.title}</span>
                      </div>
                      <Tag className="text-xs">{risk.status}</Tag>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 创建/更新信息 */}
            <div className="text-xs text-gray-500 flex items-center gap-4 pt-2 border-t border-gray-100">
              <span>创建人：{getCreatorName(selectedArticle.created_by)}</span>
              <span>创建时间：{formatDate(selectedArticle.created_at)}</span>
              <span>更新时间：{formatDate(selectedArticle.updated_at)}</span>
            </div>
          </div>
        )}
      </Modal>

      {/* 新增/编辑知识条目 Modal */}
      <Modal
        title={editingArticle ? '编辑知识条目' : '新增知识条目'}
        open={formVisible}
        onCancel={() => setFormVisible(false)}
        onOk={handleSave}
        okText="保存"
        width={640}
        destroyOnClose
      >
        <div className="space-y-4">
          {/* 标题 */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">标题 <span className="text-red-500">*</span></label>
            <Input
              placeholder="输入文章标题"
              value={formData.title}
              onChange={e => setFormData(d => ({ ...d, title: e.target.value }))}
            />
          </div>

          {/* 分类 */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">分类</label>
            <Select
              value={formData.category}
              onChange={val => setFormData(d => ({ ...d, category: val }))}
              style={{ width: '100%' }}
              options={KB_CATEGORIES.map(c => ({ label: c, value: c }))}
            />
          </div>

          {/* 标签 */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">标签</label>
            <Select
              mode="tags"
              placeholder="输入或选择标签"
              value={formData.tags}
              onChange={vals => setFormData(d => ({ ...d, tags: vals as string[] }))}
              style={{ width: '100%' }}
              options={ALL_TAGS.map(t => ({ label: t, value: t }))}
            />
          </div>

          {/* 内容 */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">内容 <span className="text-red-500">*</span></label>
            <TextArea
              placeholder="输入文章内容（支持 Markdown 格式）"
              value={formData.content}
              onChange={e => setFormData(d => ({ ...d, content: e.target.value }))}
              rows={10}
              showCount
            />
          </div>

          {/* 来源类型 */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">来源类型</label>
            <Select
              value={formData.source_type}
              onChange={val => setFormData(d => ({ ...d, source_type: val as KnowledgeBaseArticle['source_type'] }))}
              style={{ width: '100%' }}
              options={SOURCE_TYPE_OPTIONS}
            />
          </div>

          {/* 来源引用 */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">来源引用</label>
            <Input
              placeholder="如 CVE 编号、外部链接等"
              value={formData.source_ref}
              onChange={e => setFormData(d => ({ ...d, source_ref: e.target.value }))}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
