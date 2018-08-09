const
  express = require('express'),
  exphbs = require('express-handlebars'),
  bodyParser = require('body-parser'),
  url = require('url'),
  user = require('./user'),
  mongoose = require('mongoose'),
  MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/mongo_test";

mongoose.connect(MONGO_URI, function (err, res) {
  if (err) {
  console.log ('ERROR connecting to: ' + MONGO_URI + '. ' + err)
  } else {
  console.log ('Succeeded connected to: ' + MONGO_URI)
  }
});

let app = express()
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
app.set('port', process.env.PORT || 3000)
app.use(bodyParser.urlencoded({
  extended: true
}))
app.use(bodyParser.json())

app.post('/github', async function(req, res) {
  const payload = JSON.parse(req.body)
  // stop if this is not a review request
  if (payload.action != 'review_requested') {
    return
  }
  
  const subscribedUser = await user.findByGithubLogin(payload.requested_reviewer.login)
  slack.sendPullRequestToReviewer(subscribedUser, payload)
    .then(success => { res.send (200); return })
    .catch(err => { res.send(500); return })
})

app.post('/user/create', async function(req, res) {
  const newUserData = {
    slackUsername: req.body.slack.username,
    githubLogin: req.body.github.username
  }
  
  const existingUser = await user.findByGithubLogin(newUserData.githubLogin)
  console.log("EXISTING USER")
  console.log(existingUser)
  if (existingUser) {
    res.redirect(url.format({
      pathname: '/settings',
      query: {
        'errorMsg': new Buffer('this github username is already signed up').toString('base64'),
        'uid': existingUser._id
      }
    }))
  } else {
    const newUser = await user.create(newUserData)
    console.log('newUser')
    console.log(newUser)
    console.log(newUser._id)
    res.redirect(url.format({
      pathname: '/settings',
      query: {
        'uid': `${newUser._id}`,
        'rs': `${newUser.randomString}`,
        'successMsg': new Buffer('You are now signed up').toString('base64')
      }
    }))
  }
})

app.post('/user/update', async function(req, res) {
  const userToUpdate = await user.findById(req.body.user.id)
  console.log('User to update is:')
  console.log(userToUpdate)
  console.log('User submitted is:')
  console.log({
    rs: req.body.user.rs,
    id: req.body.user.id
  })
  if (userToUpdate.randomString != req.body.user.rs) {
    return res.sendStatus(403)
  }
  
  const updatedUserData = {
    slackUsername: req.body.slack.username,
    githubLogin: req.body.github.username
  }
  
  const userUpdated = await user.update(userToUpdate._id, updatedUserData)
  res.redirect(url.format({
    pathname: '/settings',
    query: {
      'uid': `${userUpdated._id}`,
      'rs': `${userUpdated.randomString}`,
      'successMsg': new Buffer('Your settings have been updated').toString('base64')
    }
  }))
})

app.post('/user/delete', async function(req, res) {
  const userDeleted = await user.delete(req.body.user.id)
  res.redirect(url.format({
    pathname: '/signup',
    query: {
      'successMsg': new Buffer('You have successfully deleted your user').toString('base64')
    }
  }))
})

app.get('/signup', function(req, res) {
  let viewData = {
    slackUsername: req.query.slackUsername
  }
  if (req.query.successMsg) {
    viewData.successMsg = Buffer.from(req.query.successMsg, 'base64').toString('ascii')
  }
  res.render('signup', viewData)
})

app.get('/settings', async function(req, res) {
  console.log(req.query)
  const thisUser = await user.findById(req.query.uid)
  // if the user's random string is not present, they are forbidden
  if (req.query.rs != thisUser.randomString) {
    return res.sendStatus(403)
  }
  let viewData = {
    slackUsername: thisUser.slackUsername,
    githubLogin: thisUser.githubLogin,
    userId: thisUser._id,
    rs: thisUser.randomString
  }
  if (req.query.successMsg) {
    viewData.successMsg = Buffer.from(req.query.successMsg, 'base64').toString('ascii')
  }
  res.render('settings', viewData)
})

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
})

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'
module.exports = app
