import axios from "axios";
import pg from "pg";
import bodyParser from "body-parser";
import express, { query } from "express";
import ejs from "ejs";

const db = new pg.Client({
  user: "postgres",
  password: "password",
  host: "localhost",
  port: "5432",
  database: "the-book-shelf",
});

db.connect()
  .then(() => console.log("Connected to DB"))
  .catch((err) => console.log(err.stack));

const app = express();
const port = 5000;

app.set("views", "./views");
app.set("view engine", "ejs");

// app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.redirect("/home");
});

app.get("/home", async (req, res) => {
  const queryResult = await db.query("SELECT * FROM contents");
  const bookDetails = queryResult.rows;
  // console.log(bookDetails);

  res.render("home.ejs", { books: bookDetails });
});

app.get("/add", (req, res) => {
  res.render("add.ejs");
});

app.post("/handleDelete", async (req, res) => {
  const reqBody = req.body.book;
  // console.log(reqBody);
  try {
    await db.query("DELETE FROM contents WHERE id=$1", [reqBody]);
  } catch (error) {
    console.log("Error while deleting single book: ", error.message);
  }
  res.redirect("/delete");
});

app.get("/delete", async (req, res) => {
  const queryResult = await db.query("SELECT * FROM contents");
  const bookDetails = queryResult.rows;
  if (bookDetails.length > 0) res.render("delete.ejs", { books: bookDetails });
  else res.render("delete.ejs");
});

app.post("/new-book", async (req, res) => {
  // console.log(req.body);
  var book = req.body.title;
  var notes = "";
  const ratings = parseInt(req.body.ratings);
  const queryBook = book.split().join("+");
  let description = "";

  // this makes api request to get the book details using book name
  const response = await axios.get(
    `https://openlibrary.org/search.json?q=${queryBook}&fields=*,availability&limit=1`
  );
  const author = req.body.author
    ? req.body.author
    : response.data.docs[0]["author_name"][0];
  // console.log(author);
  const coverId = response.data.docs[0]["cover_i"];
  const isbn = parseInt(response.data.docs[0]["isbn"][0]);

  book = response.data.docs[0]["title"];
  // console.log(coverId);
  // console.log(isbn);

  // schema has id, title, author, cover_url, description, notes, rating, uid
  // await db.query("INSERT INTO contents(title, author, cover_url)");

  //make get request to my custom built api to get description
  try {
    let bookWithoutSpaces = book.split().join("%20");
    console.log(book);
    const resultDescription = await axios.get(
      `http://localhost:3000/description/${bookWithoutSpaces}`
    );
    // console.log(resultDescription.data);
    description = resultDescription.data.description;
  } catch (err) {
    console.log(
      "Error while fetching description from your API :",
      err.message
    );
  }

  //making get request to for notes if note form data is empty
  if (req.body.notes) notes = req.body.notes;
  else
    try {
      let bookWithoutSpaces = book.split().join("%20");
      const resultDescription = await axios.get(
        `http://localhost:3000/notes/${bookWithoutSpaces}`
      );
      // console.log(resultDescription.data);
      notes = resultDescription.data.notes;
    } catch (err) {
      console.log("Error while fetching notes from your API :", err.message);
    }

  //this block adds the form data to the DB
  try {
    await db.query(
      "INSERT INTO contents(title, author, description, notes, rating, uid, isbn, coverId) VALUES($1, $2, $3, $4, $5, $6, $7,$8)",
      [book, author, description, notes, ratings, 2, isbn, coverId]
    );
    console.log("Row added to the table");
  } catch (err) {
    console.log("Error while quering : ", err.message);
  }

  res.redirect("/home");
});

app.post("/edit-book", (req, res) => {
  const id = parseInt(req.body.id);
  const newTitle = req.body.title;
  const newAuthor = req.body.author;
  const newNotes = req.body.notes;
  const newRating = req.body.ratings;

  try {
    const queryResult = db.query(
      "UPDATE contents SET title=$1, author=$2, notes=$3, rating=$4 WHERE id = $5",
      [newTitle, newAuthor, newNotes, newRating, id]
    );
    console.log("Book ID:", id, "Edit Successful");
  } catch (error) {
    console.log("Error while editing:", error.message);
  }
  res.redirect(`/home`);
});

app.get("/notes/:id", async (req, res) => {
  // console.log(req.params);
  const id = req.params.id;
  let resRows = "";
  try {
    const queryResult = await db.query("SELECT * FROM contents WHERE id=$1", [
      id,
    ]);
    resRows = queryResult.rows;
    if (resRows.length > 0) {
      // console.log(resRows);
    }
  } catch (error) {
    console.log("Error while querying for notes: ", error.message);
  }
  res.render("notes.ejs", { book: resRows[0] });
});

app.post("/deleteAll", async (req, res) => {
  try {
    await db.query("DELETE FROM contents ");
  } catch (error) {
    console.log("Error while deleting single book: ", error.message);
  }
  res.redirect("/delete");
});

app.get("/search", (req, res) => {
  res.render("search.ejs");
});

app.post("/searchQuery", (req, res) => {
  console.log(req.body);
  res.send(req.body);
});

app.listen(port, (req, res) => {
  console.log(`Sever is running on port http://localhost:${port}`);
});
