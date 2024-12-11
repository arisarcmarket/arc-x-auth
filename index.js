const express = require("express");
const passport = require("passport");
const { Strategy } = require("@superfaceai/passport-twitter-oauth2");
const { Pool } = require("pg");

const session = require("express-session");
require("dotenv").config();

passport.serializeUser(function (user, done) {
  done(null, user);
});
passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

let accessToken

// Set up the PostgreSQL connection pool
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});


// Use the Twitter OAuth2 strategy within Passport
passport.use(
  new Strategy(
    {
      clientID: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET,
      clientType: "confidential",
      callbackURL: `${process.env.BASE_URL}/auth/twitter/callback`,
    },
    (_accessToken, refreshToken, profile, done) => {

      accessToken=_accessToken

      const query = `
      INSERT INTO x_auths (id, username, displayname, access_token,refresh_token )
      VALUES ($1, $2, $3, $4,$5)
      ON CONFLICT (id) DO UPDATE
      SET username = $2,
          displayname = $3,
          access_token = $4,
          refresh_token = $5
    `;
      const values = [profile.id, profile.username, profile.displayName, _accessToken,refreshToken];
      
      pool.query(query, values, (error, results) => {
        if (error) {
          return done(error);
        }
        console.log('User added or updated in database');
        return done(null, profile);
      });
      
    }
  )
);

const app = express();
app.use(passport.initialize());
app.use(
  session({ secret: "keyboard cat", resave: false, saveUninitialized: true })
);

app.get(
  "/auth/twitter",
  passport.authenticate("twitter", {
    scope: ["tweet.read", "users.read", "offline.access"],
  })
);

  app.get(
    "/auth/twitter/callback",
    passport.authenticate("twitter"),
    function (req, res) {
      console.log('xxxxx')
      
      const redirectUrl = `https://reactor.helloarc.ai/auth/x-handle?xId=${accessToken}`; // Replace with your desired URL
      // const redirectUrl = `https://reactor-chat-ai.dedicateddevelopers.us/auth/x-handle?xId=${accessToken}`; // Replace with your desired URL
      res.redirect(redirectUrl);
      // res.json({
      //   message: "Authentication succeeded",
      //   user: req.user,
      // });
    }
  );

app.listen(8005, () => {
  console.log(`Listening on ${process.env.BASE_URL}`);
