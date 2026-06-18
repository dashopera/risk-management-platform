import React, { useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Card, Breadcrumb, Button, Space, Tag, Tooltip, Steps, Descriptions,
  Divider, Empty, message, Badge,
} from 'antd';
import {
  EditOutlined, DeleteOutlined, ExportOutlined, HistoryOutlined,
  HomeOutlined, SafetyCertificateOutlined, DownloadOutlined,
  UploadOutlined, EyeOutlined, FileOutlined, RobotOutlined,
  StarFilled, StarOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/contexts/AuthContext';
import { mockRisks, mockAiAnalysis } from '@/mock/data';
import type { SecurityRisk, RiskMeasure } from '@/types/types';
import {
  formatDate, formatFileSize, getLevelColor, getStatusColor,
  getTaskStatusColor, getDaysRemaining,
} from '@/lib/utils';

// ========== 风险矩阵组件 ==========
function RiskMatrix({ impact, likelihood }: { impact: number; likelihood: number }) {
  // 5x5 矩阵：行=影响程度(5在上), 列=发生概率(5在右)
  const getColor = (i: number, l: number) => {
    const score = i * l;
    if (score >= 20) return 'bg-red-500';
    if (score >= 12) return 'bg-orange-400';
    if (score >= 6) return 'bg-yellow-400';
    return 'bg-green-400';
  };

  return (
    <div className="inline-block">
      <div className="flex items-end gap-1">
        {/* Y 轴标签 */}
        <div className="flex flex-col-reverse gap-1 pr-2 pb-6">
          {[1, 2, 3, 4, 5].map(v => (
            <div key={v} className="h-10 flex items-center text-xs text-gray-500 font-medium">
              {v}
            </div>
          ))}
        </div>
        <div>
          {/* 矩阵网格 */}
          <div className="grid grid-cols-5 gap-1">
            {Array.from({ length: 25 }, (_, idx) => {
              const row = 4 - Math.floor(idx / 5); // 影响程度 5->0
              const col = idx % 5; // 发生概率 0->4
              const impactVal = row + 1;
              const likelihoodVal = col + 1;
              const isCurrent = impactVal === impact && likelihoodVal === likelihood;

              return (
                <div
                  key={idx}
                  className={`w-10 h-10 rounded flex items-center justify-center text-xs font-medium text-white
                    ${getColor(impactVal, likelihoodVal)}
                    ${isCurrent ? 'ring-2 ring-offset-1 ring-blue-600 relative' : ''}
                  `}
                >
                  {isCurrent && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-4 h-4 bg-white rounded-full shadow-lg border-2 border-blue-600" />
                    </div>
                  )}
                  {!isCurrent && <span className="text-white/80">{impactVal * likelihoodVal}</span>}
                </div>
              );
            })}
          </div>
          {/* X 轴标签 */}
          <div className="grid grid-cols-5 gap-1 mt-1">
            {[1, 2, 3, 4, 5].map(v => (
              <div key={v} className="h-4 flex items-center justify-center text-xs text-gray-500 font-medium">
                {v}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-400">
        <span>发生概率 --&gt;</span>
        <span>--&gt; 影响程度</span>
      </div>
    </div>
  );
}

// ========== 星级评分组件 ==========
function StarRating({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <StarFilled
          key={i}
          className={`text-sm ${i < value ? 'text-yellow-400' : 'text-gray-300'}`}
        />
      ))}
    </span>
  );
}

// ========== 处置措施类型颜色 ==========
function getMeasureTypeColor(type: string): string {
  const colors: Record<string, string> = {
    '修复': 'bg-blue-100 text-blue-700',
    '缓解': 'bg-yellow-100 text-yellow-700',
    '接受': 'bg-purple-100 text-purple-700',
    '转移': 'bg-cyan-100 text-cyan-700',
  };
  return colors[type] || 'bg-gray-100 text-gray-700';
}

// ========== 验证结果颜色 ==========
function getVerifyResultColor(result: string): string {
  const colors: Record<string, string> = {
    '待验证': 'bg-gray-100 text-gray-700',
    '验证通过': 'bg-green-100 text-green-700',
    '验证失败': 'bg-red-100 text-red-700',
  };
  return colors[result] || 'bg-gray-100 text-gray-700';
}

export default function RiskDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // 根据 ID 查找风险
  const risk = useMemo(() => {
    const numId = Number(id);
    return mockRisks.find(r => r.id === numId);
  }, [id]);

  // 查找关联的 AI 分析记录
  const aiRecords = useMemo(() => {
    if (!risk) return [];
    return mockAiAnalysis.filter(a => a.risk_id === risk.id);
  }, [risk]);

  // 审批步骤（Mock 数据）
  const approvalSteps = useMemo(() => {
    if (!risk) return [];
    const steps = [
      { title: '提交处置', description: '安全团队提交', status: 'finish' as const },
      { title: '风险责任人审批', description: risk.risk_owner?.name || '-', status: 'finish' as const },
      { title: '处置执行', description: risk.handler?.name || '-', status: risk.status === '已修复' || risk.status === '已接受' || risk.status === '已关闭' ? ('finish' as const) : ('process' as const) },
      { title: '验证确认', description: '安全团队验证', status: risk.actual_end_date ? ('finish' as const) : ('wait' as const) },
      { title: '关闭风险', description: '最终关闭', status: risk.status === '已关闭' ? ('finish' as const) : ('wait' as const) },
    ];
    return steps;
  }, [risk]);

  if (!risk) {
    return (
      <div className="p-6">
        <Empty description="未找到该风险记录">
          <Button type="primary" onClick={() => navigate('/risks')}>
            返回风险列表
          </Button>
        </Empty>
      </div>
    );
  }

  const isOverdue = !risk.actual_end_date && getDaysRemaining(risk.plan_end_date) < 0 && risk.status !== '已关闭';
  const canEdit = user?.role === 'admin' || user?.role === 'security_team';

  return (
    <div className="p-6 space-y-6">
      {/* 面包屑导航 */}
      <Breadcrumb
        items={[
          { title: <Link to="/"><HomeOutlined /> 首页</Link> },
          { title: <Link to="/risks">风险管理</Link> },
          { title: `${risk.risk_no}` },
        ]}
      />

      {/* 顶部区域：编号 + 标题 + 标签 + 操作 */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono text-sm text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              {risk.risk_no}
            </span>
            <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-medium ${getLevelColor(risk.level)}`}>
              {risk.level}
            </span>
            <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-medium ${getStatusColor(risk.status)}`}>
              {risk.status}
            </span>
            {isOverdue && (
              <Badge count="超期" style={{ backgroundColor: '#ef4444' }} />
            )}
          </div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-800">{risk.title}</h1>
        </div>
        <Space wrap>
          {canEdit && (
            <Button icon={<EditOutlined />} onClick={() => navigate(`/risks/${risk.id}/edit`)}>
              编辑
            </Button>
          )}
          {canEdit && (
            <Button danger icon={<DeleteOutlined />} onClick={() => message.info('删除功能（Mock）')}>
              删除
            </Button>
          )}
          <Button icon={<ExportOutlined />} onClick={() => message.info('导出功能（Mock）')}>
            导出
          </Button>
          <Button icon={<HistoryOutlined />} onClick={() => message.info('版本历史（Mock）')}>
            版本历史
          </Button>
        </Space>
      </div>

      {/* 基础信息区 */}
      <Card title="基础信息" size="small">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
          {/* 风险编号 */}
          <div className="flex">
            <span className="text-gray-500 text-sm w-28 shrink-0">风险编号</span>
            <span className="font-mono text-sm text-blue-600">{risk.risk_no}</span>
          </div>
          {/* 标题 */}
          <div className="flex md:col-span-2">
            <span className="text-gray-500 text-sm w-28 shrink-0">标题</span>
            <span className="text-sm font-medium">{risk.title}</span>
          </div>
          {/* 描述 */}
          <div className="flex md:col-span-2 lg:col-span-3">
            <span className="text-gray-500 text-sm w-28 shrink-0">描述</span>
            <span className="text-sm text-gray-700">{risk.description}</span>
          </div>
          {/* 来源 */}
          <div className="flex">
            <span className="text-gray-500 text-sm w-28 shrink-0">来源</span>
            <span className="text-sm">{risk.source}</span>
          </div>
          {/* 类别 */}
          <div className="flex">
            <span className="text-gray-500 text-sm w-28 shrink-0">类别</span>
            <span className="text-sm">{risk.category}</span>
          </div>
          {/* 等级 */}
          <div className="flex">
            <span className="text-gray-500 text-sm w-28 shrink-0">等级</span>
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getLevelColor(risk.level)}`}>
              {risk.level}
            </span>
          </div>
          {/* CVE/CNVD 编号 */}
          <div className="flex">
            <span className="text-gray-500 text-sm w-28 shrink-0">CVE/CNVD</span>
            <span className="text-sm font-mono">{risk.cve_id || '-'}</span>
          </div>
          {/* CVSS 评分 */}
          <div className="flex">
            <span className="text-gray-500 text-sm w-28 shrink-0">CVSS 评分</span>
            <span className="text-sm font-bold">{risk.cvss_score?.toFixed(1) || '-'}</span>
          </div>
          {/* 影响程度 */}
          <div className="flex">
            <span className="text-gray-500 text-sm w-28 shrink-0">影响程度</span>
            <StarRating value={risk.impact_score} />
            <span className="text-sm ml-2 font-medium">{risk.impact_score}/5</span>
          </div>
          {/* 发生概率 */}
          <div className="flex">
            <span className="text-gray-500 text-sm w-28 shrink-0">发生概率</span>
            <StarRating value={risk.likelihood_score} />
            <span className="text-sm ml-2 font-medium">{risk.likelihood_score}/5</span>
          </div>
          {/* 综合分值 */}
          <div className="flex">
            <span className="text-gray-500 text-sm w-28 shrink-0">综合分值</span>
            <span className={`text-lg font-bold ${risk.total_score >= 70 ? 'text-red-600' : risk.total_score >= 40 ? 'text-orange-500' : risk.total_score >= 20 ? 'text-yellow-500' : 'text-green-600'}`}>
              {risk.total_score}
            </span>
          </div>
          {/* 受影响资产 */}
          <div className="flex md:col-span-2">
            <span className="text-gray-500 text-sm w-28 shrink-0">受影响资产</span>
            <div className="flex flex-wrap gap-1">
              {risk.affected_assets.map((asset, idx) => (
                <Tag key={idx} color="default">{asset}</Tag>
              ))}
            </div>
          </div>
          {/* 风险责任人 */}
          <div className="flex">
            <span className="text-gray-500 text-sm w-28 shrink-0">风险责任人</span>
            <span className="text-sm">{risk.risk_owner?.name || '-'}</span>
          </div>
          {/* 处置负责人 */}
          <div className="flex">
            <span className="text-gray-500 text-sm w-28 shrink-0">处置负责人</span>
            <span className="text-sm">{risk.handler?.name || '-'}</span>
          </div>
          {/* 发现日期 */}
          <div className="flex">
            <span className="text-gray-500 text-sm w-28 shrink-0">发现日期</span>
            <span className="text-sm">{formatDate(risk.discovery_date)}</span>
          </div>
          {/* 计划完成日期 */}
          <div className="flex">
            <span className="text-gray-500 text-sm w-28 shrink-0">计划完成</span>
            <span className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
              {formatDate(risk.plan_end_date)}
              {isOverdue && <span className="ml-1">(超期)</span>}
            </span>
          </div>
          {/* 实际完成日期 */}
          <div className="flex">
            <span className="text-gray-500 text-sm w-28 shrink-0">实际完成</span>
            <span className="text-sm">{risk.actual_end_date ? formatDate(risk.actual_end_date) : '-'}</span>
          </div>
        </div>
      </Card>

      {/* 风险矩阵 */}
      <Card title="风险矩阵" size="small">
        <div className="flex flex-col sm:flex-row items-center gap-8">
          <RiskMatrix impact={risk.impact_score} likelihood={risk.likelihood_score} />
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">当前风险位置：</span>
              <span className="font-medium">影响程度 {risk.impact_score} x 发生概率 {risk.likelihood_score}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">综合分值：</span>
              <span className="font-bold text-lg">{risk.total_score}</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-green-400 inline-block" /> 低风险
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-yellow-400 inline-block" /> 中风险
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-orange-400 inline-block" /> 高风险
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-red-500 inline-block" /> 极高风险
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* 处置措施区 */}
      <Card
        title={`处置措施 (${risk.measures?.length || 0})`}
        size="small"
      >
        {risk.measures && risk.measures.length > 0 ? (
          <div className="space-y-4">
            {risk.measures.map((measure: RiskMeasure) => (
              <Card
                key={measure.id}
                type="inner"
                size="small"
                className="border-l-4"
                style={{ borderLeftColor: measure.measure_type === '修复' ? '#3b82f6' : measure.measure_type === '缓解' ? '#eab308' : measure.measure_type === '接受' ? '#a855f7' : '#06b6d4' }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                  {/* 措施类型 */}
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-sm">类型：</span>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getMeasureTypeColor(measure.measure_type)}`}>
                      {measure.measure_type}
                    </span>
                  </div>
                  {/* 任务责任人 */}
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-sm">责任人：</span>
                    <span className="text-sm">{measure.task_owner?.name || '-'}</span>
                  </div>
                  {/* 任务状态 */}
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-sm">状态：</span>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getTaskStatusColor(measure.task_status)}`}>
                      {measure.task_status}
                    </span>
                  </div>
                  {/* 计划完成日期 */}
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-sm">计划完成：</span>
                    <span className="text-sm">{formatDate(measure.plan_end_date)}</span>
                  </div>
                  {/* 实际完成日期 */}
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-sm">实际完成：</span>
                    <span className="text-sm">{measure.actual_end_date ? formatDate(measure.actual_end_date) : '-'}</span>
                  </div>
                  {/* 验证结果 */}
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-sm">验证结果：</span>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getVerifyResultColor(measure.verify_result)}`}>
                      {measure.verify_result}
                    </span>
                  </div>
                </div>
                {/* 描述 */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <span className="text-gray-500 text-sm">措施描述：</span>
                  <p className="text-sm text-gray-700 mt-1">{measure.description}</p>
                </div>
                {/* 处置结果 */}
                {measure.result_description && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <span className="text-gray-500 text-sm">处置结果：</span>
                    <p className="text-sm text-gray-700 mt-1">{measure.result_description}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Empty description="暂无处置措施" />
        )}
      </Card>

      {/* 附件区 */}
      <Card
        title={
          <span className="flex items-center gap-2">
            <FileOutlined /> 附件 ({risk.attachments?.length || 0})
          </span>
        }
        size="small"
        extra={
          canEdit && (
            <Button type="link" size="small" icon={<UploadOutlined />} onClick={() => message.info('上传功能（Mock）')}>
              上传附件
            </Button>
          )
        }
      >
        {risk.attachments && risk.attachments.length > 0 ? (
          <div className="space-y-2">
            {risk.attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileOutlined className="text-blue-500 text-lg" />
                  <div>
                    <div className="text-sm font-medium">{att.name}</div>
                    <div className="text-xs text-gray-400">
                      {formatFileSize(att.size)} | {formatDate(att.uploaded_at)}
                    </div>
                  </div>
                </div>
                <Space size="small">
                  <Tooltip title="预览">
                    <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => message.info('预览功能（Mock）')} />
                  </Tooltip>
                  <Tooltip title="下载">
                    <Button type="link" size="small" icon={<DownloadOutlined />} onClick={() => message.info('下载功能（Mock）')} />
                  </Tooltip>
                  {canEdit && (
                    <Tooltip title="删除">
                      <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => message.info('删除功能（Mock）')} />
                    </Tooltip>
                  )}
                </Space>
              </div>
            ))}
          </div>
        ) : (
          <Empty description="暂无附件" />
        )}
      </Card>

      {/* 审批状态区 */}
      <Card
        title={
          <span className="flex items-center gap-2">
            <SafetyCertificateOutlined /> 审批状态
          </span>
        }
        size="small"
      >
        <div className="mb-4">
          <Badge
            status={risk.status === '已关闭' ? 'success' : risk.status === '处置中' ? 'processing' : risk.status === '待处置' ? 'warning' : 'default'}
            text={
              <span className="text-sm font-medium">
                {risk.status === '已关闭' ? '审批已完成' : risk.status === '处置中' ? '审批进行中' : risk.status === '待处置' ? '待审批' : '审批中'}
              </span>
            }
          />
        </div>
        <Steps
          direction="vertical"
          size="small"
          current={approvalSteps.findIndex(s => s.status === 'process')}
          items={approvalSteps.map(step => ({
            title: step.title,
            description: step.description,
            status: step.status,
          }))}
        />
      </Card>

      {/* AI 分析记录区 */}
      <Card
        title={
          <span className="flex items-center gap-2">
            <RobotOutlined /> AI 分析记录
          </span>
        }
        size="small"
      >
        {aiRecords.length > 0 ? (
          <div className="space-y-4">
            {aiRecords.map(record => (
              <Card key={record.id} type="inner" size="small" className="bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-sm">模型：</span>
                    <span className="text-sm font-mono">{record.model_provider}/{record.model_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-sm">置信度：</span>
                    <span className="text-sm font-medium">{(record.confidence_score * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-sm">建议等级：</span>
                    {record.suggested_level && (
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getLevelColor(record.suggested_level)}`}>
                        {record.suggested_level}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-sm">是否采纳：</span>
                    <Tag color={record.is_applied ? 'green' : 'default'}>
                      {record.is_applied ? '已采纳' : '未采纳'}
                    </Tag>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-sm">分析时间：</span>
                    <span className="text-sm">{formatDate(record.created_at, 'YYYY-MM-DD HH:mm')}</span>
                  </div>
                </div>
                {/* 建议措施 */}
                {record.suggested_measures.length > 0 && (
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <span className="text-gray-500 text-sm">建议措施：</span>
                    <ul className="mt-1 space-y-1">
                      {record.suggested_measures.map((m, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${getMeasureTypeColor(m.type)} shrink-0`}>
                            {m.type}
                          </span>
                          <span className="text-gray-700">{m.description}</span>
                          <Tag color="orange" className="text-xs">{m.priority}</Tag>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Empty description="暂无 AI 分析记录" />
        )}
      </Card>

      {/* 底部：版本历史入口 */}
      <div className="flex justify-center pt-2 pb-4">
        <Button
          type="link"
          icon={<HistoryOutlined />}
          onClick={() => message.info('版本历史页面（Mock）')}
        >
          查看完整版本历史
        </Button>
      </div>
    </div>
  );
}
