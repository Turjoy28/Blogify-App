const { Schema,model }=require('mongoose')
const {createHmac,randomBytes}=require('crypto')
const crypto = require('crypto');
const { error } = require('console');
const { createTokenForUser } = require('../services/authentication');

const userSchema=new Schema({
    fullName:{
        type:String,
        required:true,
    },
    emailAddress:{
        type:String,
        required:true,
        unique:true,
    },
    salt:{
        type:String,
        
    },
      password:{
        type:String,
        required:true,
    },
    profileImgURL:{
        type:String,
        default:'/images/defaultImg.webp',
    },
    role:{
        type:String,
        enum:["USER","ADMIN"],
        default:"USER",
    },

},{timestamps:true})

userSchema.pre('save',function (next){
    const user=this;
    if(!user.isModified("password"))return next();
    const salt=randomBytes(16).toString('hex');
    const hashedPassword=createHmac('sha256',salt).update(user.password).digest('hex')
    this.salt=salt;
    this.password=hashedPassword;
    next();
})

userSchema.statics.matchPasswordAndGenerateToken=async function(emailAddress,password){
    const user=await this.findOne({emailAddress})
    if(!user)throw new error("User not found")
    const salt=user.salt;
    const hashedPassword=user.password;
    const userProvidedHash= createHmac('sha256',salt).update(password).digest('hex')
    if(hashedPassword!=userProvidedHash)throw new error("Incorrect Password!")
    
        const token=createTokenForUser(user)
        return token;

}

const User=model("user",userSchema);
module.exports=User;