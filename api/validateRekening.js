import axios from "axios";

export async function validateRekening(bankCode, accountNumber) {
    // eslint-disable-next-line no-undef
    const FLIP_API_KEY = process.env.FLIP_API_KEY;

    if (!FLIP_API_KEY) throw new Error("FLIP_API_KEY is not set.");

    const response = await axios.post(
        "https://gateway.flip.id/v2/disbursement/bank-account-inquiry",
        {
            bank_code: bankCode,
            account_number: accountNumber,
        },
        {
            headers: {
                Authorization: `Bearer ${FLIP_API_KEY}`,
                "Content-Type": "application/json",
            },
        }
    );

    return response.data;
}
