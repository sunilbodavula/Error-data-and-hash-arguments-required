const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "userData.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

//api 1
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPswd = await bcrypt.hash(request.body.password, 10);
  console.log(hashedPswd);
  const getUserDetailsQuery = `
    SELECT *
    FROM user
    WHERE username = '${username}';
    `;
  const dbUser = await db.get(getUserDetailsQuery);
  console.log(dbUser);
  if (dbUser === undefined) {
    const lenOfPswd = password.length;
    if (lenOfPswd < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const addUserQuery = `
            INSERT INTO
            user(username, name, password, gender, location)
            VALUES(
                '${username}',
                '${name}',
                '${hashedPswd}',
                '${gender}',
                '${location}'
            );
            `;
      await db.run(addUserQuery);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

app.get("/user/:userName", async (request, response) => {
  const { userName } = request.params;
  const selectUserQuery = `
    SELECT *
    FROM user
    WHERE username = '${userName}';
    `;
  const user = await db.get(selectUserQuery);
  response.send(user);
});

//api 2
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const getUserDetailsQuery = `
    SELECT *
    FROM user
    WHERE username = '${username}';
    `;
  const dbUser = await db.get(getUserDetailsQuery);
  console.log(dbUser.password);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const chechPswdMatched = await bcrypt.compare(password, dbUser.password);
    if (chechPswdMatched) {
      response.status(200);
      response.send("Login success");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

module.exports = app;
