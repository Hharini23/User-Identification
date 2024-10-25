const session = require("express-session");

app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));

app.get("/admin/login", (req, res) => {
  res.sendFile(__dirname + "/admin_login.html");
});

app.post("/admin/login", async (req, res) => {
  const { email, password } = req.body;
  if (!db) {
    res.status(500).send("Database not initialized");
    return;
  }
  try {
    const admin = await db.collection("admins").findOne({ email, password });
    if (admin) {
      req.session.admin = admin;
      res.redirect("/admin/requests");
    } else {
      res.send("Invalid email or password");
    }
  } catch (err) {
    console.error("Error logging in:", err);
    res.status(500).send("Failed to log in");
  }
});
