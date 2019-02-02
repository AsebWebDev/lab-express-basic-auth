const express = require("express");
const router = express.Router();

// User model
const User           = require("../models/user");

// BCrypt to encrypt passwords
const bcrypt         = require("bcrypt");
const bcryptSalt     = 10;
const zxcvbn         = require('zxcvbn');

// RECAPTCHA
const Recaptcha = require('express-recaptcha').Recaptcha;
//import Recaptcha from 'express-recaptcha'
// const options = {'theme':'dark'};
// const recaptcha = new Recaptcha('6LdSro4UAAAAAFV9fNPEBExJkXIHY0_OjqBkQ3O7', '6LdSro4UAAAAAMFpuj58J1IRC6ZkaB0WCMnr5vfE', options);
const recaptcha = new Recaptcha('6LdSro4UAAAAAFV9fNPEBExJkXIHY0_OjqBkQ3O7', '6LdSro4UAAAAAMFpuj58J1IRC6ZkaB0WCMnr5vfE');

//Routes
router.get("/", (req, res, next) => {
  res.render("index");
});

router.get("/signup", recaptcha.middleware.render, (req, res, next) => {
  res.render("auth/signup", { captcha:res.recaptcha });
});

router.post("/signup", recaptcha.middleware.verify, (req, res, next) => {
  if (!req.recaptcha.error) {
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({ "username": username })
    .then(user => {
      if (user !== null) {
        res.render("auth/signup", {
          errorMessage: "The username already exists!"
        });
        return;
      }

      if (username === "" || password === "") {
        res.render("auth/signup", {
          errorMessage: "Indicate a username and a password to sign up"
        });
        return;
      }

      if (zxcvbn(password).score <= 2) {
        console.log('TCL: zxcvbn(password)', zxcvbn(password));
        res.render("auth/signup", {
          errorMessage: "Password too weak. " + zxcvbn(password).feedback.suggestions
        });
        return;
      }

      const salt     = bcrypt.genSaltSync(bcryptSalt);
      const hashPass = bcrypt.hashSync(password, salt);

      const newUser = User({
        username,
        password: hashPass
      });

      newUser.save()
      .then(user => {
        res.redirect("/");
      })
      .catch(error => {
        next(error);
      });
    })
    .catch(error => {
      next(error);
    });
  } else {
    res.render("auth/signup", {
      errorMessage: "Wrong Captcha"
    });

  }
});

module.exports = router;