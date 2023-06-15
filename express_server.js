const express = require("express");
const cookieParser = require("cookie-parser"); // Import the cookie-parser module
const app = express();
const PORT = 8080;
const users = require("./users")


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

function urlsForUser(userIDx) { // userIDx is a placeholder
  const userUrls = {};

  for (const urlId in urlDatabase) {
    if (urlDatabase[urlId].userID === userIDx) {
      userUrls[urlId] = urlDatabase[urlId];
    }
  }

  return userUrls;
}

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


//  find a user object with a specific email in the usersDB object and return that user object.
const getUserByEmail = (users, email) => {
  for (const userId in users) {
    if (users[userId].email === email) {
      return users[userId]; // return user object
    }
  }
}




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
  const userId = req.cookies.user_id;
  console.log (userId)
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


app.get("/urls/new", (req, res) => {
  const userId = req.cookies.user_id;
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


app.get("/urls/:id", (req, res) => {
  const userId = req.cookies.user_id;

  // Check if the user is logged in
  if (!userId || !users[userId]) {
    res.status(401).send("Please log in or register to view this page.");
    return;
  }

  const id = req.params.id;

  // Check if the URL belongs to the logged-in user
  if (!urlDatabase[id].userID || urlDatabase[id].userID !== userId) {
    res.status(403).send("You do not have permission to view this page.");
    return;
  }

  const longURL = urlDatabase[id].longURL;
  const user = users[userId];
  const templateVars = { id, longURL, user };

  res.render('urls_show', templateVars);
});



app.post("/urls", (req, res) => {
  const userId = req.cookies.user_id;

  // check if the user is logged in
  if (!userId || !users[userId]) {
    res.status(403).send("You must be logged in to shorten URLs.");
    return;
  }
  
  const id = generateRandomString(); // Generate a random id (shortURL)
  const longURL = req.body.longURL; // Get the longURL from the request body

  urlDatabase[id].longURL = longURL; // Save the id-longURL pair to the urlDatabase

  res.redirect(`/urls/${id}`); // Redirect to the page displaying the newly created short URL
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

  if (urlDatabase[id].longURL) {
    urlDatabase[id].longURL = updatedLongURL; // Update the longURL in the database
    res.redirect(`/urls/${id}`); // Redirect to the updated URL details page
  } else {
    res.status(404).send("URL not found"); // Handle the case when the id is not found in the database
  }
});

app.get('/login', (req, res) => {
  const userId = req.cookies.user_id;

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
  if(password !== user.password)
    return res.status(403).send("Email and password don't match.");

  res.cookie('user_id', user.id);

  // Redirect the browser back to the /urls page
  res.redirect('/urls');

});

app.post("/logout", (req, res) => {
  // Clear the user_id cookie
  res.clearCookie("user_id");

  // Redirect the user back to the /login page
  res.redirect("/login");
});



app.get("/register", (req, res) => {
  const userId = req.cookies.user_id;

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

  // Generate a random user ID
  const userId = generateRandomString();

  // Create a new user object with the generated ID, email, and password
  const newUser = {
    id: userId,
    email,
    password
  };

  // Add the new user to the users object
  users[userId] = newUser;

  // Set the user_id cookie with the generated ID
  res.cookie("user_id", userId);

  res.redirect('/urls');
});

