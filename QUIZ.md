**Q1 — Multiple Choice**
B: app.use(express.json()) middleware is missing or registered after the route


**Q2 — Short Answer**
400 Bad Request means the server cannot process a request due to invalid syntax, corrupted cookies/cache, or a malformed URL (basically, the request did not reach the server properly). In my QuizBlitz server, POST /api/scores returns 400 if the score or totalQuestions is missing from the body. 

401 Unauthorized means the server required a username, password, or token to access some resource, which is either missing or incorrect from the request. In my server, verifyToken returns 401 if no token is provided or the token is invalid/expired. 

Lastly, 404 Not Found means the server cannot find the requested resource, usually because the page was deleted, moved, or the URL was mistyped. In QuizBlitz, if a client requests a route that doesn't exist (for ex, GET /api/users/12 and there is no user with ID 12), Express would return a 404. Another time when it would be correct to return 404 is if a database lookup finds no matching document.


**Q3 — Code Analysis**
The problem is that ```js Score.find().sort({ score: -1 }).limit(10)``` returns a Promise, but since there is no await, the result is never used. The next line then runs immediately, before the database query even completes, creating the problem described.
A corrected version of the route: 
```js
app.get('/api/scores', async (req, res) => {
  try {
    const scores = await Score.find().sort({ score: -1 }).limit(10)
    res.json(scores)
  } catch (error) {
    console.error('Error fetching scores:', error.message)
    res.status(500).json({ error: 'Failed to fetch scores' })
  }
})
```
Adding the await before the Score.find() line makes it so that the route waits for the database response and returns the actual scores data instead of the {message: 'done'}.


**Q4 — Multiple Choice**
B:  A schema defines the shape and validation rules for documents; a model is the class you use to query and save documents based on that schema


**Q5 — Design Question**
- Advantage of the cookie approach: Cookies can be set as HttpOnly, which makes them inaccessible to JavaScript running in the browser. This protects the token from being stolen by XSS (cross-site scripting) attacks, since malicious scripts cannot read HttpOnly cookies.
- Advantage of the Authorization header approach: This approach is stateless and works natively across any type of client without requiring any browser-specific cookie handling. The client simply stores the token (in memory or in localStorage) and attaches it to requests directly.

I believe that the Authorization header approach is better suited for a mobile-accessible game like QuizBlitz. Cookies are tied to browser behaviour and require additional configuration (like SameSite, Secure, and CORS credentials: true) which make the app more complex. Since QuizBlitz may be accessed from mobile browsers or eventually a native app, using a token in the Authorization header gives an authentication mechanism that works consistently across any platform. 