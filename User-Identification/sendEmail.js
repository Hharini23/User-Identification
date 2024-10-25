const nodemailer = require("nodemailer");

async function sendEmail() {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: "klathika033@gmail.com",
      pass: "Lathika107107",
    },
  });

  const mailOptions = {
    from: "klathika033@gmail.com",
    to: "lathikak.22cse@kongu.edu",
    subject: "Test Email",
    text: "This is a test email.",
  };

  try {
    let info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

sendEmail();
