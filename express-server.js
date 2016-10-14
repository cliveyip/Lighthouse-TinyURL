var express = require("express");
var cookieParser = require('cookie-parser');
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");

// let urlDatabase = {
//   "b2xVn2": "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com"
// };

let users = {UserID:{
  id: 'UserID',
  email: 'a@a.com',
  password: 'abcdefg',
  urlDatabase: {
    "b2xVn2": "http://www.lighthouselabs.ca",
    "9sm5xK": "http://www.google.com"
  }
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

function getAllLinks() {
  var allLinks = {};
  for (i in users) {
    for (j in users[i]['urlDatabase']) {
      allLinks[j] = users[i]['urlDatabase'][j];
    }
  }
  console.log(allLinks);
  return allLinks;
}

app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

app.set('view engine', 'ejs');

// Root page
app.get("/", (req, res) => {
  res.redirect("/urls");
  // TODO redirect to login screen if not logged in
});

// Browse all URLs
app.get("/urls", (req, res) => {
  var userID = req.cookies.user_id;
  // console.log('users[userID.urlDatabase', users[userID]['urlDatabase']);
  var templateVars = {
    userEmail: getEmailFromID(req.cookies.user_id)
  };
  if (userID) {
    templateVars['urls'] = users[userID]['urlDatabase'];
  } else {
    templateVars['urls'] = "";
  }
  res.render("urls_index", templateVars);
});

// Create new URL
app.get("/urls/new", (req, res) => {
  // if user is logged in
  if (req.cookies.user_id) {
  // display the new url page
    var templateVars = {
      userEmail: getEmailFromID(req.cookies.user_id)
    };
    res.render("urls_new", templateVars);
  } else {
  // display the log-in page
    res.redirect("/login");
  }

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
  var allURL = getAllLinks();
  let longURL = allURL[req.params.shortURL];
  res.redirect(longURL);
});

app.post("/urls", (req, res) => {
  var shortURL = "";
  var longURL = "";
  //var userID = req.cookies.user_id;
  //console.log('userID: ' + userID);
  if (!users[req.cookies.user_id]['urlDatabase'].hasOwnProperty(req.body.shortURL)){
    // coming from create new
    shortURL = generateRandomString();
    longURL = req.body.longURL;
  } else {
    // coming from change URL
    shortURL = req.body.shortURL;
    longURL = req.body.longURL;
  }
  console.log(shortURL);
  users[req.cookies.user_id]['urlDatabase'][shortURL] = longURL;
  res.redirect("/urls");
});

// Change URL
app.post("/urls/:shortURL/", (req, res) => {
  console.log('change: ' + req.params.shortURL);
  res.render("urls_change", {
    shortURL: req.params.shortURL,
    longURL: users[req.cookies.user_id]['urlDatabase'][req.params.shortURL],
    userEmail: getEmailFromID(req.cookies.user_id)
  });
});

app.post("/urls/:shortURL/delete", (req, res) => {
  var shortURL = req.params.shortURL;
  var userID = req.cookies.user_id;
  delete users[userID]['urlDatabase'][shortURL];
  //delete urlDatabase[shortURL];
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
      password: req.body.password,
      urlDatabase: {}
    };
    res.cookie('user_id', userRandomID);
    console.log('New user created!');
    res.redirect("/");
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
