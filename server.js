import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import axios from "axios";
import { Buffer } from "node:buffer";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const FLIP_API_KEY = process.env.FLIP_API_KEY;
const CALLBACK_TOKEN = process.env.FLIP_CALLBACK_TOKEN;

app.use(cors());
app.use(bodyParser.json());

// ✅ Root Test
app.get("/", (req, res) => {
  res.send("Flip API is running");
});

// ✅ Validate Rekening API
app.post("/api/validate-rekening", async (req, res) => {
  let { bankCode, accountNumber, inquiry_key } = req.body;

  if (!bankCode || !accountNumber) {
    return res.status(400).json({
      error: "Bank code and account number are required.",
    });
  }

  // Auto-generate inquiry_key if not provided
  if (!inquiry_key) {
    inquiry_key = `inquiry_${Date.now()}`;
  }

  if (!FLIP_API_KEY) {
    return res
      .status(500)
      .json({ error: "FLIP_API_KEY is not set in environment." });
  }

  try {
    const encodedAuth = Buffer.from(`${FLIP_API_KEY}:`).toString("base64");

    const response = await axios.post(
      "https://bigflip.id/big_sandbox_api/v2/disbursement/bank-account-inquiry",
      new URLSearchParams({
        bank_code: bankCode,
        account_number: accountNumber,
        inquiry_key,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          Authorization: `Basic ${encodedAuth}`,
        },
      }
    );

    const { account_holder, account_number } = response.data;

    res.json({
      inquiry_key,
      account_holder,
      account_number,
    });
  } catch (err) {
    console.error("Flip API Error:", err.response?.data || err.message);
    res.status(500).json({
      error: "Failed to validate rekening.",
      detail: err.response?.data || err.message,
    });
  }
});

// ✅ Flip Callback Endpoint
app.post("/api/flip-callback", (req, res) => {
  const tokenFromFlip = req.headers["x-callback-token"];

  if (tokenFromFlip !== CALLBACK_TOKEN) {
    return res.status(403).send("Invalid callback token");
  }

  console.log("🔔 Flip Callback Received:", req.body);
  res.status(200).send("OK");
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
