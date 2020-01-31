/*
 * Serve JSON to our AngularJS client
 */

// GET

const sqlite = require('sqlite3');
const dbpath = 'sqlite.db';

exports.posts = function (req, res) {
  let data = []
  let db = new sqlite.Database(dbpath);
  let sql = 'select * from BlogTitle';

  let offset = 0;
  let pageCount = 15; // this is default, the value will be changed below(based on the url params)

  let url = req.url.split('?')[1];
  let params = url.split('&');
  params.forEach(value => {
    if (value.split('=')[0] === 'offset') {
      offset = parseInt(value.split('=')[1]);
    } else if (value.split('=')[0] === 'pageCount') {
      pageCount = parseInt(value.split('=')[1]);
    }
  })

  db.all(sql, (err, rows) => {
    if (err) {
      res.json({
        error: 'Server Error'
      });
    } else {

      for (let i = offset * pageCount; i < (offset + 1) * pageCount && i < rows.length; i++) {
        data.push({
          ...rows[i],
          IsHidden: parseInt(rows[i].IsHidden),
        })
      }

      res.json({
        data,
        message: 'ok',
        count: rows.length,
        offset,
        pageCount,
      });
    }
    db.close();
  })
};

exports.post = function (req, res) {
  var id = req.params.id;
  let db = new sqlite.Database(dbpath);
  let sql_info = `select * from BlogTitle where BlogId=?`;
  let sql_content = `select Content from BlogContent where BlogId=?`;

  db.all(sql_info, [id], (err, rows) => {
    if (err || rows.length == 0) {
      res.json({ message: 'No Such Blog' });
      db.close();
    } else {
      let title = rows[0].Title;
      let time = rows[0].Time;
      let username = rows[0].Username;
      db.all(sql_content, [id], (err, rows) => {
        if (err || rows.length == 0) {
          res.json({ message: 'No Such Blog' });
        } else {
          let text = rows[0].Content;
          res.json({
            title,
            time,
            username,
            text,
          })
        }
        db.close();
      })
    }
  })

};

// POST

exports.addPost = function (req, res) {
  let { username, token, title, text } = req.body;
  login_require(username, token)
    .then(() => {
      let db = new sqlite.Database(dbpath);
      let sql_insertTitle = `insert into BlogTitle (Username, Title) values (?, ?)`;
      let sql_getLastId = 'select last_insert_rowid() from BlogTitle';

      db.run(sql_insertTitle, [username, title], err => {
        db.all(sql_getLastId, (err, rows) => {
          let lastId = rows[0]['last_insert_rowid()'];
          let sql_insertContent = `insert into BlogContent (BlogId, Content) values (?, ?)`;
          db.run(sql_insertContent, [lastId, text] , err => {
            res.json({
              message: 'ok'
            })
            db.close();
          })
        })
      })
    })
    .catch(error => {
      res.json({ error });
    })
};

// PUT

exports.editPost = function (req, res) {
  let id = req.params.id;
  let { username, token, title, text } = req.body;
  blog_permission_require(username, token, id)
    .then(() => {
      let sql_title = `update BlogTitle set Title=?, Time=datetime('now', 'localtime') where BlogId=?`;
      let sql_content = `update BlogContent set Content=? where BlogId=?`;

      let db = new sqlite.Database(dbpath);
      db.run(sql_content, [text, id]);
      db.run(sql_title, [title, id]);

      res.json({ message: 'ok' });
    })
    .catch(() => {
      res.json({ error: 'Permission Denied' });
    })

};

// DELETE

exports.deletePost = function (req, res) {
  var id = req.params.id;

  let { username, token } = req.headers;
  blog_permission_require(username, token, id)
    .then(() => {
      let db = new sqlite.Database(dbpath);
      let sql_title = `delete from BlogTitle where BlogId=?`;
      let sql_content = `delete from BlogContent where BlogId=?`
      db.run(sql_title, [id], (err) => {
        db.run(sql_content, [id], err => {
          db.close();
        })
      });
      res.json({ message: 'ok' });
    })
    .catch(() => {
      res.json({ error: 'Permission Denied' });
    })
};

function login_require(username, token) {
  return new Promise((resolve, reject) => {
    if (!username || !token) {
      reject('Not Login');
    } else {
      let db = new sqlite.Database(dbpath);
      let sql = `select * from User where Username=? and Token=?`;
      db.all(sql, [username, token], (err, rows) => {
        if (err) {
          reject('Server Error');
        } else {
          if (rows.length === 0) {
            reject('Password Expires');
          } else {
            resolve();
          }
        }
        db.close();
      })
    }
  })
}

// logic: if admin, ok. otherwise, (if admin_only: reject, else) check if is owner
function blog_permission_require(username, token, blogId, admin_only) {
  let isOwner = function (username, blogId) {
    return new Promise((resolve, reject) => {
      let sql = `select * from BlogTitle where Username=? and BlogId=?`;
      let db = new sqlite.Database(dbpath);
      db.all(sql, [username, blogId], (err, rows) => {
        if (rows.length) {
          resolve();
        } else {
          reject();
        }
        db.close();
      })
    })
  }

  admin_only = admin_only || false;
  return new Promise((resolve, reject) => {
    login_require(username, token)
      .then(() => {
        admin_require(username)
          .then(() => { resolve() })
          .catch(() => {
            if (admin_only) {
              reject();
            } else {
              isOwner(username, blogId)
                .then(() => { resolve() })
                .catch(() => { reject() })
            }
          })
      })
      .catch(error => {
        reject(error);
      })

  })
}

function admin_require(username) {
  return new Promise((resolve, reject) => {
    let db = new sqlite.Database(dbpath);
    let sql = `select IsAdmin from User where Username=?`;
    db.all(sql, [username], (err, rows) => {
      if (rows[0].IsAdmin) {
        resolve();
      } else {
        reject();
      }
      db.close();
    });
  })
}

exports.permissionCtrl = {
  login_require,
  blog_permission_require,
  admin_require,
}

exports.hidePost = function(req, res) {
  let BlogId = req.params.id;
  let { username, token } = req.body;

  login_require(username, token)
    .then(() => {
      admin_require(username)
        .then(() => {
          let db = new sqlite.Database(dbpath);
          let sql_select = `select IsHidden from BlogTitle where Blogid=?`;
          db.all(sql_select, [BlogId], (err, rows) => {
            let IsHidden = rows[0].IsHidden == 0 ? 1 : 0;
            let sql_update = `update BlogTitle set IsHidden=? where BlogId=?`;
            db.run(sql_update, [IsHidden, BlogId], () => {
              db.close();
            })
            res.json({ message: 'ok' });
          })
        })
        .catch(() => {
          res.json({ error: 'Permission Denied '});
        })
    })
    .catch(() => {
      res.json({ error: 'Permission Denied' });
    })
}