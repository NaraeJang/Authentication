//jshint esversion:6

const express = require('express');
const ejs = require('ejs');
const mongoose = require("mongoose");
const bodyParser = require('body-parser');

const app = express();

app.set('view engine', 'ejs');
// app.use(bodyParser.urlencoded({
//     extended: true
// }));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static('public'));




/////Mongoose Set Up/////
mongoose.connect('mongodb://127.0.0.1:27017/userDB', {
    useNewUrlParser: true
});

const userSchema = {
    email: String,
    password: String
};

const User = new mongoose.model('User', userSchema);




/////Starting From Here/////
app.get('/', (req, res) => {
    res.render('home');
});

app.route('/login')

    .get((req, res) => {
        res.render('login');
    })

    .post((req, res) => {
        const username = req.body.username;
        const password = req.body.password;

        User.findOne({
                email: username
            })
            .then((foundUser) => {
                if (foundUser) {
                    if (foundUser.password === password) {
                        res.render("secrets");
                    } else {
                        console.log('The password does not match with the email. Retry it.');
                        res.redirect('login');
                    }
                }
            })
            .catch((err) => {
                console.log(err);
                res.send(400, "Bad Request");
            });

    });




app.route('/register')

    .get((req, res) => {
        res.render('register');
    })

    .post(async (req, res) => {
        const newUser = new User({
            email: req.body.username,
            password: req.body.password
        });

        try {
            newUser.save();
            res.render('secrets');
            console.log("Successfully added the new user.");
        } catch (err) {
            console.log(err);
        }

    });







/////Port Starting Message/////
app.listen(3000, function () {
    console.log('Server started on Port 3000.');
});