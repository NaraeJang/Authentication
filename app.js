//jshint esversion:6

require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const mongoose = require("mongoose");
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static('public'));
app.use(session({
    secret: "Our littile secret.",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());




/////Mongoose Set Up/////
mongoose.connect('mongodb://127.0.0.1:27017/userDB', {
    useNewUrlParser: true
});

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

userSchema.plugin(passportLocalMongoose); //To hash and salt our passwords and to save our users into our MongoDB database.



//encryption always has to be first before creating mongoose.model.

const User = new mongoose.model('User', userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


/////Starting From Here/////
app.get('/', (req, res) => {
    res.render('home');
});

app.route('/login')

    .get((req, res) => {
        res.render('login');
    })

    .post((req, res) => {


    });


app.get("/secrets", function (req, res) {
    //Checking if the user is authenticated we send the user to the secrets page.
    if (req.isAuthenticated()) {
        res.render("secrets");
    } else {
        res.redirect("login");
    }
}); //We are going to check if the user authenticated.

app.route('/register')

    .get((req, res) => {
        res.render('register');
    })

    .post(async (req, res) => {

        User.register({
            username: req.body.username
        }, req.body.password);



    });







/////Port Starting Message/////
app.listen(3000, function () {
    console.log('Server started on Port 3000.');
});