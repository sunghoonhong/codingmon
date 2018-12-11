const express = require('express');
const mysql = require('mysql2/promise');
const { isLoggedIn, isNotLoggedIn, isAdmin } = require('./middlewares');
const dbconfig = require('../config/database');
const router = express.Router();

const pool = mysql.createPool(dbconfig);

// 일반 사용자 목록
router.get('/user', isAdmin, async (req, res, next) => {
    try {
        const conn = await pool.getConnection(async conn => conn);
        try {
            const [freelancers] = await conn.query(
                'SELECT * FROM freelancer'
            );
            const [clients] = await conn.query(
                'SELECT * FROM client'
            );
            conn.release();
            res.render('user', {
                title: 'Admin - 사용자 관리',
                freelancers: freelancers,
                clients: clients,
                user : req.user
            });
        }
        catch (err) {
            conn.release();
            console.error('Query Error');
            next(err);        
        }
    }
    catch(err) {
        conn.release();
        console.log(err);
        next(err);
    }
});


// 전체 의뢰 목록
router.get('/request', isAdmin, async (req, res, next) => {
    try {
        const conn = await pool.getConnection(async conn => conn);
        try {
            const [requests] = await conn.query(
                'SELECT * FROM request'
            );
            conn.release();
            res.render('request', {
                title: '의뢰 관리',
                user: req.user,
                requests: requests
            });
        }
        catch (err) {
            conn.release();
            next(err);
        }
    }
    catch (err) {
        conn.release();
        next(err);
    }
});

// 전체 언어 목록
router.get('/lang', isAdmin, async (req, res, next) => {
    try {
        const conn = await pool.getConnection(async conn => conn);
        try {
            const [langs] = await conn.query(
                'SELECT * FROM program_lang ORDER BY lang_name'
            );
            conn.release();
            res.render('lang', {
                title: 'Admin - 프로그래밍언어',
                langs: langs,
                user: req.user,
                createError: req.flash('createError')
            });
        }
        catch (err) {
            conn.release();
            console.error('Query Error');
            next(err);        
        }
    }
    catch(err) {
        conn.release();
        console.log(err);
        next(err);
    }
});

// 새로운 언어 추가
router.post('/lang', isAdmin, async (req, res, next) => {
    try {
        const conn = await pool.getConnection(async conn => conn);
        try {
            // 이미 있는 언어 예외처리
            const [exLang] = await conn.query(
                'SELECT * FROM program_lang WHERE lang_name=?',
                req.body.lang_name
            );
            if(exLang.length) {
                req.flash('createError', '이미 있는 언어입니다');
                conn.release();
                return res.redirect('/admin/lang');
            }
            // 프로그래밍 언어 목록에 추가
            await conn.query(
                'INSERT INTO program_lang(lang_name) VALUES(?)',
                req.body.lang_name
            );
            
            const [job_seekers] = await conn.query(
                `SELECT * FROM job_seeker`
            );
            const [requests] = await conn.query(
                `SELECT rqid FROM request`
            );

            // 모든 프리랜서에 대해 프로그래밍 언어 능숙도에 0으로 추가
            for(var i=0; i<job_seekers.length; i++) {
                await conn.query(
                    `INSERT INTO knows VALUES(?,?,?)`,
                    [job_seekers[i].job_seeker_id, req.body.lang_name, 0]
                )
            }
            
            // 모든 의뢰에 대해 요구 언어 능숙도에 0으로 추가
            for(var i=0; i<requests.length; i++) {
                await conn.query(
                    `INSERT INTO requires VALUES(?,?,?)`,
                    [requests[i].rqid, req.body.lang_name, 0]
                )
            }
            conn.release();
            return res.redirect('/admin/lang');
        }
        catch (err) {
            conn.release();
            console.error(err);
            return res.redirect('/admin/lang');
        }
    }
    catch(err) {
        conn.release();
        console.log(err);
        next(err);
    }
});

// 언어 삭제
router.post('/lang/delete', isAdmin, async (req, res, next) => {
    try {
        const conn = await pool.getConnection(async conn => conn);
        try {
            const [exLang] = await conn.query(
                'SELECT * FROM program_lang WHERE lang_name=?',
                req.body.lang_name
            );
            if(!exLang.length) {
                req.flash('deleteError', '없는 언어입니다');
                return res.redirect('/admin/lang');
            }
            await conn.query(
                'DELETE FROM program_lang WHERE lang_name=?',
                req.body.lang_name
            );
            conn.release();
            return res.redirect('/admin/lang');
        }
        catch (err) {
            conn.release();
            console.error('Query Error');
            return res.redirect('/admin/lang');
        }
    }
    catch(err) {
        conn.release();
        console.log(err);
        next(err);
    }
});


// 전체 팀 목록
router.get('/team', isAdmin, async (req, res, next) => {
    const conn = await pool.getConnection(async conn => conn);
    try {
        const [teams] = await conn.query('SELECT * FROM team');
        res.render('admin_team_list', {
            title: '팀 관리 - 관리자 모드',
            user: req.user,
            teams: teams,
            teamError: req.flash('teamError')
        });
        conn.release();
    }
    catch (err) {
        conn.release();
        console.error(err);
        next(err);
    }
});


// 특정 팀 조회
router.get('/team/:tname', isAdmin, async (req, res, next) => {
    const tname = req.params.tname;
    const conn = await pool.getConnection(async conn => conn);
    try {
        const [[team]] = await conn.query(
            'SELECT * FROM team WHERE tname=?', tname
        );
        const [members] = await conn.query(
            'SELECT fid FROM participates WHERE tname=?',
            tname
        );
        conn.release();
        res.render('team_profile', {
            title: '팀 관리 - 관리자 모드',
            user: req.user,
            team: team,
            members: members,
            teamError: req.flash('teamError')
        });
    }
    catch (err) {
        conn.release();
        console.error(err);
        next(err);
    }
});


// 거절된 의뢰완료신청 목록
router.get('/report', isAdmin, async (req, res, next) => {
    const conn = await pool.getConnection(async conn => conn);
    try {
        const [declineds] = await conn.query(
            `SELECT rp.rid, rq.rqid, rq.rname, rp.rfile, de.message
            FROM report rp, request rq, declined de
            WHERE rp.rid = de.drid AND rp.rqid = rq.rqid`
        );

        conn.release();
        res.render('admin_report', {
            title: '의뢰완료요청 관리',
            user: req.user,
            declineds: declineds
        });
    }
    catch (err) {
        conn.release();
        console.error(err);
        next(err);
    }
});

// 거절된 의뢰완료신청 삭제
router.post('/delete/declined', isAdmin, async (req, res, next) => {
    const conn = await pool.getConnection(async conn => conn);
    try {
        // 결과보고서는 파일이름으로 대체했으므로 파일 처리 필요없음
        await conn.query(
            `DELETE FROM report WHERE rid=?`,
            [req.body.drid]
        );
        conn.release();
        return res.redirect('/');
    }
    catch (err) {
        conn.release();
        console.error(err);
        next(err);
    }
});

// 관리자 초기화면
router.get('/', isAdmin, (req, res, next) => {
    try {
        res.render('main', {
            title: 'CodingMon - DBDBDIP @ admin',
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