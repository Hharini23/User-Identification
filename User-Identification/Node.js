const nodemailer = require("nodemailer");
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
      username: "Lathika",
      email: "klathika033@gmail.com",
      password: "Lathika107107" // You can hash this password for better security
    };

    const result = await adminsCollection.insertOne(admin);
    console.log("Admin created:", result.insertedId);
  } catch (err) {
    console.error("Error creating admin:", err);
  } finally {
    await client.close();
  }
}

async function sendEmail() {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: "your-email@gmail.com",
      pass: "your-app-password",
    },
  });

  const mailOptions = {
    from: "your-email@gmail.com",
    to: "admin-email@gmail.com",
    subject: "Test Email",
    text: "This is a test email.",
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.error("Error sending email:", error);
    }
    console.log("Email sent:", info.response);
  });
}

createAdmin();
sendEmail();
