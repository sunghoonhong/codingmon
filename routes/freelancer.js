const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const { isLoggedIn, isNotLoggedIn, isAdmin } = require('./middlewares');
const dbconfig = require('../config/database');
const router = express.Router();

const pool = mysql.createPool(dbconfig);

router.get('/profile', isLoggedIn, async (req, res, next) => {
    const conn = await pool.getConnection(async conn => conn);
    try {
        var [knows] = await conn.query(
            'SELECT lang_name, level FROM knows \
            WHERE job_seeker_id=?',
            req.user.job_seeker_id
        );
        var [langs] = await conn.query(
            'SELECT lang_name FROM program_lang'
        );
        for(var i=0; i<langs.length; ++i) {
            langs[i].level = 0;
            for(var j=0; j<knows.length; ++j) {
                if(langs[i].lang_name == knows[j].lang_name) {
                    langs[i].level = knows[j].level;
                    break;
                }
            }
        }
        conn.release();
        res.render('profile', {
            title: '나의 프로필',
            user: req.user,
            target: req.user,
            langs: langs,
            updateError: req.flash('updateError')
        });
    }
    catch (err) {
        conn.release();
        console.error(err);
        next(err);
    }
});

router.get('/profile/:id', (req, res) => {
    res.redirect('/profile/'+ req.params.id);
});

router.post('/profile/update', isLoggedIn, async (req, res, next) => {
    const keys = Object.keys(req.body);
    var langFlag = false
    const langIndex = 8;    // rating도 body에 있어서 8부터 언어시작
    for(var i=langIndex; i < keys.length; i++) {
        if(req.body[keys[i]] != 0) {
            langFlag = true;
            break;
        }
    }
    try {
        if(!langFlag) {
            req.flash('updateError', '적어도 하나의 언어는 하세요');
            if(req.user.type=='admin') {
                return res.render('alert', {
                    message: req.flash('updateError')
                });
            }
            else
                return res.redirect('/client/profile');
        }
    }
    catch (err) {
        next(err);
    }
    const { 
        id, pw, name, phone_num, age, major, career
    } = req.body;
    const conn = await pool.getConnection(async conn => conn);

    var sql ='UPDATE freelancer  \
    SET name=?, phone_num=?, age=?, major=?, career=?';
    var params = [
        name, phone_num, age, major, career
    ];
    if(pw!='비밀번호') {
        const hash = await bcrypt.hash(pw, 13);
        sql += ', password=?';
        params.push(hash);
    }
    params.push(id);
    sql += 'WHERE id=?';
    try {
        await conn.query(
            sql, params
        );
        var jsid;
        if (req.user.type=='freelancer')
            jsid = req.user.job_seeker_id;
        else {
            [[jsid]] = await conn.query(
                'SELECT job_seeker_id FROM freelancer \
                WHERE id=?', id
            );
            jsid = jsid.job_seeker_id;
        }
        for(var i=langIndex; i < keys.length; i++) {
                // 이미 있으면 UPDATE, 없으면 INSERT 하는 코드
            await conn.query(
                'INSERT INTO knows (job_seeker_id, lang_name, level) \
                VALUES(?, ?, ?) ON DUPLICATE KEY UPDATE level=?',
                [jsid, keys[i], req.body[keys[i]], req.body[keys[i]]]
            );
        }
        conn.release();
        res.redirect('/');
    }
    catch (err) {
        conn.release();
        console.error(err);
        next(err);
    }
})

router.post('/profile/delete', isAdmin, async (req, res, next) => {
    const conn = await pool.getConnection(async conn => conn);
    try {
        await conn.query(
            'DELETE FROM freelancer WHERE id=?',
            req.body.targetId
        );
        conn.release();
        res.redirect('/');
    }
    catch (err) {
        conn.release();
        next(err);
    }
});

router.get('/request', async (req, res, next) => {
    if(!req.query.orderType) req.query.orderType = 'rqid';
    const conn = await pool.getConnection(async conn => conn);
    try {
        const [requests] = await conn.query(
            `SELECT rq.rqid, rq.rname, c.id as cid, rq.start_date, rq.end_date, 
            rq.min_people, rq.max_people, rq.reward, rq.min_career
            FROM request rq, client c
            WHERE rq.cid = c.id AND rq.dev_start IS NULL
            AND rq.start_date <= now() AND now() <= rq.end_date
            ORDER BY rq.${req.query.orderType};`
        );
        conn.release();
        res.render('freelancer_request', {
            title: '구인 중인 의뢰 목록',
            user: req.user,
            requests: requests,
            orderType: req.query.orderType
        });
    }
    catch (err) {
        conn.release();
        console.error(err);
        next(err);
    }
});

router.post('/apply', isLoggedIn, async (req, res, next) => {
    const conn = await pool.getConnection(async conn => conn);
    try {
        await conn.query(
            `INSERT INTO applys(rqid, job_seeker_id) VALUES(?, ?)`,
            [req.body.rqid, req.user.job_seeker_id]
        );
        conn.release();
        res.redirect('/');
    }
    catch (err) {
        req.flash('applyError', '이미 지원했습니다');
        conn.release();
        console.error(err);
        res.redirect('/');
    }
});

router.get('/waiting', isLoggedIn, async (req, res, next) => {
    const conn = await pool.getConnection(async conn => conn);
    try {
        const [requests] = await conn.query(
            `SELECT R.rqid, R.rname, C.name, R.start_date, R.reward, A.status
            FROM request R,client C,freelancer F, job_seeker J, applys A
            WHERE R.cid = C.id AND F.job_seeker_id = J.job_seeker_id 
            AND J.job_seeker_id = A.job_seeker_id AND A.rqid = R.rqid
            AND F.id=?`, req.user.id
        );
        console.log(requests);
        res.render('freelancer_waiting', {
            title: '내가 신청한 의뢰',
            user: req.user,
            requests: requests
        });
    }
    catch (err) {
        console.error(err);
        next(err);
    }
});

router.get('/working', isLoggedIn, async (req, res, next) => {
    const conn = await pool.getConnection(async conn => conn);
    try {
        const [requests] = await conn.query(
            `SELECT R.rqid, R.rname, C.id as cid, R.dev_start, R.reward
            FROM request R,client C,freelancer F, job_seeker J, applys A
            WHERE R.cid = C.id AND F.job_seeker_id = J.job_seeker_id 
            AND J.job_seeker_id = A.job_seeker_id AND F.id=?
            AND A.rqid = R.rqid AND A.status = 'accepted' AND R.dev_end is null`,
            req.user.id
        );
        // console.log(requests);
        res.render('freelancer_working', {
            title: '진행 중인 의뢰',
            user: req.user,
            requests: requests
        });
    }
    catch (err) {
        console.error(err);
        next(err);
    }
});

router.get('/', async (req, res, next) => {
    try {
        res.render('main', {
            title: 'CodingMon - DBDBDIP @ freelancer',
            user: req.user,
            loginError: req.flash('loginError'),
        });
    }
    catch (err) {
        console.log(err);
        next(err);
    }
});

module.exports = router;