const express=require('express')
const app=express();
const PORT=8000;
const path=require("path")
const Blog=require("./models/blog")
const userRoute=require('./routes/user')
const blogRoute=require('./routes/blog')
const mongoose=require('mongoose')
const cookieParser=require('cookie-parser');
const { checkForAuthenticationCookie } = require('./middlewares/authentication');
app.set("view engine","ejs");
app.set("views",path.resolve("./views"))

app.use(express.urlencoded({extended:false}))
app.use(cookieParser());
app.use(checkForAuthenticationCookie('token'))
app.use(express.static(path.resolve("./public")))


app.get('/',async (req,res)=>{
    const allBlogs=await Blog.find();
    return res.render("home",{
        user: req.user,
        blogs:allBlogs,
    })
})
app.use('/user',userRoute);
app.use('/blog',blogRoute);





mongoose.connect('mongodb://localhost:27017/blogify').then((e)=>console.log('MongoDB connected'))
app.listen(PORT,()=>console.log(`server started at http://localhost:${PORT}`))

