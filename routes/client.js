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

router.get('/request', async (req, res, next) => {
    const conn = await pool.getConnection(async conn => conn);
    try {
        const [requests] = await conn.query(
            'SELECT * FROM request'
        );
        conn.release();

        res.render('request', {
            title: '의뢰 목록',
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
            AND f.job_seeker_id = a.job_seeker_id AND a.status ='waiting'`,
            rqid
        );
        const[teams] = await conn.query(
            `SELECT t.*
            FROM request req, team t, job_seeker j, applys a
            WHERE req.rqid =? AND a.rqid = req.rqid AND j.job_seeker_id = a.job_seeker_id
            AND t.job_seeker_id = a.job_seeker_id AND a.status ='waiting'`
            , rqid
        );
        res.render('client_applys', {
            title: '신청자 목록',
            user: req.user,
            freelancers: freelancers,
            teams: teams
        });
    }
    catch (err) {
        next(err);
    }
})

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