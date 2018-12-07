const express = require('express');
const mysql = require('mysql2/promise');
const { isLoggedIn, isNotLoggedIn, isAdmin } = require('./middlewares');
const dbconfig = require('../config/database');
const router = express.Router();

const pool = mysql.createPool(dbconfig);

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

router.post('/lang', isAdmin, async (req, res, next) => {
    try {
        const conn = await pool.getConnection(async conn => conn);
        try {
            const [exLang] = await conn.query(
                'SELECT * FROM program_lang WHERE lang_name=?',
                req.body.lang_name
            );
            if(exLang.length) {
                req.flash('createError', '이미 있는 언어입니다');
                return res.redirect('/admin/lang');
            }
            await conn.query(
                'INSERT INTO program_lang(lang_name) VALUES(?)',
                req.body.lang_name
            );
            conn.release();
            return res.redirect('/admin/lang');
        }
        catch (err) {
            conn.release();
            console.error('Query Error');
            next(err);
            return res.redirect('/admin/lang');
        }
    }
    catch(err) {
        conn.release();
        console.log(err);
        next(err);
    }
});
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
            next(err);
            return res.redirect('/admin/lang');
        }
    }
    catch(err) {
        conn.release();
        console.log(err);
        next(err);
    }
});

router.get('/team', isAdmin, async (req, res, next) => {
    const conn = await pool.getConnection(async conn => conn);
    try {
        const [teams] = await conn.query('SELECT * FROM team');
        res.render('admin_team_list', {
            title: '팀 관리 - 관리자 모드',
            user: req.user,
            teams: teams
        });
        conn.release();
    }
    catch (err) {
        conn.release();
        console.error(err);
        next(err);
    }
});

router.get('/team/:tname', isAdmin, async (req, res, next) => {
    const tname = req.params.tname;
    const conn = await pool.getConnection(async conn => conn);
    try {
        const [[team]] = await conn.query(
            'SELECT * FROM team WHERE tname=?', tname
        );
        if(!team) {
            res.render('alert', {
                title: '경고 메시지',
                message: '그런 팀은 없습니다'
            });
        }
        const [members] = await conn.query(
            'SELECT fid FROM participates WHERE tname=?',
            tname
        );
        conn.release();
        res.render('team_profile', {
            title: '팀 관리 - 관리자 모드',
            user: req.user,
            team: team,
            members: members
        });
    }
    catch (err) {
        conn.release();
        console.error(err);
        next(err);
    }
});

router.get('/report', isAdmin, async (req, res, next) => {
    const conn = await pool.getConnection(async conn => conn);
    try {
        const [declineds] = await conn.query(
            `SELECT rp.rid, rq.rqid, rq.rname, rp.rfile 
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

router.post('/delete/declined', isAdmin, async (req, res, next) => {
    const conn = await pool.getConnection(async conn => conn);
    try {
        // 결과보고서는 파일이름으로 대체했으므로 파일 처리 필요없음
        await conn.query(
            `DELETE FROM report WHERE rid=?`,
            req.body.drid
        );
        return res.redirect('/');
    }
    catch (err) {
        conn.release();
        console.error(err);
        next(err);
    }
});

router.get('/', isAdmin, async (req, res, next) => {
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