
'use client';

import { List, Typography, Button, Badge } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/api';

const { Title, Text } = Typography;

interface Notification {
  id: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function Notifications() {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get<Notification[]>('/notifications'),
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['notifications'],
      });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) =>
      api.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['notifications'],
      });
    },
  });

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
          Notifications
        </Title>

        <Button
          onClick={() => markAllAsReadMutation.mutate()}
          loading={markAllAsReadMutation.isPending}
        >
          Mark all as read
        </Button>
      </div>

      <List<Notification>
        loading={isLoading}
        itemLayout="horizontal"
        dataSource={notifications}
        renderItem={(item) => (
          <List.Item
            actions={
              !item.read
                ? [
                    <Button
                      key="mark-read"
                      type="link"
                      loading={markAsReadMutation.isPending}
                      onClick={() =>
                        markAsReadMutation.mutate(item.id)
                      }
                    >
                      Mark as read
                    </Button>,
                  ]
                : []
            }
          >
            <List.Item.Meta
              title={
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {!item.read && (
                    <Badge
                      status="processing"
                      style={{ marginRight: 8 }}
                    />
                  )}

                  <Text strong={!item.read}>
                    {item.message}
                  </Text>
                </div>
              }
              description={new Date(
                item.createdAt
              ).toLocaleString()}
            />
          </List.Item>
        )}
      />
    </div>
  );
}
