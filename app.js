const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require('bcrypt');

const databasePath = path.join(__dirname, "userData.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

//API 1

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  if(password.length < 5){
      response.status = 400;
      response.send("Password is too short");

  }else{
    const hashedPassword = await bcrypt.hash(request.body.password, 10);
    const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
    const dbUser = await database.get(selectUserQuery);
    if (dbUser === undefined) {
        const createUserQuery = `
        INSERT INTO 
            user (username, name, password, gender, location) 
        VALUES 
            (
            '${username}', 
            '${name}',
            '${hashedPassword}', 
            '${gender}',
            '${location}'
            )`;
        const dbResponse = await database.run(createUserQuery);
        // const newUserId = dbResponse.lastID;
        // response.send(`Created new user with ${newUserId}`);
        response.send("User created successfully");
    } else {
        response.status = 400;
        response.send("User already exists");
    }
  }
});

//API 2

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await database.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
      if(password.length < 5){
        response.status = 400;
        response.send("Password is too short");

  }else{
        const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
        if (isPasswordMatched === true) {
            response.send("Login Success!");
        } else {
            response.status(400);
            response.send("Invalid Password");
        }
    }
   
  }
});

// API 3

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword} = request.body;
  const newPasswordHashed = await bcrypt.hash(request.body.newPassword, 10);

  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await database.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
      if(newPassword.length < 5){
        response.status(400);
        response.send("Password is too short");

    }else{
        const isPasswordMatched = await bcrypt.compare(oldPassword, dbUser.password);
        // console.log(isPasswordMatched);
        if (isPasswordMatched === true) {
            //  console.log(isPasswordMatched);
            const updateNewPasswordQuery = `
                UPDATE
                    user
                SET
                    password = '${newPasswordHashed}'
                WHERE
                    username = '${username}';`;

            await database.run(updateNewPasswordQuery);
            response.send("Password updated");
        } else {
            response.status(400);
            response.send("Invalid Password");
    }
    }

    
  }
});

module.exports = app;