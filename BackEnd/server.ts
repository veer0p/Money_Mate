import dotenv from "dotenv";
dotenv.config();

import app from "./src/index";
import { sequelize } from "./src/config/db"; // ✅ Import Sequelize connection

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await sequelize.authenticate(); // ✅ Ensure database connection is valid
    console.log("✅ Database connected successfully!");

    await sequelize.sync({ alter: true }); // ✅ Sync models with database (use { force: true } to drop & recreate tables)
    console.log("🔄 Database synchronized!");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1); // Exit process if DB connection fails
  }
};

startServer();
