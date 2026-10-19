'use client';

import { Table, Tag, Space, Button, Popconfirm, App } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import type { Task } from './taskTypes';
import type { TableColumnsType } from 'antd';

export function TaskList({ onEditTask }: { onEditTask: (task: Task) => void }) {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.get<Task[]>('/tasks'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/tasks/${id}`),
    onSuccess: () => {
      message.success('Task deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error: Error) => {
      message.error(error.message || 'Failed to delete task');
    }
  });

  const columns: TableColumnsType<Task> = [
    {
      title: 'Task Name',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'default';
        if (status === 'Todo') color = 'blue';
        if (status === 'In Progress') color = 'orange';
        if (status === 'Review') color = 'purple';
        if (status === 'Done') color = 'green';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => {
        let color = 'default';
        if (priority === 'High' || priority === 'Critical') color = 'red';
        if (priority === 'Medium') color = 'orange';
        if (priority === 'Low') color = 'green';
        return <Tag color={color}>{priority}</Tag>;
      },
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (date: string) => date ? new Date(date).toLocaleDateString() : 'None',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: Task) => (
        <Space size="middle">
          <Button type="link" size="small" onClick={() => onEditTask(record)}>Edit</Button>
          <Popconfirm
            title="Delete the task"
            description="Are you sure to delete this task?"
            onConfirm={() => deleteMutation.mutate(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger size="small">Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table 
      columns={columns} 
      dataSource={tasks} 
      loading={isLoading} 
      rowKey="id" 
    />
  );
}
