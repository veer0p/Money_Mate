const { exec } = require("child_process");
const express = require("express");
const app = express();
const port = 3000;

app.use(express.json());

app.post("/spending_pattern", (req, res) => {
    const messages = req.body.messages;

    if (!messages) {
        console.error("Error: Missing messages in request");
        return res.status(400).json({ error: "Messages are required" });
    }

    const messagesJson = JSON.stringify(messages);

    console.log("Sending to Python:", messagesJson);

    const pythonProcess = exec("python sp1.py", (error, stdout, stderr) => {
        console.log("Python stdout:", stdout);
        console.error("Python stderr:", stderr);

        if (error) {
            console.error(`Execution Error: ${error.message}`);
            return res.status(500).json({ error: "Python execution failed" });
        }
        if (stderr) {
            console.error(`Python Script Error: ${stderr}`);
            return res.status(500).json({ error: "Python script error" });
        }

        try {
            const result = JSON.parse(stdout);
            res.json(result);
        } catch (err) {
            console.error(`Error parsing Python output: ${err}`);
            res.status(500).json({ error: "Failed to parse analysis result" });
        }
    });

    pythonProcess.stdin.write(messagesJson);
    pythonProcess.stdin.end();
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
