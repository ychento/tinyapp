const express = require("express");
const app = express();
const PORT = 8080;
const users = require("./users");
const { getUserByEmail } = require('./helpers');
const bcrypt = require("bcryptjs");
const cookieSession = require('cookie-session');


app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
}));

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

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

// Define the urlsForUser function
function urlsForUser(userIDx) { // userIDx is a placeholder
  const userUrls = {};

  for (const urlId in urlDatabase) {
    if (urlDatabase[urlId].userID === userIDx) {
      userUrls[urlId] = urlDatabase[urlId];
    }
  }
  console.log(userUrls);

  return userUrls;
}

//App Database
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

// Middleware setup
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));




app.get("/", (req, res) => {
  const userId = req.session.user_id;

  if (userId && users[userId]) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

// Route handler
app.get("/urls", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];

  // check if the user is logged in
  if (!userId || !user) {
    const templateVars = {
      errorMessage: "Please log in or register to view URLs",
    };
    res.render("error", templateVars);
    return
  }

  const templateVars = {
    user: user,
    urls: urlsForUser (userId),
  };
  res.render("urls_index", templateVars);
});




app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


// Routes to urls/new
app.get("/urls/new", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];

  // check if the user is logged in
  if (!userId || !user) {
    res.redirect("/login"); // if user is not logged in, redirect to the login page
    return;
  }

  const templateVars = {
    user: user,
  };
  
  res.render("urls_new", templateVars);
});

//Create random shortURL link from /urls page
app.post("/urls", (req, res) => {
  const userId = req.session.user_id;

  // check if the user is logged in
  if (!userId || !users[userId]) {
    res.status(403).send("You must be logged in to shorten URLs.");
    return;
  }
  
  const id = generateRandomString(); // Generate a random id (shortURL)
  const longURL = req.body.longURL; // Get the longURL from the request body

  urlDatabase[id] = { longURL: longURL, userID: userId }; // Save the id-longURL pair to the urlDatabase

  res.redirect(`/urls/${id}`); // Redirect to the page displaying the newly created short URL
});


app.get("/urls/:id", (req, res) => {
  const userId = req.session.user_id;
  const id = req.params.id;

  // Check if the user is logged in
  if (!userId || !users[userId]) {
    res.status(401).send("401 Please log in or register to view this page.");
    return;
  }

  // Check if the URL exists in the database
  if (!urlDatabase[id]) {
    res.status(404).send("404 URL not found.");
    return;
  }

  // Check if the URL belongs to the logged-in user
  if (!urlDatabase[id].userID || urlDatabase[id].userID !== userId) {
    res.status(403).send("403 You do not have permission to view this page.");
    return;
  }

  const longURL = urlDatabase[id].longURL;
  const user = users[userId];
  const templateVars = { id, longURL, user };

  res.render('urls_show', templateVars);
});

app.post("/urls/:id", (req, res) => {
  const userId = req.session.user_id;
  const id = req.params.id;

  // Check if the URL ID exists
  if (!urlDatabase[id]) {
    res.status(404).send("URL not found.");
    return;
  }

  // Check if the user is logged in
  if (!userId || !users[userId]) {
    res.status(401).send("Please log in or register to perform this action.");
    return;
  }

  // Check if the URL belongs to the logged-in user
  if (urlDatabase[id].userID !== userId) {
    res.status(403).send("You do not have permission to edit this URL.");
    return;
  }

  // Update the longURL for the given URL ID
  urlDatabase[id].longURL = req.body.longURL;

  // res.redirect(`/urls/${id}`);
  res.redirect(`/urls`);
});

app.get("/urls/:id/edit", (req, res) => {
  const userId = req.session.user_id;
  const id = req.params.id;

  // Check if the URL ID exists
  if (!urlDatabase[id]) {
    res.status(404).send("URL not found.");
    return;
  }

  // Check if the user is logged in
  if (!userId || !users[userId]) {
    res.status(401).send("Please log in or register to view this page.");
    return;
  }

  // Check if the URL belongs to the logged-in user
  if (urlDatabase[id].userID !== userId) {
    res.status(403).send("You do not have permission to edit this URL.");
    return;
  }

  const longURL = urlDatabase[id].longURL;
  const user = users[userId];
  const templateVars = { id, longURL, user };

  res.render('urls_show', templateVars);
});

app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  const url = urlDatabase[id];

  if ( url && url.longURL) {
    res.redirect(url.longURL); // Redirect to the longURL
  } else {
    res.status(404).send("URL not found"); // Handle the case when the id is not found in the database
  }
});



app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  const userId = req.session.user_id;

  // Check if the URL ID exists
  if (!urlDatabase[id]) {
    res.status(404).send("URL not found.");
    return;
  }

  // Check if the user is logged in
  if (!userId || !users[userId]) {
    res.status(401).send("Please log in or register to perform this action.");
    return;
  }

  // Check if the URL belongs to the logged-in user
  if (urlDatabase[id].userID !== userId) {
    res.status(403).send("You do not have permission to delete this URL.");
    return;
  }

  delete urlDatabase[id]; // Remove the URL resource from the database
  
  
  res.redirect("/urls"); 
});


app.get('/login', (req, res) => {
  const userId = req.session.user_id;

  // Check if the user is already logged in
  if (userId && users[userId]) {
    res.redirect("/urls"); // Redirect to the /urls page
  } else {
    res.render("login"); // Render the login page
  }
});

app.post('/login', (req, res) => {
  // Retrieve the email and password from the request body
  const { email, password } = req.body;
  
  // Find the user object with the matching email in the users object
  const user = getUserByEmail(users, email)

  if(!user) 
    return res.status(403).send('User is not found');
    
  if(!bcrypt.compareSync(password, user.password)) {
    return res.status(403).send("Email and password don't match.")
  }
  
  req.session.user_id = user.id;

  // Redirect the browser back to the /urls page
  res.redirect('/urls');

});

app.post("/logout", (req, res) => {
  // Clear the user_id cookie
  delete req.session;
  req.session = null;
  res.clearCookie ("session",{path:"/"});
  res.clearCookie ("session.sig",{path:"/"});

  // Redirect the user back to the /login page
  res.redirect("/login");
});



app.get("/register", (req, res) => {
  const userId = req.session.user_id;

  // check if the user is already logged in
  if (userId && users[userId]) {
    res.redirect("/urls"); // redirect to the /urls page
  } else {
    res.render("register"); // render the register page
  }
  
});


app.post('/register', (req, res) => {
  
  const { email, password } = req.body;

  // Check if the email or password is empty
  if (!email || !password) {
    res.status(400).send("Email or password cannot be empty");
    return;
  }

  // Check if the email already exists in the users object
  const user = getUserByEmail(users, email)
  if (user) return res.status(400).send("Email already exists");

  // Hash the password using bcrypt
  const hashedPassword = bcrypt.hashSync(password, 10);

  // Generate a random user ID
  const userId = generateRandomString();

  // Create a new user object with the generated ID, email, and password
  const newUser = {
    id: userId,
    email: email,
    password: hashedPassword
  };

  // store the new user to the users object
  users[userId] = newUser;

  // Set the user_id cookie with the generated ID
  // res.session("user_id", userId);
  req.session.user_id = userId;

  res.redirect('/urls');
});

