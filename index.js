const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { jwtVerify, createRemoteJWKSet } = require("jose-cjs");

dotenv.config();

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
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

const JWKS = createRemoteJWKSet(
  new URL(`process.env.CLIENT_URL${"/api/auth/jwks"}`),
);

const verifyJWT = async (req, res, next) => {
  const header = req?.headers.authorization;
  if (!header) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = header.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { payload } = await jwtVerify(token, JWKS);
    next();
  } catch (error) {
    return res.status(403).json({ error: "Forbidden" });
  }
};

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

    app.get("/ideas/:id", verifyJWT, async (req, res) => {
      const { id } = req.params;
      const idea = await collection.findOne({ _id: new ObjectId(id) });
      res.json(idea);
    });

    app.patch("/ideas/:id", async (req, res) => {
      const { id } = req.params;
      const updatedIdea = req.body;

      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedIdea },
      );

      res.json(result);
    });

    app.delete("/ideas/:id", async (req, res) => {
      const { id } = req.params;
      const result = await collection.deleteOne({ _id: new ObjectId(id) });
      res.json(result);
    });

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } finally {
    // await client.close();
  }
}

run().catch(console.dir);
