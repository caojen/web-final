var sqlite = require('sqlite3');

exports.login = function (req, res) {
    let { username, password } = req.body;
    password_required(username, password)
        .then(({ token, IsAdmin }) => {
            res.json({
                username,
                token,
                IsAdmin,
            })
        })
        .catch(error => {
            res.json({ error });
        });
}

exports.logout = function (req, res) {
    let { username, token } = req.body;
    let db = new sqlite.Database('sqlite.db');
    let sql = `update User set Token='' where Username='${username}' and Token='${token}';`;
    db.run(sql, function() {
        res.json({ message: 'ok' });
        db.close();
    });
}

exports.register = function (req, res) {
    let { username, password } = req.body;
    if(username.length > 17 || username.length < 6 || password.length > 17 || password.length < 6) {
        res.json({ error: 'Not_Valid' });
    } else {
        let db = new sqlite.Database('sqlite.db');
        let sql_checkUsernameIsExists = `select * from User where Username=?`;
        let sql_updateDatabase = `insert into User (Username, Password) Values (?, ?)`;
        db.all(sql_checkUsernameIsExists, [username], function(err, rows) {
            if(err) {
                res.json({ error: 'Server Error' });
                db.close();
            } else {
                if(rows.length > 0) {
                    res.json({ error: 'Username Exists' });
                    db.close();
                } else {
                    db.run(sql_updateDatabase, [username, password], function(err, rows) {
                        if(err) {
                            res.json({ error: 'Server Error' });
                        } else {
                            res.json({ message: 'ok' });
                        }
                        db.close();
                    })
                }
            }
        })
    }
}



function password_required(username, password) {
    let sql = `select * from User where Username='${username}' and Password='${password}'`;
    let db = new sqlite.Database('sqlite.db');

    return new Promise((resolve, reject) => {
        db.all(sql, function(err, res) {
            if(err) {
                console.log('err when login_require and checking permission');
                reject('Server Error');
            } else {
                if(res.length > 0) {
                    let IsAdmin = res[0].IsAdmin;
                    token_create(username)
                        .then(token => { resolve({ token, IsAdmin }) })
                        .catch(() => { reject('Server Error') });
                } else {
                    reject('Username not exists or Password error');
                }
            }
            db.close();
        });
    });
}


function token_create(username) {
    let token = "";
    let times = 64;
    while(times--) {
        token += Math.floor(Math.random() * 10);
    }
    let sql = `update User set Token='${token}' where Username='${username}'`;
    let db = new sqlite.Database('sqlite.db');

    return new Promise((resolve, reject) => {
        db.run(sql, function(err, res) {
            if(err) {
                console.log('err when token_create and update database');
                reject();
            } else {
                resolve(token);
            }
            db.close();
        })
    })
}
