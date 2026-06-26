import { useState } from 'react';
import { Box, Typography, Container, Paper, TextField, Button, Grid, CircularProgress, Card, CardContent, Divider } from '@mui/material';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

import { useCompareOffersMutation } from './offerComparisonApi.js';

export const OfferComparisonPage = () => {
  const [offers, setOffers] = useState([
    { companyName: '', baseSalary: '', bonus: '', equity: '', benefits: '' },
    { companyName: '', baseSalary: '', bonus: '', equity: '', benefits: '' }
  ]);
  const [compare, { isLoading }] = useCompareOffersMutation();
  const [result, setResult] = useState(null);

  const handleAddOffer = () => {
    setOffers([...offers, { companyName: '', baseSalary: '', bonus: '', equity: '', benefits: '' }]);
  };

  const handleRemoveOffer = (index) => {
    const newOffers = [...offers];
    newOffers.splice(index, 1);
    setOffers(newOffers);
  };

  const handleChange = (index, field, value) => {
    const newOffers = [...offers];
    newOffers[index][field] = value;
    setOffers(newOffers);
  };

  const handleCompare = async (e) => {
    e.preventDefault();
    try {
      const formattedOffers = offers.map(o => ({
        companyName: o.companyName,
        baseSalary: Number(o.baseSalary) || 0,
        bonus: Number(o.bonus) || 0,
        equity: Number(o.equity) || 0,
        benefits: o.benefits
      }));
      const response = await compare({ offers: formattedOffers }).unwrap();
      setResult(response.data);
    } catch (err) {
      alert('Failed to compare offers. Please ensure at least two offers are provided.');
    }
  };

  return (
    <Container maxWidth="xl" sx={{ pt: 12, pb: 8, minHeight: '100vh' }}>
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
          Offer Comparison Engine
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
          Input competing job offers to reveal true total compensation and get expert AI negotiation advice.
        </Typography>
      </Box>

      <form onSubmit={handleCompare}>
        <Grid container spacing={3} sx={{ mb: 4, justifyContent: 'center' }}>
          {offers.map((offer, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Paper sx={{ p: 4, borderRadius: 4, background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255,255,255,0.1)', position: 'relative' }}>
                {offers.length > 2 && (
                  <IconButton 
                    onClick={() => handleRemoveOffer(index)}
                    sx={{ position: 'absolute', top: 8, right: 8, color: 'error.main' }}
                  >
                    <RemoveCircleOutlineIcon />
                  </IconButton>
                )}
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>Offer {index + 1}</Typography>
                
                <TextField fullWidth label="Company Name" variant="outlined" sx={{ mb: 2 }} value={offer.companyName} onChange={(e) => handleChange(index, 'companyName', e.target.value)} required />
                <TextField fullWidth label="Base Salary ($)" type="number" variant="outlined" sx={{ mb: 2 }} value={offer.baseSalary} onChange={(e) => handleChange(index, 'baseSalary', e.target.value)} required />
                <TextField fullWidth label="Sign-on / Annual Bonus ($)" type="number" variant="outlined" sx={{ mb: 2 }} value={offer.bonus} onChange={(e) => handleChange(index, 'bonus', e.target.value)} />
                <TextField fullWidth label="Equity Value ($/yr)" type="number" variant="outlined" sx={{ mb: 2 }} value={offer.equity} onChange={(e) => handleChange(index, 'equity', e.target.value)} />
                <TextField fullWidth label="Benefits Details" multiline rows={3} variant="outlined" value={offer.benefits} onChange={(e) => handleChange(index, 'benefits', e.target.value)} />
              </Paper>
            </Grid>
          ))}
          
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
            <Button variant="outlined" startIcon={<AddCircleOutlineIcon />} onClick={handleAddOffer}>
              Add Another Offer
            </Button>
            <Button type="submit" variant="contained" size="large" disabled={isLoading} startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <CompareArrowsIcon />}>
              Compare Offers
            </Button>
          </Grid>
        </Grid>
      </form>

      {result && !isLoading && (
        <Box sx={{ mt: 8 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 4, textAlign: 'center' }}>AI Comparison Dashboard</Typography>
          
          <Paper sx={{ p: 4, mb: 4, borderRadius: 4, background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(14, 165, 233, 0.1))', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <EmojiEventsIcon sx={{ fontSize: 40, color: '#fbbf24' }} />
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Final Recommendation</Typography>
            </Box>
            <Typography variant="body1" sx={{ fontSize: '1.2rem', lineHeight: 1.6, mb: 4 }}>
              {result.recommendation}
            </Typography>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 3 }} />

            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, color: '#3b82f6' }}>Negotiation Lever</Typography>
            <Typography variant="body1">
              {result.negotiationLever}
            </Typography>
          </Paper>

          <Grid container spacing={4} sx={{ justifyContent: 'center' }}>
            {result.offers.map((o, i) => (
              <Grid item xs={12} md={6} lg={4} key={i}>
                <Card sx={{ height: '100%', background: 'rgba(30, 41, 59, 0.5)', borderRadius: 3, border: '1px solid rgba(255,255,255,0.1)' }}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>{o.companyName}</Typography>
                    <Typography variant="h4" sx={{ color: '#10b981', fontWeight: 'bold', mb: 4 }}>
                      ${o.totalCompensation.toLocaleString()} <Typography component="span" variant="body1" sx={{ color: 'text.secondary' }}>/ yr</Typography>
                    </Typography>

                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#34d399', mb: 1 }}>Pros</Typography>
                    <ul style={{ paddingLeft: 20, color: '#cbd5e1', marginBottom: 24 }}>
                      {o.pros.map((p, j) => <li key={j}>{p}</li>)}
                    </ul>

                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#f87171', mb: 1 }}>Cons</Typography>
                    <ul style={{ paddingLeft: 20, color: '#cbd5e1', margin: 0 }}>
                      {o.cons.map((c, j) => <li key={j}>{c}</li>)}
                    </ul>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Container>
  );
};
