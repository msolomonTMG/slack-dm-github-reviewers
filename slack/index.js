const request = require('request')
const slackOauthToken = process.env.SLACK_OAUTH_TOKEN

const helpers = {
  sendPrivateSlackMessage: function(username, text, attachments) {
    return new Promise(function(resolve, reject) {
      
      let postData = {
        text: text,
        user: username
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
  sendPullRequestToReviewer: function(subscribedUser, payload) {
    return new Promise(function(resolve, reject) {
      
      let mergeable
      if (payload.pull_request.mergeable) {
        mergeable = ":white_check_mark: true"
      } else {
        mergeable = ":x: false"
      }
      
      let attachments = [
        {
          fallback: "You've been requested to review a pull request!",
          pretext: "You've been requested to review a pull request!",
          author_name: payload.sender.login,
          author_link: payload.sender.url,
          title: payload.pull_request.title,
          title_link: payload.pull_request.html_url,
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
          ]
        }
      ]
      
      helpers.sendPrivateSlackMessage(subscribedUser.slackUsername, message, attachments)
      
    })
  }
}