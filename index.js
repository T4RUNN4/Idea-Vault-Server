const express = require("express");
const dotenv = require("dotenv");
const { MongoClient, ServerApiVersion } = require("mongodb");
dotenv.config();

const uri = process.env.MONGO_URI;
const app = express();
const PORT = process.env.PORT;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const db = client.db("idea-vault");
    const collection = db.collection("ideas");

    app.post("/ideas", async (req, res) => {
      const idea = req.body;
      const result = await collection.insertOne(idea);

      res.json(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("App is running!");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
