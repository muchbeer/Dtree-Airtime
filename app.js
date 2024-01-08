//jshint esversion:6
import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import 'dotenv/config'

const app = express();
const port = 3000;
const salt = 10;

const db = new pg.Client( { 
	user: process.env.DB_USER,
	host: process.env.DB_HOST,
	database: process.env.DB_DATABASE,
	password: process.env.DB_PASSWORD,
	port: 5432
	
 });

 db.connect();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded( {
    extended: true
} ));

async function checkDB() {
    const result = await db.query("SELECT * FROM dtree_users");
    const record = result.rows;

    record.forEach((users) => {
        console.log(`The users are now : ${users.email}`);
    });
}

console.log(process.env.DB_HOST);

app.get("/", (req, res) => {
    res.render("home");
});

app.get("/login", (req, res) => {
        checkDB();
    res.render("login");
});

app.post("/login",  async (req, res) => {
    const user = req.body.username;
    const password = req.body.password;

    try {

        const sql = "SELECT * FROM dtree_users WHERE LOWER(email) = $1;"
        const values = [user]
        
        // const sql_old = "SELECT * FROM dtree_users WHERE LOWER(email) = $1 AND LOWER(pass) = $2;"
          db.query( sql , values, async (err, data) => {
            if(err) {
                console.log(err)
               return res.render("login");
            } 

            if(record.length > 0) {
                bcrypt.compare(password.toString(), record[0].pass, (err, response) => {
                    console.log(`Entered bcrypt and data is  : ${record[0].pass}`);
                    if(err) {
                        console.log(`Output error with err inside bcrypt is : ${err}`);
                       return res.redirect("/login");
                    } else if (response) {
                        console.log(`Login successful, the data output is : ${response}`);
                      return  res.render("secrets");
                    } else {
                        console.log( `The response is : ${response}`)
                      return  res.redirect("/login");
                    }   
                })
                
            }
        });

        
    } catch(err) {
        console.log(err);
    }
})

app.get("/register", (req, res) => {
    res.render("register")
});

app.post("/register", async (req, res) => {

    const first = req.body.firstname;
    const last = req.body.lastname;
    const email = req.body.username;
    const pass = req.body.password;
    
    try {
        const sql = "INSERT INTO dtree_users (first_name, last_name, email, pass) VALUES ($1, $2, $3, $4)";  

        bcrypt.hash(pass.toString(), process.env.HASH_SALT, async (err, hash) => {
            if(err) {
                console.log(err);
                res.render("register");
            }
            const values = [ first, last, email, hash ]

            await db.query( sql , values);

        });
        
        res.redirect("/login");
      } catch (err) {
        console.log(err);
      }
    res.render("register");
});

app.get("/secrets", (req, res) => {
    res.render("secrets");
});

app.listen(port, () => {
    console.log(`The Server started on port ${port}`);
})