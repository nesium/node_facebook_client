"use strict";

var Promise = require('bluebird');
var request = Promise.promisify(require('request'));
var assert = require('assert');

function FacebookClient(oAuthToken) {
  assert(oAuthToken != null && oAuthToken.length > 0);
  this.oAuthToken = oAuthToken;
}

module.exports = FacebookClient;

FacebookClient.prototype.fetchUserInfos = function() {
  return request('https://graph.facebook.com/me?oauth_token=' + this.oAuthToken)
    .then(function(result) {
      var body = result[1];
      var json = JSON.parse(body);

      if (json.hasOwnProperty('error')) {
        throw Error.new(json.error.message, json.error.code, json.error.type);
      }

      return {
        id: json.id,
        name: json.name,
        email: json.email
      };
    });
};

FacebookClient.prototype.fetchFriends = function() {
  var friends = [];

  return this.fetchFriendsWithURL('https://graph.facebook.com/me/friends?limit=5000', friends)
    .then(function() {
      return friends;
    });
};

FacebookClient.prototype.fetchFriendsWithURL = function(url, friendsArr) {
  var self = this;

  return request(url + '&oauth_token=' + this.oAuthToken)
    .then(function(result) {
      var body = result[1];
      var json = JSON.parse(body);

      if (json.hasOwnProperty('error')) {
        throw Error.new(json.error.message, json.error.code, json.error.type);
      }

      json.data.forEach(function(friend) {
        friendsArr.push(friend);
      });

      if (friendsArr.length < json.summary.total_count && json.data.length > 0) {
        return self.fetchFriendsWithURL(
          json.paging.next + '&oauth_token=' + self.oAuthToken, friendsArr);
      }
    });
}