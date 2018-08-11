var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');
var Schema = mongoose.Schema;

var country_obj = new  Schema({
    country_name: { type: String, required: true, index: { unique: true } },
    cities:Array,
})
var save_country = mongoose.model('country_detials', country_obj);

var getCountry = require('./countries')
module.exports.saveAll_country = function(){
    // let store_country_obj = [];
    let country_obj = {}
    let country_container = Object.keys(getCountry);
    // console.log('country_container', country_container)
    // mongoose.connection.db.dropCollection(save_country, (err, suc) =>{
    //     console.log("dropCollection err", err)
    //     console.log("dropCollection suc", suc)
    // })
    save_country.collection.drop((err, suc) =>{
            console.log("dropCollection err", err)
            console.log("dropCollection suc", suc)
        });
    for(var i=0;i<country_container.length;i++){
        if(getCountry[country_container[i]]){
            country_obj.country_name = country_container[i];
            country_obj.cities = getCountry[country_container[i]];
            // store_country_obj.push(country_obj);
            var store_country_obj = save_country(country_obj);
            store_country_obj.save((err, suc)=>{
                // console.log("err", err)
                console.log("suc", suc)
            })
        }
    }
    
}