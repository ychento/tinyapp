const express = require("express");
const cookieParser = require("cookie-parser"); // Import the cookie-parser module
const app = express();
const PORT = 8080;



app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); 

function generateRandomString() {
  let result = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const length = 6;

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }

  return result;
}

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const templateVars = {
    username: req.cookies.username, // Access the "username" property from req.cookies
    urls: urlDatabase, // Pass the urlDatabase to the template as the 'urls' variable
    // ... any other variables needed for the template
  };
  res.render("urls_index", templateVars);
});




app.get("/urls/new", (req, res) => {
  const templateVars = {
    username: req.cookies.username,
    // ... any other variables needed for the template
  };
  res.render("urls_new", templateVars);
});



app.get("/urls/:id", (req, res) => {
  const id = req.params.id;
  const longURL = urlDatabase[id]; // Retrieve the longURL based on the id from your data source
  const templateVars = { id: id, longURL: longURL };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  const id = generateRandomString(); // Generate a random id
  const longURL = req.body.longURL; // Get the longURL from the request body

  urlDatabase[id] = longURL; // Save the id-longURL pair to the urlDatabase

  res.redirect(`/urls/${id}`); // Redirect to the page displaying the newly created short URL
});

app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  const longURL = urlDatabase[id];

  if (longURL) {
    res.redirect(longURL); // Redirect to the longURL
  } else {
    res.status(404).send("URL not found"); // Handle the case when the id is not found in the database
  }
});

app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;

  if (urlDatabase[id]) {
    delete urlDatabase[id]; // Remove the URL resource from the database
    res.redirect("/urls"); // Redirect to the URLs index page
  } else {
    res.status(404).send("URL not found"); // Handle the case when the id is not found in the database
  }
});


app.post("/urls/:id/update", (req, res) => {
  const id = req.params.id;
  const updatedLongURL = req.body.longURL;

  if (urlDatabase[id]) {
    urlDatabase[id] = updatedLongURL; // Update the longURL in the database
    res.redirect(`/urls/${id}`); // Redirect to the updated URL details page
  } else {
    res.status(404).send("URL not found"); // Handle the case when the id is not found in the database
  }
});


app.post('/login', (req, res) => {
  // Retrieve the username from the request body
  const { username } = req.body;
  
  // Set the "username" cookie with the provided value
  res.cookie('username', username);
  
  // Redirect the browser back to the /urls page
  res.redirect('/urls');
});


