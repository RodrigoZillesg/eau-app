import app from './app-simple';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Simplified EAU Backend running on port ${PORT}`);
  console.log(`🚀 Health Check: http://localhost:${PORT}/health`);
});

export default app;