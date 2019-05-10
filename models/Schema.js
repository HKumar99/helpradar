var mongoose = require('mongoose');

var personSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    phone: {
        type: Number,
        min: 0,
        max: 9999999999,
        required: true
    },
    email: {
        type: String
    }
});

var taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    time: {
        type: String,
        required: true
    },
    priority: {
        type: Number,
        min: 1,
        max: 3,
        required: true
    },
    helpers: [personSchema]
});


var emergencySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    time: {
        type: String,
        required: true
    },
    tasks: [taskSchema]
});

var Emergency = mongoose.model('Emergency', emergencySchema);

module.exports = Emergency;