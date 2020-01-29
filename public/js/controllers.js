'use strict';

/* Controllers */

const PageCount = 20;

function IndexCtrl($scope, $http) {
  $scope.offset = 1;
  $scope.count = 0;
  $scope.getPosts = function(offset) {
    if(offset < 0) {
      offset = 1;
    } else if(offset > $scope.offset && $scope.posts.length === 0) {
      return;
    }
    let pre_offset = $scope.offset;

    $scope.offset = offset || $scope.offset;
    $http.get(`/api/posts?pageCount=${PageCount}&offset=${$scope.offset-1}`).
    success(function(data, status, headers, config) {
      if(data.data.length === 0) {
        $scope.offset = pre_offset;
      } else {
        $scope.posts = data.data.sort((a, b) => a.BlogId-b.BlogId);
        $scope.count = data.count;

        $scope.toPage = $scope.offset;
        $scope.totalPage = Math.ceil(data.count / PageCount);
      }
    });
  }

  $scope.$watch('toPage', function(newVal, oldVal) {
    if(newVal == '') {
      return;
    }
    if(/^[1-9]+[0-9]*$/.test(newVal) === false) {
      $scope.toPage = oldVal;
    }
    if(newVal > $scope.totalPage) {
      $scope.toPage = $scope.totalPage;
    } else if(newVal < 1) {
      $scope.toPage = 1;
    }
  })

  $scope.getPosts();

  $scope.form = {};
  let username = getCookie('username');

  if(username) {
    $scope.form.username = username;
    $scope.form.isadmin = parseInt(getCookie('isadmin'));
  }

  $scope.userLogout = function() {
    let username = getCookie('username');
    if(username) {
      let token = getCookie('token');
      $http.post('/user/logout', {
        username,
        token
      });
    }
    $scope.form = {};
    setCookie('username', 'deleted', -1);
    setCookie('token', 'deleted', -1);
  }

  $scope.changeHidePost = function(BlogId) {
    if(BlogId === 0 || !!BlogId) {
      $http.put('/api/hidepost/' + BlogId, {
        username: getCookie('username'),
        token: getCookie('token'),
      })
        .success(data => {
          if(!data.error) {
            $scope.getPosts();
          }
        })
    }
  }

  $scope.resetToPage = function() {
    $scope.toPage = $scope.offset;
  }
}

function AddPostCtrl($scope, $http, $location) {
  $scope.form = {};
  $scope.submitPost = function () {
    $http.post('/api/post', { 
      username: getCookie('username'),
      token: getCookie('token'),
      ...$scope.form,
    }).
      success(function(data) {
        $location.path('/');
      });
  };
}

function ReadPostCtrl($scope, $http, $routeParams) {
  $http.get('/api/post/' + $routeParams.id).
    success(function(data) {
      $scope.post = { ...data, BlogId: $routeParams.id }
    });
  
  const commentPageCount = 20;
  $scope.commentOffset = 0;

  let getAllComments = function() {
  
    $http.get('/api/comments/' + $routeParams.id + '?pageCount=' + commentPageCount + '&offset=' + $scope.commentOffset).
      success(function(data) {
        $scope.comments = data.data.sort((a, b) => a.CommentId - b.CommentId);
      })

  }

  getAllComments();
  $scope.newComment = '';
  $scope.addCommentResult = '';
  $scope.submitComment = function() {
    if($scope.newComment !== '') {
      $http.put('/api/comment/' + $routeParams.id, {
        username: getCookie('username'),
        token: getCookie('token'),
        content: $scope.newComment,
      }).
        success(data => {
          if(data.error) {
            $scope.addCommentResult = data.error;
          } else {
            $scope.newComment = '';
            $scope.addCommentResult = '';
            getAllComments();
          }
        });
    }
  }

  $scope.changeHideStatus = function(commentId) {
    $http.put('/api/comment/hide/'+$routeParams.id+"/"+commentId, {
      username: getCookie('username'),
      token: getCookie('token'),
    })
      .success(() => {
        getAllComments();
      })
  }

  $scope.deleteComment = function(commentId) {
    $http.delete('/api/comment/'+$routeParams.id+"/"+commentId, {
      headers: {
        username: getCookie('username'),
        token: getCookie('token'),
      },
    })
      .success(() => {
        getAllComments();
      })
  }

  $scope.nextComment = function() {
    if($scope.comments.length) {
      $scope.commentOffset++;
      getAllComments();
    }
  }

  $scope.preComment = function() {
    if($scope.commentOffset) {
      $scope.commentOffset--;
      getAllComments();
    }
  }

}

function EditPostCtrl($scope, $http, $location, $routeParams) {
  $scope.form = {};
  $http.get('/api/post/' + $routeParams.id).
    success(function(data) {
      $scope.form = data;
    });

  $scope.editPost = function () {
    if(!!$scope.form.title && !!$scope.form.text) {
      $http.put('/api/post/' + $routeParams.id, {
        ...$scope.form,
        username: getCookie('username'),
        token: getCookie('token'),
      }).
        success(function(data) {
          $location.url('/readPost/' + $routeParams.id);
        });
    };
  }
}

function DeletePostCtrl($scope, $http, $location, $routeParams) {
  $http.get('/api/post/' + $routeParams.id).
    success(function(data) {
      console.log(data);
      $scope.post = data;
    });
  $scope.deleteResult = '';
  $scope.deletePost = function () {
    $http.delete('/api/post/' + $routeParams.id, {
      headers: {
        username: getCookie('username'),
        token: getCookie('token')
      }
    }).
      success(function(data) {
        if(data.error) {
          $scope.deleteResult = 'Permission denied, please try to login again';
        } else {
          $scope.deleteResult = '';
          $location.url('/');
        }
        
      });
  };

  $scope.home = function () {
    $location.url('/');
  };
}

function LoginCtrl($scope, $http, $location) {
  $scope.form = {};
  $scope.submitLogin = function() {
    $http.post('/user/login', $scope.form).
      success(function(data) {
        if(!data.error) {
          setCookie('username', data.username);
          setCookie('token', data.token);
          setCookie('isadmin', data.IsAdmin);
          $location.url('/');
        } else {
          $scope.form.errorMessage = data.error;
          console.log(data.error);
        }
      })
  }
}

function RegisterCtrl($scope, $http, $location) {
  $scope.form = {};
  $scope.message = {};

  let checkValidInput = function(username, password, confirm) {
    return new Promise((resolve, reject) => {
      let res = {};
      if(!username || !(username.length < 18 && username.length > 5 && /([a-z]|[A-Z])([a-z]|[A-Z]|[0-9]|_)+/.test(username))) {
        res = {
          ...res,
          username: '6~17 digits, alpha, number, ., _ only' 
        };
      }
      if(!password || !(password.length < 18 && password.length > 5 && /([a-z]|[A-Z]|[0-9]|.|_)+/.test(password))) {
        res = {
          ...res,
          password: '6~17 digits, alpha, number, ., _ only'
        }
      }
      if(!confirm || password !== confirm) {
        res = {
          ...res,
          confirm: 'The input is not the same'
        }
      }
      if(Object.keys(res).length === 0) {
        resolve();
      } else {
        reject(res);
      }
    })
  }

  $scope.submitRegister = function() {
    let { username, password, confirm } = $scope.form;
    checkValidInput(username, password, confirm)
      .then(() => {
        $http.post('/user/register', { username, password })
        .then(res => {
          if(res.data.error) {
            $scope.message = { username: res.data.error };
          } else {
            $location.url('/login');
          }
        })
      })
      .catch(res => {
        $scope.message = res;
        $scope.$apply();
      }) 
  }
}

function setCookie(key, value, day) {
  let days = day || 1;
  let exp = new Date();
  exp.setTime(exp.getTime() + days * 24 * 60 * 60 * 1000);

  document.cookie = `${key}=${escape(value)};expires=${exp.toUTCString()};`;
}

function getCookie(key) {
  let cookie = document.cookie;
  cookie = cookie.replace(/\s+/g, '');
  let block = cookie.split(';');
  let ret = undefined;
  block.forEach(value => {
    let key_value = value.split('=');
    if(key_value[0] === key) {
      ret = key_value[1];
    }
  });
  return ret;
}

function EditCommentCtrl($scope, $http, $location, $routeParams) {
  $scope.BlogId = $routeParams.id;
  $scope.CommentId = $routeParams.commentid;
  $scope.SubmitResult = '';

  $http.get(`/api/comment/${$scope.BlogId}/${$scope.CommentId}`)
    .success(data => {
      if(data.error) {
        $location.url('/readPost/' + $scope.BlogId);
      } else {
        $scope.Username = data.Username;
        $scope.Comment = data.Comment;
        $scope.Time = data.Time;
        $scope.IsHidden = data.IsHidden;
        $scope.newComment = data.Comment;
      }
    })
  
  $scope.SubmitComment = function() {
    $http.post(`/api/comment/${$scope.BlogId}/${$scope.CommentId}`, {
      username: getCookie('username'),
      token: getCookie('token'),
      comment: $scope.newComment,
    })
      .success(data => {
        if(data.error) {
          $scope.SubmitResult = data.error;
        } else {
          $location.url('/readPost/' + $scope.BlogId);
        }
      })
  }
}