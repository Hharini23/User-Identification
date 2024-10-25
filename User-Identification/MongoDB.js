const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const app = express();
const port = process.env.PORT || 4055;

app.use(bodyParser.urlencoded({ extended: true }));

const mongoUrl = "mongodb://localhost:27017";
const dbName = "mydatabase";
let db;

MongoClient.connect(mongoUrl)
  .then((client) => {
    db = client.db(dbName);
    console.log(`Connected to MongoDB: ${dbName}`);
  })
  .catch((err) => console.error("Failed to connect to MongoDB", err));

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "lathikak.22cse@kongu.edu",
    pass: "Lathika143143",
  },
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/User Identification.html");
});

app.post("/insert", async (req, res) => {
  const { username, name, email, pass, cpass, phone } = req.body;
  if (!db) {
    res.status(500).send("Database not initialized");
    return;
  }
  try {
    const existingUser = await db.collection("items").findOne({ $or: [{ username }, { email }]
    
    });
    if (existingUser) {
      res.send("Account with this username or email already exists.");
    } else {
      const newUser = { username, name, email, pass, cpass, phone };
      await db.collection("signup_requests").insertOne(newUser);

      const admin = await db.collection("admins").findOne({});
      if (admin) {
        const mailOptions = {
          from: "lathikak.22cse@kongu.edu",
          to: admin.email,
          subject: "New User Sign-Up Request",
          text: `A new user has requested to sign up.\n\nUsername: ${username}\nName: ${name}\nEmail: ${email}\n${pass}\nPassword: ${pass}\nPhone: ${phone}\n\nPlease log in to the admin dashboard to approve or reject this request.`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error("Error sending email:", error);
            res.status(500).send("Failed to send sign-up request");
          } else {
            console.log("Email sent:", info.response);
            res.send("Sign-up request sent to admin for approval.");
          }
        });
      } else {
        res.send("Admin not found. Please contact support.");
      }
    }
  } catch (err) {
    console.error("Error inserting data:", err);
    res.status(500).send("Failed to insert data");
  }
});

app.get("/admin/requests", async (req, res) => {
  try {
    const requests = await db.collection("signup_requests").find().toArray();
    let tableContent = `
      <h1>Sign-Up Requests</h1>
      <table border='1'>
        <tr>
          <th>Username</th>
          <th>Name</th>
          <th>Email</th>
          <th>Pass</th>
          <th>Phone</th>
          <th>Action</th>
        </tr>`;
    tableContent += requests.map(request => `
      <tr>
        <td>${request.username}</td>
        <td>${request.name}</td>
        <td>${request.email}</td>
        <td>${request.pass}</td>
        <td>${request.phone}</td>
        <td>
          <form action="/admin/approve" method="post" style="display:inline;">
            <input type="hidden" name="id" value="${request._id}">
            <button type="submit">Approve</button>
          </form>
          <form action="/admin/reject" method="post" style="display:inline;">
            <input type="hidden" name="id" value="${request._id}">
            <button type="submit">Reject</button>
          </form>
        </td>
      </tr>`).join("");
    tableContent += `
      </table>
      <a href='/'>Back to form</a>`;
    res.send(tableContent);
  } catch (err) {
    console.error("Error fetching data:", err);
    res.status(500).send("Failed to fetch data");
  }
});

app.post("/admin/approve", async (req, res) => {
  const { id } = req.body;
  try {
    const request = await db.collection("signup_requests").findOne({ _id: new ObjectId(id) });
    if (request) {
      await db.collection("items").insertOne(request);
      await db.collection("signup_requests").deleteOne({ _id: new ObjectId(id) });
      res.send("User approved and added to the database.");
    } else {
      res.send("Sign-up request not found.");
    }
  } catch (err) {
    console.error("Error approving user:", err);
    res.status(500).send("Failed to approve user");
  }
});

app.post("/admin/reject", async (req, res) => {
  const { id } = req.body;
  try {
    await db.collection("signup_requests").deleteOne({ _id: new ObjectId(id) });
    res.send("User sign-up request rejected.");
  } catch (err) {
    console.error("Error rejecting user:", err);
    res.status(500).send("Failed to reject user");
  }
});

app.get("/report", async (req, res) => {
  try {
    const items = await db.collection("items").find().toArray();
    let tableContent = `
      <h1>Report</h1>
      <table border='1'>
        <tr>
          <th>Username</th>
          <th>Name</th>
          <th>Email</th>
          <th>Password</th>
          <th>Confirm Password</th>
          <th>Phone</th>
          <th>Login Attempts</th>
          <th>Last Login Attempt</th>
        </tr>`;
    tableContent += items.map(item => `
      <tr>
        <td>${item.username}</td>
        <td>${item.name}</td>
        <td>${item.email}</td>
        <td>${item.pass}</td>
        <td>${item.cpass}</td>
        <td>${item.phone}</td>
        <td>${item.loginAttempts}</td>
        <td>${item.lastLoginAttempt ? new Date(item.lastLoginAttempt).toLocaleString() : 'N/A'}</td>
      </tr>`).join("");
    tableContent += `
      </table>
      <a href='/'>Back to form</a>`;
    res.send(tableContent);
  } catch (err) {
    console.error("Error fetching data:", err);
    res.status(500).send("Failed to fetch data");
  }
});

app.post("/login", async (req, res) => {
  const { username, email, pass } = req.body;
  if (!db) {
    res.status(500).send("Database not initialized");
    return;
  }
  try {
    const user = await db.collection("items").findOne({ username, email });
    if (user) {
      const currentTime = new Date();
      const lockoutDuration = 3600000; // 1 hour in milliseconds

      if (user.loginAttempts >= 5 && currentTime - new Date(user.lastLoginAttempt) < lockoutDuration) {
        res.send("You have been locked out due to too many failed login attempts. Please try again after one hour.");
        return;
      }

      if (user.pass === pass) {
        await db.collection("items").updateOne(
          { username, email },
          { $set: { loginAttempts: 0, lastLoginAttempt: null } }
        );
        res.redirect("/dashboard");
      } else {
        const updatedLoginAttempts = user.loginAttempts + 1;
        await db.collection("items").updateOne(
          { username, email },
          { $set: { loginAttempts: updatedLoginAttempts, lastLoginAttempt: currentTime } }
        );
        res.send("Invalid username, email, or password");
      }
    } else {
      res.send("Invalid username, email, or password");
    }
  } catch (err) {
    console.error("Error logging in:", err);
    res.status(500).send("Failed to log in");
  }
});

app.get("/dashboard", (req, res) => {
  res.sendFile(__dirname + "/Dress shop.html");
});

app.post("/reset_password", async (req, res) => {
  const { username, email, newPass, confirmNewPass } = req.body;
  if (!db) {
    res.status(500).send("Database not initialized");
    return;
  }
  if (newPass !== confirmNewPass) {
    res.send("Passwords do not match");
    return;
  }
  try {
    const result = await db.collection("items").updateOne(
      { username, email },
      { $set: { pass: newPass, cpass: confirmNewPass, loginAttempts: 0, lastLoginAttempt: null } }
    );
    if (result.matchedCount > 0) {
      res.send("Password updated successfully!");
    } else {
      res.send("Username or email not found");
    }
  } catch (err) {
    console.error("Error resetting password:", err);
    res.status(500).send("Failed to reset password");
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
