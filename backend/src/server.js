import dotenv from 'dotenv';
import app from './app.js';
import connectDB from './config/database.js';
import swaggerDocs from './config/swegger.js';

dotenv.config();
const PORT = 5000;

const startServer = async () => {
  await connectDB();
  swaggerDocs(app);
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
};

startServer();
