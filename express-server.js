var express = require("express");
var cookieParser = require('cookie-parser');
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");

function generateRandomString() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for( var i = 0; i < 6; i++ )
      text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
}

let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.use(bodyParser.urlencoded());
app.use(cookieParser());

app.set('view engine', 'ejs');

// Root page
app.get("/", (req, res) => {
  res.send('welcome to url shortener');
});

// Browse all URLs
app.get("/urls", (req, res) => {
  var templateVars = {
    urls: urlDatabase,
    username: req.cookies["username"]
  };
  res.render("urls_index", templateVars);
  console.log(urlDatabase);
});

// Create new URL
app.get("/urls/new", (req, res) => {
  var templateVars = {
    username: req.cookies["username"]
  };
  res.render("urls_new", templateVars);
});

// Edit a URL


app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    username: req.cookies["username"]
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
    username: req.cookies["username"]
  });
});

app.post("/urls/:shortURL/delete", (req, res) => {
  var shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  console.log('delete ' + shortURL);
  res.redirect("/urls/");
});

app.post("/login", (req, res) => {
  res.cookie('username', req.body.username, {expires: new Date(Date.now() + 900000)});
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie('username');
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
