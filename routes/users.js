var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
const {
  check,
  validationResult
} = require('express-validator/check');
var Users = require('../db/auth-schema');
var Events = require('../db/eventSchema')
var crypto = require('crypto');
var jwt = require('jsonwebtoken');

passport.use(new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password',
    passReqToCallback: true // allows us to pass back the entire request to the callback
  },
  function (req, username, password, done) {
    console.log("body", req.body)
    debugger;
    Users.getUserByUsername(username, (err, user) => {
      if (err) throw err;
      if (!user) {
        return done(null, false, {
          'msg': "Invalid username"
        });
      }

      Users.comparePassword(password, user.password, (err, isMatch) => {
        if (err) throw err;
        if (isMatch) {
          return done(null, user)
        } else {
          return done(null, false, {
            'msg': "Invalid password"
          });
        }
      })
    })
  }
));

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  Users.getUserById(id, function (err, user) {
    done(err, user);
  });
});

// User Registraion
router.post('/register', [
    check('name').not().isEmpty().withMessage("name is not valid"),
    check('username').not().isEmpty().withMessage("username is not valid"),
    check('email').not().isEmpty().isEmail().withMessage('email is not valid'),
    check('password').not().isEmpty().isLength({
      min: 6
    }).withMessage('password is mandatory and must be 6 characters long'),
    check('user_type').not().isEmpty().withMessage('user type is mandatory')
  ],
  function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("errors", errors)
      return res.status(422).json({
        errors: errors.array()
      });
    }
    var newUser = {
      name: req.body.name,
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
      user_role: req.body.user_type
    }
    Users.checkNewIsUser(newUser.email, (err, resData) => {
      if (err) {
        return res.status(400).json({
          success: false,
          msg: "internal error to validate user"
        });
      } else {
        console.log("resData", resData)
        if (resData) {
          res.status(200).json({
            success: true,
            msg: "User already register"
          });
        } else {
          Users.registerUser(newUser, (err, suc) => {
            if (err) {
              return res.status(400).json({
                success: false,
                msg: "internal error"
              });
            }

            res.status(200).json({
              success: true,
              msg: "user successfully register"
            });
          })
        }
      }
    })

  });

// User Login
router.post('/login', function (req, res, next) {
  passport.authenticate('local', function (err, user, info) {
    console.log("err", err)
    console.log("user", user)
    console.log("info", info)
    if (err) {
      res.status(400).send({
        success: false,
        message: "Internal error"
      });
    }
    if (user) {
      console.log("pass suc res valid", user)
      req.user = user
      return next();
    } else {
      res.status(400).send({
        success: false,
        message: info.msg
      });
    }
  })(req, res, next);
}, generateRefreshToken, generateAccesstoken, responseToUser);

router.post('/forgotPassword', (req, res)=>{
  if(req.body.username && req.body.newPassword){
    Users.getUserByUsername(req.body.username, (err, user) => {
      if(err){
        return res.status(400).json({
          status: false,
          msg: "internal err"
        })
      }
      if (!user) {
        return res.status(200).json({
          status: false,
          msg: "Invalid username"
        })
      }

      Users.updatePassword({username:req.body.username, newPassword: req.body.newPassword}, (err, update)=>{
        if(err){
          return res.status(400).json({
            status: false,
            msg: "internal err"
          })
        }

        return res.status(200).json({
          status: true,
          msg: "Password Successfully Updated.",
          data:update
        })
      })
    });
  }
})
router.get('/refreshToken', ValidateRefreshToken, generateAccesstoken, responseToUser)

router.post('/create-event', (req, res) => {
  console.log("events body", req.body)
  let EventObj = {
    "userId": req.body.user_id,
    "createDate": req.body.createDate,
    "updateDate": req.body.updateDate,
    "StartDate": req.body.StartDate,
    "EndDate": req.body.EndDate,
    "Time": req.body.Time,
    "presenter_name": req.body.presenter_name,
    "event_title": req.body.event_title,
    "subject": req.body.subject,
    "description": req.body.description,
    "event_adress": {
      "city": req.body.city,
      "state": req.body.state,
      "country": req.body.country,
      "pin_code": req.body.pin_code,
      "address": req.body.address,
    },
    "event_contact": {
      "email": req.body.email,
      "phone_no": req.body.phone_no,
    },
    "createDate":new Date(),
    "updateDate":new Date()
  }
  Events.getEventDetails(EventObj, (err, suc) => {
    if (err) {
      throw err;
      console.log("err", err)
     return res.status(400).json({
        status: false,
        msg: "internal err"
      })
    }
    res.status(200).json({
      status: true,
      msg: "event created",
      data: suc
    })

  })
})

router.get('/getEventByUser', (req, res)=>{
  if(req.query.userId){
    Events.getEvents(req.query.userId, (err, suc)=>{
      if(err){
        return res.status(400).json({
          status: false,
          msg: "internal err"
        })
      }
      if(suc){
        return res.status(200).json({
          status: true,
          msg: "user events",
          data:suc
        })
      }else{
        return res.status(200).json({
          status: true,
          msg: "No events found",
          data:suc
        })
      }
    })
  }
})

router.get('/getAllEvents', (req,res)=>{
  if(req.query.user_id){
    Users.getUserById(req.query.user_id, (err, userExit)=>{
      if(err){
        return res.status(400).json({
          status: false,
          msg: "Invalid user"
        })
      }
      console.log("userExit", userExit)
      if(userExit){
        Events.getAllEvents((err,suc)=>{
          if(err){
            return res.status(400).json({
              status: false,
              msg: "internal err"
            })
          }
          if(suc){
            return res.status(200).json({
              status: true,
              msg: "All events",
              data:suc
            })
          }else{
            return res.status(200).json({
              status: true,
              msg: "No events found",
              data:suc
            })
          }
        })
      }

    })
  }
 
})

router.post('/userRegisterForEvent', (req,res)=>{
  if(req.body.eventId && req.body.userEmailId){
    Events.userRegisterForEvent(req.body, (err, suc)=>{
      if(err){
        return res.status(400).json({
          status: false,
          msg: "Internal error"
        })
      }
      res.status(200).json({
        status: true,
        msg: "You Successfuly register for event",
        data:{event_id:suc.eventId}
      })
    })
  }
})

router.get('/removeEvent',(req, res)=>{
  if(req.query.userId && req.query.eventId){
    Events.removeEventByUserId(req.query, (err, suc)=>{
      if(err){
        return res.status(400).json({
          status: false,
          msg: "Internal error"
        })
      }
      console.log("delete event", suc)
      res.status(200).json({
        status: true,
        msg: "Event Delete Successfuly",
        data:{userId:suc.userId, event_id:suc.eventId}
      })
    });
  }
});

router.get('/userLikeEvent',(req,res)=>{
  if(req.query.eventId){
    Events.userLikeEvent(req.query, (err, suc)=>{
      if(err){
        return res.status(400).json({
          status: false,
          msg: "Internal error"
        })
      }
      console.log("delete event", suc)
      res.status(200).json({
        status: true,
        msg: "Event Like Successfuly",
        data:suc
      })
    });
  }
})

router.get('/getAllUsers', (req,res)=>{
  Users.getAllUsers((err, suc)=>{
      if(err){
        return res.status(400).json({
          status: false,
          msg: "Internal error"
        })
      }
      res.status(200).json({
        status: true,
        msg: "all users",
        data:suc
      })
    });
})
module.exports = router;

function generateRefreshToken(req, res, next) {
  // console.log("2 req.body", req);
  // res.send("success login");
  Users.getRefreshTokenById({
    'username': req.body.username,
    "refreshToken": ""
  }, function (err, suc) {
    if (err) {
      return res.status(400).send({
        success: false,
        message: "Internal error"
      });
    }
    let insertTokenObj = {
      'username': req.body.username,
      // 'refreshToken':"hello"
      'refreshToken': req.user._id.toString() + '.' + crypto.randomBytes(40).toString('hex')
    }
    if (!suc) {
      Users.insertRefreshToken(insertTokenObj, function (err, innerSuc) {
        if (err) {
          return res.status(400).send({
            success: false,
            message: "Internal error"
          });
        }
        console.log("get token suc", innerSuc)
        req.refreshToken = innerSuc.refreshToken
        return next();
      })
    } else {
      Users.updateRefreshTokenById(insertTokenObj, (err, innerSuc) => {
        if (err) {
          return res.status(400).send({
            success: false,
            message: "Internal error"
          });
        }
        console.log("update token suc", innerSuc);
        req.refreshToken = insertTokenObj.refreshToken
        return next();
      })
    }
  })
}

function generateAccesstoken(req, res, next) {
  jwt.sign({
    id: req.user._id
  }, 'vnydev', {
    expiresIn: 60 * 60
  }, (err, token) => {
    if (err) {
      return res.status(400).send({
        success: false,
        message: "Internal error"
      });
    }
    req.token = token;
    next();
  });
}

function responseToUser(req, res) {
  res.status(200).json({
    accessTokenDB: req.token,
    refreshTokenDB: req.refreshToken,
    expiresIn: 60 * 60 - 10,
    user: {
      id: req.user._id,
      name: req.user.name,
      username: req.user.username,
      email: req.user.email,
      user_role: req.user.user_role
    }
  });
}

function ValidateRefreshToken(req, res, next) {
  console.log("req.body valid", req.query)
  Users.getRefreshTokenById({
    "username": "",
    "refreshToken": req.query.refreshToken
  }, (err, suc) => {
    if (err) {
      return res.status(400).send({
        success: false,
        message: "Invalid user"
      });
    } else {
      console.log("valid token suc", suc)
      if (suc) {
        Users.getUserByUsername(suc.username, (err, userSuc) => {
          if (err) {
            return res.status(400).send({
              success: false,
              message: "Invalid user"
            });
          }
          console.log("userSuc", userSuc)
          req.user = userSuc;
          console.log("req.user", req.user)
          let insertTokenObj = {
            'username': req.query.username,
            // 'refreshToken':"hello"
            'refreshToken': req.user._id.toString() + '.' + crypto.randomBytes(40).toString('hex')
          }
          Users.updateRefreshTokenById(insertTokenObj, (err, innerSuc) => {
            if (err) {
              return res.status(400).send({
                success: false,
                message: "Internal error"
              });
            }
            console.log("update token suc", innerSuc);
            req.refreshToken = insertTokenObj.refreshToken
            return next();
          })
        })
      } else {
        return res.status(400).send({
          success: false,
          message: "Invalid user"
        });
      }
    }
  })
}