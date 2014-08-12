var https = require('https'),
    token = require('./token.js'),
    GitHubApi = require("github");

var domain = 'api.github.com',
    user = 'sitestacker',
    repo = 'imb',
    get = function(api, cb) {
        https.get('https://' + domain + api + '&access_token=' + token, cb);
    },
    post = function(api, cb) {
        var options = {
                hostname: domain,
                port: 443,
                path: api,
                method: 'POST',
                headers: {
                    'User-Agent': 'calin-seciu',
                    'Authorization': 'token ' + token
                }
            },
            req = https.request(options, cb);
        req.on('error', function(e) {
            console.error(e);
        });
        return req;
    };

var github = new GitHubApi({
    version: '3.0.0',
    debug: true
});
github.authenticate({
    type: 'oauth',
    token: token
});

var Label = function(data) {
    this.name = data.name;
    this.color = data.color;
    this.url = data.url;
};

var Issue = function(data) {
    this.data = data;
    this.number = data.number;
};
Issue.prototype = {
    labels: function() {
        if (!this._labels) {
            var i,
                data = this.data.labels,
                labels = this._labels = [];
            for (i = 0; i < data.length; i++) {
                labels.push(new Label(data[i]));
            }
        }
        return this._labels;
    },
    hasLabel: function(label) {
        var labels = this.labels(),
            lab,
            typeOf = typeof(label);
        for (var i = 0; i < labels.length; i++) {
            lab = labels[i];
            if (typeOf == 'string' && label == lab.name || lab.name == label.name) {
                return true;
            }
        }
        return false;
    },
    addLabel: function(label) {
        var req = post('/repos/'+user+'/'+repo+'/issues/'+this.number+'/labels', function(res) {
            console.log("statusCode: ", res.statusCode);
            res.on('data', function(d) {
                process.stdout.write(d);
            });
        });
        req.write(JSON.stringify([label]));
        req.end();
    }
};

github.issues.repoIssues({
    user: user,
    repo: repo,
    state: 'all'
}, function(err, data) {
    if (err) {
        console.error(err);
    }
    var i,
        issue;
    for (i = 0; i < data.length; i++) {
        issue = new Issue(data[i]);
        if (!issue.hasLabel('user-forms')) {
            issue.addLabel('user-forms');
        }
    }
});