import React from 'react';
import { 
  Box, 
  Skeleton, 
  Paper, 
  Card, 
  CardContent, 
  Grid,
  useTheme 
} from '@mui/material';

interface LoadingSkeletonProps {
  variant?: 'table' | 'card' | 'list' | 'dashboard' | 'form' | 'stats';
  rows?: number;
  columns?: number;
  height?: number | string;
  animation?: 'pulse' | 'wave' | false;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'table',
  rows = 5,
  columns = 4,
  height = 'auto',
  animation = 'wave'
}) => {
  const theme = useTheme();

  const renderTableSkeleton = () => (
    <Paper elevation={2} sx={{ width: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Skeleton variant="text" width={200} height={32} animation={animation} />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Skeleton variant="circular" width={40} height={40} animation={animation} />
            <Skeleton variant="circular" width={40} height={40} animation={animation} />
            <Skeleton variant="circular" width={40} height={40} animation={animation} />
          </Box>
        </Box>
        <Skeleton variant="rectangular" width="100%" height={40} animation={animation} />
      </Box>

      {/* Table */}
      <Box sx={{ p: 2 }}>
        {/* Table Header */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2, pb: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton 
              key={index}
              variant="text" 
              width={`${100 / columns}%`} 
              height={24} 
              animation={animation}
            />
          ))}
        </Box>

        {/* Table Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <Box key={rowIndex} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton 
                key={colIndex}
                variant="text" 
                width={`${100 / columns}%`} 
                height={20} 
                animation={animation}
              />
            ))}
          </Box>
        ))}
      </Box>

      {/* Pagination */}
      <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Skeleton variant="text" width={150} height={24} animation={animation} />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Skeleton variant="circular" width={32} height={32} animation={animation} />
          <Skeleton variant="circular" width={32} height={32} animation={animation} />
          <Skeleton variant="circular" width={32} height={32} animation={animation} />
        </Box>
      </Box>
    </Paper>
  );

  const renderCardSkeleton = () => (
    <Grid container spacing={3}>
      {Array.from({ length: rows }).map((_, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Skeleton variant="circular" width={40} height={40} animation={animation} />
                <Skeleton variant="rectangular" width={60} height={24} animation={animation} />
              </Box>
              <Skeleton variant="text" width="100%" height={24} sx={{ mb: 1 }} animation={animation} />
              <Skeleton variant="text" width="80%" height={20} sx={{ mb: 2 }} animation={animation} />
              <Skeleton variant="text" width="60%" height={32} animation={animation} />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const renderListSkeleton = () => (
    <Paper elevation={2}>
      {Array.from({ length: rows }).map((_, index) => (
        <Box key={index} sx={{ p: 2, borderBottom: index < rows - 1 ? `1px solid ${theme.palette.divider}` : 'none' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Skeleton variant="circular" width={50} height={50} animation={animation} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="70%" height={24} sx={{ mb: 0.5 }} animation={animation} />
              <Skeleton variant="text" width="50%" height={20} sx={{ mb: 0.5 }} animation={animation} />
              <Skeleton variant="text" width="30%" height={16} animation={animation} />
            </Box>
            <Box>
              <Skeleton variant="rectangular" width={80} height={32} animation={animation} />
            </Box>
          </Box>
        </Box>
      ))}
    </Paper>
  );

  const renderDashboardSkeleton = () => (
    <Box>
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {Array.from({ length: 4 }).map((_, index) => (
          <Grid item xs={6} sm={6} md={3} key={index}>
            <Card elevation={2}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Skeleton variant="text" width={80} height={32} animation={animation} />
                    <Skeleton variant="text" width={120} height={20} animation={animation} />
                  </Box>
                  <Skeleton variant="circular" width={40} height={40} animation={animation} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Skeleton variant="text" width={200} height={24} sx={{ mb: 2 }} animation={animation} />
            <Skeleton variant="rectangular" width="100%" height={300} animation={animation} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Skeleton variant="text" width={150} height={24} sx={{ mb: 2 }} animation={animation} />
            <Skeleton variant="circular" width="100%" height={250} animation={animation} />
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Items */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Skeleton variant="text" width={200} height={24} sx={{ mb: 2 }} animation={animation} />
        {Array.from({ length: 5 }).map((_, index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Skeleton variant="circular" width={40} height={40} animation={animation} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="60%" height={20} animation={animation} />
              <Skeleton variant="text" width="40%" height={16} animation={animation} />
            </Box>
            <Skeleton variant="text" width={80} height={20} animation={animation} />
          </Box>
        ))}
      </Paper>
    </Box>
  );

  const renderFormSkeleton = () => (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Skeleton variant="text" width={300} height={32} sx={{ mb: 3 }} animation={animation} />
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          {Array.from({ length: 4 }).map((_, index) => (
            <Box key={index} sx={{ mb: 3 }}>
              <Skeleton variant="text" width={120} height={20} sx={{ mb: 1 }} animation={animation} />
              <Skeleton variant="rectangular" width="100%" height={56} animation={animation} />
            </Box>
          ))}
        </Grid>
        <Grid item xs={12} md={6}>
          {Array.from({ length: 4 }).map((_, index) => (
            <Box key={index} sx={{ mb: 3 }}>
              <Skeleton variant="text" width={120} height={20} sx={{ mb: 1 }} animation={animation} />
              <Skeleton variant="rectangular" width="100%" height={56} animation={animation} />
            </Box>
          ))}
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4 }}>
        <Skeleton variant="rectangular" width={100} height={40} animation={animation} />
        <Skeleton variant="rectangular" width={120} height={40} animation={animation} />
      </Box>
    </Paper>
  );

  const renderStatsSkeleton = () => (
    <Grid container spacing={3}>
      {Array.from({ length: rows || 4 }).map((_, index) => (
        <Grid item xs={6} sm={6} md={3} key={index}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Skeleton variant="text" width={60} height={48} animation={animation} />
                  <Skeleton variant="text" width={100} height={20} animation={animation} />
                </Box>
                <Skeleton variant="circular" width={40} height={40} animation={animation} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const skeletonStyles = {
    height: height === 'auto' ? 'auto' : height,
  };

  switch (variant) {
    case 'table':
      return <Box sx={skeletonStyles}>{renderTableSkeleton()}</Box>;
    case 'card':
      return <Box sx={skeletonStyles}>{renderCardSkeleton()}</Box>;
    case 'list':
      return <Box sx={skeletonStyles}>{renderListSkeleton()}</Box>;
    case 'dashboard':
      return <Box sx={skeletonStyles}>{renderDashboardSkeleton()}</Box>;
    case 'form':
      return <Box sx={skeletonStyles}>{renderFormSkeleton()}</Box>;
    case 'stats':
      return <Box sx={skeletonStyles}>{renderStatsSkeleton()}</Box>;
    default:
      return <Box sx={skeletonStyles}>{renderTableSkeleton()}</Box>;
  }
};

export default LoadingSkeleton;