var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');
var Schema = mongoose.Schema;

var signup = new  Schema({
    name:{ type: String, required: true },
    username: { type: String, required: true, index: { unique: true } },
    email:{type: String, required: true, index: { unique: true }},
    password: { type: String, required: true },
    user_role: { type: Number, required: true }
})
var UserSignUp = mongoose.model('users', signup);

var refreshTokenScehma = new Schema({
    username: { type: String, required: true, index: { unique: true } },
    refreshToken: { type: String, required: true, index: { unique: true } }
});
var GetrefreshTokenScehma = mongoose.model('refreshToken', refreshTokenScehma);

module.exports.registerUser = function(userDetail, cb){
    bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(userDetail.password, salt, function(err, hash) {
            // Store hash in your password DB.
            userDetail.password = hash;
            var newUser = new UserSignUp(userDetail)
            newUser.save(cb)
        });
    });
}
module.exports.updatePassword = (userDetail, cb) => {
    bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(userDetail.newPassword, salt, function(err, hash) {
            // Store hash in your password DB.
            userDetail.newPassword = hash;
            var queryObj = [{ "username" : userDetail.username }, { "email" : userDetail.username }]
            UserSignUp.updateOne({$or:queryObj},
            { $set: { "password" : userDetail.newPassword } }, cb);
        });
    });
}
module.exports.getUserById =  function(id, cb){
    UserSignUp.findById(id, cb);
}
module.exports.getUserByUsername =  function(username,cb){
    var queryObj = [{'username':username}, {'email':username}];
    UserSignUp.findOne({$or:queryObj},cb);
}
module.exports.checkNewIsUser =  function(email,cb){
    UserSignUp.findOne({'email':email},cb);
}
module.exports.comparePassword =  function(userPassword, hash, cb){
    bcrypt.compare(userPassword, hash, (err, isMatch) =>{
        console.log("pwd ismath", isMatch);
        if(err) throw err;
        cb(null, isMatch)
    })
}
module.exports.getRefreshTokenById = function(user, cb){
    var queryObj = [{'username':user.username}, {'refreshToken':user.refreshToken}];
    GetrefreshTokenScehma.findOne({$or:queryObj}, cb);
}
module.exports.updateRefreshTokenById = function(userToken, cb){
    GetrefreshTokenScehma.updateOne({ "username" : userToken.username },
    { $set: { "refreshToken" : userToken.refreshToken } }, cb);
}
module.exports.insertRefreshToken = function(tokenData, cb){
    var newToken =  GetrefreshTokenScehma(tokenData);
    newToken.save(cb);
}

module.exports.getAllUsers = (cb)=>{
    UserSignUp.find({}).exec(cb)
}