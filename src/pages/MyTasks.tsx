import React, { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Card, Radio, Input, Button, Tag, Empty, Space, Badge, Tooltip, message,
} from 'antd';
import {
  SearchOutlined, PlayCircleOutlined, SendOutlined,
  CheckCircleOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/contexts/AuthContext';
import { mockRisks } from '@/mock/data';
import { TASK_STATUSES } from '@/lib/constants';
import {
  formatDate, getLevelColor, getStatusColor, getTaskStatusColor,
  getDaysRemaining,
} from '@/lib/utils';
import type { SecurityRisk, RiskMeasure, TaskStatus } from '@/types/types';

// 处置措施类型颜色
function getMeasureTypeColor(type: string): string {
  const colors: Record<string, string> = {
    '修复': 'bg-blue-100 text-blue-700',
    '缓解': 'bg-yellow-100 text-yellow-700',
    '接受': 'bg-purple-100 text-purple-700',
    '转移': 'bg-cyan-100 text-cyan-700',
  };
  return colors[type] || 'bg-gray-100 text-gray-700';
}

// 工作流状态中文映射
function getWorkflowStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    assigned: '已分配',
    in_progress: '进行中',
    pending_confirm: '待确认',
    pending_close: '待关闭',
    closed: '已关闭',
  };
  return labels[status] || status;
}

function getWorkflowStatusColor(status: string): string {
  const colors: Record<string, string> = {
    assigned: 'bg-orange-100 text-orange-700',
    in_progress: 'bg-blue-100 text-blue-700',
    pending_confirm: 'bg-purple-100 text-purple-700',
    pending_close: 'bg-cyan-100 text-cyan-700',
    closed: 'bg-gray-100 text-gray-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}

export default function MyTasks() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>('全部');
  const [searchText, setSearchText] = useState('');

  // 根据当前用户角色过滤相关风险
  const myRisks = useMemo(() => {
    if (!user) return [];

    let filtered: SecurityRisk[] = [];

    if (user.role === 'risk_owner') {
      // 风险责任人：查看 risk_owner_id = 自己的风险
      filtered = mockRisks.filter(r => r.risk_owner_id === user.id);
    } else if (user.role === 'handler') {
      // 处置责任人：查看 task_owner_id = 自己的措施任务对应的风险
      const myMeasureRiskIds = new Set<number>();
      mockRisks.forEach(risk => {
        risk.measures?.forEach(m => {
          if (m.task_owner_id === user.id) {
            myMeasureRiskIds.add(risk.id);
          }
        });
      });
      filtered = mockRisks.filter(r => myMeasureRiskIds.has(r.id));
    } else {
      // admin / security_team / executive 查看所有
      filtered = [...mockRisks];
    }

    return filtered;
  }, [user]);

  // 筛选后的风险列表
  const filteredRisks = useMemo(() => {
    let result = myRisks;

    // 状态筛选
    if (statusFilter !== '全部') {
      result = result.filter(risk => {
        if (statusFilter === '已逾期') {
          // 检查是否有已逾期的措施
          return risk.measures?.some(m => {
            if (m.task_status === '已逾期') return true;
            if (m.task_status !== '已完成' && getDaysRemaining(m.plan_end_date) < 0) return true;
            return false;
          });
        }
        // 其他状态：检查措施中是否有匹配的任务状态
        return risk.measures?.some(m => m.task_status === statusFilter);
      });
    }

    // 搜索筛选
    if (searchText.trim()) {
      const keyword = searchText.trim().toLowerCase();
      result = result.filter(risk =>
        risk.title.toLowerCase().includes(keyword) ||
        risk.risk_no.toLowerCase().includes(keyword) ||
        risk.measures?.some(m => m.description.toLowerCase().includes(keyword))
      );
    }

    return result;
  }, [myRisks, statusFilter, searchText]);

  // 判断措施是否逾期
  const isMeasureOverdue = (measure: RiskMeasure): boolean => {
    if (measure.task_status === '已完成') return false;
    return getDaysRemaining(measure.plan_end_date) < 0;
  };

  // 获取措施到期信息文本
  const getMeasureDueText = (measure: RiskMeasure): { text: string; color: string } => {
    const days = getDaysRemaining(measure.plan_end_date);
    if (measure.task_status === '已完成') {
      return { text: '已完成', color: 'text-green-600' };
    }
    if (days < 0) {
      return { text: `已逾期 ${Math.abs(days)} 天`, color: 'text-red-600 font-medium' };
    }
    if (days === 0) {
      return { text: '今天到期', color: 'text-orange-500 font-medium' };
    }
    if (days <= 7) {
      return { text: `剩余 ${days} 天`, color: 'text-orange-500' };
    }
    return { text: `剩余 ${days} 天`, color: 'text-gray-500' };
  };

  // 判断卡片是否需要红色左边框（有逾期措施）
  const isRiskOverdue = (risk: SecurityRisk): boolean => {
    return risk.measures?.some(m => isMeasureOverdue(m)) || false;
  };

  // 获取快捷操作按钮
  const getActionButtons = (measure: RiskMeasure, risk: SecurityRisk) => {
    const buttons = [];

    if (measure.task_status === '未开始') {
      buttons.push(
        <Button
          key="start"
          type="primary"
          size="small"
          icon={<PlayCircleOutlined />}
          onClick={() => message.info(`开始任务（Mock）：${measure.description.slice(0, 20)}...`)}
        >
          开始任务
        </Button>
      );
    }

    if (measure.task_status === '进行中') {
      buttons.push(
        <Button
          key="submit"
          type="primary"
          size="small"
          icon={<SendOutlined />}
          onClick={() => message.info(`提交结果（Mock）：${measure.description.slice(0, 20)}...`)}
        >
          提交结果
        </Button>
      );
    }

    if (measure.task_status === '已完成' && measure.verify_result === '待验证') {
      buttons.push(
        <Button
          key="confirm"
          size="small"
          icon={<CheckCircleOutlined />}
          onClick={() => message.info(`确认处置（Mock）：${measure.description.slice(0, 20)}...`)}
        >
          确认处置
        </Button>
      );
    }

    return buttons;
  };

  // 统计各状态数量
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      '全部': myRisks.length,
      '未开始': 0,
      '进行中': 0,
      '已完成': 0,
      '已逾期': 0,
    };

    myRisks.forEach(risk => {
      const seen = new Set<string>();
      risk.measures?.forEach(m => {
        if (isMeasureOverdue(m) && !seen.has('overdue_' + risk.id)) {
          counts['已逾期']++;
          seen.add('overdue_' + risk.id);
        }
        if (m.task_status !== '已完成' && !isMeasureOverdue(m)) {
          if (!seen.has(m.task_status + '_' + risk.id)) {
            counts[m.task_status] = (counts[m.task_status] || 0) + 1;
            seen.add(m.task_status + '_' + risk.id);
          }
        }
      });
    });

    return counts;
  }, [myRisks]);

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">我的任务</h1>
          <p className="text-gray-500 mt-1">查看和管理分配给我的风险处置任务</p>
        </div>
      </div>

      {/* 筛选栏 */}
      <Card size="small">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* 状态筛选 */}
          <Radio.Group
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            optionType="button"
            buttonStyle="solid"
          >
            {['全部', ...TASK_STATUSES].map(status => (
              <Radio.Button key={status} value={status}>
                {status}
                <Badge
                  count={statusCounts[status] || 0}
                  size="small"
                  style={{ marginLeft: 4 }}
                  showZero
                />
              </Radio.Button>
            ))}
          </Radio.Group>

          {/* 搜索框 */}
          <Input
            placeholder="搜索风险标题、编号或措施描述"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            allowClear
            className="sm:w-72"
          />
        </div>
      </Card>

      {/* 任务列表 */}
      {filteredRisks.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredRisks.map(risk => (
            <Card
              key={risk.id}
              className={`shadow-sm rounded-lg hover:shadow-md transition-shadow ${
                isRiskOverdue(risk) ? 'border-l-4 border-l-red-500' : ''
              }`}
              bodyStyle={{ padding: '16px' }}
            >
              {/* 卡片头部：编号 + 标题 + 标签 */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="font-mono text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded cursor-pointer hover:bg-blue-100"
                      onClick={() => navigate(`/risks/${risk.id}`)}
                    >
                      {risk.risk_no}
                    </span>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getLevelColor(risk.level)}`}>
                      {risk.level}
                    </span>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getWorkflowStatusColor(risk.workflow_status)}`}>
                      {getWorkflowStatusLabel(risk.workflow_status)}
                    </span>
                  </div>
                  <h3
                    className="text-sm font-semibold text-gray-800 truncate cursor-pointer hover:text-blue-600"
                    onClick={() => navigate(`/risks/${risk.id}`)}
                    title={risk.title}
                  >
                    {risk.title}
                  </h3>
                </div>
              </div>

              {/* 处置措施列表 */}
              {risk.measures && risk.measures.length > 0 && (
                <div className="space-y-3 mt-3 pt-3 border-t border-gray-100">
                  {risk.measures.map(measure => {
                    const dueInfo = getMeasureDueText(measure);
                    return (
                      <div
                        key={measure.id}
                        className="p-3 bg-gray-50 rounded-lg"
                      >
                        {/* 措施描述 */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium shrink-0 ${getMeasureTypeColor(measure.measure_type)}`}>
                              {measure.measure_type}
                            </span>
                            <span className="text-sm text-gray-700 truncate" title={measure.description}>
                              {measure.description}
                            </span>
                          </div>
                        </div>

                        {/* 措施详情行 */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                          {/* 任务状态 */}
                          <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${getTaskStatusColor(measure.task_status)}`}>
                            {measure.task_status}
                          </span>

                          {/* 计划完成日期 */}
                          <span className="flex items-center gap-1">
                            <ClockCircleOutlined />
                            {formatDate(measure.plan_end_date)}
                          </span>

                          {/* 到期倒计时 */}
                          <span className={dueInfo.color}>
                            {dueInfo.text}
                          </span>

                          {/* 任务责任人 */}
                          <span>
                            责任人：{measure.task_owner?.name || '-'}
                          </span>
                        </div>

                        {/* 快捷操作 */}
                        {getActionButtons(measure, risk).length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <Space size="small">
                              {getActionButtons(measure, risk)}
                            </Space>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <Empty
            description="暂无待处理任务"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" onClick={() => navigate('/risks')}>
              查看风险列表
            </Button>
          </Empty>
        </Card>
      )}
    </div>
  );
}
