var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');
var Schema = mongoose.Schema;

var eventRegisteration = new Schema({
    userId:String,
    eventId:String,
    userEmailId:String
})
var eventSchema = new Schema({
    userId:String,
    StartDate: {type:Date, createdAt: 'created_at' }, 
    EndDate: {type:Date, createdAt: 'created_at' },
    Time:String,
    presenter_name: String,
    event_title: String,
    subject: String,
    description: String,
    event_adress:{
        city: String,
        state: String,
        country: String,
        pin_code: String,
        address: String,
    },
    event_contact:{
        email: String,
        phone_no: Number,
    },
    post:{
        like:{type:Number, default:function(){return 0}},

    },
    createDate:{type:Date, createdAt: 'created_at' },
    updateDate:{type:Date, createdAt: 'created_at' }
})

var events = mongoose.model('events', eventSchema);

module.exports.getEventDetails = (eventData, cb)=>{
    var newEvent = new events(eventData);
    newEvent.save(cb);
}

module.exports.getEvents = (user_id, cb) =>{
    events.find({userId:user_id}, cb)
}

module.exports.getAllEvents = (cb) =>{
    events.find({}).sort({createDate:-1}).exec(cb);
}

module.exports.removeEventByUserId = (remove_obj, cb)=>{
    events.deleteOne({userId:remove_obj.userId, _id:remove_obj.eventId}, cb);
}
module.exports.userLikeEvent = (remove_obj, cb)=>{
    events.findOneAndUpdate({_id:remove_obj.eventId},{$inc:{'post.like':1}}, cb);
}

var eventsRegister = mongoose.model('events_register', eventRegisteration);

module.exports.userRegisterForEvent = (info, cb) =>{
    var userRegister =  new eventsRegister(info);
    userRegister.save(cb);
}
