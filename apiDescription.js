import express from "express";
import axios from "axios";
//free google ai studio(gemini ai)
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = 3000;

const apiKey = process.env.GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.get("/description/:book", async (req, res) => {
  const bookName = req.params.book;
  //   res.json(req.params);
  console.log(bookName);

  const prompt = `write description for the book name called ${bookName} in 120 words`;

  const result = await model.generateContent(prompt);
  // console.log(result.response.text());
  res.json({
    book: bookName,
    description: result.response.candidates[0].content.parts[0].text,
  });
});

app.get("/notes/:book", async (req, res) => {
  const bookName = req.params.book;
  console.log(bookName);

  const prompt = `write complete notes for the book name called ${bookName}, the output format should only one paragraph including every pages  of the book, give output of 1000 words with no heading and don't use ##, ** in the result you generate`;

  const result = await model.generateContent(prompt);
  console.log(result.response.text());
  res.json({
    book: bookName,
    notes: result.response.candidates[0].content.parts[0].text,
  });
});

app.listen(port, (req, res) => {
  console.log(`Custom API is running on port ${port}`);
});
