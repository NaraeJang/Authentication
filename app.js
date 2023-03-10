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
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');


mongoose.set('strictQuery', true);

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
    password: String,
    googleId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose); //To hash and salt our passwords and to save our users into our MongoDB database.
userSchema.plugin(findOrCreate);



//encryption always has to be first before creating mongoose.model.

const User = new mongoose.model('User', userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
   done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
  });

passport.use(new GoogleStrategy({
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/secrets"
    },
    function (accessToken, refreshToken, profile, cb) {
        console.log(profile);
        User.findOrCreate({
            googleId: profile.id
        }, function (err, user) {
            return cb(err, user);
        });
    }
));


/////Starting From Here/////
app.get('/', (req, res) => {
    res.render('home');
});

app.route('/login')

    .get((req, res) => {
        res.render('login');
    })

    .post((req, res) => {
        const newUser = new User({
            username: req.body.username,
            password: req.body.password
        });

        req.logIn(newUser, function (err) {
            if (err) {
                console.log(err);
            } else {
                passport.authenticate("local")(req, res, () => {
                    res.redirect("/secrets")
                });
            }
        });

    });





app.get('/auth/google',
    passport.authenticate('google', {
        scope: ['profile']
    }));


app.get('/auth/google/secrets',
    passport.authenticate('google', {
        failureRedirect: '/login'
    }),
    function (req, res) {
        // Successful authentication, redirect to secrets.
        res.redirect('/secrets');
    });




app.get("/secrets", function (req, res) {
  User.find({ "secret": {$ne:null} }, function(err, foundUsers) {
        if(err) {
            console.log(err);
        } else {
            if (foundUsers) {
                res.render("secrets", {usersWithSecrets: foundUsers});
            }
        }
  });
}); 




app.route('/submit')

.get(function(req, res) {
    if (req.isAuthenticated()) {
        res.render("submit");
    } else {
        res.redirect("/login");
    }
})

.post(function(req, res) {
    const submittedSecret = req.body.secret;

    console.log(req.user.id);

    User.findById(req.user.id, function(err, foundUser) {
        if(err) {
            console.log(err);
        } else {
            foundUser.secret = submittedSecret;
            foundUser.save(function() {
                res.redirect("/secrets");
            });
        }
    });
});



app.route('/register')

    .get((req, res) => {
        res.render('register');
    })

    .post(async (req, res) => {

        User.register({
                username: req.body.username
            }, req.body.password).then(user => {
                if (!user) {
                    res.redirect("/register");
                } else {
                    passport.authenticate('local')(req, res, () => {
                        res.redirect("/secrets")
                    })
                }
            })
            .catch(err => {
                console.log(err);
            });

    });





app.get("/logout", function (req, res) {
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        res.redirect('/');
    });
});






/////Port Starting Message/////
app.listen(3000, function () {
    console.log('Server started on Port 3000.');
});