const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const MongoDBStore = require('connect-mongodb-session')(session);
const app = express()
const UserModel = require('./models/user');
const bcrypt = require('bcryptjs');
const MongoURI = 'mongodb://0.0.0.0:27017/session'
// Connect MongoDB at default port 27017.
async function connectToDatabase() {
  try {
    await mongoose.connect(MongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to the database');
    // Continue with the rest of your code
  } catch (error) {
    console.error('Failed to connect to the database:', error);
  }
}

connectToDatabase();

const store = new MongoDBStore({
  uri: MongoURI,
  collection: "session"
})

app.set('view engine', 'ejs')
app.use(express.urlencoded({ extended: true }))
app.use(session({
  secret: "key to sign cookie",
  resave: false,
  saveUninitialized: false,
  store: store
}))
const isAuth = (req,res,next) =>{
  if(req.session.isAuth){
    next()
  }
  else {
    res.redirect("/login")
  }

}

app.get("/", (req, res) => {
  res.render("landing")
})
app.get("/login", (req, res) => {
  res.render("login")
})
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  let user = await UserModel.findOne({ email });

  if (!user) {
    return res.render("/login");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.render("/login");
  }
  req.session.isAuth = true
  res.redirect("/dashboard");
});

app.get("/register",(req,res)=>{
  res.render("register")
  
})
app.post("/register", async (req,res)=>{
  const{name,email,password} = req.body;  
  let user = await UserModel.findOne({email})

const hashpswrd = await bcrypt.hash(password, 12)

  if(user){
     return res.redirect('/register')
  }
  user = new UserModel({
    name, 
    email,
    password: hashpswrd
  })
  await user.save()
  res.redirect("/login")
})



app.get("/dashboard",isAuth,(req,res)=>{
  res.render("dashboard")
})

app.post("/logout",(req,res)=>{
  req.session.destroy((err)=>{
    if(err) throw err;
    res.redirect("/")
  })
})

app.listen(5000, console.log("server running on http://localhost:5000"))