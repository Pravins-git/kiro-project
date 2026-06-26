import { useState } from 'react';
import { Box, Typography, Container, Grid, Paper, CircularProgress, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import DeleteIcon from '@mui/icons-material/Delete';
import { useGetMetricsQuery, useGetUsersQuery, useDeleteUserMutation } from './adminApi.js';

export const AdminPanel = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const { data: metricsData, isLoading: isLoadingMetrics } = useGetMetricsQuery();
  const { data: usersData, isLoading: isLoadingUsers } = useGetUsersQuery({ page: page + 1, limit: rowsPerPage });
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to completely delete this user and all their data?')) {
      try {
        await deleteUser(userId).unwrap();
        alert('User deleted successfully');
      } catch (err) {
        alert('Failed to delete user: ' + (err.data?.error || 'Unknown error'));
      }
    }
  };

  if (isLoadingMetrics || isLoadingUsers) {
    return (
      <Container sx={{ pt: 12, pb: 8, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  const metrics = metricsData?.data || {};
  const users = usersData?.data?.users || [];
  const totalUsers = usersData?.data?.pagination?.total || 0;

  return (
    <Container maxWidth="xl" sx={{ pt: 12, pb: 8 }}>
      <Typography variant="h3" sx={{ fontWeight: 800, mb: 4 }}>
        Admin Dashboard
      </Typography>

      <Grid container spacing={3} sx={{ mb: 6 }}>
        {[
          { label: 'Total Users', value: metrics.totalUsers },
          { label: 'Verified Users', value: metrics.verifiedUsers },
          { label: 'Total Resumes', value: metrics.totalResumes },
          { label: 'Processed Resumes', value: metrics.processedResumes },
          { label: 'Total Chat Sessions', value: metrics.totalChatSessions },
        ].map((metric, idx) => (
          <Grid item xs={12} sm={6} md={2.4} key={idx}>
            <Paper sx={{ p: 3, borderRadius: 3, background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Typography variant="subtitle2" color="text.secondary">{metric.label}</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 1 }}>{metric.value}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        User Management
      </Typography>
      
      <TableContainer component={Paper} sx={{ background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user._id}>
                <TableCell>{user.firstName} {user.lastName}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip label={user.role} size="small" color={user.role === 'Platform Admin' ? 'error' : 'primary'} />
                </TableCell>
                <TableCell>
                  {user.isVerified ? <Chip label="Verified" size="small" color="success" /> : <Chip label="Unverified" size="small" color="default" />}
                </TableCell>
                <TableCell>
                  <Button 
                    color="error" 
                    startIcon={<DeleteIcon />} 
                    onClick={() => handleDeleteUser(user._id)}
                    disabled={isDeleting || user.role === 'Platform Admin'}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={totalUsers}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{ color: 'white' }}
        />
      </TableContainer>
    </Container>
  );
};
