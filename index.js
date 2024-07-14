import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import axios from "axios";

const app = express();
const port = 3000;

const db = new pg.Client({
    user: "postgres",
    password: "YourPasswordHere",
    host: "localhost",
    port: 5432,
    database: "bookTracker"
});

db.connect();

app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded( {extended: true } ));
app.use(express.static("public"));

app.get("/", async (req, res) => {
    const result = await db.query("SELECT * FROM book");
    console.log(result.rows);
    res.render("index.ejs", { books: result.rows });
});

app.post("/search", async (req, res) => {
    const query = req.body.query;
    try {
        const response = await axios.get(`https://openlibrary.org/search.json?q=${query}`);
        const results = response.data.docs.map(item => {
            const isbn = Array.isArray(item.isbn) && item.isbn.length > 0 ? item.isbn[0] : null;
            return {
                title: item.title,
                author: item.author_name ? item.author_name.join(', ') : 'Unknown',
                key: item.key.replace("/works/", ""),
                image: isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg` : 'https://covers.openlibrary.org/b/isbn/default-M.jpg'
            };
        });
        res.render('searchResults.ejs', { results });
    } catch (error) {
        console.error("Error fetching data:", error);
        res.render('error', { message: 'Error fetching data' });
    }
});

app.post("/add", async (req, res) => {
    const { title, author, key, image, ratings } = req.body;
    try {
        await db.query("INSERT INTO book (title, author, key, image, ratings) VALUES ($1, $2, $3, $4, $5)", [title, author, key, image, ratings]);
        res.redirect("/");
    } catch (error) {
        console.error("Error adding book:", error);
        res.render('error', { message: 'Error adding book' });
    }
});

// app.post("/add", async (req, res) => {
//     const { title, author, key, image } = req.body;
//     await db.query("INSERT INTO book (title, author, key, image) VALUES ($1, $2, $3, $4)", [title, author, key, image]);
//     res.redirect("/");
// });


app.delete("/delete", async (req, res) => {
    console.log("dfddd");
    const id  = req.body.id;
    console.log(id);
    try {
        await db.query("DELETE FROM book WHERE id = $1", [id]);
        res.json({ success: true });
    } catch (error) {
        console.error("Error deleting book:", error);
        res.status(500).json({ success: false });
    }
});

app.listen(port, () =>{
    console.log(`server running on port ${port}`);
});