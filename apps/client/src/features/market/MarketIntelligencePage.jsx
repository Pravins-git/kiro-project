import { useState } from 'react';
import { Box, Typography, Container, Grid, Paper, CircularProgress, TextField, Button, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import SearchIcon from '@mui/icons-material/Search';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useLazyGetInsightsQuery } from './marketApi.js';

export const MarketIntelligencePage = () => {
  const [roleInput, setRoleInput] = useState('');
  const [fetchInsights, { data, isLoading, error, isFetching }] = useLazyGetInsightsQuery();

  const handleSearch = (e) => {
    e.preventDefault();
    if (roleInput.trim()) {
      fetchInsights(roleInput);
    }
  };

  const insights = data?.data;

  // Mock historical trend data for the chart based on the fetched median
  const generateChartData = (median, growthRate) => {
    const currentYear = new Date().getFullYear();
    const data = [];
    let currentSalary = median / Math.pow(1 + (growthRate / 100), 5); // back-calculate 5 years
    for (let i = -5; i <= 5; i++) {
      data.push({
        year: currentYear + i,
        salary: Math.round(currentSalary),
      });
      currentSalary *= (1 + (growthRate / 100)); // apply compound growth
    }
    return data;
  };

  return (
    <Container maxWidth="xl" sx={{ pt: 12, pb: 8, minHeight: '100vh' }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
          Market Intelligence
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
          Real-time salary data, demand forecasting, and skill analytics powered by AI.
        </Typography>
      </Box>

      <Paper 
        component="form" 
        onSubmit={handleSearch}
        sx={{ 
          p: 1, 
          display: 'flex', 
          alignItems: 'center', 
          maxWidth: 600, 
          mx: 'auto', 
          mb: 8,
          background: 'rgba(30, 41, 59, 0.7)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 3
        }}
      >
        <TextField
          fullWidth
          placeholder="Enter a job title (e.g. Senior Software Engineer)"
          variant="outlined"
          value={roleInput}
          onChange={(e) => setRoleInput(e.target.value)}
          sx={{ '& fieldset': { border: 'none' } }}
        />
        <Button 
          type="submit" 
          variant="contained" 
          size="large" 
          disabled={isLoading || isFetching}
          sx={{ borderRadius: 2, px: 4, py: 1.5 }}
          startIcon={isLoading || isFetching ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
        >
          Analyze
        </Button>
      </Paper>

      {error && (
        <Typography color="error" textAlign="center">
          Failed to fetch insights. Please try again.
        </Typography>
      )}

      {insights && !isLoading && !isFetching && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
            Analysis for {insights.role}
            {insights.demandTrend === 'rising' && <Chip icon={<TrendingUpIcon />} label="Rising Demand" color="success" />}
            {insights.demandTrend === 'stable' && <Chip icon={<TrendingFlatIcon />} label="Stable Demand" color="primary" />}
            {insights.demandTrend === 'declining' && <Chip icon={<TrendingDownIcon />} label="Declining Demand" color="error" />}
          </Typography>

          <Grid container spacing={4}>
            {/* Compensation Overview */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 4, height: '100%', borderRadius: 4, background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Typography variant="h6" sx={{ mb: 3 }}>Compensation Overview</Typography>
                
                <Box sx={{ mb: 4 }}>
                  <Typography variant="body2" color="text.secondary">10th Percentile</Typography>
                  <Typography variant="h5">{insights.salaryRange.currency} {insights.salaryRange.p10.toLocaleString()}</Typography>
                </Box>
                
                <Box sx={{ mb: 4 }}>
                  <Typography variant="body2" color="primary.main" sx={{ fontWeight: 'bold' }}>Median Salary</Typography>
                  <Typography variant="h3" sx={{ fontWeight: 800 }}>{insights.salaryRange.currency} {insights.salaryRange.median.toLocaleString()}</Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">90th Percentile</Typography>
                  <Typography variant="h5">{insights.salaryRange.currency} {insights.salaryRange.p90.toLocaleString()}</Typography>
                </Box>
              </Paper>
            </Grid>

            {/* Salary Growth Projection */}
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 4, height: '100%', borderRadius: 4, background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Typography variant="h6" sx={{ mb: 1 }}>10-Year Salary Projection</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                  Estimated based on {insights.growthRate}% projected 5-year growth.
                </Typography>
                <Box sx={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <LineChart data={generateChartData(insights.salaryRange.median, insights.growthRate)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="year" stroke="rgba(255,255,255,0.5)" />
                      <YAxis stroke="rgba(255,255,255,0.5)" tickFormatter={(value) => `${value / 1000}k`} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: 'none', borderRadius: 8, color: '#fff' }}
                        formatter={(value) => [`${insights.salaryRange.currency} ${value.toLocaleString()}`, 'Salary']}
                      />
                      <Line type="monotone" dataKey="salary" stroke="#a855f7" strokeWidth={3} dot={{ r: 4, fill: '#a855f7' }} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>

            {/* Top Skills */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 4, height: '100%', borderRadius: 4, background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Typography variant="h6" sx={{ mb: 3 }}>Most In-Demand Skills</Typography>
                <Box sx={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart layout="vertical" data={insights.topSkills.map((s, i) => ({ ...s, value: 5 - i }))} margin={{ left: 50 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={false} />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.7)" width={100} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: 'none', borderRadius: 8 }}
                        formatter={(value, name, props) => [props.payload.importance, 'Importance']}
                      />
                      <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>

            {/* Strategic Insights */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 4, height: '100%', borderRadius: 4, background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Typography variant="h6" sx={{ mb: 3 }}>Strategic Insights</Typography>
                {insights.insights.map((insight, idx) => (
                  <Box key={idx} sx={{ mb: 3, p: 2, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                      {insight}
                    </Typography>
                  </Box>
                ))}
                
                <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>Top Geographies</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {insights.geographicHotspots.map((hotspot, idx) => (
                    <Chip key={idx} label={hotspot} variant="outlined" sx={{ color: 'primary.light', borderColor: 'primary.main' }} />
                  ))}
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </motion.div>
      )}
    </Container>
  );
};
