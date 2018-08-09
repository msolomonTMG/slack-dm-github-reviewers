const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  slackUsername: String,
  slackChannel: String,
  githubLogin: String,
  randomString: String
})

const User = mongoose.model('Users', userSchema)

const helpers = {
  createRandomString: function() {
    let randomString = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const length = 20;

    for( let i=0; i < length; i++ )
        randomString += possible.charAt(Math.floor(Math.random() * possible.length));

    return randomString;
  }
}

module.exports = {
  findByGithubLogin: function(githubLogin) {
    return new Promise(function(resolve, reject) {
      
      User.findOne({
        githubLogin: githubLogin
      }, function(err, user) {
        if(!err) {
          return resolve(user)
        } else {
          return reject(err)
        }
      })
      
    })
  },
  findBySlackChannel: function(slackChannel) {
    return new Promise(function(resolve, reject) {
      
      User.findOne({
        slackChannel: slackChannel
      }, function(err, user) {
        if(!err) {
          return resolve(user)
        } else {
          return reject(err)
        }
      })
      
    })
  },
  findById: function(id) {
    return new Promise(function(resolve, reject) {
      
      User.findOne({
        _id: id
      }, function(err, user) {
        if(!err) {
          return resolve(user)
        } else {
          return reject(err)
        }
      })
      
    })
  },
  create: function(userObj) {
    return new Promise(function (resolve, reject) {
      if (!userObj.githubLogin || !userObj.slackUsername) {
        return reject({
          error: {
            msg: 'User must have slack username and github login set'
          }
        })
      } else {
        newUser = new User ({
          slackUsername: userObj.slackUsername,
          slackChannel: userObj.slackChannel,
          githubLogin: userObj.githubLogin,
          randomString: helpers.createRandomString()
        })
        newUser.save(function (err, user) {
          if (err) {
            console.log(err)
            return reject(err)
          } else {
            return resolve(user)
          }
        })
      }
    })
  },
  update: function(mongoId, updates) {
    return new Promise(function(resolve, reject) {
      User.update(
        { _id: mongoId },
        { $set: updates },
        function(err, result) {
          if (err) {
            return reject(err);
          } else {
            User.findOne({
              _id: mongoId
            }, function(err, user) {
              if(!err) {
                return resolve(user)
              } else {
                return reject(err)
              }
            })
          }
        }
      )
    })
  },
  delete: function(mongoId) {
    return new Promise(function(resolve, reject) {
      
      User.remove({
        _id: mongoId
      }, function(err, result) {
        if (err) {
          return reject(err)
        } else {
          return resolve(result)
        }
      })
      
    })
  }
}
