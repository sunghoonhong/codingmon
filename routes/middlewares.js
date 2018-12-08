const mysql = require('mysql2/promise');
const dbconfig = require('../config/database');
const pool = mysql.createPool(dbconfig);

// 로그인 상태인지
// 또는
// 각 유저의 종류를 확인

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

// 팀 페이지를 사용하는 경우
// 로그인한 사용자가 그 팀의 팀장인지 확인
exports.isMgr = async (req, res, next) => {
    const tname = req.params.tname;
    const conn = await pool.getConnection(async conn => conn);
    try {
        const [[exMgr]] = await conn.query(
            'SELECT * FROM team WHERE mgr_id=? AND tname=?',
            [req.user.id, tname]
        );
        conn.release();
        if(exMgr) {
            next();
        }
        else {
            res.status(403).send('당신은 팀장이 아닙니다');
        }
    }
    catch (err) {
        conn.release();
        console.log(req.params);
        console.error(err);
        res.status(403).send('Query error');
    }
}