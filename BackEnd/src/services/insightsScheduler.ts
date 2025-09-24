import { spawn } from 'child_process';
import * as cron from 'node-cron';
import path from 'path';

class InsightsScheduler {
  private isRunning = false;

  start() {
    if (this.isRunning) return;
    
    console.log('Starting insights scheduler...');
    
    // Schedule daily processing at midnight
    cron.schedule('0 0 * * *', () => {
      this.processAllUsers();
    });
    
    // Run initial processing on startup
    setTimeout(() => {
      this.processAllUsers();
    }, 5000); // Wait 5 seconds after server start
    
    this.isRunning = true;
    console.log('Insights scheduler started successfully');
  }

  private processAllUsers() {
    console.log('Processing insights for all users...');
    
    const scriptPath = path.join(__dirname, '../../../data_processing/insights_processor.py');
    const process = spawn('python3', [scriptPath]);
    
    process.stdout.on('data', (data) => {
      console.log(`Insights processing: ${data}`);
    });
    
    process.stderr.on('data', (data) => {
      console.error(`Insights processing error: ${data}`);
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        console.log('Insights processing completed successfully');
      } else {
        console.error(`Insights processing failed with code ${code}`);
      }
    });
  }
}

export default new InsightsScheduler();