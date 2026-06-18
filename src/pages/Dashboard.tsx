import { useMemo } from 'react';
import { Table, Tag, Tooltip } from 'antd';
import ReactECharts from 'echarts-for-react';
import {
  ShieldAlert,
  Clock,
  Loader2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { mockRisks, mockMeasures } from '@/mock/data';
import { formatDate, getLevelColor, getStatusColor } from '@/lib/utils';
import type { SecurityRisk } from '@/types/types';

// ==================== 统计卡片 ====================
interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  trend?: number;
}

function StatCard({ title, value, icon, color, bgColor, trend }: StatCardProps) {
  return (
    <div className="rounded-xl bg-white shadow-sm border border-gray-100 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-lg ${bgColor} flex items-center justify-center shrink-0`}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-gray-500 truncate">{title}</div>
        <div className="text-3xl font-bold mt-1" style={{ color }}>
          {value}
        </div>
        {trend !== undefined && (
          <div className="flex items-center gap-1 mt-1 text-xs">
            {trend > 0 ? (
              <TrendingUp className="w-3 h-3 text-red-500" />
            ) : trend < 0 ? (
              <TrendingDown className="w-3 h-3 text-green-500" />
            ) : null}
            <span className={trend > 0 ? 'text-red-500' : trend < 0 ? 'text-green-500' : 'text-gray-400'}>
              {trend > 0 ? `较昨日 +${trend}` : trend < 0 ? `较昨日 ${trend}` : '与昨日持平'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== 图表卡片容器 ====================
interface ChartCardProps {
  title: string;
  children: React.ReactNode;
}

function ChartCard({ title, children }: ChartCardProps) {
  return (
    <div className="rounded-xl bg-white shadow-sm border border-gray-100 p-5">
      <h3 className="text-base font-semibold text-gray-700 mb-3">{title}</h3>
      {children}
    </div>
  );
}

// ==================== 主组件 ====================
export default function Dashboard() {
  const today = new Date();

  // ---------- 统计数据 ----------
  const stats = useMemo(() => {
    const risks = mockRisks;
    const total = risks.length;

    const pending = risks.filter(
      (r) => r.status === '待处置' && r.workflow_status !== 'closed'
    ).length;

    const inProgress = risks.filter(
      (r) => r.status === '处置中' && r.workflow_status !== 'closed'
    ).length;

    const overdue = risks.filter((r) => {
      if (r.workflow_status === 'closed') return false;
      const planEnd = new Date(r.plan_end_date);
      return planEnd < today && r.status !== '已修复' && r.status !== '已接受';
    }).length;

    return { total, pending, inProgress, overdue };
  }, []);

  // ---------- 风险等级分布（饼图）----------
  const levelPieOption = useMemo(() => {
    const levelCount: Record<string, number> = { '严重': 0, '高危': 0, '中危': 0, '低危': 0 };
    mockRisks.forEach((r) => {
      if (levelCount[r.level] !== undefined) {
        levelCount[r.level]++;
      }
    });

    return {
      tooltip: {
        trigger: 'item' as const,
        formatter: '{b}: {c} ({d}%)',
      },
      legend: {
        bottom: 0,
        itemWidth: 12,
        itemHeight: 12,
        textStyle: { fontSize: 12, color: '#6b7280' },
      },
      color: ['#dc2626', '#f97316', '#eab308', '#22c55e'],
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: true,
          itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
          label: { show: true, formatter: '{b}\n{d}%', fontSize: 12 },
          data: [
            { value: levelCount['严重'], name: '严重' },
            { value: levelCount['高危'], name: '高危' },
            { value: levelCount['中危'], name: '中危' },
            { value: levelCount['低危'], name: '低危' },
          ],
        },
      ],
    };
  }, []);

  // ---------- 风险趋势（折线图，按月统计新增风险）----------
  const trendLineOption = useMemo(() => {
    const monthCount: Record<string, number> = {};
    mockRisks.forEach((r) => {
      const d = new Date(r.discovery_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthCount[key] = (monthCount[key] || 0) + 1;
    });

    const sortedMonths = Object.keys(monthCount).sort();
    const monthLabels = sortedMonths.map((m) => {
      const [y, mo] = m.split('-');
      return `${y}年${parseInt(mo)}月`;
    });

    return {
      tooltip: {
        trigger: 'axis' as const,
        formatter: '{b}<br/>新增风险: {c} 个',
      },
      grid: { left: 40, right: 20, top: 20, bottom: 30 },
      xAxis: {
        type: 'category' as const,
        data: monthLabels,
        axisLabel: { fontSize: 11, color: '#6b7280' },
        axisLine: { lineStyle: { color: '#e5e7eb' } },
      },
      yAxis: {
        type: 'value' as const,
        minInterval: 1,
        axisLabel: { fontSize: 11, color: '#6b7280' },
        splitLine: { lineStyle: { color: '#f3f4f6', type: 'dashed' as const } },
      },
      series: [
        {
          type: 'line',
          data: sortedMonths.map((m) => monthCount[m]),
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: { width: 3, color: '#3b82f6' },
          itemStyle: { color: '#3b82f6' },
          areaStyle: {
            color: {
              type: 'linear' as const,
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(59,130,246,0.25)' },
                { offset: 1, color: 'rgba(59,130,246,0.02)' },
              ],
            },
          },
        },
      ],
    };
  }, []);

  // ---------- 风险类别分布（柱状图）----------
  const categoryBarOption = useMemo(() => {
    const catCount: Record<string, number> = {};
    mockRisks.forEach((r) => {
      catCount[r.category] = (catCount[r.category] || 0) + 1;
    });

    const sorted = Object.entries(catCount).sort((a, b) => b[1] - a[1]);

    return {
      tooltip: {
        trigger: 'axis' as const,
        formatter: '{b}<br/>数量: {c} 个',
      },
      grid: { left: 80, right: 20, top: 10, bottom: 30 },
      xAxis: {
        type: 'value' as const,
        minInterval: 1,
        axisLabel: { fontSize: 11, color: '#6b7280' },
        splitLine: { lineStyle: { color: '#f3f4f6', type: 'dashed' as const } },
      },
      yAxis: {
        type: 'category' as const,
        data: sorted.map(([k]) => k),
        axisLabel: { fontSize: 12, color: '#374151' },
        axisLine: { lineStyle: { color: '#e5e7eb' } },
      },
      series: [
        {
          type: 'bar',
          data: sorted.map(([, v]) => v),
          barWidth: 20,
          itemStyle: {
            borderRadius: [0, 4, 4, 0],
            color: {
              type: 'linear' as const,
              x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [
                { offset: 0, color: '#3b82f6' },
                { offset: 1, color: '#60a5fa' },
              ],
            },
          },
        },
      ],
    };
  }, []);

  // ---------- 处置进度（柱状图，按状态统计措施完成情况）----------
  const progressBarOption = useMemo(() => {
    const statusCount: Record<string, { total: number; completed: number }> = {};
    const statusOrder = ['待处置', '处置中', '已修复', '已接受'];

    mockRisks.forEach((r) => {
      if (!statusCount[r.status]) {
        statusCount[r.status] = { total: 0, completed: 0 };
      }
      statusCount[r.status].total++;
      const measures = mockMeasures.filter((m) => m.risk_id === r.id);
      if (measures.length > 0 && measures.every((m) => m.task_status === '已完成')) {
        statusCount[r.status].completed++;
      }
    });

    const categories = statusOrder.filter((s) => statusCount[s]);
    const totalData = categories.map((s) => statusCount[s].total);
    const completedData = categories.map((s) => statusCount[s].completed);

    return {
      tooltip: {
        trigger: 'axis' as const,
        axisPointer: { type: 'shadow' as const },
      },
      legend: {
        top: 0,
        itemWidth: 12,
        itemHeight: 12,
        textStyle: { fontSize: 12, color: '#6b7280' },
      },
      grid: { left: 60, right: 20, top: 40, bottom: 30 },
      xAxis: {
        type: 'category' as const,
        data: categories,
        axisLabel: { fontSize: 12, color: '#374151' },
        axisLine: { lineStyle: { color: '#e5e7eb' } },
      },
      yAxis: {
        type: 'value' as const,
        minInterval: 1,
        axisLabel: { fontSize: 11, color: '#6b7280' },
        splitLine: { lineStyle: { color: '#f3f4f6', type: 'dashed' as const } },
      },
      series: [
        {
          name: '涉及风险数',
          type: 'bar',
          data: totalData,
          barWidth: 24,
          itemStyle: {
            borderRadius: [4, 4, 4, 4],
            color: '#93c5fd',
          },
        },
        {
          name: '措施已完成',
          type: 'bar',
          data: completedData,
          barWidth: 24,
          itemStyle: {
            borderRadius: [4, 4, 4, 4],
            color: '#3b82f6',
          },
        },
      ],
    };
  }, []);

  // ---------- TOP10 高风险表格 ----------
  const top10Risks = useMemo(() => {
    return [...mockRisks]
      .sort((a, b) => b.total_score - a.total_score)
      .slice(0, 10);
  }, []);

  const tableColumns = useMemo(
    () => [
      {
        title: '排名',
        dataIndex: 'rank',
        key: 'rank',
        width: 60,
        align: 'center' as const,
        render: (_: number, __: SecurityRisk, index: number) => {
          const colors = ['text-red-500', 'text-orange-500', 'text-yellow-500'];
          return (
            <span className={`font-bold text-sm ${colors[index] || 'text-gray-500'}`}>
              {index + 1}
            </span>
          );
        },
      },
      {
        title: '风险编号',
        dataIndex: 'risk_no',
        key: 'risk_no',
        width: 130,
        render: (text: string) => (
          <span className="font-mono text-sm text-blue-600">{text}</span>
        ),
      },
      {
        title: '标题',
        dataIndex: 'title',
        key: 'title',
        ellipsis: { showTitle: true },
        render: (text: string) => (
          <Tooltip title={text}>
            <span className="text-sm">{text}</span>
          </Tooltip>
        ),
      },
      {
        title: '等级',
        dataIndex: 'level',
        key: 'level',
        width: 80,
        align: 'center' as const,
        render: (level: string) => (
          <Tag className={`${getLevelColor(level)} border-0 px-2 py-0.5 rounded-md text-xs`}>
            {level}
          </Tag>
        ),
      },
      {
        title: '综合分值',
        dataIndex: 'total_score',
        key: 'total_score',
        width: 100,
        align: 'center' as const,
        sorter: (a: SecurityRisk, b: SecurityRisk) => a.total_score - b.total_score,
        defaultSortOrder: 'descend' as const,
        render: (score: number) => {
          const color =
            score >= 70 ? 'text-red-600' : score >= 50 ? 'text-orange-600' : score >= 30 ? 'text-yellow-600' : 'text-green-600';
          return <span className={`font-bold ${color}`}>{score}</span>;
        },
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 90,
        align: 'center' as const,
        render: (status: string) => (
          <Tag className={`${getStatusColor(status)} border-0 px-2 py-0.5 rounded-md text-xs`}>
            {status}
          </Tag>
        ),
      },
      {
        title: '责任人',
        key: 'handler',
        width: 90,
        align: 'center' as const,
        render: (_: unknown, record: SecurityRisk) => record.handler?.name || '-',
      },
      {
        title: '计划完成日期',
        dataIndex: 'plan_end_date',
        key: 'plan_end_date',
        width: 130,
        align: 'center' as const,
        render: (date: string, record: SecurityRisk) => {
          const isOverdue = new Date(date) < today && record.status !== '已修复' && record.status !== '已接受';
          return (
            <span className={`text-sm ${isOverdue ? 'text-red-500 font-semibold' : 'text-gray-600'}`}>
              {formatDate(date)}
            </span>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // ---------- 渲染 ----------
  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">工作台</h1>
        <p className="text-gray-500 mt-1">安全风险概览与数据看板</p>
      </div>

      {/* 顶部统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="风险总数"
          value={stats.total}
          icon={<ShieldAlert className="w-6 h-6" />}
          color="#3b82f6"
          bgColor="bg-blue-50"
          trend={undefined}
        />
        <StatCard
          title="待处置"
          value={stats.pending}
          icon={<Clock className="w-6 h-6" />}
          color="#f97316"
          bgColor="bg-orange-50"
          trend={undefined}
        />
        <StatCard
          title="处置中"
          value={stats.inProgress}
          icon={<Loader2 className="w-6 h-6" />}
          color="#eab308"
          bgColor="bg-yellow-50"
          trend={undefined}
        />
        <StatCard
          title="已逾期"
          value={stats.overdue}
          icon={<AlertTriangle className="w-6 h-6" />}
          color="#ef4444"
          bgColor="bg-red-50"
          trend={undefined}
        />
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="风险等级分布">
          <ReactECharts option={levelPieOption} style={{ height: 300 }} />
        </ChartCard>

        <ChartCard title="风险趋势（按月统计新增风险）">
          <ReactECharts option={trendLineOption} style={{ height: 300 }} />
        </ChartCard>

        <ChartCard title="风险类别分布">
          <ReactECharts option={categoryBarOption} style={{ height: 300 }} />
        </ChartCard>

        <ChartCard title="处置进度">
          <ReactECharts option={progressBarOption} style={{ height: 300 }} />
        </ChartCard>
      </div>

      {/* TOP10 高风险表格 */}
      <div className="rounded-xl bg-white shadow-sm border border-gray-100 p-5">
        <h3 className="text-base font-semibold text-gray-700 mb-3">TOP10 高风险</h3>
        <Table<SecurityRisk>
          columns={tableColumns}
          dataSource={top10Risks}
          rowKey="id"
          pagination={false}
          size="middle"
          scroll={{ x: 900 }}
          className="dashboard-table"
        />
      </div>
    </div>
  );
}
