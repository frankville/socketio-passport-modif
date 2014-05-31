var http = require('http');
//var views = require('./views');
var express = require('express');
var app = express();
var connect = require('connect');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var socketIo = require('socket.io');
var passportSocketIo = require('passport.socketio');
var sessionStore = new connect.session.MemoryStore();
var crypto = require('crypto');
var mysql = require("mysql");
var sessionSecret = 'wielkiSekret44';
var sessionKey = 'connect.sid';
var server;
var io;

var sameCustomer;

// Define our db creds
var db = mysql.createConnection({
    host: "localhost",
    user: "1",
    password:"1",
    database: "node"
});

// Log any errors connected to the db
db.connect(function(err){
    if (err) console.log(err)
})

// helper callback to make syncronous queries
// to database taken from http://jsfiddle.net/3rY9L/
var after = function _after(count, f) {
    var c = 0,
        results = [];

    return function _callback() {
        switch (arguments.length) {
        case 0:
            results.push(null);
            break;
        case 1: // this case is triggered when query returns some rows
            results.push(arguments[0]);
            break;
        default:
            results.push(arguments);
            break;
        }
        if (++c === count) {
            f.apply(this, results);
        }
    };
};

// Hash password utility
function generatePassword(str){
    var passwd = crypto.createHash('sha256').update(str, 'base64').digest('hex').slice(0,30);
    return passwd;
}

// TODO
// get a cleaner way to get session username
function getUsername() {
    var key = Object.keys(sessionStore.sessions)[0];
    var _session = JSON.parse(sessionStore.sessions[key]);

    return _session.passport.user.username;
}    

// Query the database for tuple with this username and password
// returns callback to avoid async malfunction
function validateLogin(username, password, callback){
    // encode password
    var passwd = generatePassword(password);
    db.query('SELECT id FROM user WHERE username = ? AND passwd = ?' , [username, passwd], callback);
}

// funtcion redirect to admin or client page on login
var redirectOnLogin = function(req, res){
    db.query("select customer.id from customer join user on user.id = customer.id where user.username = ?", req.user.username, function(err, result){
        if(err) console.log(err);
        if(result[0] != null){
            //views.client(req,res);
        }
        else{
            //views.admin(req,res);
        }
    });  
}

function getUserCustomerID(username, callback){

    db.query("SELECT C.id FROM customer C JOIN user U ON U.id = C.id \
              WHERE U.username = ?", [username], 
    function(err, result){
            if(err){
                 db.query("SELECT customerid FROM adminuser A JOIN user U ON user.id = adminuser.id \
                  WHERE username = ?", [username], 
            function(err2, result2){
                if(result){
                    console.log(result2[0].customerid);
                    callback(result2[0].customerid);
                }else{
                    console.log(err2);
                }
            });
        }else{
            console.log(result[0].id);
            callback(result[0].id);        
        }
    });
}

// Broadcast to all users with same customer id
function broadcast(socket, callbackName, data){
    var id = socket.id;
    var username = getUsername();

    // get all admin users with same customer id from given username
    db.query("SELECT username FROM adminuser JOIN user ON user.id = adminuser.id \
              WHERE customerid = (SELECT customerid FROM adminuser JOIN user ON user.id = adminuser.id \
              WHERE username = ?)", [username], 
    function(err, result){
        passportSocketIo.filterSocketsByUser(io, function(user){
            // in case it is not an admin user
            if (user.username === username)
                return true;
            for(var k in result) {
                if(user.username === result[k].username)
                    return true;
            }
            return false;
        }).forEach(function(_socket){
            if(id != _socket.id)
                _socket.emit(callbackName, data);
        });
    });   
}

/*
wt: Working Time, Type: json

json fields | table correspondence
-----------------------------------
employee    | employee.id    (INT)
branchid    | branch.id      (INT)
captcheckin | checkinpic     (BLOB)
checkin     | checkin        (INT)
captcheckout| checkoutpic    (BLOB)
checkout    | checkout       (INT)
*/

// return workingtime row inserted
function saveCheckin(socket, wt){
    console.log(" valor del wt "+wt);
    db.query('INSERT INTO workingtime (empid,branchid,checkinpic,checkin,checkout,checkoutpic) VALUES (?,?,?,?,?,?)', 
                                                                    [wt.employee,wt.branchid,wt.captcheckin,wt.checkin,wt.captcheckout,wt.checkout],
    function (err, result){
        if(!err){
            var wtId = result.insertId;
            db.query("SELECT * FROM workingtime where id = ?", [wtId],
            function (err, result){
                if (!err){
                    broadcast(socket, "generatedCheckin", result[0]);
                    socket.emit("generatedCheckin",{"id" : wtId});
                }
                else
                    console.log(err);
            });
        }
        else
            console.log(err);
    });
}

// Update checkout in a working time entry matching by date and employee this way we can override 
// the use of the local database autogenerated ids that can conflict between clients
function saveCheckout(socket, wt){
    db.query("update workingtime set captcheckout = ?, checkout = ? where empid = ? and day(checkin) = day(now()) and month(checkin) = month(now()) and year(checkin) = year(now())", 
                                            [wt.captcheckout, wt.checkout, wt.employee],
    function (err, result){
        if(!err){
            var wtId = result.insertId;
            db.query("SELECT * FROM workingtime where id = ?", [wtId],
            function (err, result){
                if (!err){
                    // emit to everyone the new row 
                    broadcast(socket, "generatedCheckout", result[0]);
                    // emit to sender th new id
                    socket.emit("generatedCheckout",{"id" : wtId});
                }
                else
                    console.log(err);
            });
        }
        else
            console.log(err);
    });
}

/*
au: Admin User. Type: json

json fields | table correspondence
-----------------------------------
id          | id              (INT) - just used in update
username    | user.username   (VARCHAR)
passwd      | user.passwd     (VARCHAR)
name        | name            (VARCHAR)
surname     | surname         (VARCHAR)
picture     | picture         (BLOB)
email       | email           (VARCHAR)
address     | address         (VARCHAR)
phone       | phone           (INT)
customerid  | customer.id     (INT)
userid      | user.id         (INT)
*/

// return the inserted adminUser and user rows
function saveAdminUser(socket, au){
    // encode password
    var passwd = generatePassword(au.passwd);
    // insert the user
    db.query("INSERT INTO user (username,passwd) VALUES (?,?)", [au.username, passwd], 
    function (err, result){
        if(!err){
            //now insert the admin user using the id of the inserted user
            var userid = result.insertId;
		    db.query("INSERT INTO adminuser (id,name,surname,picture,email,address,phone,customerid) VALUES (?,?,?,?,?,?,?,?)", 
                                                                            [userid,au.name,au.surname,au.picture,au.email,au.address,au.phone,au.customerid], 
            function(err, result){
                if(!err){
                    var adminId = result.insertId;
                    var handleDatabase = after(2, function (adminUser,user) {
                        var data = {"adminUser": adminUser[1], 
                                    "user": user[1]};
                        // return to all new rows
                        broadcast(socket, "generatedAdminUser", data);
                        // return to sender the new user id
                        socket.emit("generatedAdminUser", {"id": userid} );
                    })
                    // get both rows and emit to all connected clients
                    db.query("SELECT * FROM adminuser where id = ?", [adminId], handleDatabase);
                    db.query("SELECT * FROM user where id = ?", [userid], handleDatabase);
                }
                else
                    console.log(err);
            });
	    }
        else
		    console.log(err);
    });
}

// return the updated adminUser and user rows
function updateAdminUser(socket, au){
    // encode password
    var passwd = generatePassword(au.passwd);
    // update the user
    db.query("UPDATE user SET username = ?, passwd = ? WHERE id = ?", 
                                      [au.username, passwd, au.userid], 
    function (err, result){
        if(!err){
            //now insert the admin user using the id of the inserted user
            db.query("UPDATE adminuser SET name = ?, surname = ?, picture = ?, email = ?, address = ?, phone = ?, customerid = ? WHERE id = ?",
                                                [au.name, au.surname, au.picture, au.email, au.address, au.phone, au.customerid, au.id], 
            function(err, result){
                if(!err){
                    var handleDatabase = after(2, function (adminUser,user) {
                        var data = {"adminUser": adminUser[1], 
                                    "user": user[1]};
                        // return to all new rows
                        broadcast(socket, "updatedAdminUser", data);
                        // return to sender the new user id
                        socket.emit("updatedAdminUser", {"id": au.id} );
                    })
                    // get both rows and emit to all connected clients
                    db.query("SELECT * FROM adminuser where id = ?", [au.id], handleDatabase);
                    db.query("SELECT * FROM user where id = ?", [au.id], handleDatabase);
                }
                else
                    console.log(err);
            });
        }
        else
            console.log(err);
    });
}

// this function will delete in cascade a user and its associated adminuser 
function deleteUser(socket, au){
    db.query("DELETE FROM user WHERE id = ?", 
                                        [au.id], 
    function(err, result){
        if(!err){
            broadcast(socket, "deletedUser", {"id": au.id} );
            socket.emit("deletedUser", {"id": au.id});
        }
        else
            console.log(err);
    });
}

/*
e: Employee, Type: json.

json fields | table correspondence
-----------------------------------
id          | id          (INT) -- used for updates
name        | name        (VARCHAR)
surname     | surname     (VARCHAR)
picture     | picture     (BLOB)
customerid  | customer.id (INT)
*/

// return employee row
function saveEmployee(socket, e){
    db.query('INSERT INTO employee (name,surname,picture,customerid) VALUES (?,?,?,?)', [e.name, e.surname, e.picture, e.customerid], 
    function(err, result){
        if(!err){
            var empId = result.insertId;
            // send to clients the inserted row 
            db.query("SELECT * FROM employee where id = ?", [empId],
            function (err, result){
                if (!err){
                    broadcast(socket, "generatedEmployee", result[0]);
                    socket.emit("generatedEmployee", {"id" : empId});
                }
                else
                    console.log(err);
            });
        }
        else
            console.log(err);
    });
}

// return updated row
function updateEmployee(socket, e){
    db.query('UPDATE employee SET name = ?, surname = ?, picture = ?, customerid = ? WHERE id = ?', 
                                        [e.name, e.surname, e.picture, e.customerid, e.id], 
    function(err, result){
        if(!err){
            // send to clients the inserted row 
            db.query("SELECT * FROM employee where id = ?", [e.id],
            function (err, result){
                if (!err){
                    broadcast(socket, "updatedEmployee", result[0]);
                    socket.emit("updatedEmployee", {"id" : e.id});
                }
                else
                    console.log(err);
            });
        }
        else
            console.log(err);
    });
}

// delete employee
function deleteEmployee(socket, e){
    db.query("DELETE FROM employee WHERE id = ?", [e.id], 
    function(err,result){
        if(!err){
            broadcast(socket, "deletedEmployee", {"id": e.id});
            socket.emit("deletedEmployee", {"id": e.id});
        }
        else
            console.log(err);
    });
}

/*
b: Branch, Type: json.

json fields | table correspondence
-----------------------------------
id          | id            (INT) -- just for the updates
name        | name          (VARCHAR)
phone       | phone         (INT)
address     | address       (INT)
email       | email         (VARCHAR)
customerid  | customer.id   (INT)
*/

// return inserted row in branch table
function saveBranch(socket, b){
    db.query('INSERT INTO branch (name,phone,address,email,customerid) VALUES (?,?,?,?,?)',[b.name,b.phone,b.address,b.email,b.customerid], 
    function(err, result){
        if(!err){
            var branchId = result.insertId;
            // send to clients the inserted row 
            db.query("SELECT * FROM branch where id = ?", [branchId],
            function (err, result){
                if (!err){
                    broadcast(socket, "generatedBranch", result[0]);
                    socket.emit("generatedBranch", {"id" : branchId});
                }
                else
                    console.log(err);
            });
        }
        else
            console.log(err);
    });   
}

// update branch 
function updateBranch(socket, b){
    db.query('UPDATE branch SET name = ?, phone = ?, address = ?, email = ?, customerid = ? WHERE id = ?',
                                      [b.name, b.phone, b.address, b.email, b.customerid, b.id], 
    function(err, result){
        if(!err){
            // send to clients the inserted row 
            db.query("SELECT * FROM branch where id = ?", [b.id],
            function (err, result){
                if (!err){
                    broadcast(socket, "updatedBranch", result[0]);
                    socket.emit("updatedBranch", {"id" : b.id});
                }
                else
                    console.log(err);
            });
        }
        else
            console.log(err);
    });   
}

// delete a branch
function deleteBranch(socket, b){
    db.query("DELETE FROM branch WHERE id = ?", [b.id], 
    function(err,result){
        if(!err){
            broadcast(socket, "deletedBranch", {"id": b.id});
            socket.emit("deletedBranch", {"id": b.id});
        }
        else
            console.log(err);
    });
}

/*
bpa: Branches per Admin. type: json

json fields | table correspondence
-----------------------------------
adminId     | admin.id  (INT)
brnachId    | branch.id (INT)
*/

// return the row inserted in branches per admin
function saveBranchesPerAdmin(socket, bpa){
    db.query('INSERT INTO branchesperadmin (adminid,branchid) VALUES (?,?)',[bpa.adminid, bpa.branchid], 
    function(err, result){
        if(!err){
            // send to clients the inserted row 
            db.query("SELECT * FROM branchesperadmin where adminid = ? and branchid = ?", [bpa.adminid, bpa.branchid],
            function (err, result){
                if (!err){
                    broadcast(socket, "generatedBranchesPerAdmin", result[0]);
                }
                else
                    console.log(err);
            });
        }
        else
            console.log(err);
    });
}

// delete branches per admin
function deleteBranchesPerAdmin(socket, bpa){
    db.query("DELETE FFROM branchesperadmin WHERE adminid = ? and branchid = ?", 
                                                    [bpa.adminid, bpa.branchid],
    function(err, result){
        if (!err) {
            broadcast(socket, "deletedBranchesPerAdmin", bpa);
            socket.emit("deletedBranchesPerAdmin", bpa);
        } 
        else
            console.log(err);
    });
}

// return the rows in a json array
function broadcastAllTodaysTuples(socket, customerid){
    var handleDatabase = after(5, function (adminUsers,branches,branchesperadmin,employees,workingtime) {
        var data = {"adminUsers": adminUsers[1], 
                    "branches": branches[1], 
                    "branchesPerAdmin": branchesperadmin[1], 
                    "employees": employees[1],
                    "workingtime": workingtime[1]};
        socket.emit("syncFromServer",data);
    });

    // query each database for tuples inserted today
    db.query("SELECT * FROM adminuser where customerid = ?", [customerid], handleDatabase);
    db.query("SELECT * FROM branch where customerid = ?", [customerid], handleDatabase);
    db.query("SELECT branchesperadmin.* FROM branch inner join branchesperadmin on branch.id = branchesperadmin.branchid where customerid = ?", [customerid], handleDatabase);
    db.query("SELECT * FROM employee where customerid = ?", [customerid], handleDatabase);
    db.query("SELECT workingtime.* FROM employee inner join workingtime on employee.id = workingtime.empid where day(checkin) = day(now()) and month(checkin) = month(now()) and year(checkin) = year(now()) and customerid = ?", [customerid], handleDatabase);
}

// configuration passport.js and server
passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (obj, done) {
    done(null, obj);
});

// verify user and password
var p = new LocalStrategy(
    function (username, password, done) {
        validateLogin(username,password,
            function(err, results) {
            if (!err){
                if (results[0] == null){
                    return done(null, false);
                }

                return done(null, {
                    username: username,
                    password: password
                });
            }
            else
                console.log(err);    
        });
    }
);

passport.use(p);
/*
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
*/
app.use(express.cookieParser());
app.use(express.urlencoded());
app.use(express.session({
    store: sessionStore,
    key: sessionKey,
    secret: sessionSecret
}));

app.use(passport.initialize());
app.use(passport.session());
/*
app.use(express.static('public'));
app.use(express.static("bower_components"));

app.get('/', views.index)

app.get('/login', views.login);
*/
app.use('/',express.static(__dirname));
app.get('/', function(req, res) {
   
});

app.get('/isLogged', function(req, res) {
    if(req.isAuthenticated()){
        getUserCustomerID(req.user.username,  function(response){
            res.send(""+response);
        });
    }else{
        res.send("0");
    }
});


app.post('/login',
    passport.authenticate('local', {
        failureRedirect: '/login'
    }),
    function(req,res){

        getUserCustomerID(req.user.username, function(resp){
            res.send(resp.toString());
        });
    }
);

/*
app.post('/login',
    passport.authenticate('local', {
        failureRedirect: '/login'
    }),
    redirectOnLogin
);

app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/login');
});
*/
app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});
server = http.createServer(app);
io = socketIo.listen(server);

var onAuthorizeSuccess = function (data, accept) {
    accept(null, true);
};

var onAuthorizeFail = function (data, message, error, accept) {
    if (error) {
        throw new Error(message);
    }
    accept(null, false);
};

io.set('authorization', passportSocketIo.authorize({
    passport: passport,
    cookieParser: express.cookieParser,
    key: sessionKey, 
    secret: sessionSecret,
    store: sessionStore,
    success: onAuthorizeSuccess,
    fail: onAuthorizeFail
}));

io.set('log level', 2);

// bind model and socket events
io.sockets.on('connection', function (socket) {
    socket.on('disconnect', function() {   
    });
    
    db.query("select customer.id from customer join user on user.id = customer.id where user.username = ?", getUsername(), function(err, result){
        if(err) 
            console.log(err);
        else if(result[0]){
            console.log(getUsername()+" "+result[0].id);
            broadcastAllTodaysTuples(socket, result[0].id);
        }        
    });

    socket.on("saveAdminUser", function(data){
        saveAdminUser(socket, data);    
    });

    socket.on("updateAdminUser", function(data){
        updateAdminUser(socket,data);
    });

    socket.on("deleteUser", function(data){
        deleteUser(socket,data);
    });
    
    socket.on("saveBranchesPerAdmin", function(data){
        saveBranchesPerAdmin(socket, data);    
    });

    socket.on("deleteBranchesPerAdmin", function(data){
        deleteBranchesPerAdmin(socket,data);
    });
    
    socket.on("saveBranch", function(data){
        saveBranch(socket, data);
    });

    socket.on("deleteBranch", function(data){
        deleteBranch(socket, data);
    });
    
    socket.on("updateBranch", function(data){
        updateBranch(socket, data);
    });

    socket.on("saveEmployee", function(data){
        saveEmployee(socket, data);
    });

    socket.on("updateEmployee", function(data){
        updateEmployee(socket, data);
    });
    
    socket.on("deleteEmployee", function(data){
        deleteEmployee(socket, data);
    });
    
    socket.on("saveCheckin", function(data){
        saveCheckin(socket, data);
    });
    
    socket.on("saveCheckout", function(data){
        saveCheckout(socket, data);
    });
});

server.listen(2012, function () {
    console.log('Serwer pod adresem http://linode.dnsdynamic.com:2012/');
});