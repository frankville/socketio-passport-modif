exports.index = function (req, res) {
	var usr;

	if(req.user)
	{
		usr = req.user.username;
		req.session.usr = usr;
	}

	res.render('index', {user: usr});
}

exports.login = function (req, res) {
    res.render('login');
}

exports.client = function (req, res) {
	res.render('client');
}

exports.admin = function(req, res){
    res.render('admin');
}