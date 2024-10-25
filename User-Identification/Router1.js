const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const User = require('./models/User'); 

const app = express();
const router = express.Router();

mongoose.connect('mongodb://localhost:27017/your_database_name', { useNewUrlParser: true, useUnifiedTopology: true });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

router.post("/MongoDB", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.body.username });
    if (user) {
      return res.status(400).json({
        message: "This user is already registered",
        data: {}
      });
    }
    res.status(200).json({
      message: "Login successful",
      data: user
    });
  } catch (err) {
    res.status(500).json({
      message: "An error occurred",
      error: err.message
    });
  }
});

app.use('/', router);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
