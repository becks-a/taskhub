'use client';

import { Typography, Tabs, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { TaskList } from '../../../components/tasks/TaskList';
import { KanbanBoard } from '../../../components/tasks/KanbanBoard';
import { TaskModal } from '../../../components/tasks/TaskModal';
import type { Task } from '../../../components/tasks/taskTypes';

const { Title } = Typography;

export default function TasksPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const openModal = (task: Task | null = null) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const items = [
    { key: 'board', label: 'Kanban Board', children: <KanbanBoard onEditTask={openModal} /> },
    { key: 'list', label: 'List View', children: <TaskList onEditTask={openModal} /> },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Tasks</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
          New Task
        </Button>
      </div>
      <Tabs defaultActiveKey="board" items={items} />
      
      <TaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        task={editingTask} 
      />
    </div>
  );
}
