
'use client';

import { useState, useSyncExternalStore } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd';
import {
  Card,
  Tag,
  Typography,
  Spin,
  Button,
  Popconfirm,
  App,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import api from '../../lib/api';

const { Title, Text } = Typography;

const COLUMNS = [
  { id: 'Todo', title: 'To Do' },
  { id: 'In Progress', title: 'In Progress' },
  { id: 'Review', title: 'Review' },
  { id: 'Done', title: 'Done' },
] as const;

type TaskStatus = (typeof COLUMNS)[number]['id'];

interface Task {
  id: string;
  title: string;
  status: string;
  priority?: string;
  [key: string]: unknown;
}

type BoardData = Record<TaskStatus, Task[]>;

function createBoard(tasks: Task[]): BoardData {
  const board: BoardData = {
    Todo: [],
    'In Progress': [],
    Review: [],
    Done: [],
  };

  tasks.forEach((task) => {
    if (task.status in board) {
      board[task.status as TaskStatus].push(task);
    }
  });

  return board;
}

function subscribeToClient(): () => void {
  return () => {};
}

function getClientSnapshot(): boolean {
  return true;
}

function getServerSnapshot(): boolean {
  return false;
}

interface KanbanBoardProps {
  onEditTask: (task: Task) => void;
}

export function KanbanBoard({
  onEditTask,
}: KanbanBoardProps) {
  const mounted = useSyncExternalStore(
    subscribeToClient,
    getClientSnapshot,
    getServerSnapshot
  );

  const queryClient = useQueryClient();
  const { message } = App.useApp();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.get<Task[]>('/tasks'),
  });

  // Stores the most recent local drag-and-drop arrangement.
  const [localBoard, setLocalBoard] = useState<{
    tasks: Task[];
    board: BoardData;
  } | null>(null);

  // Use local ordering while it belongs to the current query data.
  // Otherwise, rebuild the board from the latest server data.
  const boardData =
    localBoard?.tasks === tasks
      ? localBoard.board
      : createBoard(tasks);

  const updateStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: string;
    }) => api.patch(`/tasks/${id}/status`, { status }),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['tasks'],
      });
    },

    onError: (error: Error) => {
      message.error(
        error.message || 'Failed to update task status'
      );

      setLocalBoard(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/tasks/${id}`),

    onSuccess: () => {
      message.success('Task deleted successfully');

      queryClient.invalidateQueries({
        queryKey: ['tasks'],
      });
    },

    onError: (error: Error) => {
      message.error(
        error.message || 'Failed to delete task'
      );
    },
  });

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const sourceId = source.droppableId as TaskStatus;
    const destinationId =
      destination.droppableId as TaskStatus;

    const sourceColumn = boardData[sourceId];
    const destinationColumn = boardData[destinationId];

    if (!sourceColumn || !destinationColumn) return;

    const task = sourceColumn[source.index];

    if (!task) return;

    const updatedBoard: BoardData = {
      Todo: [...boardData.Todo],
      'In Progress': [...boardData['In Progress']],
      Review: [...boardData.Review],
      Done: [...boardData.Done],
    };

    // Remove the task from its previous position.
    updatedBoard[sourceId].splice(source.index, 1);

    // Insert it at the new position.
    updatedBoard[destinationId].splice(
      destination.index,
      0,
      {
        ...task,
        status: destinationId,
      }
    );

    // Update the interface immediately.
    setLocalBoard({
      tasks,
      board: updatedBoard,
    });

    // Save status changes to the backend.
    if (sourceId !== destinationId) {
      updateStatusMutation.mutate({
        id: draggableId,
        status: destinationId,
      });
    }
  };

  if (!mounted || isLoading) {
    return (
      <Spin
        size="large"
        style={{
          display: 'block',
          margin: '40px auto',
        }}
      />
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div
        style={{
          display: 'flex',
          gap: 16,
          overflowX: 'auto',
          paddingBottom: 16,
        }}
      >
        {COLUMNS.map((column) => (
          <div
            key={column.id}
            style={{
              flex: '0 0 300px',
              background: '#212124',
              borderRadius: 8,
              padding: 16,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}
            >
              <Title
                level={5}
                style={{ margin: 0 }}
              >
                {column.title}
              </Title>

              <Tag>
                {boardData[column.id].length}
              </Tag>
            </div>

            <Droppable droppableId={column.id}>
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  style={{ minHeight: 200 }}
                >
                  {boardData[column.id].map(
                    (task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              marginBottom: 16,
                              cursor: 'grab',
                              boxShadow: snapshot.isDragging
                                ? '0 8px 16px rgba(0,0,0,0.1)'
                                : '0 2px 4px rgba(0,0,0,0.05)',
                              ...provided.draggableProps.style,
                            }}
                            size="small"
                            actions={[
                              <Button
                                key="edit"
                                type="text"
                                icon={<EditOutlined />}
                                onClick={() =>
                                  onEditTask(task)
                                }
                              />,
                              <Popconfirm
                                key="delete"
                                title="Delete task?"
                                onConfirm={() =>
                                  deleteMutation.mutate(
                                    task.id
                                  )
                                }
                                okText="Yes"
                                cancelText="No"
                              >
                                <Button
                                  type="text"
                                  danger
                                  icon={<DeleteOutlined />}
                                />
                              </Popconfirm>,
                            ]}
                          >
                            <div
                              style={{ marginBottom: 8 }}
                            >
                              <Text strong>
                                {task.title}
                              </Text>
                            </div>

                            <Tag
                              color={
                                task.priority === 'High' ||
                                task.priority === 'Critical'
                                  ? 'red'
                                  : task.priority === 'Medium'
                                    ? 'orange'
                                    : 'green'
                              }
                            >
                              {task.priority}
                            </Tag>
                          </Card>
                        )}
                      </Draggable>
                    )
                  )}

                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}
