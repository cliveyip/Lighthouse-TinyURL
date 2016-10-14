var express = require("express");
//var cookieParser = require('cookie-parser');
var app = express();
var PORT = process.env.PORT || 3000;
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt-nodejs');
const cookieSession = require('cookie-session');

let users = {};

// let users = { testUserID:{
//   id: 'testUserID',
//   email: 'user@test.com',
//   password: '123',
//   urlDatabase: {
//     "b2xVn2": "http://www.lighthouselabs.ca",
//   }
// }};

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
  return allLinks;
  // allLinks = {"b2xVn2": "http://www.lighthouselabs.ca",
  //             "asdfew": "http://www.google.ca"}
}

function linkExists(link){
  var allLinks = getAllLinks();
  for (var i in allLinks) {
    if (i == link) {
      return true;
    }
  }
  return false;
}

function linkBelongsToUser(userDB, reqLink) {
  for (var i in userDB) {
    if (i == reqLink) {
      return true;
    } else {
      return false;
    }
  }
}

app.use(bodyParser.urlencoded({extended: false}));
//app.use(cookieParser());
app.use(cookieSession({
  keys: ['user_id'],
}))


app.set('view engine', 'ejs');

// Root page
app.get("/", (req, res) => {
  res.redirect("/urls");
  // TODO redirect to login screen if not logged in
});

// Browse all URLs
app.get("/urls", (req, res) => {
  var userID = req.session.user_id;
  var templateVars = {
    userEmail: getEmailFromID(req.session.user_id)
  };
  if (userID) {
    templateVars['urls'] = users[userID]['urlDatabase'];
  } else {
    templateVars['urls'] = "";
    // TODO get
  }
  res.render("urls_index", templateVars);
});

// Create new URL
app.get("/urls/new", (req, res) => {
  // if user is logged in
  if (req.session.user_id) {
  // display the new url page
    var templateVars = {
      userEmail: getEmailFromID(req.session.user_id)
    };
    res.render("urls_new", templateVars);
  } else {
  // display the log-in page
    res.redirect("/login");
  }

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
  if (!users[req.session.user_id]['urlDatabase'].hasOwnProperty(req.body.shortURL)){
    // coming from create new
    shortURL = generateRandomString();
    longURL = req.body.longURL;
  } else {
    // coming from change URL
    shortURL = req.body.shortURL;
    longURL = req.body.longURL;
  }
  users[req.session.user_id]['urlDatabase'][shortURL] = longURL;
  res.redirect("/urls");
});

// Edit a URL
app.get("/urls/:id", (req, res) => {
  if (!req.session.user_id) {
    res.status(401).send("Please log in before editing links.");
  } else {
    if (!linkExists(req.params.id)) {
      res.status(404).send("The link you are trying to edit does not exist.");
    } else {
      if (!linkBelongsToUser(users[req.session.user_id]['urlDatabase'], req.params.id)) {
        res.status(403).send("The link you are trying to edit does not belong to you.");
      }
    }
    res.status(200);
    let templateVars = {
      shortURL: req.params.id,
      longURL: users[req.session.user_id]['urlDatabase'][req.params.id],
      userEmail: getEmailFromID(req.session.user_id)
    };
    res.render("urls_change", templateVars);
  }
});

app.post("/urls/:shortURL/", (req, res) => {
  console.log('change: ' + req.params.shortURL);
  res.render("urls_change", {
    shortURL: req.params.shortURL,
    longURL: users[req.session.user_id]['urlDatabase'][req.params.shortURL],
    userEmail: getEmailFromID(req.session.user_id)
  });
});

app.post("/urls/:shortURL/delete", (req, res) => {
  var shortURL = req.params.shortURL;
  var userID = req.session.user_id;
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
    // if (req.body.password == users[getIDFromEmail(req.body.email)]['password'])
    if (bcrypt.compareSync(req.body.password, users[getIDFromEmail(req.body.email)]['password'])) {
      //res.cookie('user_id', getIDFromEmail(req.body.email));
      req.session.user_id = getIDFromEmail(req.body.email);
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
  // res.clearCookie('user_id');
  // res.clearCookie('user_email');
  req.session = null;
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
      password: bcrypt.hashSync(req.body.password),
      urlDatabase: {}
    };
    //res.cookie('user_id', userRandomID);
    req.session.user_id = userRandomID;
    console.log('New user created!');
    res.redirect("/");
  }
});

app.listen(PORT, () => {
  console.log(`Tiny URL app listening on port ${PORT}!`);
});
