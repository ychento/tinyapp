
//  find a user object with a specific email in the usersDB object and return that user object.
const getUserByEmail = function(users, email)  {
  for (const userId in users) {
    if (users[userId].email === email) {
      console.log('User found:', users[userId]);
      return users[userId]; // return user object
    }
  }
}


module.exports = { getUserByEmail };