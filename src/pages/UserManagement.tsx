import { useState, useMemo } from 'react';
import { Table, Tag, Button, Modal, Form, Input, Select, Space, Popconfirm, message } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, KeyOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons';
import { mockUsers } from '@/mock/data';
import { formatDate } from '@/lib/utils';
import { ROLE_LABELS, USER_ROLES } from '@/lib/constants';
import type { User, UserRole } from '@/types/types';

interface UserFormData {
  name: string;
  email: string;
  role: UserRole;
  phone: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([...mockUsers]);
  const [searchText, setSearchText] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [addForm] = Form.useForm<UserFormData>();
  const [editForm] = Form.useForm<UserFormData>();

  // ---------- 搜索过滤 ----------
  const filteredUsers = useMemo(() => {
    if (!searchText.trim()) return users;
    const keyword = searchText.toLowerCase();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(keyword) ||
        u.email.toLowerCase().includes(keyword)
    );
  }, [users, searchText]);

  // ---------- 获取用户状态 ----------
  const getUserStatus = (user: User): { text: string; color: string } => {
    if (user.is_disabled) return { text: '禁用', color: 'red' };
    if (user.login_fail_count >= 5 || user.locked_until) return { text: '锁定', color: 'orange' };
    return { text: '正常', color: 'green' };
  };

  // ---------- 新增用户 ----------
  const handleAddUser = () => {
    addForm.validateFields().then((values) => {
      const newUser: User = {
        id: Math.max(...users.map((u) => u.id)) + 1,
        ...values,
        is_disabled: false,
        force_password_change: true,
        login_fail_count: 0,
        created_at: new Date().toISOString(),
      };
      setUsers((prev) => [...prev, newUser]);
      setAddModalOpen(false);
      addForm.resetFields();
      message.success('用户创建成功');
    });
  };

  // ---------- 编辑用户 ----------
  const handleEditUser = () => {
    editForm.validateFields().then((values) => {
      if (!editingUser) return;
      setUsers((prev) =>
        prev.map((u) => (u.id === editingUser.id ? { ...u, ...values } : u))
      );
      setEditModalOpen(false);
      setEditingUser(null);
      editForm.resetFields();
      message.success('用户信息已更新');
    });
  };

  // ---------- 重置密码 ----------
  const handleResetPassword = (user: User) => {
    message.success(`已重置 ${user.name} 的密码`);
  };

  // ---------- 禁用/启用 ----------
  const handleToggleDisable = (user: User) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, is_disabled: !u.is_disabled } : u))
    );
    message.success(user.is_disabled ? `已启用 ${user.name}` : `已禁用 ${user.name}`);
  };

  // ---------- 解锁 ----------
  const handleUnlock = (user: User) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === user.id ? { ...u, login_fail_count: 0, locked_until: undefined } : u
      )
    );
    message.success(`已解锁 ${user.name}`);
  };

  // ---------- 表格列定义 ----------
  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 120,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 200,
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (role: UserRole) => (
        <Tag color="blue">{ROLE_LABELS[role] || role}</Tag>
      ),
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 140,
      render: (phone: string) => phone || '-',
    },
    {
      title: '状态',
      key: 'status',
      width: 90,
      align: 'center' as const,
      render: (_: unknown, record: User) => {
        const status = getUserStatus(record);
        return <Tag color={status.color}>{status.text}</Tag>;
      },
    },
    {
      title: '强制改密',
      dataIndex: 'force_password_change',
      key: 'force_password_change',
      width: 100,
      align: 'center' as const,
      render: (val: boolean) =>
        val ? <Tag color="warning">是</Tag> : <Tag color="default">否</Tag>,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 170,
      render: (date: string) => formatDate(date, 'YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      fixed: 'right' as const,
      render: (_: unknown, record: User) => {
        const status = getUserStatus(record);
        return (
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingUser(record);
                editForm.setFieldsValue({
                  name: record.name,
                  role: record.role,
                  phone: record.phone,
                });
                setEditModalOpen(true);
              }}
            >
              编辑
            </Button>
            <Popconfirm
              title="确认重置密码？"
              description={`将重置 ${record.name} 的密码，用户下次登录需强制修改。`}
              onConfirm={() => handleResetPassword(record)}
              okText="确认"
              cancelText="取消"
            >
              <Button type="link" size="small" icon={<KeyOutlined />}>
                重置密码
              </Button>
            </Popconfirm>
            <Popconfirm
              title={record.is_disabled ? '确认启用该用户？' : '确认禁用该用户？'}
              description={
                record.is_disabled
                  ? `启用后 ${record.name} 可正常登录系统。`
                  : `禁用后 ${record.name} 将无法登录系统。`
              }
              onConfirm={() => handleToggleDisable(record)}
              okText="确认"
              cancelText="取消"
            >
              <Button type="link" size="small" icon={<LockOutlined />}>
                {record.is_disabled ? '启用' : '禁用'}
              </Button>
            </Popconfirm>
            {status.text === '锁定' && (
              <Popconfirm
                title="确认解锁该用户？"
                description={`将清除 ${record.name} 的登录失败计数并解除锁定。`}
                onConfirm={() => handleUnlock(record)}
                okText="确认"
                cancelText="取消"
              >
                <Button type="link" size="small" icon={<UnlockOutlined />}>
                  解锁
                </Button>
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">用户管理</h1>
        <p className="text-gray-500 mt-1">管理系统用户账户、角色与权限</p>
      </div>

      {/* 搜索栏与操作按钮 */}
      <div className="rounded-xl bg-white shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between gap-4">
          <Input
            placeholder="按姓名或邮箱搜索..."
            prefix={<SearchOutlined className="text-gray-400" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            style={{ width: 300 }}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              addForm.resetFields();
              setAddModalOpen(true);
            }}
          >
            新增用户
          </Button>
        </div>
      </div>

      {/* 用户表格 */}
      <div className="rounded-xl bg-white shadow-sm border border-gray-100">
        <Table<User>
          columns={columns}
          dataSource={filteredUsers}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
          size="middle"
          scroll={{ x: 1200 }}
        />
      </div>

      {/* 新增用户弹窗 */}
      <Modal
        title="新增用户"
        open={addModalOpen}
        onOk={handleAddUser}
        onCancel={() => {
          setAddModalOpen(false);
          addForm.resetFields();
        }}
        okText="创建"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={addForm} layout="vertical" className="mt-4">
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入用户姓名" />
          </Form.Item>
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input placeholder="请输入邮箱地址" />
          </Form.Item>
          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择用户角色">
              {USER_ROLES.map((role) => (
                <Select.Option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="phone"
            label="手机号"
            rules={[
              { pattern: /^1\d{10}$/, message: '请输入有效的手机号' },
            ]}
          >
            <Input placeholder="请输入手机号" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑用户弹窗 */}
      <Modal
        title="编辑用户"
        open={editModalOpen}
        onOk={handleEditUser}
        onCancel={() => {
          setEditModalOpen(false);
          setEditingUser(null);
          editForm.resetFields();
        }}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={editForm} layout="vertical" className="mt-4">
          <Form.Item label="邮箱">
            <Input value={editingUser?.email} disabled />
          </Form.Item>
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入用户姓名" />
          </Form.Item>
          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择用户角色">
              {USER_ROLES.map((role) => (
                <Select.Option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="phone"
            label="手机号"
            rules={[
              { pattern: /^1\d{10}$/, message: '请输入有效的手机号' },
            ]}
          >
            <Input placeholder="请输入手机号" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
