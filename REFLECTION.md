**Q1 — Middleware**
In Express, middleware is essentially a function that sits between an incoming HTTP request and the final route handler. Each middleware function receives req, res, and next, and can read/modify the request, send a response early, or call next() to pass control to the next function in the chain. The order it is registered in matters because Express processes middleware and routes in the order they are registered. If a middleware is not registered before a route that needs it, the route runs without that middleware having had a chance to act, making it essentially useless. The difference between global and route-level middleware is that global middleware runs on every request, while route-level middleware is passed as an argument to a specific route and will only run for that route. For example:

Global middleware: 
```js
app.use(express.json()) 
```
It runs on every request automatically.

Route-level middleware:
```js
app.post('/api/scores', verifyToken, async (req, res) => {
    ...
})
app.get('/api/scores', async (req, res) => {
  const scores = await Score.find().sort({ score: -1 }).limit(10)
  res.json(scores)
})
```
In the post function, verifyToken will only run for POST /api/scores, while int he get function, anyone can call it because the verifyToken is not required. 


**Q2 — Password Security**
Passwords must never be stored in plain text for security purposes. If they are stored in plaintext and if someone gets access to your database, then they have all users' passwords which is a major vulnerability. bcrypt.hash(password,10) generates a secure hash of a password using the bcrypt algorithm, which you can then safely store in the database. The number 10 controls the number of iterations of the algorithm. A value of 10 means it uses the bycrpt algorithm with a cost factor of 2^10 iterations, which takes about 10ms-100ms per hash. It also adds a salt to the hash, which is a random string of characters added to the password before it is hashed to prevent 2 passwords from hashing to the same value. 

To verify the password, bcrypt.compare() reads the stored salt that was used before and then repeats the same hashing process on a user's inputted password as before. Then, it compares the hashed version of the entered password with the hash stored in the database, thus eliminating the need for the raw password to ever be stored. 

**Q3 — JWT Flow**
The complete authentication flow of my server from a user's perspective is as follows:
- Register an account (POST /api/auth/register)
    - Client: sends {email, password} in the request body.
    - Server: validates the fields, checks that the email isn't already taken, hashes the password with bcrypt, and saves the new user to the MongoDB database.
    - Then, the server returns {message, userId, email} (without a token yet, as the user must still log in separately)

- Logging in (POST /api/auth/login)
    - Client: sends {email, password} in the request body.
    - Server: looks up the user by email, calls bcrypt.compare() to verify the password against the stored hash, then calls jwt.sign() to create a signed token.
    - Then, the server returns {token, userId, email}

JWT (JavaScript Web Token), embeds the userID, email, and expiry timestamp as follows:
```js
jsjwt.sign(
  { userId: user._id, email: user.email }, 
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN }
)
```
So the JWT contains userId and email baked into it, along with an expiry timestamp.
- Submiting a score (POST /api/scores)
    - Client: sends the JWT in the header and {score, totalQuestions} in the body.
    - Server: verifyToken middleware reads the header, calls jwt.verify(token, process.env.JWT_SECRET), and if valid, attaches the decoded payload to req.user. The route then uses req.user.userId and req.user.email to save the score.
    - Then, the server returns the saved score document.

There is no database lookup is needed to verify the token becuase the JWT is cryptographically signed using JWT_SECRET. When jwt.verify() is called in the last step described above, it recomputes the signature from the token's header and payload and checks it against the signature embedded in the token. If the secret matches and the token has not yet expired, the payload is accepted. Since the userId and email are already inside the token, the server doesn't need to query the database to know who the user is. 


**Q4 — In-Memory vs Database**
2 problems that I would observe with the in-memory approach:
- Problem 1: Data would be lost on every restart. If we were simply storing scores in a plain JavaScript array, then all the scores would disappear whenever the server process stops or crashes. The database allows this data to persist by saving it to the disk. 
- Problem 2: Scores arrays would appear to be different if the web app were running on multiple servers. Each instance would have its own separate scores array and they would be completely out of sync, leading to problems with accurately tracking scores. Instead, MongoDB acts as a centralized place to store all up-to-date scores from every instance. 

If I redployed the server, my MongoDB data stays intact because it is stored on the disk completely independent of the Node process. Redeploying the server simply restarts the Node app, but does not affect this stored data (it just has to reconnect to the database and can easily access it again). However, redeploying while using the in-memory array meant that the array would start empty again every time I restarted the server. 


**Q5 — Route Design Decision**
Your server has two separate score routes: GET /api/scores is public and POST /api/scores is protected. Explain why this distinction makes sense for a leaderboard application. Then consider this alternative design: what would break or become problematic if GET /api/scores also required authentication?

It makes sense to have the GET public but the POST private for a leaderboard application because you want everyone to be able to view scores, but you don't want everyone to be able to post any scores that they would like. Requiring authentication to post a score is necessary because without it, anyone could send arbitrary POST requests and flood the leaderboard with fake scores. The token not only ensures that authenticated players can submit, but it makes sure that the server knows who submitted what score. On the other hand, requiring authentication to view the leaderboard would defeat the purpose of a public leaderboard. If GET /api/scores also required authetnication, then players who haven't logged in yet or are just browsing the webiste would be completely unable to see the leaderboard. The leaderboard is meant to be a public feature, so this would be a very poor user experience. Also, then the LeaderboardView.vue would need to pass a token on every page load. 