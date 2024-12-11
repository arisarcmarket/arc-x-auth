const express = require('express');
const passport = require('passport');
const TwitterStrategy = require('passport-twitter').Strategy;
const session = require('express-session');


// Set up the PostgreSQL connection pool
const pool = new Pool({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
  });
  
// Initialize the Express app
const app = express();

// Configure session middleware
app.use(session({
  secret: 'MyScreet',
  resave: false,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

// Replace these with your actual Twitter app credentials
const TWITTER_CONSUMER_KEY = 'ELnEYbOg0B6yjohixhNxGg0iV';
const TWITTER_CONSUMER_SECRET = 'uXTRSSz7W36bG6E6FOL37qbcYiqGCxGK3itpe8jlP1uqPcvS7O';

// Configure Passport to use Twitter strategy
passport.use(new TwitterStrategy({
    consumerKey: TWITTER_CONSUMER_KEY,
    consumerSecret: TWITTER_CONSUMER_SECRET,
    callbackURL: "https://arc-x.helloarc.ai/auth/twitter/callback"
  },
  function(token, tokenSecret, profile, done) {
    // In a real application, you'd save the user to your database here
    return done(null, profile);
  }
));

// Serialize user to save to session
passport.serializeUser(function(user, done) {
  done(null, user);
});

// Deserialize user from session
passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

// Route to start the authentication process
app.get('/auth/twitter',
    passport.authenticate('twitter', { scope: ['tweet.read', 'users.read', 'offline.access'] })
  );
  
  // Route to handle the callback from Twitter
  app.get('/auth/twitter/callback', 
    passport.authenticate('twitter', { failureRedirect: '/' }),
    function(req, res) {
      // Successful authentication, redirect home or to another route
      res.redirect('/');
    }
  );
  
  // Route to log out the user
  app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
  });
  
  app.get('/', function(req,res){
        res.send(req.user);
  })
  // A protected route example
  app.get('/profile', ensureAuthenticated, function(req, res) {
    res.send(`Hello ${req.user.username}`);
  });
  
  // Middleware to ensure the user is authenticated
  function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    
    res.redirect('/');
  }


  // Start the Express server
const PORT = process.env.PORT || 8005;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
