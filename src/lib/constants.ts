export const RISK_SOURCES = ['内部来源', '外部来源'] as const;
export const RISK_CATEGORIES = [
  '漏洞利用', '配置缺陷', '身份与访问', '数据安全',
  '恶意软件与攻击', '供应链风险', '合规与法规', '物理安全', '其他'
] as const;
export const RISK_LEVELS = ['严重', '高危', '中危', '低危'] as const;
export const RISK_STATUSES = ['待处置', '处置中', '已修复', '已接受', '已转移', '已关闭'] as const;
export const MEASURE_TYPES = ['修复', '缓解', '接受', '转移'] as const;
export const TASK_STATUSES = ['未开始', '进行中', '已完成', '已逾期'] as const;
export const USER_ROLES = ['admin', 'security_team', 'risk_owner', 'handler', 'executive'] as const;

export const ROLE_LABELS: Record<string, string> = {
  admin: '系统管理员',
  security_team: '安全团队',
  risk_owner: '风险责任人',
  handler: '处置责任人',
  executive: '公司高管',
};

export const KB_CATEGORIES = [
  '漏洞修复', '配置加固', '应急响应', '合规要求', '最佳实践', '工具使用'
] as const;

export const NOTIFICATION_TYPES = [
  '到期提醒', '超期警示', '审批通知', '系统通知', '风险状态变更'
] as const;
