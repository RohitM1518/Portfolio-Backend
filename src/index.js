import { app } from './app.js';
import connectDB from './database/connectDatabase.js';

const PORT = process.env.PORT || 8001;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Portfolio Backend Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.log(`Error: ${error.message}`);
  }); 