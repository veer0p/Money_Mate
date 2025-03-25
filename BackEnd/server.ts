import dotenv from "dotenv";
dotenv.config();

import app from "./src/index";
import { sequelize } from "./src/config/db"; // ✅ Import Sequelize connection

// Ensure PORT is a number
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const startServer = async () => {
  try {
    await sequelize.authenticate(); // ✅ Ensure database connection is valid
    console.log("✅ Database connected successfully!");

    await sequelize.sync({ alter: false }); // ✅ Sync models with database (use { force: true } to drop & recreate tables)
    console.log("🔄 Database synchronized!");

    app.listen(PORT, "0.0.0.0", () => {
      // ✅ Bind to 0.0.0.0 for network accessibility
      console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
      console.log(
        `📱 Accessible on your local network at http://${getIPAddress()}:${PORT}`
      );
    });
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1); // Exit process if DB connection fails
  }
};

// Helper function to get the local IP address
function getIPAddress(): string {
  // const os = require("os");
  // const interfaces = os.networkInterfaces();
  // for (const interfaceName in interfaces) {
  //   const iface = interfaces[interfaceName];
  //   for (const alias of iface) {
  //     if (alias.family === "IPv4" && !alias.internal) {
  //       return alias.address;
  //     }
  //   }
  // }
  return "192.168.164.6"; // Fallback to localhost if no IP is found
}

startServer();
