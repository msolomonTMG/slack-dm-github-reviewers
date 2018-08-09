const request = require('request')
const slackOauthToken = process.env.SLACK_OAUTH_TOKEN
const APP_URL = process.env.APP_URL || 'http://localhost:3000'
const moment = require('moment')

const helpers = {
  sendPrivateSlackMessage: function(channel, text, attachments) {
    return new Promise(function(resolve, reject) {
      let postData = {
        text: text,
        channel: channel,
        as_user: false
      }

      if (attachments) {
        postData.attachments = attachments
      }

      let options = {
        method: 'post',
        body: postData,
        json: true,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          Authorization: `Bearer ${slackOauthToken}`
        },
        url: 'https://slack.com/api/chat.postMessage'
      }
      
      request(options, function(err, res, body) {
        if (err) {
          return reject(err)
        } else {
          return resolve(body)
        }
      })
      
    })
  }
}

module.exports = {
  getUserInfo: function(slackUserId) {
    return new Promise(function(resolve, reject) {
      
      request(`https://slack.com/api/users.info?token=${slackOauthToken}&user=${slackUserId}`, function(err, res, body) {
        if (err) {
          return reject(err)
        } else {
          return resolve(JSON.parse(body))
        }
      })
      
    })
  },
  sendSignupLink: function(slackChannel, slackUsername) {
    return new Promise(function(resolve, reject) {
      
      let text = `Click <${APP_URL}/signup?slackChannel=${slackChannel}&slackUsername=${slackUsername}|here> to signup`
      
      helpers.sendPrivateSlackMessage(slackChannel, text)
        .then(result => {
          return resolve(result)
        })
        .catch(err => {
          return reject(err)
        })
      
    })
  },
  sendSettingsLink: function(slackChannel, thisUser) {
    return new Promise(function(resolve, reject) {
      
      let text = `Click <${APP_URL}/settings?uid=${thisUser._id}&rs=${thisUser.randomString}&slackUsername=${thisUser.slackUsername}|here> to adjust your settings`
      
      helpers.sendPrivateSlackMessage(slackChannel, text)
        .then(result => {
          return resolve(result)
        })
        .catch(err => {
          return reject(err)
        })
      
    })
  },
  sendPullRequestToReviewer: function(subscribedUser, payload) {
    return new Promise(function(resolve, reject) {
      let mergeable
      if (payload.pull_request.mergeable) {
        mergeable = ":white_check_mark: true"
      } else {
        mergeable = ":x: false"
      }
      
      let attachments = [{
        fallback: `${payload.sender.login} has requested you to review a pull request!`,
        pretext: `${payload.sender.login} has requested you to review a pull request!`,
        author_name: payload.pull_request.user.login,
        author_link: payload.pull_request.user.html_url,
        title: payload.pull_request.title,
        title_link: payload.pull_request.html_url,
        text: payload.pull_request.body,
        fields: [
          {
            title: "Mergeable",
            value: mergeable,
            short: true
          },
          {
            title: "Changed Files",
            value: payload.pull_request.changed_files,
            short: true
          },
          {
            title: "Additions",
            value: payload.pull_request.additions,
            short: true
          },
          {
            title: "Deletions",
            value: payload.pull_request.deletions,
            short: true
          }
        ],
        img_url: payload.sender.avatar_url,
        thumb_url: payload.sender.avatar_url,
        footer: payload.repository.name,
        ts: moment(payload.pull_request.created_at).unix(),
        footer_icon: `https://camo.githubusercontent.com/7710b43d0476b6f6d4b4b2865e35c108f69991f3/68747470733a2f2f7777772e69636f6e66696e6465722e636f6d2f646174612f69636f6e732f6f637469636f6e732f313032342f6d61726b2d6769746875622d3235362e706e67`
      }]
      
      helpers.sendPrivateSlackMessage(subscribedUser.slackChannel, "", attachments)
        .then(success => {
          return resolve(success)
        })
        .catch(err => {
          return reject(err)
        })
      
    })
  },
  sendDefaultMessage: function(channel, message) {
    return new Promise(function(resolve, reject) {
      
      helpers.sendPrivateSlackMessage(channel, message)
        .then(success => {
          return resolve(success)
        })
        .catch(err => {
          return reject(err)
        })
      
    })
  }
}