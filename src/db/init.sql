-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'security_team', 'risk_owner', 'handler', 'executive')),
  phone TEXT,
  is_disabled INTEGER DEFAULT 0,
  force_password_change INTEGER DEFAULT 1,
  login_fail_count INTEGER DEFAULT 0,
  locked_until TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 安全风险主表
CREATE TABLE IF NOT EXISTS security_risks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  risk_no TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  source TEXT NOT NULL,
  category TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('严重', '高危', '中危', '低危')),
  affected_assets TEXT DEFAULT '[]',
  cvss_score REAL CHECK (cvss_score >= 0.0 AND cvss_score <= 10.0),
  cve_id TEXT,
  impact_score INTEGER NOT NULL CHECK (impact_score >= 1 AND impact_score <= 5),
  likelihood_score INTEGER NOT NULL CHECK (likelihood_score >= 1 AND likelihood_score <= 5),
  total_score INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT '待处置' CHECK (status IN ('待处置', '处置中', '已修复', '已接受', '已转移', '已关闭')),
  workflow_status TEXT NOT NULL DEFAULT 'assigned' CHECK (workflow_status IN ('assigned', 'in_progress', 'pending_confirm', 'pending_close', 'closed')),
  risk_owner_id INTEGER NOT NULL REFERENCES users(id),
  handler_id INTEGER REFERENCES users(id),
  discovery_date TEXT NOT NULL,
  plan_end_date TEXT NOT NULL,
  actual_end_date TEXT,
  attachments TEXT DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_risks_status ON security_risks(status);
CREATE INDEX idx_risks_level ON security_risks(level);
CREATE INDEX idx_risks_owner ON security_risks(risk_owner_id);
CREATE INDEX idx_risks_date ON security_risks(discovery_date);

-- 处置措施表
CREATE TABLE IF NOT EXISTS risk_measures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  risk_id INTEGER NOT NULL REFERENCES security_risks(id) ON DELETE CASCADE,
  measure_type TEXT NOT NULL CHECK (measure_type IN ('修复', '缓解', '接受', '转移')),
  description TEXT NOT NULL,
  task_owner_id INTEGER NOT NULL REFERENCES users(id),
  task_status TEXT NOT NULL DEFAULT '未开始' CHECK (task_status IN ('未开始', '进行中', '已完成', '已逾期')),
  plan_end_date TEXT NOT NULL,
  actual_end_date TEXT,
  verify_result TEXT DEFAULT '待验证' CHECK (verify_result IN ('待验证', '验证通过', '验证失败')),
  verify_by INTEGER REFERENCES users(id),
  result_description TEXT,
  result_attachments TEXT DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_measures_risk ON risk_measures(risk_id);
CREATE INDEX idx_measures_owner ON risk_measures(task_owner_id);

-- 审计日志表
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action_type TEXT NOT NULL,
  operator_id INTEGER REFERENCES users(id),
  operator_name TEXT NOT NULL,
  target_id INTEGER,
  target_title TEXT,
  old_values TEXT,
  new_values TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_audit_type ON audit_logs(action_type);
CREATE INDEX idx_audit_operator ON audit_logs(operator_id);

-- 通知表
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  risk_id INTEGER REFERENCES security_risks(id),
  measure_id INTEGER REFERENCES risk_measures(id),
  recipient_id INTEGER NOT NULL REFERENCES users(id),
  is_read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_notif_recipient ON notifications(recipient_id, is_read);

-- 知识库表
CREATE TABLE IF NOT EXISTS knowledge_base (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT DEFAULT '[]',
  source_type TEXT NOT NULL CHECK (source_type IN ('manual', 'auto_extract', 'external_cve', 'ai_generated')),
  source_ref TEXT,
  related_risk_ids TEXT DEFAULT '[]',
  view_count INTEGER DEFAULT 0,
  reference_count INTEGER DEFAULT 0,
  is_published INTEGER DEFAULT 1,
  created_by INTEGER NOT NULL REFERENCES users(id),
  updated_by INTEGER REFERENCES users(id),
  published_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- AI 分析记录表
CREATE TABLE IF NOT EXISTS ai_analysis_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  risk_id INTEGER REFERENCES security_risks(id),
  input_text TEXT NOT NULL,
  analysis_result TEXT NOT NULL,
  suggested_level TEXT,
  suggested_measures TEXT DEFAULT '[]',
  suggested_category TEXT,
  suggested_source TEXT,
  suggested_impact_score INTEGER,
  suggested_likelihood_score INTEGER,
  confidence_score REAL,
  model_provider TEXT NOT NULL,
  model_name TEXT NOT NULL,
  is_applied INTEGER DEFAULT 0,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now'))
);

-- 风险版本历史表
CREATE TABLE IF NOT EXISTS risk_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  risk_id INTEGER NOT NULL REFERENCES security_risks(id),
  version_no INTEGER NOT NULL,
  version_tag TEXT,
  snapshot TEXT NOT NULL,
  changed_by INTEGER REFERENCES users(id),
  change_reason TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX idx_version_risk_no ON risk_versions(risk_id, version_no);

-- 审批流程定义表
CREATE TABLE IF NOT EXISTS approval_workflows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  trigger_event TEXT NOT NULL,
  steps TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 审批实例表
CREATE TABLE IF NOT EXISTS approval_instances (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workflow_id INTEGER NOT NULL REFERENCES approval_workflows(id),
  risk_id INTEGER NOT NULL REFERENCES security_risks(id),
  measure_id INTEGER REFERENCES risk_measures(id),
  current_step INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  submitter_id INTEGER NOT NULL REFERENCES users(id),
  submitter_comment TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT
);

-- 审批步骤记录表
CREATE TABLE IF NOT EXISTS approval_steps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  instance_id INTEGER NOT NULL REFERENCES approval_instances(id),
  step_no INTEGER NOT NULL,
  approver_id INTEGER NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  comment TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 通知渠道配置表
CREATE TABLE IF NOT EXISTS notification_channels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel_type TEXT NOT NULL CHECK (channel_type IN ('wechat_work', 'outlook', 'teams')),
  channel_name TEXT NOT NULL,
  config TEXT NOT NULL,
  is_enabled INTEGER DEFAULT 1,
  priority INTEGER DEFAULT 0,
  created_by INTEGER NOT NULL REFERENCES users(id),
  last_test_at TEXT,
  last_test_result TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 用户通知偏好表
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  channel_id INTEGER NOT NULL REFERENCES notification_channels(id),
  notification_types TEXT DEFAULT '[]',
  is_enabled INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, channel_id)
);

-- 通知发送日志表
CREATE TABLE IF NOT EXISTS notification_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel_id INTEGER NOT NULL REFERENCES notification_channels(id),
  notification_id INTEGER NOT NULL REFERENCES notifications(id),
  recipient_id INTEGER NOT NULL REFERENCES users(id),
  external_message_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  sent_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 自定义字段定义表
CREATE TABLE IF NOT EXISTS custom_fields (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL,
  field_key TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL,
  field_options TEXT DEFAULT '[]',
  is_required INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(entity_type, field_key)
);

-- 自定义字段值表
CREATE TABLE IF NOT EXISTS custom_field_values (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  custom_field_id INTEGER NOT NULL REFERENCES custom_fields(id),
  entity_id INTEGER NOT NULL,
  value_text TEXT,
  value_number REAL,
  value_date TEXT,
  value_json TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(custom_field_id, entity_id)
);

-- total_score 触发器
CREATE TRIGGER IF NOT EXISTS calc_total_score
AFTER INSERT ON security_risks
BEGIN
  UPDATE security_risks SET total_score = NEW.impact_score * NEW.likelihood_score WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS calc_total_score_update
AFTER UPDATE OF impact_score, likelihood_score ON security_risks
BEGIN
  UPDATE security_risks SET total_score = NEW.impact_score * NEW.likelihood_score WHERE id = NEW.id;
END;
