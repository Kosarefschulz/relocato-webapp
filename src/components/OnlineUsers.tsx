import React from 'react';
import { Box, Chip, Avatar, Tooltip, Badge, Typography, Paper } from '@mui/material';
import { useOnlineUsers } from '../hooks/useRealtime';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

export const OnlineUsers: React.FC = () => {
  const { onlineUsers, loading } = useOnlineUsers();

  if (loading) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        backgroundColor: 'background.default',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2
      }}
    >
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Online Nutzer ({onlineUsers.length})
      </Typography>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
        {onlineUsers.map((user) => (
          <Tooltip
            key={user.userId}
            title={
              <Box>
                <Typography variant="body2">{user.userName || 'Unbekannter Nutzer'}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {user.currentPage && `Auf: ${user.currentPage}`}
                </Typography>
                <Typography variant="caption" display="block" color="text.secondary">
                  Status: {getStatusText(user.status)}
                </Typography>
              </Box>
            }
          >
            <Chip
              size="small"
              avatar={
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={
                    <FiberManualRecordIcon
                      sx={{
                        fontSize: 10,
                        color: getStatusColor(user.status)
                      }}
                    />
                  }
                >
                  <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>
                    {user.userName?.charAt(0)?.toUpperCase() || '?'}
                  </Avatar>
                </Badge>
              }
              label={user.userName || 'Unbekannter Nutzer'}
              sx={{
                backgroundColor: 'background.paper',
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }}
            />
          </Tooltip>
        ))}
      </Box>
    </Paper>
  );
};

function getStatusColor(status: string): string {
  switch (status) {
    case 'online':
      return '#4caf50';
    case 'away':
      return '#ff9800';
    case 'busy':
      return '#f44336';
    default:
      return '#9e9e9e';
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case 'online':
      return 'Online';
    case 'away':
      return 'Abwesend';
    case 'busy':
      return 'Beschäftigt';
    default:
      return 'Offline';
  }
}