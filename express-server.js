var express = require("express");
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

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.use(bodyParser.urlencoded());

app.set('view engine', 'ejs');

app.get("/urls", (req, res) => {
  var templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
  console.log(urlDatabase);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id };
  res.render("urls_show", templateVars);
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
    longURL: urlDatabase[req.params.shortURL]
  });
});

app.post("/urls/:shortURL/delete", (req, res) => {
  var shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  console.log('delete ' + shortURL);
  res.redirect("/urls/");
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
