import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button, Steps, Upload, Table, Card, Tag, message, Alert,
  Result, Space, Typography, Progress,
} from 'antd';
import type { UploadProps, TableColumnType } from 'antd';
import {
  InboxOutlined, DownloadOutlined, CheckCircleOutlined,
  CloseCircleOutlined, ArrowLeftOutlined, FileExcelOutlined,
} from '@ant-design/icons';
import { mockRisks } from '@/mock/data';
import type { SecurityRisk } from '@/types/types';
import { getLevelColor } from '@/lib/utils';
import { RISK_LEVELS, RISK_STATUSES, RISK_CATEGORIES, RISK_SOURCES } from '@/lib/constants';

const { Dragger } = Upload;
const { Title, Text } = Typography;

interface ParsedRow {
  row: number;
  title: string;
  risk_no: string;
  level: string;
  status: string;
  category: string;
  total_score: number;
  risk_owner: string;
  discovery_date: string;
  plan_end_date: string;
  description: string;
  cve_id: string;
  cvss_score: string;
  errors: string[];
}

// 模拟 CSV 模板内容
const CSV_TEMPLATE = `风险编号,标题,描述,等级,状态,类别,综合分值,责任人,发现日期,计划完成日期,CVE编号,CVSS评分
SEC-2026-100,示例风险标题,示例风险描述,高危,待处置,漏洞利用,72,张安全,2026-06-01,2026-07-01,CVE-2024-XXXX,8.5`;

export default function RiskImport() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [fileList, setFileList] = useState<any[]>([]);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: number;
    failed: number;
    failedRows: { row: number; errors: string[] }[];
  } | null>(null);

  // 校验规则
  const validateRow = useCallback((row: ParsedRow): string[] => {
    const errors: string[] = [];
    if (!row.title.trim()) errors.push('标题不能为空');
    if (!row.risk_no.trim()) errors.push('风险编号不能为空');
    if (!RISK_LEVELS.includes(row.level as any)) errors.push(`等级"${row.level}"无效，应为：${RISK_LEVELS.join('/')}`);
    if (!RISK_STATUSES.includes(row.status as any)) errors.push(`状态"${row.status}"无效，应为：${RISK_STATUSES.join('/')}`);
    if (!RISK_CATEGORIES.includes(row.category as any)) errors.push(`类别"${row.category}"无效`);
    if (row.total_score < 0 || row.total_score > 100) errors.push('综合分值应在 0-100 之间');
    if (!row.discovery_date.trim()) errors.push('发现日期不能为空');
    if (row.discovery_date && isNaN(Date.parse(row.discovery_date))) errors.push('发现日期格式无效');
    if (row.plan_end_date && isNaN(Date.parse(row.plan_end_date))) errors.push('计划完成日期格式无效');
    if (row.cvss_score && (isNaN(Number(row.cvss_score)) || Number(row.cvss_score) < 0 || Number(row.cvss_score) > 10)) {
      errors.push('CVSS评分应在 0-10 之间');
    }
    return errors;
  }, []);

  // 模拟解析上传文件
  const simulateParse = useCallback(() => {
    // 从 mockRisks 中取前 15 条数据作为模拟解析结果
    const mockParsed: ParsedRow[] = mockRisks.slice(0, 15).map((risk, index) => {
      const row: ParsedRow = {
        row: index + 2, // CSV 从第 2 行开始（第 1 行是表头）
        title: risk.title,
        risk_no: risk.risk_no,
        level: risk.level,
        status: risk.status,
        category: risk.category,
        total_score: risk.total_score,
        risk_owner: risk.risk_owner?.name || '',
        discovery_date: risk.discovery_date.split('T')[0],
        plan_end_date: risk.plan_end_date.split('T')[0],
        description: risk.description,
        cve_id: risk.cve_id || '',
        cvss_score: risk.cvss_score?.toString() || '',
        errors: [],
      };
      row.errors = validateRow(row);
      return row;
    });

    // 故意让第 3、7、11 行产生校验错误，模拟真实场景
    if (mockParsed[2]) {
      mockParsed[2].level = '极高';
      mockParsed[2].status = '未知';
      mockParsed[2].errors = validateRow(mockParsed[2]);
    }
    if (mockParsed[6]) {
      mockParsed[6].title = '';
      mockParsed[6].total_score = 150;
      mockParsed[6].errors = validateRow(mockParsed[6]);
    }
    if (mockParsed[10]) {
      mockParsed[10].discovery_date = 'invalid-date';
      mockParsed[10].category = '未知类别';
      mockParsed[10].errors = validateRow(mockParsed[10]);
    }

    return mockParsed;
  }, [validateRow]);

  // 上传前校验
  const beforeUpload: UploadProps['beforeUpload'] = useCallback((file) => {
    const isCSV = file.type === 'text/csv' || file.name.endsWith('.csv');
    const isExcel =
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'application/vnd.ms-excel' ||
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls');

    if (!isCSV && !isExcel) {
      message.error('仅支持 CSV 和 Excel 文件');
      return Upload.LIST_IGNORE;
    }

    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error('文件大小不能超过 10MB');
      return Upload.LIST_IGNORE;
    }

    return false; // 阻止自动上传，手动处理
  }, []);

  // 文件选择变化
  const handleFileChange: UploadProps['onChange'] = useCallback((info) => {
    setFileList(info.fileList.slice(-1)); // 只保留最新一个文件
  }, []);

  // 解析文件（模拟）
  const handleParse = useCallback(() => {
    if (fileList.length === 0) {
      message.warning('请先上传文件');
      return;
    }
    message.loading({ content: '正在解析文件...', key: 'parse', duration: 1 });
    setTimeout(() => {
      const data = simulateParse();
      setParsedData(data);
      setCurrentStep(1);
      message.success({ content: `解析完成，共 ${data.length} 条数据`, key: 'parse' });
    }, 800);
  }, [fileList, simulateParse]);

  // 确认导入（模拟）
  const handleConfirmImport = useCallback(() => {
    setImporting(true);
    message.loading({ content: '正在导入数据...', key: 'import', duration: 0 });

    setTimeout(() => {
      const validRows = parsedData.filter(r => r.errors.length === 0);
      const failedRows = parsedData.filter(r => r.errors.length > 0);

      setImportResult({
        success: validRows.length,
        failed: failedRows.length,
        failedRows: failedRows.map(r => ({ row: r.row, errors: r.errors })),
      });
      setCurrentStep(3);
      setImporting(false);
      message.success({ content: `导入完成！成功 ${validRows.length} 条，失败 ${failedRows.length} 条`, key: 'import' });
    }, 1500);
  }, [parsedData]);

  // 下载 CSV 模板
  const handleDownloadTemplate = useCallback(() => {
    const blob = new Blob(['\uFEFF' + CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '风险导入模板.csv';
    link.click();
    URL.revokeObjectURL(url);
    message.success('模板已下载');
  }, []);

  // 重置
  const handleReset = useCallback(() => {
    setCurrentStep(0);
    setFileList([]);
    setParsedData([]);
    setImportResult(null);
  }, []);

  // 统计
  const passCount = useMemo(() => parsedData.filter(r => r.errors.length === 0).length, [parsedData]);
  const failCount = useMemo(() => parsedData.filter(r => r.errors.length > 0).length, [parsedData]);

  // 预览表格列
  const previewColumns: TableColumnType<ParsedRow>[] = [
    { title: '行号', dataIndex: 'row', key: 'row', width: 70 },
    {
      title: '风险编号', dataIndex: 'risk_no', key: 'risk_no', width: 140,
      render: (text: string) => <span className="font-mono text-sm text-blue-600">{text}</span>,
    },
    {
      title: '标题', dataIndex: 'title', key: 'title', ellipsis: true,
      render: (text: string) => <span className="font-medium">{text || '(空)'}</span>,
    },
    {
      title: '等级', dataIndex: 'level', key: 'level', width: 80,
      render: (level: string) => (
        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getLevelColor(level)}`}>
          {level}
        </span>
      ),
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 90,
    },
    {
      title: '类别', dataIndex: 'category', key: 'category', width: 100,
    },
    {
      title: '综合分值', dataIndex: 'total_score', key: 'total_score', width: 90,
    },
    {
      title: '责任人', dataIndex: 'risk_owner', key: 'risk_owner', width: 100,
    },
    {
      title: '发现日期', dataIndex: 'discovery_date', key: 'discovery_date', width: 110,
    },
    {
      title: '校验结果', key: 'validation', width: 200,
      render: (_: unknown, record: ParsedRow) =>
        record.errors.length > 0 ? (
          <div className="space-y-1">
            {record.errors.map((err, i) => (
              <Tag key={i} color="error" className="text-xs">{err}</Tag>
            ))}
          </div>
        ) : (
          <Tag color="success" icon={<CheckCircleOutlined />}>通过</Tag>
        ),
    },
  ];

  // 失败行表格列
  const failedColumns: TableColumnType<{ row: number; errors: string[] }>[] = [
    { title: '行号', dataIndex: 'row', key: 'row', width: 100 },
    {
      title: '错误原因', dataIndex: 'errors', key: 'errors',
      render: (errors: string[]) => (
        <div className="space-y-1">
          {errors.map((err, i) => (
            <Tag key={i} color="error">{err}</Tag>
          ))}
        </div>
      ),
    },
  ];

  const steps = [
    { title: '上传文件', icon: <InboxOutlined /> },
    { title: '预览数据', icon: <FileExcelOutlined /> },
    { title: '确认导入', icon: <CheckCircleOutlined /> },
    { title: '导入结果', icon: importResult?.failed === 0 ? <CheckCircleOutlined /> : <CloseCircleOutlined /> },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center gap-3">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/risks')} />
        <div>
          <Title level={4} className="!mb-0">批量导入</Title>
          <Text type="secondary">通过 CSV 或 Excel 模板批量导入风险数据</Text>
        </div>
      </div>

      {/* 步骤条 */}
      <Card>
        <Steps current={currentStep} items={steps} className="mb-8" />

        {/* Step 0: 上传文件 */}
        {currentStep === 0 && (
          <div className="max-w-2xl mx-auto space-y-6">
            <Dragger
              fileList={fileList}
              beforeUpload={beforeUpload}
              onChange={handleFileChange}
              accept=".csv,.xlsx,.xls"
              maxCount={1}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ fontSize: 48, color: '#1890ff' }} />
              </p>
              <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
              <p className="ant-upload-hint">
                支持 CSV、Excel（.xlsx/.xls）格式，文件大小不超过 10MB
              </p>
            </Dragger>

            <div className="flex justify-center">
              <Button
                icon={<DownloadOutlined />}
                onClick={handleDownloadTemplate}
              >
                下载 CSV 模板
              </Button>
            </div>

            <div className="flex justify-center">
              <Button
                type="primary"
                size="large"
                disabled={fileList.length === 0}
                onClick={handleParse}
              >
                开始解析
              </Button>
            </div>
          </div>
        )}

        {/* Step 1: 预览数据 */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <Alert
              message="数据预览"
              description={
                <div className="flex items-center gap-6">
                  <span>共 <Text strong>{parsedData.length}</Text> 条数据</span>
                  <span className="text-green-600">
                    <CheckCircleOutlined /> 通过 {passCount} 条
                  </span>
                  <span className="text-red-600">
                    <CloseCircleOutlined /> 失败 {failCount} 条
                  </span>
                </div>
              }
              type={failCount > 0 ? 'warning' : 'success'}
              showIcon
            />

            <Table<ParsedRow>
              columns={previewColumns}
              dataSource={parsedData.slice(0, 10)}
              rowKey="row"
              pagination={false}
              size="small"
              scroll={{ x: 1200 }}
              rowClassName={(record) =>
                record.errors.length > 0 ? 'bg-red-50' : ''
              }
              footer={() =>
                parsedData.length > 10 && (
                  <Text type="secondary">仅显示前 10 条预览，共 {parsedData.length} 条数据</Text>
                )
              }
            />

            {failCount > 0 && (
              <Alert
                message={`${failCount} 条数据校验失败，失败行将不会被导入。请检查数据后重新上传，或直接跳过失败行继续导入。`}
                type="error"
                showIcon
              />
            )}

            <div className="flex justify-end gap-3">
              <Button onClick={() => setCurrentStep(0)}>上一步</Button>
              <Button type="primary" onClick={() => setCurrentStep(2)}>
                下一步
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: 确认导入 */}
        {currentStep === 2 && (
          <div className="max-w-lg mx-auto space-y-6">
            <Card title="导入摘要" className="border-blue-200">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Text>总行数</Text>
                  <Text strong>{parsedData.length} 条</Text>
                </div>
                <div className="flex justify-between items-center">
                  <Text className="text-green-600">通过校验</Text>
                  <Text strong className="text-green-600">{passCount} 条</Text>
                </div>
                <div className="flex justify-between items-center">
                  <Text className="text-red-600">校验失败</Text>
                  <Text strong className="text-red-600">{failCount} 条</Text>
                </div>
                <Progress
                  percent={Math.round((passCount / parsedData.length) * 100)}
                  status={failCount === 0 ? 'success' : 'normal'}
                  strokeColor={failCount === 0 ? '#52c41a' : '#faad14'}
                />
              </div>
            </Card>

            {failCount > 0 && (
              <Alert
                message="注意：校验失败的行将被跳过，仅导入通过校验的数据。"
                type="warning"
                showIcon
              />
            )}

            <div className="flex justify-center gap-3">
              <Button onClick={() => setCurrentStep(1)}>上一步</Button>
              <Button
                type="primary"
                size="large"
                loading={importing}
                onClick={handleConfirmImport}
                disabled={passCount === 0}
              >
                确认导入
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: 导入结果 */}
        {currentStep === 3 && importResult && (
          <div className="max-w-2xl mx-auto space-y-6">
            <Result
              status={importResult.failed === 0 ? 'success' : importResult.success > 0 ? 'warning' : 'error'}
              title={importResult.failed === 0 ? '导入成功' : '导入完成'}
              subTitle={`成功导入 ${importResult.success} 条风险数据${importResult.failed > 0 ? `，${importResult.failed} 条导入失败` : ''}`}
              extra={[
                <Button type="primary" key="list" onClick={() => navigate('/risks')}>
                  查看风险列表
                </Button>,
                <Button key="again" onClick={handleReset}>
                  继续导入
                </Button>,
              ]}
            />

            {importResult.failed > 0 && (
              <Card title={`失败明细（${importResult.failed} 条）`} size="small">
                <Table<{ row: number; errors: string[] }>
                  columns={failedColumns}
                  dataSource={importResult.failedRows}
                  rowKey="row"
                  pagination={false}
                  size="small"
                  rowClassName={() => 'bg-red-50'}
                />
              </Card>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
