import { useState } from 'react';
import {
  Tabs,
  Card,
  Form,
  Input,
  Select,
  Switch,
  Button,
  Table,
  Tag,
  Space,
  Modal,
  Upload,
  Slider,
  InputNumber,
  message,
  Popconfirm,
  Progress,
  Empty,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ApiOutlined,
  LinkOutlined,
  GlobalOutlined,
  UploadOutlined,
  SendOutlined,
  SettingOutlined,
  RobotOutlined,
  TranslationOutlined,
  AppstoreOutlined,
  BranchesOutlined,
} from '@ant-design/icons';
import type { CustomField } from '@/types/types';

// ==================== Mock 数据 ====================

// 审批流程
interface ApprovalWorkflow {
  id: number;
  name: string;
  trigger_event: string;
  steps: number;
  is_enabled: boolean;
  description: string;
}

const mockWorkflows: ApprovalWorkflow[] = [
  { id: 1, name: '风险接受审批', trigger_event: '风险状态变更为"已接受"', steps: 3, is_enabled: true, description: '风险责任人提交 -> 安全团队审核 -> 管理员审批' },
  { id: 2, name: '风险关闭审批', trigger_event: '风险状态变更为"已关闭"', steps: 2, is_enabled: true, description: '处置责任人提交 -> 风险责任人确认' },
  { id: 3, name: '高风险处置审批', trigger_event: '创建严重/高风险', steps: 3, is_enabled: true, description: '安全团队提交 -> 风险责任人审核 -> 管理员审批' },
  { id: 4, name: '数据导出审批', trigger_event: '导出敏感数据', steps: 2, is_enabled: false, description: '申请人提交 -> 管理员审批' },
];

// 自定义字段
const mockCustomFields: CustomField[] = [
  { id: 1, entity_type: 'risk', field_key: 'external_ref', field_label: '外部参考编号', field_type: 'text', field_options: [], is_required: false, sort_order: 1, is_active: true, created_at: '2026-01-10T08:00:00Z' },
  { id: 2, entity_type: 'risk', field_key: 'compliance_tags', field_label: '合规标签', field_type: 'multi_select', field_options: ['GDPR', 'PCI-DSS', '等保2.0', 'ISO27001'], is_required: false, sort_order: 2, is_active: true, created_at: '2026-01-15T08:00:00Z' },
  { id: 3, entity_type: 'risk', field_key: 'business_impact', field_label: '业务影响评估', field_type: 'select', field_options: ['高', '中', '低'], is_required: true, sort_order: 3, is_active: true, created_at: '2026-02-01T08:00:00Z' },
  { id: 4, entity_type: 'measure', field_key: 'cost_estimate', field_label: '处置成本估算', field_type: 'number', field_options: [], is_required: false, sort_order: 1, is_active: true, created_at: '2026-02-10T08:00:00Z' },
  { id: 5, entity_type: 'risk', field_key: 'legacy_field', field_label: '废弃字段', field_type: 'text', field_options: [], is_required: false, sort_order: 4, is_active: false, created_at: '2026-01-05T08:00:00Z' },
];

// 多语言
interface Language {
  code: string;
  name: string;
  coverage: number;
  is_enabled: boolean;
}

const mockLanguages: Language[] = [
  { code: 'zh-CN', name: '中文', coverage: 100, is_enabled: true },
  { code: 'en-US', name: '英文', coverage: 85, is_enabled: true },
  { code: 'ja-JP', name: '日文', coverage: 60, is_enabled: false },
  { code: 'ko-KR', name: '韩文', coverage: 45, is_enabled: false },
  { code: 'fr-FR', name: '法文', coverage: 30, is_enabled: false },
];

// AI 模型配置
interface AiModelConfig {
  id: number;
  provider: string;
  api_key: string;
  endpoint: string;
  model_name: string;
  temperature: number;
  is_enabled: boolean;
  usage_count: number;
  last_used?: string;
}

const mockAiModels: AiModelConfig[] = [
  { id: 1, provider: 'OpenAI', api_key: 'sk-****...****3xKm', endpoint: 'https://api.openai.com/v1', model_name: 'gpt-4o', temperature: 0.3, is_enabled: true, usage_count: 1523, last_used: '2026-06-18T08:30:00Z' },
  { id: 2, provider: 'Anthropic', api_key: 'sk-ant-****...****7bNq', endpoint: 'https://api.anthropic.com', model_name: 'claude-3.5-sonnet', temperature: 0.3, is_enabled: false, usage_count: 0 },
  { id: 3, provider: 'Ollama', api_key: '', endpoint: 'http://localhost:11434', model_name: 'llama3:8b', temperature: 0.5, is_enabled: true, usage_count: 856, last_used: '2026-06-17T16:00:00Z' },
  { id: 4, provider: '自定义', api_key: '', endpoint: 'https://internal-ai.company.com/v1', model_name: 'company-risk-v2', temperature: 0.2, is_enabled: false, usage_count: 210 },
];

// 通知渠道
interface NotificationChannelConfig {
  id: number;
  channel_type: string;
  channel_name: string;
  webhook_url: string;
  is_enabled: boolean;
  priority: number;
  last_test_at?: string;
  last_test_result?: string;
}

const mockChannels: NotificationChannelConfig[] = [
  { id: 1, channel_type: 'wechat_work', channel_name: '企业微信通知', webhook_url: 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=****', is_enabled: true, priority: 1, last_test_at: '2026-06-17T10:00:00Z', last_test_result: 'success' },
  { id: 2, channel_type: 'outlook', channel_name: 'Outlook 邮件通知', webhook_url: 'https://outlook.office365.com/webhook/****', is_enabled: true, priority: 2, last_test_at: '2026-06-16T14:00:00Z', last_test_result: 'success' },
  { id: 3, channel_type: 'teams', channel_name: 'Microsoft Teams 通知', webhook_url: 'https://teams.microsoft.com/webhook/****', is_enabled: false, priority: 3, last_test_at: '2026-06-10T09:00:00Z', last_test_result: 'failed' },
];

// ==================== 主组件 ====================
export default function Settings() {
  const [basicForm] = Form.useForm();
  const [workflowModalOpen, setWorkflowModalOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<ApprovalWorkflow | null>(null);
  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>(mockWorkflows);
  const [fieldModalOpen, setFieldModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [customFields, setCustomFields] = useState<CustomField[]>(mockCustomFields);
  const [languages, setLanguages] = useState<Language[]>(mockLanguages);
  const [aiModels, setAiModels] = useState<AiModelConfig[]>(mockAiModels);
  const [channels, setChannels] = useState<NotificationChannelConfig[]>(mockChannels);

  // ---------- 基本设置保存 ----------
  const handleSaveBasic = () => {
    basicForm.validateFields().then(() => {
      message.success('基本设置已保存');
    });
  };

  // ---------- 审批流程 ----------
  const handleSaveWorkflow = () => {
    message.success(editingWorkflow ? '流程已更新' : '流程已创建');
    setWorkflowModalOpen(false);
    setEditingWorkflow(null);
  };

  const handleToggleWorkflow = (id: number) => {
    setWorkflows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, is_enabled: !w.is_enabled } : w))
    );
  };

  const handleDeleteWorkflow = (id: number) => {
    setWorkflows((prev) => prev.filter((w) => w.id !== id));
    message.success('流程已删除');
  };

  // ---------- 自定义字段 ----------
  const handleSaveField = () => {
    message.success(editingField ? '字段已更新' : '字段已创建');
    setFieldModalOpen(false);
    setEditingField(null);
  };

  const handleToggleField = (id: number) => {
    setCustomFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, is_active: !f.is_active } : f))
    );
  };

  const handleDeleteField = (id: number) => {
    setCustomFields((prev) => prev.filter((f) => f.id !== id));
    message.success('字段已删除');
  };

  // ---------- 多语言 ----------
  const handleToggleLanguage = (code: string) => {
    setLanguages((prev) =>
      prev.map((l) => (l.code === code ? { ...l, is_enabled: !l.is_enabled } : l))
    );
  };

  // ---------- AI 模型 ----------
  const handleTestConnection = (model: AiModelConfig) => {
    message.loading({ content: `正在测试 ${model.provider} 连接...`, key: 'test-conn' });
    setTimeout(() => {
      message.success({ content: `${model.provider} 连接测试成功`, key: 'test-conn' });
    }, 1500);
  };

  const handleToggleAiModel = (id: number) => {
    setAiModels((prev) =>
      prev.map((m) => (m.id === id ? { ...m, is_enabled: !m.is_enabled } : m))
    );
  };

  // ---------- 通知渠道 ----------
  const handleTestChannel = (channel: NotificationChannelConfig) => {
    message.loading({ content: `正在测试 ${channel.channel_name}...`, key: 'test-channel' });
    setTimeout(() => {
      message.success({ content: `${channel.channel_name} 测试消息已发送`, key: 'test-channel' });
    }, 1500);
  };

  const handleToggleChannel = (id: number) => {
    setChannels((prev) =>
      prev.map((c) => (c.id === id ? { ...c, is_enabled: !c.is_enabled } : c))
    );
  };

  // ==================== Tab 1: 基本设置 ====================
  const BasicSettingsTab = () => (
    <Card className="rounded-xl shadow-sm border border-gray-100">
      <Form
        form={basicForm}
        layout="vertical"
        initialValues={{
          system_name: '安全风险管理平台',
          default_language: 'zh-CN',
          default_theme: 'light',
        }}
      >
        <Form.Item label="系统名称" name="system_name" rules={[{ required: true }]}>
          <Input placeholder="请输入系统名称" />
        </Form.Item>
        <Form.Item label="Logo 上传">
          <Upload
            maxCount={1}
            accept=".png,.jpg,.svg"
            beforeUpload={() => false}
          >
            <Button icon={<UploadOutlined />}>上传 Logo</Button>
          </Upload>
        </Form.Item>
        <Form.Item label="默认语言" name="default_language">
          <Select
            options={[
              { value: 'zh-CN', label: '中文' },
              { value: 'en-US', label: 'English' },
              { value: 'ja-JP', label: '日本語' },
            ]}
          />
        </Form.Item>
        <Form.Item label="默认主题" name="default_theme">
          <Select
            options={[
              { value: 'light', label: '浅色主题' },
              { value: 'dark', label: '深色主题' },
              { value: 'auto', label: '跟随系统' },
            ]}
          />
        </Form.Item>
        <Form.Item>
          <Button type="primary" onClick={handleSaveBasic}>
            保存设置
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );

  // ==================== Tab 2: 审批流程配置 ====================
  const ApprovalWorkflowTab = () => {
    const workflowColumns = [
      { title: '名称', dataIndex: 'name', key: 'name' },
      { title: '触发事件', dataIndex: 'trigger_event', key: 'trigger_event', ellipsis: { showTitle: true } },
      { title: '步骤数', dataIndex: 'steps', key: 'steps', width: 80, align: 'center' as const },
      {
        title: '启用状态',
        dataIndex: 'is_enabled',
        key: 'is_enabled',
        width: 100,
        align: 'center' as const,
        render: (val: boolean, record: ApprovalWorkflow) => (
          <Switch checked={val} size="small" onChange={() => handleToggleWorkflow(record.id)} />
        ),
      },
      {
        title: '操作',
        key: 'actions',
        width: 150,
        align: 'center' as const,
        render: (_: unknown, record: ApprovalWorkflow) => (
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingWorkflow(record);
                setWorkflowModalOpen(true);
              }}
            >
              编辑
            </Button>
            <Popconfirm
              title="确认删除此流程？"
              onConfirm={() => handleDeleteWorkflow(record.id)}
              okText="确认"
              cancelText="取消"
            >
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ];

    return (
      <Card className="rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-500">配置风险审批流程与触发规则</span>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingWorkflow(null);
              setWorkflowModalOpen(true);
            }}
          >
            新增流程
          </Button>
        </div>
        <Table<ApprovalWorkflow>
          columns={workflowColumns}
          dataSource={workflows}
          rowKey="id"
          pagination={false}
          size="middle"
        />
        <Modal
          title={editingWorkflow ? '编辑审批流程' : '新增审批流程'}
          open={workflowModalOpen}
          onOk={handleSaveWorkflow}
          onCancel={() => {
            setWorkflowModalOpen(false);
            setEditingWorkflow(null);
          }}
          okText="保存"
          cancelText="取消"
          destroyOnClose
        >
          <Form layout="vertical" className="mt-4" initialValues={editingWorkflow || undefined}>
            <Form.Item label="流程名称" name="name" rules={[{ required: true, message: '请输入流程名称' }]}>
              <Input placeholder="请输入流程名称" />
            </Form.Item>
            <Form.Item label="触发事件" name="trigger_event" rules={[{ required: true, message: '请输入触发事件' }]}>
              <Input placeholder="请输入触发事件描述" />
            </Form.Item>
            <Form.Item label="审批步骤数" name="steps" rules={[{ required: true }]}>
              <InputNumber min={1} max={10} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="流程说明" name="description">
              <Input.TextArea rows={3} placeholder="请输入流程说明" />
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    );
  };

  // ==================== Tab 3: 自定义字段管理 ====================
  const CustomFieldTab = () => {
    const fieldColumns = [
      { title: '标识', dataIndex: 'field_key', key: 'field_key', render: (v: string) => <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{v}</code> },
      { title: '名称', dataIndex: 'field_label', key: 'field_label' },
      { title: '类型', dataIndex: 'field_type', key: 'field_type', width: 120, render: (v: string) => <Tag>{v}</Tag> },
      { title: '必填', dataIndex: 'is_required', key: 'is_required', width: 80, align: 'center' as const, render: (v: boolean) => v ? <Tag color="red">是</Tag> : <Tag>否</Tag> },
      {
        title: '启用',
        dataIndex: 'is_active',
        key: 'is_active',
        width: 80,
        align: 'center' as const,
        render: (val: boolean, record: CustomField) => (
          <Switch checked={val} size="small" onChange={() => handleToggleField(record.id)} />
        ),
      },
      {
        title: '操作',
        key: 'actions',
        width: 150,
        align: 'center' as const,
        render: (_: unknown, record: CustomField) => (
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingField(record);
                setFieldModalOpen(true);
              }}
            >
              编辑
            </Button>
            <Popconfirm
              title="确认删除此字段？"
              onConfirm={() => handleDeleteField(record.id)}
              okText="确认"
              cancelText="取消"
            >
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ];

    return (
      <Card className="rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-500">管理风险和处置措施的自定义字段</span>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingField(null);
              setFieldModalOpen(true);
            }}
          >
            新增字段
          </Button>
        </div>
        <Table<CustomField>
          columns={fieldColumns}
          dataSource={customFields}
          rowKey="id"
          pagination={false}
          size="middle"
        />
        <Modal
          title={editingField ? '编辑自定义字段' : '新增自定义字段'}
          open={fieldModalOpen}
          onOk={handleSaveField}
          onCancel={() => {
            setFieldModalOpen(false);
            setEditingField(null);
          }}
          okText="保存"
          cancelText="取消"
          destroyOnClose
        >
          <Form layout="vertical" className="mt-4" initialValues={editingField || undefined}>
            <Form.Item label="字段标识" name="field_key" rules={[{ required: true, message: '请输入字段标识' }]}>
              <Input placeholder="英文标识，如 external_ref" />
            </Form.Item>
            <Form.Item label="字段名称" name="field_label" rules={[{ required: true, message: '请输入字段名称' }]}>
              <Input placeholder="请输入字段名称" />
            </Form.Item>
            <Form.Item label="字段类型" name="field_type" rules={[{ required: true }]}>
              <Select
                options={[
                  { value: 'text', label: '文本' },
                  { value: 'number', label: '数字' },
                  { value: 'select', label: '单选' },
                  { value: 'multi_select', label: '多选' },
                  { value: 'date', label: '日期' },
                  { value: 'textarea', label: '多行文本' },
                ]}
              />
            </Form.Item>
            <Form.Item label="是否必填" name="is_required" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    );
  };

  // ==================== Tab 4: 多语言管理 ====================
  const LanguageTab = () => (
    <Card className="rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500">管理系统支持的语言及翻译覆盖率</span>
      </div>
      <div className="space-y-4">
        {languages.map((lang) => (
          <div
            key={lang.code}
            className={`flex items-center justify-between p-4 rounded-lg border ${
              lang.is_enabled ? 'border-blue-200 bg-blue-50/50' : 'border-gray-200 bg-gray-50/50'
            }`}
          >
            <div className="flex items-center gap-4">
              <div>
                <div className="text-sm font-medium text-gray-700">{lang.name}</div>
                <div className="text-xs text-gray-400">{lang.code}</div>
              </div>
              <Progress
                percent={lang.coverage}
                size="small"
                style={{ width: 160 }}
                status={lang.coverage === 100 ? 'success' : 'active'}
              />
            </div>
            <Space>
              <Button type="link" size="small" icon={<TranslationOutlined />}>
                编辑翻译
              </Button>
              <Switch
                checked={lang.is_enabled}
                size="small"
                onChange={() => handleToggleLanguage(lang.code)}
              />
            </Space>
          </div>
        ))}
      </div>
    </Card>
  );

  // ==================== Tab 5: AI 模型配置 ====================
  const AiModelTab = () => {
    const modelColumns = [
      { title: '提供商', dataIndex: 'provider', key: 'provider', width: 120, render: (v: string) => <Tag color="blue">{v}</Tag> },
      { title: '模型名称', dataIndex: 'model_name', key: 'model_name' },
      { title: 'Endpoint', dataIndex: 'endpoint', key: 'endpoint', ellipsis: { showTitle: true } },
      { title: '温度', dataIndex: 'temperature', key: 'temperature', width: 80, align: 'center' as const, render: (v: number) => v.toFixed(1) },
      {
        title: '使用次数',
        dataIndex: 'usage_count',
        key: 'usage_count',
        width: 100,
        align: 'center' as const,
        sorter: (a: AiModelConfig, b: AiModelConfig) => a.usage_count - b.usage_count,
      },
      {
        title: '启用',
        dataIndex: 'is_enabled',
        key: 'is_enabled',
        width: 80,
        align: 'center' as const,
        render: (val: boolean, record: AiModelConfig) => (
          <Switch checked={val} size="small" onChange={() => handleToggleAiModel(record.id)} />
        ),
      },
      {
        title: '操作',
        key: 'actions',
        width: 100,
        align: 'center' as const,
        render: (_: unknown, record: AiModelConfig) => (
          <Button
            type="link"
            size="small"
            icon={<ApiOutlined />}
            onClick={() => handleTestConnection(record)}
          >
            测试连接
          </Button>
        ),
      },
    ];

    return (
      <Card className="rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-500">配置 AI 模型用于风险智能分析</span>
        </div>
        <Table<AiModelConfig>
          columns={modelColumns}
          dataSource={aiModels}
          rowKey="id"
          pagination={false}
          size="middle"
          scroll={{ x: 900 }}
        />

        {/* 配置表单 */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-700 mb-4">添加/编辑模型配置</h4>
          <Form layout="vertical" className="max-w-2xl">
            <div className="grid grid-cols-2 gap-4">
              <Form.Item label="模型提供商">
                <Select
                  placeholder="选择提供商"
                  options={[
                    { value: 'OpenAI', label: 'OpenAI' },
                    { value: 'Anthropic', label: 'Anthropic' },
                    { value: 'Ollama', label: 'Ollama (本地)' },
                    { value: '自定义', label: '自定义' },
                  ]}
                />
              </Form.Item>
              <Form.Item label="模型名称">
                <Input placeholder="如 gpt-4o, claude-3.5-sonnet" />
              </Form.Item>
              <Form.Item label="API Key" className="col-span-2">
                <Input.Password placeholder="输入 API Key" />
              </Form.Item>
              <Form.Item label="API Endpoint" className="col-span-2">
                <Input placeholder="https://api.openai.com/v1" />
              </Form.Item>
              <Form.Item label="温度 (Temperature)">
                <Slider min={0} max={1} step={0.1} defaultValue={0.3} />
              </Form.Item>
            </div>
            <Form.Item>
              <Button type="primary">保存配置</Button>
            </Form.Item>
          </Form>
        </div>
      </Card>
    );
  };

  // ==================== Tab 6: 通知渠道配置 ====================
  const NotificationChannelTab = () => {
    const channelColumns = [
      {
        title: '渠道类型',
        dataIndex: 'channel_type',
        key: 'channel_type',
        width: 120,
        render: (v: string) => {
          const iconMap: Record<string, React.ReactNode> = {
            wechat_work: <span>企业微信</span>,
            outlook: <span>Outlook</span>,
            teams: <span>Teams</span>,
          };
          return <Tag color="blue">{iconMap[v] || v}</Tag>;
        },
      },
      { title: '渠道名称', dataIndex: 'channel_name', key: 'channel_name' },
      { title: 'Webhook URL', dataIndex: 'webhook_url', key: 'webhook_url', ellipsis: { showTitle: true } },
      { title: '优先级', dataIndex: 'priority', key: 'priority', width: 80, align: 'center' as const },
      {
        title: '最近测试',
        key: 'last_test',
        width: 120,
        align: 'center' as const,
        render: (_: unknown, record: NotificationChannelConfig) => {
          if (!record.last_test_at) return <span className="text-gray-400">-</span>;
          return (
            <div>
              <Tag color={record.last_test_result === 'success' ? 'green' : 'red'}>
                {record.last_test_result === 'success' ? '成功' : '失败'}
              </Tag>
            </div>
          );
        },
      },
      {
        title: '启用',
        dataIndex: 'is_enabled',
        key: 'is_enabled',
        width: 80,
        align: 'center' as const,
        render: (val: boolean, record: NotificationChannelConfig) => (
          <Switch checked={val} size="small" onChange={() => handleToggleChannel(record.id)} />
        ),
      },
      {
        title: '操作',
        key: 'actions',
        width: 100,
        align: 'center' as const,
        render: (_: unknown, record: NotificationChannelConfig) => (
          <Button
            type="link"
            size="small"
            icon={<SendOutlined />}
            onClick={() => handleTestChannel(record)}
          >
            测试发送
          </Button>
        ),
      },
    ];

    return (
      <Card className="rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-500">配置通知推送渠道</span>
        </div>
        <Table<NotificationChannelConfig>
          columns={channelColumns}
          dataSource={channels}
          rowKey="id"
          pagination={false}
          size="middle"
          scroll={{ x: 900 }}
        />

        {/* 配置表单 */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-700 mb-4">添加/编辑通知渠道</h4>
          <Form layout="vertical" className="max-w-2xl">
            <div className="grid grid-cols-2 gap-4">
              <Form.Item label="渠道类型">
                <Select
                  placeholder="选择渠道类型"
                  options={[
                    { value: 'wechat_work', label: '企业微信' },
                    { value: 'outlook', label: 'Outlook' },
                    { value: 'teams', label: 'Microsoft Teams' },
                  ]}
                />
              </Form.Item>
              <Form.Item label="渠道名称">
                <Input placeholder="请输入渠道名称" />
              </Form.Item>
              <Form.Item label="Webhook URL" className="col-span-2">
                <Input placeholder="请输入 Webhook URL" />
              </Form.Item>
              <Form.Item label="优先级">
                <InputNumber min={1} max={10} defaultValue={1} style={{ width: '100%' }} />
              </Form.Item>
            </div>
            <Form.Item>
              <Button type="primary">保存配置</Button>
            </Form.Item>
          </Form>
        </div>
      </Card>
    );
  };

  // ==================== Tab 配置 ====================
  const tabItems = [
    {
      key: 'basic',
      label: (
        <span className="flex items-center gap-1.5">
          <SettingOutlined />
          基本设置
        </span>
      ),
      children: <BasicSettingsTab />,
    },
    {
      key: 'workflow',
      label: (
        <span className="flex items-center gap-1.5">
          <BranchesOutlined />
          审批流程配置
        </span>
      ),
      children: <ApprovalWorkflowTab />,
    },
    {
      key: 'fields',
      label: (
        <span className="flex items-center gap-1.5">
          <AppstoreOutlined />
          自定义字段管理
        </span>
      ),
      children: <CustomFieldTab />,
    },
    {
      key: 'language',
      label: (
        <span className="flex items-center gap-1.5">
          <GlobalOutlined />
          多语言管理
        </span>
      ),
      children: <LanguageTab />,
    },
    {
      key: 'ai',
      label: (
        <span className="flex items-center gap-1.5">
          <RobotOutlined />
          AI 模型配置
        </span>
      ),
      children: <AiModelTab />,
    },
    {
      key: 'notification',
      label: (
        <span className="flex items-center gap-1.5">
          <SendOutlined />
          通知渠道配置
        </span>
      ),
      children: <NotificationChannelTab />,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">系统设置</h1>
        <p className="text-gray-500 mt-1">配置系统参数、审批流程、自定义字段与集成</p>
      </div>

      {/* Tabs */}
      <Tabs items={tabItems} defaultActiveKey="basic" />
    </div>
  );
}
