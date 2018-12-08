const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const fs = require('fs');
const { isLoggedIn, isNotLoggedIn, isAdmin } = require('./middlewares');
const dbconfig = require('../config/database');
const router = express.Router();

const pool = mysql.createPool(dbconfig);

// 프리랜서 자신의 정보 조회
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

// 특정 ID의 프리랜서 정보 조회
router.get('/profile/:id', (req, res) => {
    res.redirect('/profile/'+ req.params.id);
});

// 프리랜서 정보 수정
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
    if(pw) {
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

// 프리랜서 삭제
router.post('/profile/delete', isAdmin, async (req, res, next) => {
    const conn = await pool.getConnection(async conn => conn);
    try {
        const [externals] = await conn.query(
            `SELECT efile, fid FROM owns_external WHERE fid=?`,
            req.body.targetId
        );
        var path;
        for(i in externals) {
            path = `./public/external/${req.body.targetId}/${externals[i].efile}`;
            fs.unlinkSync(path, (err) => console.error('외적 포트폴리오 삭제 실패', err));
        }

        // DB에서 프리랜서 삭제 (외적 포트폴리오는 CASCADE로 삭제)
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

// 특정 프리랜서의 외부 포트폴리오 조회
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
            externals: externals,
            externalError: req.flash('externalError')
        });
    }
    catch (err) {
        conn.release();
        next(err);
    }
});

// 특정 프리랜서의 특정 외적 포트폴리오 다운로드
router.get('/:id/external/:file', (req, res, next) => {
    return res.sendFile(`${req.params.file}`, {
        root: `public/external/${req.params.id}/`
    });
});

// 구인 중인 의뢰목록 확인
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
            orderType: req.query.orderType,
            applyError: req.flash('applyError')
        });
    }
    catch (err) {
        conn.release();
        console.error(err);
        next(err);
    }
});

// 구인 중인 의뢰목록에서 의뢰에 신청
router.post('/apply', isLoggedIn, async (req, res, next) => {
    const conn = await pool.getConnection(async conn => conn);
    try {
        // 프리랜서의 최소 조건 충족 확인
        const [[pass]] = await conn.query(
            `SELECT * FROM request R, freelancer F
            WHERE R.dev_start IS NULL AND R.min_people <= 1 AND F.career >= R.min_career
            AND R.rqid = ? AND F.id = ?
            AND NOT EXISTS
            (SELECT * FROM job_seeker J, knows K, requires req, program_lang pl
            WHERE F.job_seeker_id = J.job_seeker_id AND J.job_seeker_id = K.job_seeker_id
            AND K.lang_name = pl.lang_name AND pl.lang_name = req.lang_name 
            AND req.rqid = R.rqid AND K.level < req.level AND F.id = ?)`,
            [req.body.rqid, req.user.id, req.user.id]
        );
        console.log(pass);
        if(!pass) {
            conn.release();
            req.flash('applyError', '최소 조건을 충족시키지 못합니다');
            return res.redirect('/freelancer/request');
        }
        await conn.query(
            `INSERT INTO applys(rqid, job_seeker_id) VALUES(?, ?)`,
            [req.body.rqid, req.user.job_seeker_id]
        );
        conn.release();
        return res.redirect('/');
    }
    catch (err) {
        req.flash('applyError', '신청 중 오류 발생');
        conn.release();
        console.error(err);
        res.redirect('/');
    }
});

// 신청한 의뢰목록 조회
router.get('/waiting', isLoggedIn, async (req, res, next) => {
    const conn = await pool.getConnection(async conn => conn);
    try {
        const [requests] = await conn.query(
            `SELECT R.rqid, R.rname, R.cid, R.start_date, R.reward, A.status
            FROM request R,client C,freelancer F, job_seeker J, applys A
            WHERE R.cid = C.id AND F.job_seeker_id = J.job_seeker_id 
            AND J.job_seeker_id = A.job_seeker_id AND A.rqid = R.rqid AND F.id=?
            ORDER BY A.status DESC`, req.user.id
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

// 진행중인 의뢰목록 조회
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

// 의뢰완료 신청 전송
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

// 특정 의뢰에 대한 거절메시지 이력 조회
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

// 수락된 의뢰 목록 조회
router.get('/accepted', isLoggedIn, async (req, res, next) => {
    const conn = await pool.getConnection(async conn => conn);
    try {
        const [acceptances] = await conn.query(
            `SELECT ac.*, req.rqid, req.cid, req.rname, rep.rfile
            FROM freelancer f, job_seeker j, report rep, accepted ac, request req
            WHERE f.id = ? AND f.job_seeker_id = j.job_seeker_id AND
            j.job_seeker_id = rep.job_seeker_id AND rep.rid = ac.arid AND
            rep.rqid = req.rqid AND ac.c_rating is NULL`,
            req.user.id
        );
        conn.release();
        res.render('freelancer_accepted', {
            title: '요청수락된 의뢰',
            user: req.user,
            acceptances: acceptances
        });
    }
    catch (err) {
        conn.release();
        console.error(err);
        next(err);
    }
});


// 의뢰자 평점 지정
router.post('/accepted', isLoggedIn, async (req, res, next) => {
    const conn = await pool.getConnection(async conn => conn);
    try {
        await conn.query(
            `UPDATE accepted
            SET c_rating = ?
            WHERE arid=?`,
            [req.body.rating, req.body.rid]
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

// 프리랜서의 홈페이지
router.get('/', async (req, res, next) => {
    const conn = await pool.getConnection(async conn => conn);
    try {
        const [alarms] = await conn.query(
            `SELECT rq.rqid, c.name
            FROM freelancer f, job_seeker j, request rq, report rp, accepted ac, client c
            WHERE f.id = ? AND f.job_seeker_id = j.job_seeker_id
            AND j.job_seeker_id =rp.job_seeker_id AND rp.rid = ac.arid
            AND rp.rqid = rq.rqid AND rq.cid = c.id AND ac.c_rating is NULL`,
            req.user.id
        );
        conn.release();
        res.render('main', {
            title: 'CodingMon - DBDBDIP @ freelancer',
            user: req.user,
            alarms: alarms,
            loginError: req.flash('loginError'),
        });
    }
    catch (err) {
        console.log(err);
        next(err);
    }
});

module.exports = router;