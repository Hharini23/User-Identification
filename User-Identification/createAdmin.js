const { MongoClient } = require("mongodb");

const mongoUrl = "mongodb://localhost:27017";
const dbName = "mydatabase";

async function createAdmin() {
  const client = new MongoClient(mongoUrl);

  try {
    await client.connect();
    const db = client.db(dbName);
    const adminsCollection = db.collection("admins");

    const admin = {
      username: "Lathika K",
      email: "lathikak.22cse@kongu.edu",
      password: "Lathika143143" // You can hash this password for better security
    };

    const result = await adminsCollection.insertOne(admin);
    console.log("Admin created:", result.insertedId);
  } catch (err) {
    console.error("Error creating admin:", err);
  } finally {
    await client.close();
  }
}

createAdmin();
