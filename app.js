//jshint esversion:6
import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import 'dotenv/config';
import session from "express-session";
import passport from "passport";
import flash from "express-flash";
import initialize from './passport-config.js'
import methodOverride from "method-override";


// const initializePassport = require('./passport-config')
initialize(passport, 
   async email => {

    try {

        const sql = "SELECT * FROM dtree_users WHERE LOWER(email) = $1"
        const values = [email]

        const data = await db.query( sql, values);

        if (data.rowCount == 0) return false; 
        return data.rows[0];
    
        // const sql_old = "SELECT * FROM dtree_users WHERE LOWER(email) = $1 AND LOWER(pass) = $2;"
       
    } catch (error) {
        console.log(`Error outside catch is now : ${error}`)
       return false; 
    }

}, 
async (id) => {
    try {
        const sql = "SELECT * FROM dtree_users WHERE LOWER(id) = $1;"
        const values = [id]
        const data = await db.query( sql, values);

        if (data.rowCount == 0) return false; 
        return data.rows[0];

    } catch (error) {
       return false; 
    }
 
})

const app = express();
const port = 3000;


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

app.use(flash());
app.use(session( {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))

app.use(passport.initialize());
app.use(passport.session());

app.use(methodOverride('_method'))


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

app.get("/login", checkNotAuthenticated, (req, res) => {
        checkDB();
    res.render("login");
});

app.post("/login",  passport.authenticate('local', {
    successRedirect: "/secrets",
    failureRedirect: "/login",
    failureFlash: true
}))

app.get("/register", checkNotAuthenticated , (req, res) => {
    res.render("register")
});

app.post("/register", checkNotAuthenticated, async (req, res) => {

    const first = req.body.firstname;
    const last = req.body.lastname;
    const email = req.body.username;
    const pass = req.body.password;
    
    try {
        const sql = "INSERT INTO dtree_users (first_name, last_name, email, pass) VALUES ($1, $2, $3, $4)"  

        bcrypt.hash(pass.toString(), parseInt(process.env.HASH_SALT) , async (err, hash) => {
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
        res.redirect('/register')
      }
});

app.get("/secrets", checkAuthenticated, (req, res) => {
    const usersigned = req.user.name;
    console.log(`The user signed is : ${usersigned}`)
    res.render("secrets");
});

//Logout function
app.post('/logout', function(req, res, next) {
    req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect('/secrets');
    });
  });

function checkAuthenticated(req, res, next) {
    if(req.isAuthenticated()) {
        return next()
    }
    res.redirect('/login')
}

function checkNotAuthenticated(req, res, next) {
    if(req.isAuthenticated()) {
       return res.redirect("/secrets")
    }
    next()
}
app.listen(port, () => {
    console.log(`The Server started on port ${port}`);
})