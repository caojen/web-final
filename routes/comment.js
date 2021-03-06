const { login_require, blog_permission_require, admin_require } = require('./api.js').permissionCtrl;
var sqlite = require('sqlite3');
const dbpath = 'sqlite.db';

exports.addComment = function (req, res) {
  let id = req.params.id;
  let { username, token, content } = req.body;
  login_require(username, token)
    .then(() => {
      let db = new sqlite.Database(dbpath);
      let sql = `insert into Comment (Username, BlogId, Content) values (?, ?, ?)`;
      db.run(sql, [username, id, content], () => {
        db.close();
      })
      res.json({ message: 'ok' });
    })
    .catch(() => {
      res.json({ error: 'NOT Login' });
    })
}

exports.getComment = function (req, res) {
  let BlogId = req.params.id;
  let sql = `select * from Comment where BlogId=?`;
  let db = new sqlite.Database(dbpath);

  let offset = 0;
  let pageCount = 20;

  let url = req.url.split('?')[1];
  let params = url.split('&');
  params.forEach(value => {
    if (value.split('=')[0] === 'offset') {
      offset = parseInt(value.split('=')[1]);
    } else if (value.split('=')[0] === 'pageCount') {
      pageCount = parseInt(value.split('=')[1]);
    }
  })

  db.all(sql, [BlogId], (err, rows) => {
    let data = [];

    for (let i = offset * pageCount; i < ((offset + 1) * pageCount) && i < rows.length; i++) {
      data.push({
        CommentId: rows[i].CommentId,
        Username: rows[i].Username,
        Content: rows[i].Content,
        IsHidden: rows[i].IsHidden,
        Time: rows[i].Time,
      })
    }

    res.json({
      count: rows.length,
      offset,
      pageCount,
      data,
    });
  })
}

exports.changeCommentStatus = function (req, res) {
  let BlogId = req.params.id;
  let CommentId = req.params.commentid;
  let { username, token } = req.body;

  blog_permission_require(username, token, BlogId, true)
    .then(() => {
      let sql_select = `select IsHidden from Comment where CommentId=? and BlogId=?`;
      let db = new sqlite.Database(dbpath);
      db.all(sql_select, [CommentId, BlogId], function (err, rows) {
        let newVal = rows[0].IsHidden == 0 ? 1 : 0;
        let sql_update = `update Comment set IsHidden=? where CommentId=? and BlogId=?`;
        db.run(sql_update, [newVal, CommentId, BlogId], () => {
          db.close();
        })
        res.json({ message: 'ok' });
      })
    })
    .catch(() => {
      res.json({ error: 'Permission Denied' });
    })
}

exports.deleteComment = function(req, res) {
  let BlogId = req.params.id;
  let CommentId = req.params.commentid;
  let { username, token } = req.headers;
  delete_comment_permission_require(username, token, BlogId, CommentId)
    .then(() => {
      let db = new sqlite.Database(dbpath);
      let sql = `delete from Comment where BlogId=? and CommentId=?`;
      db.run(sql, [BlogId, CommentId], () => {
        db.close();
      })
      res.json({ message: 'ok' });
    })
    .catch(() => {
      res.json({ error: 'Permission Denied' });
    })
  
}

exports.getChangeCommentPageDetail = function(req, res) {
  let BlogId = req.params.id;
  let CommentId = req.params.commentid;

  let db = new sqlite.Database(dbpath);
  let sql = `select * from Comment where BlogId=? and CommentId=?`;
  db.all(sql, [BlogId, CommentId], (err, rows) => {
    if(err || rows.length === 0) {
      res.json({ error: 'No Such Comment' });
    } else {
      res.json({
        BlogId,
        CommentId,
        Username: rows[0].Username,
        Comment: rows[0].Content,
        IsHidden: rows[0].IsHidden,
        Time: rows[0].Time,
      })
    }
    db.close();
  })
}



function delete_comment_permission_require(username, token, BlogId, CommentId) {
  return new Promise((resolve, reject) => {
    login_require(username, token)
      .then(() => {
        admin_require(username)
          .then(() => { resolve() })
          .catch(() => {
            // check if is blog' owner
            let db = new sqlite.Database(dbpath);
            let sql_checkIsBlogOwner = `select * from BlogTitle where BlogId=? and Username=?`;
            let sql_checkIsCommentOwner = `select * from Comment where BlogId=? and CommentId=? and Username=?`;
            db.all(sql_checkIsBlogOwner, [BlogId, username], (err, rows) => {
              if(rows.length > 0) {
                resolve();
                db.close();
              } else {
                db.all(sql_checkIsCommentOwner, [BlogId, CommentId, username], (err, rows) => {
                  if(rows.length > 0) {
                    resolve();
                  } else {
                    reject();
                  }
                  db.close();
                })
              }
            })
          })
      })
      .catch(() => { reject() })
  })
}

exports.changeComment = function(req, res) {
  let BlogId = req.params.id;
  let CommentId = req.params.commentid;
  let { username, token, comment } = req.body;
  login_require(username, token)
    .then(() => {
      let db = new sqlite.Database(dbpath);
      let sql_checkPermission = `select * from Comment where BlogId=? and CommentId=?`;
      db.all(sql_checkPermission, [BlogId, CommentId], (err, rows) => {
        if(rows.length == 0) {
          res.json({ error: 'No Such Comment' });
          db.close();
        } else {
          let sql_update = `update Comment set Content=?, Time=datetime('now', 'localtime') where BlogId=? and CommentId=?`;
          db.run(sql_update, [comment, BlogId, CommentId], (err) => {
            db.close();
          })
          res.json({ message: 'ok' })
        }
      })
    })
    .catch(() => {
      res.json({ error: 'Permission Denied' });
    })
}