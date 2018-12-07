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
        const [langs] = await conn.query(
            'SELECT lang_name, level FROM knows \
            WHERE job_seeker_id=?',
            req.user.job_seeker_id
        );
        const [internals] = await conn.query(
            `SELECT rq.rqid, rq.rname, rq.dev_start, rq.dev_end, ar.j_rating, rp.rfile
            FROM owns_internal oi, accepted ar, report rp, request rq
            WHERE oi.fid = ? AND oi.arid = ar.arid AND ar.arid = rp.rid AND rp.rqid = rq.rqid`,
            [req.user.id]
        );
        conn.release();
        res.render('profile', {
            title: '나의 프로필',
            user: req.user,
            target: req.user,
            langs: langs,
            internals: internals,
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
        await conn.query(sql, params);
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
        return res.redirect('/');
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
        return res.redirect('/');
    }
    catch (err) {
        conn.release();
        next(err);
    }
});

router.get('/:id/external', isLoggedIn, async (req, res, next) => {
    const conn = await pool.getConnection(async conn => conn);
    try{
        const [externals] = await conn.query(
            `SELECT * FROM owns_external WHERE fid=?`,
            req.params.id
        );
        
        conn.release();
        res.render('external', {
            title: '외적 포트폴리오 목록',
            user: req.user,
            targetId: req.params.id,
            externals: externals
        });
    }
    catch (err) {
        conn.release();
        next(err);
    }
});

router.get('/:id/external/:file', (req, res, next) => {
    return res.sendFile(`${req.params.file}`, {
        root: `public/external/${req.params.id}/`
    });
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
        /*
            최소조건 만족 체크!!!
        */
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
        conn.release();
        res.render('freelancer_waiting', {
            title: '내가 신청한 의뢰',
            user: req.user,
            requests: requests
        });
    }
    catch (err) {
        conn.release();
        console.error(err);
        next(err);
    }
});

router.get('/working', isLoggedIn, async (req, res, next) => {
    const conn = await pool.getConnection(async conn => conn);
    try {
        const [devs] = await conn.query(
            `SELECT R.rqid, R.rname, C.id as cid, R.dev_start, R.reward
            FROM request R,client C,freelancer F, job_seeker J, applys A
            WHERE R.cid = C.id AND F.job_seeker_id = J.job_seeker_id 
            AND J.job_seeker_id = A.job_seeker_id AND F.id=?
            AND NOT EXISTS(SELECT * FROM report rep WHERE R.rqid=rep.rqid)
            AND A.rqid = R.rqid AND A.status = 'accepted' AND R.dev_end IS NULL`,
            req.user.id
        );
        const [waitings] = await conn.query(
            `SELECT R.rqid, R.rname, C.id as cid, R.dev_start, R.reward
            FROM request R,client C,freelancer F, job_seeker J, applys A
            WHERE R.cid = C.id AND F.job_seeker_id = J.job_seeker_id 
            AND J.job_seeker_id = A.job_seeker_id AND A.rqid = R.rqid AND A.status = 'accepted' 
            AND (SELECT rep.status FROM report rep WHERE R.rqid=rep.rqid ORDER BY rep.rid DESC LIMIT 1)='waiting'
            AND R.dev_end IS NULL AND F.id=?`,
            req.user.id
        );
        const [declineds] = await conn.query(
            `SELECT R.rqid, R.rname, C.id as cid, R.dev_start, R.reward
            FROM request R,client C,freelancer F, job_seeker J, applys A
            WHERE R.cid = C.id AND F.job_seeker_id = J.job_seeker_id 
            AND J.job_seeker_id = A.job_seeker_id AND A.rqid = R.rqid AND A.status = 'accepted' 
            AND (SELECT rep.status FROM report rep WHERE R.rqid=rep.rqid ORDER BY rep.rid DESC LIMIT 1)='declined'
            AND R.dev_end IS NULL AND F.id=?`,
            req.user.id
        );
        conn.release();
        res.render('freelancer_working', {
            title: '진행 중인 의뢰',
            user: req.user,
            devs: devs,
            waitings: waitings,
            declineds: declineds,
            submitError: req.flash('submitError')
        });
    }
    catch (err) {
        conn.release();
        console.error(err);
        next(err);
    }
});

router.post('/report/submit', isLoggedIn, async (req, res, next) => {
    const { rfile, rqid } = req.body;
    const conn = await pool.getConnection(async conn => conn);
    try {
        const [exWaiting] = await conn.query(
            `SELECT * FROM report WHERE rqid=? AND job_seeker_id=? AND status='waiting'`,
            [rqid, req.user.job_seeker_id]
        );
        if(exWaiting.length) {
            conn.release();
            req.flash('submitError', '완료신청 수락 대기중입니다');
            return res.redirect('/freelancer/working');
        }

        await conn.query(
            `INSERT INTO report(rfile, rqid, job_seeker_id)
            VALUES(?, ?, ?)`,
            [rfile, rqid, req.user.job_seeker_id]
        );
        conn.release();
        res.redirect('/');
    }
    catch(err) {
        req.flash('submitError', '완료 신청 중 에러발생')
        conn.release();
        console.error(err);
        next(err);
    }
});

router.post('/report/:rid/accept', isLoggedIn, async (req, res, next) => {
    const conn = await pool.getConnection(async conn => conn);
    try {
        await conn.query(
            `UPDATE report rep, request req
            SET rep.status = 'accepted', req.dev_end = now()
            WHERE rep.rid = ? and rep.rqid = req.rqid`,
            req.params.rid
        );
        const[users] = await conn.query(
            `SELECT f.id as fid
            FROM freelancer f, report rep, job_seeker j
            WHERE rep.rid = ? AND rep.status = 'accepted' AND rep.job_seeker_id = j.job_seeker_id 
            AND j.job_seeker_id = f.job_seeker_id`,
            req.params.rid
        );
        await conn.query(
            `INSERT INTO accepted(arid, j_rating) VALUES (?, ?)`,
            [req.params.rid, req.body.rating]
        );
        await conn.query(
            `INSERT INTO owns_internal(fid, arid) VALUES (?, ?)`,
            [users[0].fid, req.params.rid]
        );
        return res.redirect('/');
    }
    catch (err) {
        conn.release();
        next(err);
    }
});

router.get('/request/:rqid/declined', isLoggedIn, async (req, res, next) => {
    const rqid = req.params.rqid;
    const conn = await pool.getConnection(async conn => conn);
    try {
        const [messages] = await conn.query(
            `SELECT rep.rfile, d.message
            FROM declined d, request req, report rep
            WHERE req.rqid = ? AND req.rqid = rep.rqid AND
            rep.status = 'declined' AND rep.rid = d.drid
            ORDER BY rep.rid DESC`,
            rqid
        );
        conn.release();
        res.render('freelancer_message', {
            title: '거절 메시지',
            user: req.user,
            messages: messages,
            rqid:req.params.rqid,
        });
    }
    catch (err) {
        conn.release();
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