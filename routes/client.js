const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const { 
    isLoggedIn, isNotLoggedIn, isAdmin, isFreelancer, isClient
} = require('./middlewares');
const dbconfig = require('../config/database');
const router = express.Router();

const pool = mysql.createPool(dbconfig);

router.get('/profile', isLoggedIn, (req, res) => {
    res.render('profile', {
        title: '나의 프로필',
        user: req.user,
        target: req.user
    });
});

router.get('/profile/:id', (req, res) => {
    res.redirect('/profile/'+ req.params.id);
});

router.post('/profile/update', isLoggedIn, async (req, res, next) => {
    const { 
        id, pw, name, phone_num
    } = req.body;
    var sql = 'UPDATE client SET name=?, phone_num=?';
    var params = [
        name, phone_num
    ];
    if(pw!='비밀번호') {
        const hash = await bcrypt.hash(pw, 13);
        sql += ', password=?';
        params.push(hash);
    }
    sql += ' WHERE id=?';
    params.push(id);
    const conn = await pool.getConnection(async conn => conn);
    try {
        await conn.query(
            sql, params       
        );
        conn.release();
        res.redirect('/');
    }
    catch (err) {
        conn.release();
        console.error(err);
        next(err);
    }
});

router.post('/profile/delete', isAdmin, async (req, res, next) => {
    const conn = await pool.getConnection(async conn => conn);
    try {
        await conn.query(
            'DELETE FROM client WHERE id=?',
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

router.get('/request', isLoggedIn, async (req, res, next) => {
    if(!req.query.orderType) req.query.orderType = 'rqid';
    const conn = await pool.getConnection(async conn => conn);
    try {
        const [requests] = await conn.query(
            `SELECT * FROM request WHERE cid=?
            ORDER BY ${req.query.orderType}`,
            req.user.id
        );
        conn.release();

        res.render('client_request', {
            title: '내 의뢰 목록',
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

router.get('/request/:rqid', async (req, res, next) => {
    res.redirect('/request/'+req.params.rqid);
})

router.get('/request/:rqid/apply', async (req, res, next) => {
    const rqid = req.params.rqid;
    const conn = await pool.getConnection(async conn => conn);
    try {
        const[freelancers] = await conn.query(
            `SELECT f.*
            FROM request req, freelancer f, job_seeker j, applys a
            WHERE req.rqid =? AND a.rqid = req.rqid AND j.job_seeker_id = a.job_seeker_id
            AND f.job_seeker_id = a.job_seeker_id`,
            rqid
        );
        const[teams] = await conn.query(
            `SELECT t.*
            FROM request req, team t, job_seeker j, applys a
            WHERE req.rqid =? AND a.rqid = req.rqid AND j.job_seeker_id = a.job_seeker_id
            AND t.job_seeker_id = a.job_seeker_id`,
            rqid
        );
        conn.release();
        res.render('client_applys', {
            title: '신청자 목록',
            user: req.user,
            freelancers: freelancers,
            teams: teams,
            rqid: req.params.rqid,
            applyError: req.flash('applyError')
        });
    }
    catch (err) {
        conn.release();
        next(err);
    }
});

router.post('/request/:rqid/apply', async (req, res, next) => {
    const rqid = req.params.rqid;
    const job_seeker_id = req.body.job_seeker_id;
    const conn = await pool.getConnection(async conn => conn);
    try {
        const [[request]] = await conn.query(
            `SELECT dev_start FROM request WHERE rqid=?`, rqid
        );
        if(request.dev_start) {
            req.flash('applyError', '이미 선택된 의뢰입니다');
            return res.redirect(`/client/request/${rqid}/apply`);
        }
        // 수락한거 status = accepted
        await conn.query(
            `UPDATE request req, applys a, job_seeker j, freelancer f
            SET a.status = 'accepted', req.dev_start = now()
            WHERE req.rqid = ? AND req.rqid = a.rqid AND a.job_seeker_id = j.job_seeker_id
            AND j.job_seeker_id = f.job_seeker_id AND f.job_seeker_id = ?`,
            [rqid, job_seeker_id]
        );
        // 나머지는 전부 status = decliend
        await conn.query(
            `UPDATE request req, applys a, job_seeker j, freelancer f SET a.status = 'declined'
            WHERE req.rqid = ? AND req.rqid = a.rqid AND a.status = 'waiting'`,
            rqid
        );
        conn.release();
        res.redirect('/')
    }
    catch (err) {
        conn.release();
        console.error(err);
        next(err);
    }
});

router.get('/register', isClient, async (req, res, next) => {
    const conn = await pool.getConnection(async conn => conn);
    try {
        const [langs] = await conn.query(
            'SELECT lang_name FROM program_lang'
        );
        conn.release();
        res.render('register', {
            title: '의뢰 등록',
            user: req.user,
            langs: langs,
            regError: req.flash('regError')
        });
    }
    catch (err) {
        conn.release();
        next(err);
    }
});

router.post('/register', isClient, async (req, res, next) => {
    const { 
        rname, reward, start_date, end_date,
        min_people, max_people, min_career
    } = req.body;   // 기본정보는 7개
    try {
        if(min_people > max_people && start_date > end_date) {
            req.flash('regError', '입력이 이상합니다');
            res.redirect('/client/register');
        }
    }
    catch (err) {
        next(err);
    }
    const conn = await pool.getConnection(async conn => conn);
    try {
        const [request] = await conn.query(
            'INSERT INTO request(   \
                cid, rname, reward, start_date, end_date,   \
                min_people, max_people, min_career  \
            ) VALUES(?, ?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, rname, reward, start_date, end_date,
            min_people, max_people, min_career]
        );
        var keys = Object.keys(req.body);
        for(var i=7; i<keys.length; i++) {
            if(req.body[keys[i]]) {
                await conn.query(
                    'INSERT INTO requires(rqid, lang_name, level) \
                    VALUES(?, ?, ?)',
                    [request.insertId, keys[i], req.body[keys[i]]]
                );
            }
        }
        conn.release();
        res.redirect('/');
    }
    catch (err) {
        conn.release();
        req.flash('regError', '오류 발생')
        console.error(err);
        res.redirect('/client/register');
    }
});

router.get('/working', isLoggedIn, async (req, res, next) => {
    if(!req.query.orderType) req.query.orderType = 'rqid';
    const conn = await pool.getConnection(async conn => conn);
    try {
        const [requests] = await conn.query(
            `SELECT R.rqid, R.rname, R.dev_start, R.reward, F.id as fid
            FROM request R,freelancer F, job_seeker J, applys A
            WHERE R.cid = ? AND F.job_seeker_id = J.job_seeker_id 
            AND J.job_seeker_id = A.job_seeker_id
            AND A.rqid = R.rqid AND A.status = 'accepted' AND R.dev_end IS NULL
            ORDER BY ${req.query.orderType}`,
            req.user.id
        );
        // console.log(requests);
        res.render('client_working', {
            title: '진행 중인 의뢰',
            user: req.user,
            requests: requests,
            orderType: req.query.orderType
        });
    }
    catch (err) {
        console.error(err);
        next(err);
    }
});

router.get('/request/:rqid/complete', async (req, res, next) => {
    const rqid = req.params.rqid;
    const conn = await pool.getConnection(async conn => conn);
    try {
        const[reports] = await conn.query(
            `SELECT f.id as fid, rep.rfile as rfile
            FROM request req, freelancer f, report rep, client c, job_seeker j
            WHERE req.rqid = ? AND req.rqid = rep.rqid 
            and rep.status = 'waiting' and rep.job_seeker_id = j.job_seeker_id
            and j.job_seeker_id = f.job_seeker_id`,
            rqid
        );
        conn.release();
        res.render('client_complete', {
            title: '의뢰완료 요청',
            user: req.user,
            reports: reports,
            rqid: req.params.rqid,
            applyError: req.flash('applyError')
        });
    }
    catch (err) {
        conn.release();
        next(err);
    }
});

router.get('/', async (req, res, next) => {
    try {
        res.render('main', {
            title: 'CodingMon - DBDBDIP @ client',
            user: req.user,
            loginError: req.flash('loginError'),
        });
    }
    catch (err) {
        console.log(err);
    }
});

module.exports = router;