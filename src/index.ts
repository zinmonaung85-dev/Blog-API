const express = require("express");
const dotenv = require("dotenv");

dotenv.config();

const PORT = process.env.PORT;
const app = express();

if (!PORT) {
    throw new Error("PORT is not provided");
}

app.listen(Number(PORT), () => {
    console.log(`✅ Express server running at http://localhost:${PORT}`);
});