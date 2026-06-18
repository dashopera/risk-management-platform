import React, { useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Card, Form, Input, Select, Radio, InputNumber, DatePicker, Button,
  Space, Breadcrumb, Upload, message, Divider, Empty,
} from 'antd';
import {
  HomeOutlined, PlusOutlined, MinusCircleOutlined, InboxOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { mockRisks, mockUsers } from '@/mock/data';
import { RISK_SOURCES, RISK_CATEGORIES, RISK_LEVELS, MEASURE_TYPES } from '@/lib/constants';
import { generateRiskNo } from '@/lib/utils';
import type { RiskLevel, MeasureType } from '@/types/types';

const { TextArea } = Input;
const { Dragger } = Upload;

export default function RiskForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const isEdit = Boolean(id && id !== 'new');
  const pageTitle = isEdit ? '编辑风险' : '新增风险';

  // 编辑模式：加载现有风险数据
  const existingRisk = useMemo(() => {
    if (!isEdit) return undefined;
    const numId = Number(id);
    return mockRisks.find(r => r.id === numId);
  }, [id, isEdit]);

  useEffect(() => {
    if (isEdit && existingRisk) {
      form.setFieldsValue({
        title: existingRisk.title,
        description: existingRisk.description,
        source: existingRisk.source,
        category: existingRisk.category,
        level: existingRisk.level,
        cve_id: existingRisk.cve_id || '',
        cvss_score: existingRisk.cvss_score,
        impact_score: existingRisk.impact_score,
        likelihood_score: existingRisk.likelihood_score,
        affected_assets: existingRisk.affected_assets,
        risk_owner_id: existingRisk.risk_owner_id,
        handler_id: existingRisk.handler_id || undefined,
        discovery_date: dayjs(existingRisk.discovery_date),
        plan_end_date: dayjs(existingRisk.plan_end_date),
        measures: existingRisk.measures?.map(m => ({
          measure_type: m.measure_type,
          description: m.description,
          task_owner_id: m.task_owner_id,
          plan_end_date: dayjs(m.plan_end_date),
        })) || [],
      });
    }
  }, [isEdit, existingRisk, form]);

  // 综合分值自动计算
  const impactScore = Form.useWatch('impact_score', form);
  const likelihoodScore = Form.useWatch('likelihood_score', form);
  const totalScore = (impactScore || 0) * (likelihoodScore || 0);

  // 用户选项列表
  const userOptions = useMemo(() => {
    return mockUsers
      .filter(u => !u.is_disabled)
      .map(u => ({ label: `${u.name} (${u.email})`, value: u.id }));
  }, []);

  // 提交处理
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (isEdit) {
        // 编辑模式：Mock 提示
        message.success('风险信息更新成功');
        navigate(`/risks/${id}`);
      } else {
        // 新增模式：生成风险编号
        const discoveryDate = values.discovery_date?.format('YYYY-MM-DDTHH:mm:ssZ') || new Date().toISOString();
        const yearRisks = mockRisks.filter(r => r.discovery_date.startsWith(String(dayjs().year())));
        const riskNo = generateRiskNo(discoveryDate, yearRisks.length);
        message.success(`风险创建成功，编号：${riskNo}`);
        navigate(`/risks/1`); // Mock 跳转到第一条风险详情
      }
    } catch (err) {
      // 表单校验失败，Ant Design 会自动显示错误信息
    }
  };

  // 取消
  const handleCancel = () => {
    if (isEdit) {
      navigate(`/risks/${id}`);
    } else {
      navigate('/risks');
    }
  };

  // 上传配置
  const uploadProps = {
    multiple: true,
    beforeUpload: () => false, // 阻止自动上传
    onChange: () => message.info('文件上传功能（Mock）'),
  };

  return (
    <div className="p-6 space-y-6">
      {/* 面包屑导航 */}
      <Breadcrumb
        items={[
          { title: <Link to="/"><HomeOutlined /> 首页</Link> },
          { title: <Link to="/risks">风险管理</Link> },
          { title: pageTitle },
        ]}
      />

      {/* 页面标题 */}
      <h1 className="text-2xl font-bold text-gray-800">{pageTitle}</h1>

      <Form
        form={form}
        layout="vertical"
        requiredMark="optional"
        scrollToFirstError
        initialValues={{
          measures: [
            {
              measure_type: '修复' as MeasureType,
              description: '',
              task_owner_id: undefined,
              plan_end_date: undefined,
            },
          ],
        }}
      >
        {/* ========== 基础信息 ========== */}
        <Card title="基础信息" className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            {/* 风险标题 */}
            <Form.Item
              label="风险标题"
              name="title"
              rules={[
                { required: true, message: '请输入风险标题' },
                { max: 200, message: '风险标题不能超过200个字符' },
              ]}
              className="md:col-span-2"
            >
              <Input placeholder="请输入风险标题" />
            </Form.Item>

            {/* 风险描述 */}
            <Form.Item
              label="风险描述"
              name="description"
              rules={[
                { max: 2000, message: '风险描述不能超过2000个字符' },
              ]}
              className="md:col-span-2"
            >
              <TextArea rows={4} placeholder="请输入风险描述" showCount maxLength={2000} />
            </Form.Item>

            {/* 风险来源 */}
            <Form.Item
              label="风险来源"
              name="source"
              rules={[{ required: true, message: '请选择风险来源' }]}
            >
              <Select placeholder="请选择风险来源">
                {RISK_SOURCES.map(s => (
                  <Select.Option key={s} value={s}>{s}</Select.Option>
                ))}
              </Select>
            </Form.Item>

            {/* 风险类别 */}
            <Form.Item
              label="风险类别"
              name="category"
              rules={[{ required: true, message: '请选择风险类别' }]}
            >
              <Select placeholder="请选择风险类别">
                {RISK_CATEGORIES.map(c => (
                  <Select.Option key={c} value={c}>{c}</Select.Option>
                ))}
              </Select>
            </Form.Item>

            {/* 风险等级 */}
            <Form.Item
              label="风险等级"
              name="level"
              rules={[{ required: true, message: '请选择风险等级' }]}
            >
              <Radio.Group>
                {RISK_LEVELS.map(level => (
                  <Radio.Button
                    key={level}
                    value={level}
                    className={
                      level === '严重' ? '[&.ant-radio-button-wrapper-checked]:bg-red-600 [&.ant-radio-button-wrapper-checked]:border-red-600 [&.ant-radio-button-wrapper-checked]:text-white' :
                      level === '高危' ? '[&.ant-radio-button-wrapper-checked]:bg-orange-500 [&.ant-radio-button-wrapper-checked]:border-orange-500 [&.ant-radio-button-wrapper-checked]:text-white' :
                      level === '中危' ? '[&.ant-radio-button-wrapper-checked]:bg-yellow-500 [&.ant-radio-button-wrapper-checked]:border-yellow-500 [&.ant-radio-button-wrapper-checked]:text-white' :
                      '[&.ant-radio-button-wrapper-checked]:bg-green-500 [&.ant-radio-button-wrapper-checked]:border-green-500 [&.ant-radio-button-wrapper-checked]:text-white'
                    }
                  >
                    {level}
                  </Radio.Button>
                ))}
              </Radio.Group>
            </Form.Item>

            {/* CVE/CNVD编号 */}
            <Form.Item label="CVE/CNVD编号" name="cve_id">
              <Input placeholder="例如：CVE-2021-44228" />
            </Form.Item>

            {/* CVSS评分 */}
            <Form.Item label="CVSS评分" name="cvss_score">
              <InputNumber
                min={0}
                max={10}
                step={0.1}
                precision={1}
                placeholder="0.0 - 10.0"
                className="w-full"
              />
            </Form.Item>

            {/* 影响程度 */}
            <Form.Item
              label="影响程度"
              name="impact_score"
              rules={[{ required: true, message: '请输入影响程度' }]}
              tooltip="评分范围 1-5，5 表示影响最大"
            >
              <InputNumber min={1} max={5} placeholder="1-5" className="w-full" />
            </Form.Item>

            {/* 发生概率 */}
            <Form.Item
              label="发生概率"
              name="likelihood_score"
              rules={[{ required: true, message: '请输入发生概率' }]}
              tooltip="评分范围 1-5，5 表示概率最高"
            >
              <InputNumber min={1} max={5} placeholder="1-5" className="w-full" />
            </Form.Item>

            {/* 综合分值（只读） */}
            <Form.Item label="综合分值">
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-bold ${
                  totalScore >= 70 ? 'text-red-600' :
                  totalScore >= 40 ? 'text-orange-500' :
                  totalScore >= 20 ? 'text-yellow-500' :
                  'text-green-600'
                }`}>
                  {totalScore}
                </span>
                <span className="text-sm text-gray-400">= 影响程度({impactScore || 0}) x 发生概率({likelihoodScore || 0})</span>
              </div>
            </Form.Item>

            {/* 受影响资产 */}
            <Form.Item
              label="受影响资产"
              name="affected_assets"
              className="md:col-span-2"
            >
              <Select
                mode="tags"
                placeholder="输入资产名称后按回车添加"
                tokenSeparators={[',']}
              />
            </Form.Item>

            {/* 风险责任人 */}
            <Form.Item
              label="风险责任人"
              name="risk_owner_id"
              rules={[{ required: true, message: '请选择风险责任人' }]}
            >
              <Select
                showSearch
                placeholder="请选择风险责任人"
                optionFilterProp="label"
                options={userOptions}
              />
            </Form.Item>

            {/* 处置负责人 */}
            <Form.Item label="处置负责人" name="handler_id">
              <Select
                showSearch
                allowClear
                placeholder="请选择处置负责人"
                optionFilterProp="label"
                options={userOptions}
              />
            </Form.Item>

            {/* 发现日期 */}
            <Form.Item
              label="发现日期"
              name="discovery_date"
              rules={[{ required: true, message: '请选择发现日期' }]}
            >
              <DatePicker className="w-full" />
            </Form.Item>

            {/* 计划完成日期 */}
            <Form.Item
              label="计划完成日期"
              name="plan_end_date"
              rules={[
                { required: true, message: '请选择计划完成日期' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const discoveryDate = getFieldValue('discovery_date');
                    if (!value || !discoveryDate) return Promise.resolve();
                    if (value.isBefore(discoveryDate, 'day')) {
                      return Promise.reject(new Error('计划完成日期不能早于发现日期'));
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
            >
              <DatePicker className="w-full" />
            </Form.Item>
          </div>
        </Card>

        {/* ========== 处置措施 ========== */}
        <Card title="处置措施" className="mb-6">
          <Form.List name="measures">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }, index) => (
                  <div key={key} className="mb-6 last:mb-0">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-600">
                        措施 {index + 1}
                      </span>
                      {fields.length > 1 && (
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<MinusCircleOutlined />}
                          onClick={() => remove(name)}
                        >
                          删除
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 p-4 bg-gray-50 rounded-lg">
                      {/* 处置方式 */}
                      <Form.Item
                        {...restField}
                        label="处置方式"
                        name={[name, 'measure_type']}
                        rules={[{ required: true, message: '请选择处置方式' }]}
                      >
                        <Select placeholder="请选择处置方式">
                          {MEASURE_TYPES.map(t => (
                            <Select.Option key={t} value={t}>{t}</Select.Option>
                          ))}
                        </Select>
                      </Form.Item>

                      {/* 任务责任人 */}
                      <Form.Item
                        {...restField}
                        label="任务责任人"
                        name={[name, 'task_owner_id']}
                        rules={[{ required: true, message: '请选择任务责任人' }]}
                      >
                        <Select
                          showSearch
                          placeholder="请选择任务责任人"
                          optionFilterProp="label"
                          options={userOptions}
                        />
                      </Form.Item>

                      {/* 措施描述 */}
                      <Form.Item
                        {...restField}
                        label="措施描述"
                        name={[name, 'description']}
                        className="md:col-span-2"
                        rules={[{ required: true, message: '请输入措施描述' }]}
                      >
                        <TextArea rows={3} placeholder="请输入处置措施描述" />
                      </Form.Item>

                      {/* 计划完成日期 */}
                      <Form.Item
                        {...restField}
                        label="计划完成日期"
                        name={[name, 'plan_end_date']}
                        rules={[{ required: true, message: '请选择计划完成日期' }]}
                      >
                        <DatePicker className="w-full" />
                      </Form.Item>
                    </div>
                  </div>
                ))}
                <Divider />
                <Button
                  type="dashed"
                  onClick={() => add({
                    measure_type: '修复' as MeasureType,
                    description: '',
                    task_owner_id: undefined,
                    plan_end_date: undefined,
                  })}
                  block
                  icon={<PlusOutlined />}
                >
                  添加处置措施
                </Button>
              </>
            )}
          </Form.List>
        </Card>

        {/* ========== 附件上传 ========== */}
        <Card title="附件上传" className="mb-6">
          <Dragger {...uploadProps}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
            <p className="ant-upload-hint">
              支持单个或批量上传，支持常见文件格式
            </p>
          </Dragger>
        </Card>

        {/* ========== 底部按钮 ========== */}
        <div className="flex justify-end gap-3 pt-2 pb-6">
          <Button onClick={handleCancel}>
            取消
          </Button>
          <Button type="primary" onClick={handleSubmit}>
            {isEdit ? '保存修改' : '提交'}
          </Button>
        </div>
      </Form>
    </div>
  );
}
