import "dotenv/config"; // must be first so env is loaded
import { sendOtp } from "./mailer.js";

const email = process.env.TEST_EMAIL || "ney1673@dlsud.edu.ph";

sendOtp({ to: email, code: "654321" })
  .then((info) => {
    console.log("OK:", info.messageId || info);
    process.exit(0);
  })
  .catch((e) => {
    console.error("FAIL:", e.message);
    process.exit(1);
  });
