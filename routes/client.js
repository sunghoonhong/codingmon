const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const multer = require('multer');
const { 
    isLoggedIn, isNotLoggedIn, isAdmin, isFreelancer, isClient
} = require('./middlewares');
const {document_dir} = require('./preprocess');
const dbconfig = require('../config/database');
const router = express.Router();

const pool = mysql.createPool(dbconfig);

// 의뢰자 자신의 정보 조회
router.get('/profile', isLoggedIn, (req, res) => {
    res.render('profile', {
        title: '나의 프로필',
        user: req.user,
        target: req.user
    });
});

// 특정 ID의 의뢰자 조회
router.get('/profile/:id', (req, res) => {
    res.redirect('/profile/'+ req.params.id);
});


// 의뢰자 정보 수정
router.post('/profile/update', isLoggedIn, async (req, res, next) => {
    const { 
        id, pw, name, phone_num
    } = req.body;
    var sql = 'UPDATE client SET name=?, phone_num=?';
    var params = [
        name, phone_num
    ];
    if(pw) {
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

// 의뢰자 삭제
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


// 의뢰자 자신의 의뢰 목록
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


// 특정 의뢰의 정보
router.get('/request/:rqid', (req, res, next) => {
    res.redirect('/request/'+req.params.rqid);
})

/*
    의뢰 신청과 관련
*/

// 특정 의뢰에 신청한 명단
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

// 특정 의뢰에 신청한 사람들 중 선택
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
            conn.release();
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
        res.redirect('/client/request');
    }
    catch (err) {
        conn.release();
        console.error(err);
        next(err);
    }
});

/*
    새로운 의뢰 등록
*/

// 의뢰 등록 양식
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

// 의뢰자가 새로운 의뢰 등록
router.post('/register', isClient, async (req, res, next) => {
    const { 
        rname, reward, start_date, end_date,
        min_people, max_people, min_career
    } = req.body;   // 기본정보는 7개
    try {
        if(min_people > max_people && start_date > end_date) {
            req.flash('regError', '입력이 이상합니다');
            return res.redirect('/client/register');
        }
    }
    catch (err) {
        next(err);
    }
    const conn = await pool.getConnection(async conn => conn);
    try {
        const [request] = await conn.query(
            `INSERT INTO request(
                cid, rname, reward, start_date, end_date,
                min_people, max_people, min_career
            ) VALUES(?, ?, ?, ?, ?, ?, ?, ?)`,
            [req.user.id, rname, reward, start_date, end_date,
            min_people, max_people, min_career]
        );
        var keys = Object.keys(req.body);
        for(var i=7; i<keys.length; i++) {
            await conn.query(
                `INSERT INTO requires(rqid, lang_name, level) VALUES(?, ?, ?)`,
                [request.insertId, keys[i], req.body[keys[i]]]
            );
        }
        conn.release();
        res.render('register_document', {
            title: '의뢰 문서 등록',
            user: req.user,
            rqid: request.insertId
        });

    } catch (err) {
        req.flash('regError', '의뢰 등록 오류');
        console.error(err);
        conn.release();
        next(err);
    }
});

// 새로운 의뢰 등록 시 복수의 의뢰문서 등록
router.post('/register/document/:rqid', isClient, document_dir, multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, `public/document/${req.params.rqid}`)
        },
        filename: (req, file, cb) => {
            cb(null, file.originalname)
        }
    })}).array('document', 10), async (req, res, next) => {
    const conn = await pool.getConnection(async conn => conn);
    try{
        if(req.files) {
            for(var i=0, file, exDoc; i<req.files.length; ++i) {
                file = req.files[i];
                [[exDoc]] = await conn.query(
                    `SELECT * FROM document WHERE dfile=? AND rqid=?`,
                    [file.originalname, req.params.rqid]
                );
                if(exDoc) continue;
                await conn.query(
                    `INSERT INTO document(dfile, rqid) VALUES(?, ?)`,
                    [file.originalname, req.params.rqid]
                );
            }
        }
        conn.release();
        return res.redirect(`/`);
    }
    catch (err) {
        conn.release();
        req.flash('regError', '의뢰문서 업로드 오류')
        console.error(err);
        res.redirect('/client/register');
    }
});

// 현재 진행중인 의뢰목록
router.get('/working', isLoggedIn, async (req, res, next) => {
    if(!req.query.orderType) req.query.orderType = 'rqid';
    const conn = await pool.getConnection(async conn => conn);
    try {
        const [requests] = await conn.query(
            `SELECT R.rqid, R.rname, R.start_date, R.dev_start, R.reward, F.id as fid
            FROM request R,freelancer F, job_seeker J, applys A
            WHERE R.cid = ? AND F.job_seeker_id = J.job_seeker_id 
            AND J.job_seeker_id = A.job_seeker_id
            AND A.rqid = R.rqid AND A.status = 'accepted' AND R.dev_end IS NULL
            ORDER BY ${req.query.orderType}`,
            req.user.id
        );
        conn.release();
        res.render('client_working', {
            title: '진행 중인 의뢰',
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

// 특정 의뢰에 대한 의뢰완료요청 목록
router.get('/request/:rqid/complete', isLoggedIn, async (req, res, next) => {
    const rqid = req.params.rqid;
    const conn = await pool.getConnection(async conn => conn);
    try {
        const[reports] = await conn.query(
            `SELECT f.id as fid, rep.rfile, rep.rid
            FROM request req, freelancer f, report rep
            WHERE req.rqid = rep.rqid AND rep.status = 'waiting'
            AND rep.job_seeker_id = f.job_seeker_id AND req.rqid = ?`,
            rqid
        );
        conn.release();
        res.render('client_complete', {
            title: '의뢰완료 요청',
            user: req.user,
            reports: reports,
            rqid: req.params.rqid
        });
    }
    catch (err) {
        conn.release();
        next(err);
    }
});

/*
    의뢰완료요청에 대해 수락
*/

// 특정 의뢰완료요청에 대해 수락할 시 평점 지정 양식
router.get('/report/:rid/accept', isLoggedIn, (req, res, next) => {
    try {
        res.render('client_accept', {
            title: '요청 수락',
            user: req.user,
            rid: req.params.rid
        });
    }
    catch (err) {
        next(err);
    }
});

// 특정 의뢰완료요청에 대해 평점 지정과 함께 수락 처리
router.post('/report/:rid/accept', isLoggedIn, async (req, res, next) => {
    const conn = await pool.getConnection(async conn => conn);
    try {
        await conn.query(
            `UPDATE report rep, request req
            SET rep.status = 'accepted', req.dev_end = now()
            WHERE rep.rid = ? and rep.rqid = req.rqid`,
            req.params.rid
        );
        const [users] = await conn.query(
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
        conn.release();
        return res.redirect('/');
    }
    catch (err) {
        conn.release();
        next(err);
    }
});

/*
    의뢰완료요청에 대해 거절
*/

// 특정 의뢰완료요청에 대해 거절할 시 거절 메시지 입력 양식
router.get('/report/:rid/decline', isLoggedIn, (req, res, next) => {
    try {
        res.render('client_decline', {
            title: '요청 거부',
            user: req.user,
            rid: req.params.rid
        });
    }
    catch (err) {
        next(err);
    }
});

// 특정 의뢰완료요청에 대해 거절메시지와 함께 거절 처리
router.post('/report/:rid/decline', isLoggedIn, async (req, res, next) => {
    const conn = await pool.getConnection(async conn => conn);
    try {
        // report status 를 declined로 업데이트
        await conn.query(
            `UPDATE report rep
            SET rep.status = 'declined'
            WHERE rep.rid = ?`,
            req.params.rid
        );
        // declined에 추가
        await conn.query(
            `INSERT INTO declined VALUES (?, ?)`,
            [req.params.rid, req.body.message]
        );
        conn.release();
        return res.redirect('/');
    }
    catch (err) {
        conn.release();
        next(err);
    }
});


// 의뢰자의 홈페이지
router.get('/', (req, res, next) => {
    try {
        res.render('main', {
            title: 'CodingMon - DBDBDIP @ client',
            user: req.user,
            loginError: req.flash('loginError'),
        });
    }
    catch (err) {
        console.error(err);
        next(err);
    }
});

module.exports = router;