'use client';

import { Modal, Form, Input, Select, DatePicker, App } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import api from '../../lib/api';
import dayjs, { type Dayjs } from 'dayjs';
import type { Task } from './taskTypes';

type ProjectOption = { id: string; title: string };
type TaskValues = {
  title: string; description?: string; project: string; status: string;
  priority: string; dueDate?: Dayjs;
};

const { Option } = Select;

export function TaskModal({ 
  isOpen, 
  onClose, 
  task 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  task: Task | null 
}) {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get<ProjectOption[]>('/projects'),
  });

  useEffect(() => {
    if (isOpen) {
      if (task) {
        form.setFieldsValue({
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          project: task.project,
          dueDate: task.dueDate ? dayjs(task.dueDate) : undefined,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ 
          status: 'Todo',
          priority: 'Medium' 
        });
      }
    }
  }, [isOpen, task, form]);

  const saveMutation = useMutation({
    mutationFn: (values: TaskValues) => {
      const payload = {
        ...values,
        dueDate: values.dueDate ? values.dueDate.toISOString() : undefined,
      };
      
      if (task) {
        return api.patch(`/tasks/${task.id}`, payload);
      }
      return api.post('/tasks', payload);
    },
    onSuccess: () => {
      message.success(task ? 'Task updated successfully' : 'Task created successfully');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      onClose();
    },
    onError: (error: Error) => {
      message.error(error.message || 'Failed to save task');
    }
  });

  return (
    <Modal
      title={task ? 'Edit Task' : 'New Task'}
      open={isOpen}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={saveMutation.isPending}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => saveMutation.mutate(values)}
      >
        <Form.Item
          name="title"
          label="Task Title"
          rules={[{ required: true, message: 'Please input a title!' }]}
        >
          <Input placeholder="E.g. Update user settings page" />
        </Form.Item>
        
        <Form.Item
          name="description"
          label="Description"
        >
          <Input.TextArea placeholder="Brief description of the task" rows={3} />
        </Form.Item>

        <Form.Item
          name="project"
          label="Project"
          rules={[{ required: true, message: 'Please select a project!' }]}
        >
          <Select placeholder="Select a project" loading={projectsLoading}>
            {projects?.map((p: ProjectOption) => (
              <Option key={p.id} value={p.id}>{p.title}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="status"
          label="Status"
          rules={[{ required: true }]}
        >
          <Select>
            <Option value="Todo">To Do</Option>
            <Option value="In Progress">In Progress</Option>
            <Option value="Review">Review</Option>
            <Option value="Done">Done</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="priority"
          label="Priority"
          rules={[{ required: true }]}
        >
          <Select>
            <Option value="Low">Low</Option>
            <Option value="Medium">Medium</Option>
            <Option value="High">High</Option>
            <Option value="Critical">Critical</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="dueDate"
          label="Due Date"
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
