var express = require("express");
var cookieParser = require('cookie-parser');
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");

let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

let users = {UserID:{
  id: 'UserID',
  email: 'a@a.com',
  password: 'abcdefg'
}};

function generateRandomString() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for( var i = 0; i < 6; i++ )
      text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
}

function userEmailExists(email) {
  for (i in users) {
    if (email == users[i]['email']) return true;
  }
  return false;
}

function getIDFromEmail(email) {
  for (i in users) {
    if (email == users[i]['email']) return users[i]['id'];
  }
}

function getEmailFromID(id) {
  for (i in users) {
    if (id == users[i]['id']) return users[i]['email'];
  }
}

app.use(bodyParser.urlencoded());
app.use(cookieParser());

app.set('view engine', 'ejs');

// Root page
app.get("/", (req, res) => {
  res.redirect("/urls");
  // TODO redirect to login screen if not logged in
});

// Browse all URLs
app.get("/urls", (req, res) => {
  var templateVars = {
    urls: urlDatabase,
    userEmail: getEmailFromID(req.cookies.user_id)
  };
  res.render("urls_index", templateVars);
});

// Create new URL
app.get("/urls/new", (req, res) => {
  var templateVars = {
    userEmail: getEmailFromID(req.cookies.user_id)
  };
  res.render("urls_new", templateVars);
});

// Edit a URL
app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    userEmail: getEmailFromID(req.cookies.user_id)
  };
  res.render("urls_show", templateVars);
});

// Redirect to the longURL (actual website)
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post("/urls", (req, res) => {
  var shortURL = "";
  var longURL = "";
  console.log("req.body.shortURL: " + req.body.shortURL);
  if (!urlDatabase.hasOwnProperty(req.body.shortURL)){
    // coming from create new
    shortURL = generateRandomString();
    longURL = req.body.longURL;
    console.log('generate new shortURL');
  } else {
    // coming from change URL
    shortURL = req.body.shortURL;
    longURL = req.body.longURL;
    console.log('matched existing URL shortURL');
  }
  urlDatabase[shortURL] = longURL;

  console.log(urlDatabase);
  console.log(req.body);  // debug statement to see POST parameters
  //res.redirect("/urls/" + shortURL);
  res.redirect("/urls");
});

// Change URL
app.post("/urls/:shortURL/", (req, res) => {
  console.log('change: ' + req.params.shortURL);
  res.render("urls_change", {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    userEmail: getEmailFromID(req.cookies.user_id)
  });
});

app.post("/urls/:shortURL/delete", (req, res) => {
  var shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  console.log('delete ' + shortURL);
  res.redirect("/urls/");
});

app.get("/login", (req, res) => {
  let templateVars = {
  };
  res.render("urls_login", templateVars);
});

app.post("/login", (req, res) => {
  // if user matching the email is found
  if (userEmailExists(req.body.email)) {
    // if password is correct
    if (req.body.password == users[getIDFromEmail(req.body.email)]['password']) {
      res.cookie('user_id', getIDFromEmail(req.body.email));
    } else {
      // password is incorrect, return 403
      res.status(403);
      res.send("Password is incorrect.  Please try again.")
    }
  } else {
    // no match found, return 403
    res.status(403);
    res.send("Email does not exist.  Please register.");
  }
  res.redirect("/");
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.clearCookie('user_email');
  res.redirect("/");
});

// Register
app.get("/register", (req, res) => {
  let templateVars = {
  };
  res.render("urls_register", templateVars);
});

app.post("/register", (req, res) => {
  // if either email or password field is blank
  if (!req.body.email || !req.body.password) {
    res.status(400);
    res.send('email or password is blank');
  // if email already existed
  } else if (userEmailExists(req.body.email)) {
    res.status(400);
    res.send('email already exists');
  } else {
  // create new userRandomID and add to user object
    var userRandomID = generateRandomString();
    users[userRandomID] = {
      id: userRandomID,
      email: req.body.email,
      password: req.body.password
    };
    res.cookie('user_id', userRandomID);
    console.log('New user created!');
    res.redirect("/");
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
