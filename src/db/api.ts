import { getDatabase, saveDatabase } from './database';
import type {
  User,
  SecurityRisk,
  RiskMeasure,
  AuditLog,
  Notification,
  KnowledgeBaseArticle,
  AiAnalysisRecord,
} from '@/types/types';

// ========== 辅助函数 ==========

function rowToUser(row: Record<string, unknown>): User {
  return {
    id: row.id as number,
    name: row.name as string,
    email: row.email as string,
    role: row.role as User['role'],
    phone: (row.phone as string) || undefined,
    is_disabled: Boolean(row.is_disabled),
    force_password_change: Boolean(row.force_password_change),
    login_fail_count: row.login_fail_count as number,
    locked_until: (row.locked_until as string) || undefined,
    created_at: row.created_at as string,
  };
}

function rowToRisk(row: Record<string, unknown>): SecurityRisk {
  return {
    id: row.id as number,
    risk_no: row.risk_no as string,
    title: row.title as string,
    description: (row.description as string) || '',
    source: row.source as string,
    category: row.category as string,
    level: row.level as SecurityRisk['level'],
    affected_assets: JSON.parse((row.affected_assets as string) || '[]'),
    cvss_score: row.cvss_score != null ? (row.cvss_score as number) : undefined,
    cve_id: (row.cve_id as string) || undefined,
    impact_score: row.impact_score as number,
    likelihood_score: row.likelihood_score as number,
    total_score: row.total_score as number,
    status: row.status as SecurityRisk['status'],
    workflow_status: row.workflow_status as SecurityRisk['workflow_status'],
    risk_owner_id: row.risk_owner_id as number,
    handler_id: row.handler_id != null ? (row.handler_id as number) : undefined,
    discovery_date: row.discovery_date as string,
    plan_end_date: row.plan_end_date as string,
    actual_end_date: (row.actual_end_date as string) || undefined,
    attachments: JSON.parse((row.attachments as string) || '[]'),
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function rowToMeasure(row: Record<string, unknown>): RiskMeasure {
  return {
    id: row.id as number,
    risk_id: row.risk_id as number,
    measure_type: row.measure_type as RiskMeasure['measure_type'],
    description: row.description as string,
    task_owner_id: row.task_owner_id as number,
    task_status: row.task_status as RiskMeasure['task_status'],
    plan_end_date: row.plan_end_date as string,
    actual_end_date: (row.actual_end_date as string) || undefined,
    verify_result: row.verify_result as RiskMeasure['verify_result'],
    verify_by: row.verify_by != null ? (row.verify_by as number) : undefined,
    result_description: (row.result_description as string) || undefined,
    result_attachments: JSON.parse((row.result_attachments as string) || '[]'),
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function rowToAuditLog(row: Record<string, unknown>): AuditLog {
  return {
    id: row.id as number,
    action_type: row.action_type as string,
    operator_id: row.operator_id as number,
    operator_name: row.operator_name as string,
    target_id: row.target_id != null ? (row.target_id as number) : undefined,
    target_title: (row.target_title as string) || undefined,
    old_values: row.old_values ? JSON.parse(row.old_values as string) : undefined,
    new_values: row.new_values ? JSON.parse(row.new_values as string) : undefined,
    created_at: row.created_at as string,
  };
}

function rowToNotification(row: Record<string, unknown>): Notification {
  return {
    id: row.id as number,
    type: row.type as string,
    title: row.title as string,
    content: row.content as string,
    risk_id: row.risk_id != null ? (row.risk_id as number) : undefined,
    measure_id: row.measure_id != null ? (row.measure_id as number) : undefined,
    recipient_id: row.recipient_id as number,
    is_read: Boolean(row.is_read),
    created_at: row.created_at as string,
  };
}

function rowToKnowledgeArticle(row: Record<string, unknown>): KnowledgeBaseArticle {
  return {
    id: row.id as number,
    title: row.title as string,
    content: row.content as string,
    category: row.category as string,
    tags: JSON.parse((row.tags as string) || '[]'),
    source_type: row.source_type as KnowledgeBaseArticle['source_type'],
    source_ref: (row.source_ref as string) || undefined,
    related_risk_ids: JSON.parse((row.related_risk_ids as string) || '[]'),
    view_count: row.view_count as number,
    reference_count: row.reference_count as number,
    is_published: Boolean(row.is_published),
    created_by: row.created_by as number,
    updated_by: row.updated_by != null ? (row.updated_by as number) : undefined,
    published_at: (row.published_at as string) || undefined,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function rowToAiAnalysis(row: Record<string, unknown>): AiAnalysisRecord {
  return {
    id: row.id as number,
    risk_id: row.risk_id != null ? (row.risk_id as number) : undefined,
    input_text: row.input_text as string,
    analysis_result: JSON.parse((row.analysis_result as string) || '{}'),
    suggested_level: (row.suggested_level as AiAnalysisRecord['suggested_level']) || undefined,
    suggested_measures: JSON.parse((row.suggested_measures as string) || '[]'),
    suggested_category: (row.suggested_category as string) || undefined,
    suggested_source: (row.suggested_source as string) || undefined,
    suggested_impact_score: row.suggested_impact_score != null ? (row.suggested_impact_score as number) : undefined,
    suggested_likelihood_score: row.suggested_likelihood_score != null ? (row.suggested_likelihood_score as number) : undefined,
    confidence_score: row.confidence_score as number,
    model_provider: row.model_provider as string,
    model_name: row.model_name as string,
    is_applied: Boolean(row.is_applied),
    created_by: row.created_by as number,
    created_at: row.created_at as string,
  };
}

/** 将值转义为 SQL 字面量 */
function sqlEscape(val: unknown): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'boolean') return val ? '1' : '0';
  return `'${String(val).replace(/'/g, "''")}'`;
}

/** 将 db.exec 结果转换为对象数组（无参数查询） */
function execToObjects(db: Awaited<ReturnType<typeof getDatabase>>, sql: string): Record<string, unknown>[] {
  try {
    const results = db.exec(sql);
    if (results.length === 0) return [];
    const [{ columns, values }] = results;
    return values.map(row => {
      const obj: Record<string, unknown> = {};
      columns.forEach((col, i) => {
        obj[col] = row[i];
      });
      return obj;
    });
  } catch (e) {
    console.error('[execToObjects] SQL error:', sql, e);
    return [];
  }
}

// ========== 用户相关 ==========

export async function getUsers(): Promise<User[]> {
  const db = await getDatabase();
  const rows = execToObjects(db, 'SELECT * FROM users ORDER BY id');
  return rows.map(rowToUser);
}

export async function getUserById(id: number): Promise<User | null> {
  const db = await getDatabase();
  const rows = execToObjects(db, `SELECT * FROM users WHERE id = ${id}`);
  return rows.length > 0 ? rowToUser(rows[0]) : null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const db = await getDatabase();
  // 使用 exec 直接查询（参数化查询在 sql.js 中可能有兼容性问题）
  const escapedEmail = email.replace(/'/g, "''");
  const rows = execToObjects(db, `SELECT * FROM users WHERE email = '${escapedEmail}'`);
  return rows.length > 0 ? rowToUser(rows[0]) : null;
}

export async function createUser(data: {
  name: string;
  email: string;
  role: string;
  phone?: string;
}): Promise<User> {
  const db = await getDatabase();
  db.run(
    'INSERT INTO users (name, email, role, phone) VALUES (?, ?, ?, ?)',
    [data.name, data.email, data.role, data.phone || null]
  );
  saveDatabase();
  const escapedEmail = data.email.replace(/'/g, "''");
  const rows = execToObjects(db, `SELECT * FROM users WHERE email = '${escapedEmail}'`);
  return rowToUser(rows[0]);
}

export async function updateUser(id: number, data: Partial<User>): Promise<User | null> {
  const db = await getDatabase();
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
  if (data.email !== undefined) { fields.push('email = ?'); values.push(data.email); }
  if (data.role !== undefined) { fields.push('role = ?'); values.push(data.role); }
  if (data.phone !== undefined) { fields.push('phone = ?'); values.push(data.phone); }
  if (data.is_disabled !== undefined) { fields.push('is_disabled = ?'); values.push(data.is_disabled ? 1 : 0); }
  if (data.force_password_change !== undefined) { fields.push('force_password_change = ?'); values.push(data.force_password_change ? 1 : 0); }
  if (data.login_fail_count !== undefined) { fields.push('login_fail_count = ?'); values.push(data.login_fail_count); }
  if (data.locked_until !== undefined) { fields.push('locked_until = ?'); values.push(data.locked_until); }

  if (fields.length === 0) return getUserById(id);

  values.push(id);
  db.run(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
  saveDatabase();
  return getUserById(id);
}

// ========== 风险相关 ==========

export interface RiskFilters {
  status?: string;
  level?: string;
  category?: string;
  source?: string;
  risk_owner_id?: number;
  handler_id?: number;
  keyword?: string;
  workflow_status?: string;
}

export async function getRisks(filters?: RiskFilters): Promise<SecurityRisk[]> {
  const db = await getDatabase();
  const conditions: string[] = [];

  if (filters) {
    if (filters.status) { conditions.push(`status = ${sqlEscape(filters.status)}`); }
    if (filters.level) { conditions.push(`level = ${sqlEscape(filters.level)}`); }
    if (filters.category) { conditions.push(`category = ${sqlEscape(filters.category)}`); }
    if (filters.source) { conditions.push(`source = ${sqlEscape(filters.source)}`); }
    if (filters.risk_owner_id) { conditions.push(`risk_owner_id = ${filters.risk_owner_id}`); }
    if (filters.handler_id) { conditions.push(`handler_id = ${filters.handler_id}`); }
    if (filters.workflow_status) { conditions.push(`workflow_status = ${sqlEscape(filters.workflow_status)}`); }
    if (filters.keyword) {
      const escapedKw = filters.keyword.replace(/'/g, "''");
      conditions.push(`(title LIKE '%${escapedKw}%' OR risk_no LIKE '%${escapedKw}%' OR description LIKE '%${escapedKw}%')`);
    }
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows = execToObjects(db, `SELECT * FROM security_risks ${where} ORDER BY id DESC`);
  return rows.map(rowToRisk);
}

export async function getRiskById(id: number): Promise<SecurityRisk | null> {
  const db = await getDatabase();
  const rows = execToObjects(db, `SELECT * FROM security_risks WHERE id = ${id}`);
  if (rows.length === 0) return null;

  const risk = rowToRisk(rows[0]);

  // 加载关联数据
  const ownerRows = execToObjects(db, `SELECT * FROM users WHERE id = ${risk.risk_owner_id}`);
  if (ownerRows.length > 0) risk.risk_owner = rowToUser(ownerRows[0]);

  if (risk.handler_id) {
    const handlerRows = execToObjects(db, `SELECT * FROM users WHERE id = ${risk.handler_id}`);
    if (handlerRows.length > 0) risk.handler = rowToUser(handlerRows[0]);
  }

  const measureRows = execToObjects(db, `SELECT * FROM risk_measures WHERE risk_id = ${id} ORDER BY id`);
  risk.measures = measureRows.map(m => {
    const measure = rowToMeasure(m);
    const ownerRows2 = execToObjects(db, `SELECT * FROM users WHERE id = ${measure.task_owner_id}`);
    if (ownerRows2.length > 0) measure.task_owner = rowToUser(ownerRows2[0]);
    return measure;
  });

  return risk;
}

export async function createRisk(data: Partial<SecurityRisk>): Promise<SecurityRisk> {
  const db = await getDatabase();
  db.run(
    `INSERT INTO security_risks (risk_no, title, description, source, category, level, affected_assets, cvss_score, cve_id, impact_score, likelihood_score, total_score, status, workflow_status, risk_owner_id, handler_id, discovery_date, plan_end_date, attachments)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.risk_no,
      data.title,
      data.description || '',
      data.source,
      data.category,
      data.level,
      JSON.stringify(data.affected_assets || []),
      data.cvss_score ?? null,
      data.cve_id ?? null,
      data.impact_score ?? 1,
      data.likelihood_score ?? 1,
      (data.impact_score ?? 1) * (data.likelihood_score ?? 1),
      data.status || '待处置',
      data.workflow_status || 'assigned',
      data.risk_owner_id,
      data.handler_id ?? null,
      data.discovery_date,
      data.plan_end_date,
      JSON.stringify(data.attachments || []),
    ]
  );
  saveDatabase();
  const escapedRiskNo = data.risk_no.replace(/'/g, "''");
  const rows = execToObjects(db, `SELECT * FROM security_risks WHERE risk_no = '${escapedRiskNo}'`);
  return rowToRisk(rows[0]);
}

export async function updateRisk(id: number, data: Partial<SecurityRisk>): Promise<SecurityRisk | null> {
  const db = await getDatabase();
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title); }
  if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
  if (data.source !== undefined) { fields.push('source = ?'); values.push(data.source); }
  if (data.category !== undefined) { fields.push('category = ?'); values.push(data.category); }
  if (data.level !== undefined) { fields.push('level = ?'); values.push(data.level); }
  if (data.affected_assets !== undefined) { fields.push('affected_assets = ?'); values.push(JSON.stringify(data.affected_assets)); }
  if (data.cvss_score !== undefined) { fields.push('cvss_score = ?'); values.push(data.cvss_score); }
  if (data.cve_id !== undefined) { fields.push('cve_id = ?'); values.push(data.cve_id); }
  if (data.impact_score !== undefined) { fields.push('impact_score = ?'); values.push(data.impact_score); }
  if (data.likelihood_score !== undefined) { fields.push('likelihood_score = ?'); values.push(data.likelihood_score); }
  if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }
  if (data.workflow_status !== undefined) { fields.push('workflow_status = ?'); values.push(data.workflow_status); }
  if (data.risk_owner_id !== undefined) { fields.push('risk_owner_id = ?'); values.push(data.risk_owner_id); }
  if (data.handler_id !== undefined) { fields.push('handler_id = ?'); values.push(data.handler_id); }
  if (data.plan_end_date !== undefined) { fields.push('plan_end_date = ?'); values.push(data.plan_end_date); }
  if (data.actual_end_date !== undefined) { fields.push('actual_end_date = ?'); values.push(data.actual_end_date); }
  if (data.attachments !== undefined) { fields.push('attachments = ?'); values.push(JSON.stringify(data.attachments)); }

  if (fields.length === 0) return getRiskById(id);

  fields.push("updated_at = datetime('now')");
  values.push(id);
  db.run(`UPDATE security_risks SET ${fields.join(', ')} WHERE id = ?`, values);
  saveDatabase();
  return getRiskById(id);
}

export async function deleteRisk(id: number): Promise<boolean> {
  const db = await getDatabase();
  db.run('DELETE FROM security_risks WHERE id = ?', [id]);
  saveDatabase();
  return true;
}

// ========== 措施相关 ==========

export async function getMeasuresByRiskId(riskId: number): Promise<RiskMeasure[]> {
  const db = await getDatabase();
  const rows = execToObjects(db, `SELECT * FROM risk_measures WHERE risk_id = ${riskId} ORDER BY id`);
  return rows.map(rowToMeasure);
}

export async function createMeasure(data: Partial<RiskMeasure>): Promise<RiskMeasure> {
  const db = await getDatabase();
  db.run(
    `INSERT INTO risk_measures (risk_id, measure_type, description, task_owner_id, task_status, plan_end_date, actual_end_date, verify_result, verify_by, result_description, result_attachments)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.risk_id,
      data.measure_type,
      data.description,
      data.task_owner_id,
      data.task_status || '未开始',
      data.plan_end_date,
      data.actual_end_date ?? null,
      data.verify_result || '待验证',
      data.verify_by ?? null,
      data.result_description ?? null,
      JSON.stringify(data.result_attachments || []),
    ]
  );
  saveDatabase();
  const rows = execToObjects(db, 'SELECT * FROM risk_measures WHERE id = last_insert_rowid()');
  return rowToMeasure(rows[0]);
}

export async function updateMeasure(id: number, data: Partial<RiskMeasure>): Promise<RiskMeasure | null> {
  const db = await getDatabase();
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.measure_type !== undefined) { fields.push('measure_type = ?'); values.push(data.measure_type); }
  if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
  if (data.task_owner_id !== undefined) { fields.push('task_owner_id = ?'); values.push(data.task_owner_id); }
  if (data.task_status !== undefined) { fields.push('task_status = ?'); values.push(data.task_status); }
  if (data.plan_end_date !== undefined) { fields.push('plan_end_date = ?'); values.push(data.plan_end_date); }
  if (data.actual_end_date !== undefined) { fields.push('actual_end_date = ?'); values.push(data.actual_end_date); }
  if (data.verify_result !== undefined) { fields.push('verify_result = ?'); values.push(data.verify_result); }
  if (data.verify_by !== undefined) { fields.push('verify_by = ?'); values.push(data.verify_by); }
  if (data.result_description !== undefined) { fields.push('result_description = ?'); values.push(data.result_description); }
  if (data.result_attachments !== undefined) { fields.push('result_attachments = ?'); values.push(JSON.stringify(data.result_attachments)); }

  if (fields.length === 0) {
    const rows = execToObjects(db, `SELECT * FROM risk_measures WHERE id = ${id}`);
    return rows.length > 0 ? rowToMeasure(rows[0]) : null;
  }

  fields.push("updated_at = datetime('now')");
  values.push(id);
  db.run(`UPDATE risk_measures SET ${fields.join(', ')} WHERE id = ?`, values);
  saveDatabase();
  const rows = execToObjects(db, `SELECT * FROM risk_measures WHERE id = ${id}`);
  return rows.length > 0 ? rowToMeasure(rows[0]) : null;
}

export async function deleteMeasure(id: number): Promise<boolean> {
  const db = await getDatabase();
  db.run('DELETE FROM risk_measures WHERE id = ?', [id]);
  saveDatabase();
  return true;
}

// ========== 审计日志 ==========

export interface AuditLogFilters {
  action_type?: string;
  operator_id?: number;
  start_date?: string;
  end_date?: string;
}

export async function getAuditLogs(filters?: AuditLogFilters): Promise<AuditLog[]> {
  const db = await getDatabase();
  const conditions: string[] = [];

  if (filters) {
    if (filters.action_type) { conditions.push(`action_type = ${sqlEscape(filters.action_type)}`); }
    if (filters.operator_id) { conditions.push(`operator_id = ${filters.operator_id}`); }
    if (filters.start_date) { conditions.push(`created_at >= ${sqlEscape(filters.start_date)}`); }
    if (filters.end_date) { conditions.push(`created_at <= ${sqlEscape(filters.end_date)}`); }
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows = execToObjects(db, `SELECT * FROM audit_logs ${where} ORDER BY id DESC`);
  return rows.map(rowToAuditLog);
}

export async function createAuditLog(data: {
  action_type: string;
  operator_id: number;
  operator_name: string;
  target_id?: number;
  target_title?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
}): Promise<AuditLog> {
  const db = await getDatabase();
  db.run(
    `INSERT INTO audit_logs (action_type, operator_id, operator_name, target_id, target_title, old_values, new_values)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      data.action_type,
      data.operator_id,
      data.operator_name,
      data.target_id ?? null,
      data.target_title ?? null,
      data.old_values ? JSON.stringify(data.old_values) : null,
      data.new_values ? JSON.stringify(data.new_values) : null,
    ]
  );
  saveDatabase();
  const rows = execToObjects(db, 'SELECT * FROM audit_logs WHERE id = last_insert_rowid()');
  return rowToAuditLog(rows[0]);
}

// ========== 通知 ==========

export async function getNotifications(recipientId: number): Promise<Notification[]> {
  const db = await getDatabase();
  const rows = execToObjects(db, `SELECT * FROM notifications WHERE recipient_id = ${recipientId} ORDER BY id DESC`);
  return rows.map(rowToNotification);
}

export async function markNotificationAsRead(id: number): Promise<void> {
  const db = await getDatabase();
  db.run('UPDATE notifications SET is_read = 1 WHERE id = ?', [id]);
  saveDatabase();
}

export async function markAllNotificationsAsRead(recipientId: number): Promise<void> {
  const db = await getDatabase();
  db.run('UPDATE notifications SET is_read = 1 WHERE recipient_id = ? AND is_read = 0', [recipientId]);
  saveDatabase();
}

export async function createNotification(data: {
  type: string;
  title: string;
  content: string;
  risk_id?: number;
  measure_id?: number;
  recipient_id: number;
}): Promise<Notification> {
  const db = await getDatabase();
  db.run(
    `INSERT INTO notifications (type, title, content, risk_id, measure_id, recipient_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [data.type, data.title, data.content, data.risk_id ?? null, data.measure_id ?? null, data.recipient_id]
  );
  saveDatabase();
  const rows = execToObjects(db, 'SELECT * FROM notifications WHERE id = last_insert_rowid()');
  return rowToNotification(rows[0]);
}

// ========== 知识库 ==========

export interface KnowledgeFilters {
  category?: string;
  keyword?: string;
  is_published?: boolean;
}

export async function getKnowledgeBase(filters?: KnowledgeFilters): Promise<KnowledgeBaseArticle[]> {
  const db = await getDatabase();
  const conditions: string[] = [];

  if (filters) {
    if (filters.category) { conditions.push(`category = ${sqlEscape(filters.category)}`); }
    if (filters.is_published !== undefined) { conditions.push(`is_published = ${filters.is_published ? 1 : 0}`); }
    if (filters.keyword) {
      const escapedKw = filters.keyword.replace(/'/g, "''");
      conditions.push(`(title LIKE '%${escapedKw}%' OR content LIKE '%${escapedKw}%')`);
    }
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows = execToObjects(db, `SELECT * FROM knowledge_base ${where} ORDER BY id DESC`);
  return rows.map(rowToKnowledgeArticle);
}

export async function getKnowledgeArticleById(id: number): Promise<KnowledgeBaseArticle | null> {
  const db = await getDatabase();
  const rows = execToObjects(db, `SELECT * FROM knowledge_base WHERE id = ${id}`);
  return rows.length > 0 ? rowToKnowledgeArticle(rows[0]) : null;
}

export async function createKnowledgeArticle(data: {
  title: string;
  content: string;
  category: string;
  tags?: string[];
  source_type: string;
  source_ref?: string;
  related_risk_ids?: number[];
  created_by: number;
}): Promise<KnowledgeBaseArticle> {
  const db = await getDatabase();
  db.run(
    `INSERT INTO knowledge_base (title, content, category, tags, source_type, source_ref, related_risk_ids, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.title,
      data.content,
      data.category,
      JSON.stringify(data.tags || []),
      data.source_type,
      data.source_ref ?? null,
      JSON.stringify(data.related_risk_ids || []),
      data.created_by,
    ]
  );
  saveDatabase();
  const rows = execToObjects(db, 'SELECT * FROM knowledge_base WHERE id = last_insert_rowid()');
  return rowToKnowledgeArticle(rows[0]);
}

export async function updateKnowledgeArticle(id: number, data: Partial<KnowledgeBaseArticle>): Promise<KnowledgeBaseArticle | null> {
  const db = await getDatabase();
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title); }
  if (data.content !== undefined) { fields.push('content = ?'); values.push(data.content); }
  if (data.category !== undefined) { fields.push('category = ?'); values.push(data.category); }
  if (data.tags !== undefined) { fields.push('tags = ?'); values.push(JSON.stringify(data.tags)); }
  if (data.source_type !== undefined) { fields.push('source_type = ?'); values.push(data.source_type); }
  if (data.source_ref !== undefined) { fields.push('source_ref = ?'); values.push(data.source_ref); }
  if (data.related_risk_ids !== undefined) { fields.push('related_risk_ids = ?'); values.push(JSON.stringify(data.related_risk_ids)); }
  if (data.is_published !== undefined) { fields.push('is_published = ?'); values.push(data.is_published ? 1 : 0); }
  if (data.updated_by !== undefined) { fields.push('updated_by = ?'); values.push(data.updated_by); }
  if (data.view_count !== undefined) { fields.push('view_count = ?'); values.push(data.view_count); }
  if (data.reference_count !== undefined) { fields.push('reference_count = ?'); values.push(data.reference_count); }

  if (fields.length === 0) return getKnowledgeArticleById(id);

  fields.push("updated_at = datetime('now')");
  values.push(id);
  db.run(`UPDATE knowledge_base SET ${fields.join(', ')} WHERE id = ?`, values);
  saveDatabase();
  return getKnowledgeArticleById(id);
}

export async function deleteKnowledgeArticle(id: number): Promise<boolean> {
  const db = await getDatabase();
  db.run('DELETE FROM knowledge_base WHERE id = ?', [id]);
  saveDatabase();
  return true;
}

// ========== AI 分析 ==========

export async function getAiAnalysisRecords(riskId?: number): Promise<AiAnalysisRecord[]> {
  const db = await getDatabase();
  if (riskId) {
    const rows = execToObjects(db, `SELECT * FROM ai_analysis_records WHERE risk_id = ${riskId} ORDER BY id DESC`);
    return rows.map(rowToAiAnalysis);
  }
  const rows = execToObjects(db, 'SELECT * FROM ai_analysis_records ORDER BY id DESC');
  return rows.map(rowToAiAnalysis);
}

export async function createAiAnalysisRecord(data: {
  risk_id?: number;
  input_text: string;
  analysis_result: Record<string, unknown>;
  suggested_level?: string;
  suggested_measures?: Array<{ type: string; description: string; priority: string }>;
  suggested_category?: string;
  suggested_source?: string;
  suggested_impact_score?: number;
  suggested_likelihood_score?: number;
  confidence_score: number;
  model_provider: string;
  model_name: string;
  is_applied?: boolean;
  created_by: number;
}): Promise<AiAnalysisRecord> {
  const db = await getDatabase();
  db.run(
    `INSERT INTO ai_analysis_records (risk_id, input_text, analysis_result, suggested_level, suggested_measures, suggested_category, suggested_source, suggested_impact_score, suggested_likelihood_score, confidence_score, model_provider, model_name, is_applied, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.risk_id ?? null,
      data.input_text,
      JSON.stringify(data.analysis_result),
      data.suggested_level ?? null,
      JSON.stringify(data.suggested_measures || []),
      data.suggested_category ?? null,
      data.suggested_source ?? null,
      data.suggested_impact_score ?? null,
      data.suggested_likelihood_score ?? null,
      data.confidence_score,
      data.model_provider,
      data.model_name,
      data.is_applied ? 1 : 0,
      data.created_by,
    ]
  );
  saveDatabase();
  const rows = execToObjects(db, 'SELECT * FROM ai_analysis_records WHERE id = last_insert_rowid()');
  return rowToAiAnalysis(rows[0]);
}

// ========== 统计 ==========

export interface DashboardStats {
  totalRisks: number;
  pendingRisks: number;
  inProgressRisks: number;
  fixedRisks: number;
  criticalRisks: number;
  highRisks: number;
  mediumRisks: number;
  lowRisks: number;
  overdueMeasures: number;
  unreadNotifications: number;
  recentRisks: SecurityRisk[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const db = await getDatabase();

  const totalRows = execToObjects(db, 'SELECT COUNT(*) as cnt FROM security_risks');
  const pendingRows = execToObjects(db, "SELECT COUNT(*) as cnt FROM security_risks WHERE status = '待处置'");
  const inProgressRows = execToObjects(db, "SELECT COUNT(*) as cnt FROM security_risks WHERE status = '处置中'");
  const fixedRows = execToObjects(db, "SELECT COUNT(*) as cnt FROM security_risks WHERE status = '已修复'");
  const criticalRows = execToObjects(db, "SELECT COUNT(*) as cnt FROM security_risks WHERE level = '严重'");
  const highRows = execToObjects(db, "SELECT COUNT(*) as cnt FROM security_risks WHERE level = '高危'");
  const mediumRows = execToObjects(db, "SELECT COUNT(*) as cnt FROM security_risks WHERE level = '中危'");
  const lowRows = execToObjects(db, "SELECT COUNT(*) as cnt FROM security_risks WHERE level = '低危'");
  const overdueRows = execToObjects(db, "SELECT COUNT(*) as cnt FROM risk_measures WHERE task_status = '进行中' AND plan_end_date < datetime('now')");
  const unreadRows = execToObjects(db, 'SELECT COUNT(*) as cnt FROM notifications WHERE is_read = 0');
  const recentRows = execToObjects(db, 'SELECT * FROM security_risks ORDER BY created_at DESC LIMIT 5');

  return {
    totalRisks: (totalRows[0]?.cnt as number) || 0,
    pendingRisks: (pendingRows[0]?.cnt as number) || 0,
    inProgressRisks: (inProgressRows[0]?.cnt as number) || 0,
    fixedRisks: (fixedRows[0]?.cnt as number) || 0,
    criticalRisks: (criticalRows[0]?.cnt as number) || 0,
    highRisks: (highRows[0]?.cnt as number) || 0,
    mediumRisks: (mediumRows[0]?.cnt as number) || 0,
    lowRisks: (lowRows[0]?.cnt as number) || 0,
    overdueMeasures: (overdueRows[0]?.cnt as number) || 0,
    unreadNotifications: (unreadRows[0]?.cnt as number) || 0,
    recentRisks: recentRows.map(rowToRisk),
  };
}
