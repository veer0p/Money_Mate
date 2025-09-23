import { spawn } from 'child_process';
import path from 'path';

export class PythonProcessor {
    private pythonPath: string;
    private scriptPath: string;

    constructor() {
        this.pythonPath = 'python';
        this.scriptPath = path.join(__dirname, '../../../data_processing/run_extraction.py');
    }

    async processMessages(limit: number | null = null): Promise<{ processed: number; transactions: number }> {
        return new Promise((resolve, reject) => {
            const args = [this.scriptPath];
            if (limit) {
                args.push('--limit', limit.toString());
            }
            const pythonProcess = spawn(this.pythonPath, args, {
                env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
            });
            
            let output = '';
            let errorOutput = '';

            pythonProcess.stdout.on('data', (data) => {
                output += data.toString();
                console.log(`🐍 ${data.toString().trim()}`);
            });

            pythonProcess.stderr.on('data', (data) => {
                errorOutput += data.toString();
                console.error(`🐍 Error: ${data.toString().trim()}`);
            });

            pythonProcess.on('close', (code) => {
                if (code === 0) {
                    // Parse output for results
                    const processedMatch = output.match(/processed (\d+) messages/);
                    const transactionsMatch = output.match(/created (\d+) transactions/);
                    
                    resolve({
                        processed: processedMatch ? parseInt(processedMatch[1]) : 0,
                        transactions: transactionsMatch ? parseInt(transactionsMatch[1]) : 0
                    });
                } else {
                    reject(new Error(`Python process failed with code ${code}: ${errorOutput}`));
                }
            });

            pythonProcess.on('error', (error) => {
                reject(new Error(`Failed to start Python process: ${error.message}`));
            });
        });
    }
}