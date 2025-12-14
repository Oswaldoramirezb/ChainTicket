import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'TicketChain API is running' });
});

app.get('/api/events', (req, res) => {
  res.json({
    events: [
      {
        id: '1',
        name: 'VIP Night at The Lounge',
        description: 'Exclusive VIP access to the rooftop lounge',
        ticketPrice: '0.05',
        currency: 'MOVE',
        totalTickets: 100,
        soldTickets: 45,
        date: '2024-12-28',
      },
    ],
  });
});

app.post('/api/ai/recommend', (req, res) => {
  const { businessType, averageCustomers, eventType } = req.body;
  
  const recommendation = {
    suggestedTickets: Math.ceil((averageCustomers || 100) * 1.2),
    reasoning: `Based on your ${businessType || 'business'} type and average of ${averageCustomers || 100} customers, we recommend creating slightly more tickets to account for increased demand.`,
    priceRange: {
      min: '0.01',
      max: '0.1',
      currency: 'MOVE',
    },
  };
  
  res.json(recommendation);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend API running on port ${PORT}`);
});
