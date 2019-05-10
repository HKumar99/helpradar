var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
var mongoose = require('mongoose');
var dotenv = require('dotenv').config({path: '../final' + '/.env'});
var logger = require('morgan');
var exphbs = require('express-handlebars');
var _ = require('underscore');
var Emergency = require('./models/Schema');
var moment = require('moment');
var typed = require('typed.js');
var timing = require('./timing.js');
var materialize = require('material-css');

var app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.engine('handlebars', exphbs({ defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

console.log(process.env.MONGODB);
mongoose.connect(process.env.MONGODB);
mongoose.connection.on('error', function() {
    console.log('MongoDB Connection Error!');
    process.exit(1);
});

var http = require('http').Server(app);
var io = require('socket.io')(http);

// The main page...contains all emergencies
app.get('/', function(req, res) {
    Emergency.find({}, function(err, emerges) {
        res.render('home', {data: emerges});
    });
});

// Returns the most recent emergencies
app.get('/recentemergencies', function(req, res) {
    Emergency.find({}, function(err, emerges) {
        var reversed = emerges.reverse();
        res.render('home', {data: reversed});
    });
});

// Renders user input handlebar to add an emergency
app.get('/addEmergency', function(req, res) {
    Emergency.find({}, function(err, emerges) {
        res.render('emerge', {data: emerges});
    })
});

// Renders handlebar for each emergency
app.get('/get/:id', function(req, res) {
    Emergency.findOne({_id: req.params.id}, function(err, emerge) {
        if (err) throw err;
        var tasks = emerge.tasks;
        console.log(emerge._id);
        res.render('emergency', {eid: emerge._id, etitle: emerge.title, data: tasks});
    });
})

// Renders user input handlebar to add a task
app.get('/get/:id/addTask', function(req, res) {
    Emergency.findOne({_id: req.params.id}, function(err, emerge) {
        if (err) throw err;
        res.render('tasker', {id: emerge._id});
    });
});

// Renders a list of all helpers for a task of an emergency
app.get('/:id/:taskid', function(req, res) {
    Emergency.findOne({_id: req.params.id}, function(err, emerge) {
        if (err) throw err;
        for (var i = 0; i < emerge.tasks.length; i++) {
            if (emerge.tasks[i]._id == req.params.taskid) {
                var helpers = emerge.tasks[i].helpers;
                res.render('task', {eid: emerge._id, taskid: req.params.taskid, data: helpers, etitle: emerge.tasks[i].title})
            }
        }
    });
});

// Renders user input handlebar to add a helper
app.get('/:id/:taskid/addHelper', function(req, res) {
    Emergency.findOne({_id: req.params.id}, function(err, emerge) {
        if (err) throw err;
        for (var i = 0; i < emerge.tasks.length; i++) {
            if (emerge.tasks[i]._id == req.params.taskid) {
                res.render('helper', {eid: emerge._id, taskid: req.params.taskid})
            }
        }
    });
});

// Post a new emergency to the database
app.post('/emergency', function(req, res) {
    var emergency = new Emergency({
        title: req.body.title,
        description: req.body.description,
        time: moment().format('MMMM Do YYYY, h:mm:ss a'),
        tasks: []
    });

    emergency.save(function(err) {
        if (err) throw err;
        io.emit('New Emergency', emergency);
    });
});

// Create a new task for an emergency
app.post('/create/:id/task', function(req, res) {
    Emergency.findOne({_id: req.params.id}, function(err, emerge) {
        if (err) throw err;
        if (!emerge) return res.send("No such emergency");
        var task = {
            title: req.body.title,
            description: req.body.description,
            priority: parseInt(req.body.priority),
            time: moment().format('MMMM Do YYYY, h:mm:ss a'),
            helpers: []
        }
        emerge.tasks = emerge.tasks.concat([task]);
        emerge.save(function(err) {
            if (err) throw err;
            res.redirect('/get/' + req.params.id);
        });
    });
});

// Add a helper or person to help out with the task
app.post('/create/:id/:taskid/person', function(req, res) {
    Emergency.findOne({_id: req.params.id}, function(err, emerge) {
        if (err) throw err;
        if (!emerge) return res.send("No such emergency");
        for (var i = 0; i < emerge.tasks.length; i++) {
            if (emerge.tasks[i]._id == req.params.taskid) {
                var helper = {
                    name: req.body.name,
                    phone: parseInt(req.body.phone),
                    email: req.body.email
                }
                emerge.tasks[i].helpers = emerge.tasks[i].helpers.concat([helper]);
                break;
            }
        }
        emerge.save(function(err) {
            if (err) throw err;
            res.redirect('/' + req.params.id + '/' + req.params.taskid);
        });
    });
});

// Delete an emergency
app.delete('/remove/:id', function(req, res) {
    Emergency.findByIdAndRemove(req.params.id, function(err, emerge) {
        if (!emerge) return res.send("Not deleted");
        res.send("Deleted");
    });
});

// Removes first task in an emergency
app.delete('/remove/:id/task', function(req, res) {
    Emergency.findOne({_id: req.params.id}, function(err, emerge) {
        if (err) throw err;
        if (!emerge) return res.send("No such emergency");
        if (emerge.tasks.length != 0) {
            emerge.tasks = emerge.tasks.pop();
        }

        emerge.save(function(err) {
            if (err) throw err;
            return res.send("Removed task");
        });
    });
});

// Removes first person for a task
app.delete('/remove/:id/:taskid/person', function(req, res) {
    Emergency.findOne({_id: req.params.id}, function(err, emerge) {
        if (err) throw err;
        if (!emerge) return res.send("No such emergency");
        for (var i = 0; i < emerge.tasks.length; i++) {
            if (emerge.tasks[i]._id == req.params.taskid) {
                emerge.tasks[i].helpers = emerge.tasks[i].helpers.pop();
            }
        }
        emerge.save(function(err) {
            if (err) throw err;
            return res.send("Helper removed!");
        });
    });
});

app.get('/about', function(req, res) {
    res.render('about', {});
});

app.listen(process.env.PORT || 3000, function() {
    console.log('Listening!');
});






































