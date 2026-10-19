'use client';

import { Modal, Form, Input, ColorPicker } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import api from '../../lib/api';
import type { Color } from 'antd/es/color-picker';

type Project = { id: string; title: string; description?: string; color?: string };
type ProjectValues = { title: string; description?: string; color?: string | Color };

export function ProjectModal({ 
  isOpen, 
  onClose, 
  project 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  project: Project | null 
}) {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isOpen) {
      if (project) {
        form.setFieldsValue({
          title: project.title,
          description: project.description,
          color: project.color || '#1890ff',
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ color: '#5E6AD2' });
      }
    }
  }, [isOpen, project, form]);

  const saveMutation = useMutation({
    mutationFn: (values: ProjectValues) => {
      // ColorPicker returns an object or string, so ensure it's a string
      const payload = {
        ...values,
        color: typeof values.color === 'string' ? values.color : values.color?.toHexString(),
      };
      
      if (project) {
        return api.patch(`/projects/${project.id}`, payload);
      }
      return api.post('/projects', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      onClose();
    },
  });

  return (
    <Modal
      title={project ? 'Edit Project' : 'New Project'}
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
          label="Project Title"
          rules={[{ required: true, message: 'Please input a title!' }]}
        >
          <Input placeholder="E.g. Marketing Campaign" />
        </Form.Item>
        
        <Form.Item
          name="description"
          label="Description"
        >
          <Input.TextArea placeholder="Brief description of the project" rows={3} />
        </Form.Item>

        <Form.Item
          name="color"
          label="Project Color"
        >
          <ColorPicker />
        </Form.Item>
      </Form>
    </Modal>
  );
}
