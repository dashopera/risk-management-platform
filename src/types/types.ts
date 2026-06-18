export type UserRole = 'admin' | 'security_team' | 'risk_owner' | 'handler' | 'executive';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  auth_id?: string;
  is_disabled: boolean;
  force_password_change: boolean;
  login_fail_count: number;
  locked_until?: string;
  created_at: string;
}

export type RiskLevel = '严重' | '高危' | '中危' | '低危';
export type RiskStatus = '待处置' | '处置中' | '已修复' | '已接受' | '已转移' | '已关闭';
export type WorkflowStatus = 'assigned' | 'in_progress' | 'pending_confirm' | 'pending_close' | 'closed';
export type TaskStatus = '未开始' | '进行中' | '已完成' | '已逾期';
export type MeasureType = '修复' | '缓解' | '接受' | '转移';
export type VerifyResult = '待验证' | '验证通过' | '验证失败';

export interface SecurityRisk {
  id: number;
  risk_no: string;
  title: string;
  description: string;
  source: string;
  category: string;
  level: RiskLevel;
  affected_assets: string[];
  cvss_score?: number;
  cve_id?: string;
  impact_score: number;
  likelihood_score: number;
  total_score: number;
  status: RiskStatus;
  workflow_status: WorkflowStatus;
  risk_owner_id: number;
  handler_id?: number;
  discovery_date: string;
  plan_end_date: string;
  actual_end_date?: string;
  attachments: Attachment[];
  created_at: string;
  updated_at: string;
  // 关联数据（非数据库字段）
  risk_owner?: User;
  handler?: User;
  measures?: RiskMeasure[];
}

export interface RiskMeasure {
  id: number;
  risk_id: number;
  measure_type: MeasureType;
  description: string;
  task_owner_id: number;
  task_status: TaskStatus;
  plan_end_date: string;
  actual_end_date?: string;
  verify_result: VerifyResult;
  verify_by?: number;
  result_description?: string;
  result_attachments: Attachment[];
  created_at: string;
  updated_at: string;
  // 关联数据
  task_owner?: User;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploaded_at: string;
}

export interface AuditLog {
  id: number;
  action_type: string;
  operator_id: number;
  operator_name: string;
  target_id?: number;
  target_title?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  created_at: string;
}

export interface Notification {
  id: number;
  type: string;
  title: string;
  content: string;
  risk_id?: number;
  measure_id?: number;
  recipient_id: number;
  is_read: boolean;
  created_at: string;
}

export interface KnowledgeBaseArticle {
  id: number;
  title: string;
  content: string;
  category: string;
  tags: string[];
  source_type: 'manual' | 'auto_extract' | 'external_cve' | 'ai_generated';
  source_ref?: string;
  related_risk_ids: number[];
  view_count: number;
  reference_count: number;
  is_published: boolean;
  created_by: number;
  updated_by?: number;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AiAnalysisRecord {
  id: number;
  risk_id?: number;
  input_text: string;
  analysis_result: Record<string, unknown>;
  suggested_level?: RiskLevel;
  suggested_measures: Array<{ type: MeasureType; description: string; priority: string }>;
  suggested_category?: string;
  suggested_source?: string;
  suggested_impact_score?: number;
  suggested_likelihood_score?: number;
  confidence_score: number;
  model_provider: string;
  model_name: string;
  is_applied: boolean;
  created_by: number;
  created_at: string;
}

export interface NotificationChannel {
  id: number;
  channel_type: 'wechat_work' | 'outlook' | 'teams';
  channel_name: string;
  config: Record<string, unknown>;
  is_enabled: boolean;
  priority: number;
  last_test_at?: string;
  last_test_result?: string;
  created_at: string;
}

export interface ApprovalInstance {
  id: number;
  workflow_id: number;
  risk_id: number;
  measure_id?: number;
  current_step: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  submitter_id: number;
  submitter_comment?: string;
  created_at: string;
  completed_at?: string;
}

export interface RiskVersion {
  id: number;
  risk_id: number;
  version_no: number;
  version_tag?: string;
  snapshot: Record<string, unknown>;
  changed_by: number;
  change_reason?: string;
  created_at: string;
}

export interface CustomField {
  id: number;
  entity_type: string;
  field_key: string;
  field_label: string;
  field_type: string;
  field_options: string[];
  is_required: boolean;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}
