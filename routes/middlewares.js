exports.isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) {
        next();
    }
    else {
        res.status(403).send('로그인이 필요합니다');
    }
};

exports.isNotLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        next();
    }
    else {
        res.redirect('/');
    }
};

exports.isAdmin = (req, res, next) => {
    if (req.user && req.user.type == 'admin') {
        next();
    }
    else {
        res.render('error', {
            title: '에러',
            message: '관리자 권한이 필요합니다',
            error: {status: 403}
        })
        // res.status(403).send('관리자 권한이 필요합니다');
    }
};
exports.isFreelancer = (req, res, next) => {
    if (req.user && req.user.type == 'freelancer') {
        next();
    }
    else {
        res.status(403).send('당신은 프리랜서가 아닙니다');
    }
};
exports.isClient = (req, res, next) => {
    if (req.user && req.user.type == 'client') {
        next();
    }
    else {
        res.status(403).send('당신은 의뢰자가 아닙니다');
    }
};