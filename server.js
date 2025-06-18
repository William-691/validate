import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import axios from "axios";
import { Buffer } from "node:buffer";

dotenv.config();

const app = express();
// eslint-disable-next-line no-undef
const PORT = process.env.PORT || 5000;
// eslint-disable-next-line no-undef
const FLIP_API_KEY = process.env.FLIP_API_KEY;

app.use(cors());
app.use(bodyParser.json());

// Validate rekening endpoint using Flip API (HTTP Basic Auth)
app.post("/api/validate-rekening", async (req, res) => {
    const { bankCode, accountNumber } = req.body;

    if (!bankCode || !accountNumber) {
        return res.status(400).json({ error: "Bank code and account number are required." });
    }

    if (!FLIP_API_KEY) {
        return res.status(500).json({ error: "FLIP_API_KEY is not set in environment." });
    }

    try {
        const encodedAuth = Buffer.from(`${FLIP_API_KEY}:`).toString("base64");

        const response = await axios.post(
            "https://bigflip.id/big_sandbox_api/v2/disbursement/bank-account-inquiry",
            new URLSearchParams({
                bank_code: bankCode,
                account_number: accountNumber,
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
            account_holder,
            account_number,
        });
    } catch (err) {
        console.error("Flip API Error:", err.response?.data || err.message);
        res.status(500).json({ error: "Failed to validate rekening." });
    }
});

app.get("/", (req, res) => {
    res.send("Hello");
});

app.post("/api/flip-callback", (req, res) => {
    const tokenFromFlip = req.headers["x-callback-token"];
    // eslint-disable-next-line no-undef
    if (tokenFromFlip !== process.env.FLIP_CALLBACK_TOKEN) {
        return res.status(403).send("Invalid callback token");
    }
    // Save or process req.body here
    res.status(200).send("OK");
});

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
