const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

dotenv.config();

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: "https://fantastic-meme-rj5w9pwj7462x6vx-3000.app.github.dev",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

const PORT = process.env.PORT || 5000;
const uri = process.env.MONGO_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let collection;

async function run() {
  try {
    // await client.connect();

    const db = client.db("idea-vault");
    collection = db.collection("ideas");

    app.post("/ideas", async (req, res) => {
      const idea = req.body;
      const result = await collection.insertOne(idea);

      res.json(result);
    });

    app.get("/", (req, res) => {
      res.send("App is running!");
    });

    app.get("/ideas", async (req, res) => {
      const ideas = await collection.find().toArray();
      res.json(ideas);
    });

    app.get("/ideas/trending", async (req, res) => {
      const trendingIdeas = await collection
        .aggregate([{ $match: { isTrending: true } }, { $limit: 6 }])
        .toArray();

      res.json(trendingIdeas);
    });

    app.get("/ideas/:email", async (req, res) => {
      const email = req.params.email;
      const userIdeas = await collection.find({ user: email }).toArray();
      res.json(userIdeas);
    });

    app.get("/ideas/:id", async (req, res) => {
      const { id } = req.params;
      const idea = await collection.findOne({ _id: new ObjectId(id) });
      res.json(idea);
    });


    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } finally {
    // await client.close();
  }
}

run().catch(console.dir);
