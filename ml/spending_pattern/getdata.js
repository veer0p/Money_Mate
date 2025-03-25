const Sentiment = require("sentiment");
const sentiment = new Sentiment();

app.get("/spending_pattern", (req, res) => {
    const filePath = "uploads/17108458910.csv";

    let results = [];
    fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (data) => {
            let analysis = sentiment.analyze(data.Category || "");
            data.SentimentScore = analysis.score;
            results.push(data);
        })
        .on("end", () => {
            res.json({ message: "Sentiment Analysis Complete", data: results });
        })
        .on("error", (error) => {
            res.status(500).json({ error: error.message });
        });
});
