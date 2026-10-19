
'use client';

import {
  Table,
  Button,
  Typography,
  Space,
  Tag,
  Popconfirm,
  App,
} from 'antd';
import type { TableColumnsType } from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../lib/api';
import { ProjectModal } from '../../../components/projects/ProjectModal';

const { Title } = Typography;

interface Project {
  id: string;
  title: string;
  description?: string;
  color?: string;
  members?: unknown[];
}

export default function Projects() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] =
    useState<Project | null>(null);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get<Project[]>('/projects'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/projects/${id}`),

    onSuccess: () => {
      message.success('Project deleted successfully');
      queryClient.invalidateQueries({
        queryKey: ['projects'],
      });
    },

    onError: (error: Error) => {
      message.error(
        error.message || 'Failed to delete project'
      );
    },
  });

  const openModal = (project: Project | null = null) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };

  const columns: TableColumnsType<Project> = [
    {
      title: 'Project Name',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Project) => (
        <Space>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: record.color || '#1890ff',
            }}
          />
          <strong>{text}</strong>
        </Space>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Members',
      dataIndex: 'members',
      key: 'members',
      render: (members: unknown[] | undefined) => (
        <Tag color="blue">
          {members?.length ?? 0} Members
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_value: unknown, record: Project) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<UnorderedListOutlined />}
            onClick={() =>
              router.push(
                `/tasks?projectId=${record.id}`
              )
            }
          >
            Tasks
          </Button>

          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => openModal(record)}
          >
            Edit
          </Button>

          <Popconfirm
            title="Delete the project"
            description="Are you sure to delete this project? All associated tasks will be orphaned."
            onConfirm={() =>
              deleteMutation.mutate(record.id)
            }
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              loading={deleteMutation.isPending}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <Title level={2} style={{ margin: 0 }}>
          Projects
        </Title>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => openModal()}
        >
          New Project
        </Button>
      </div>

      <Table<Project>
        columns={columns}
        dataSource={projects}
        loading={isLoading}
        rowKey="id"
      />

      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        project={editingProject}
      />
    </div>
  );
}
