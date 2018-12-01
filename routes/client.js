const express = require('express');
const mysql = require('mysql2/promise');
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
    const conn = await pool.getConnection(async conn => conn);
    try {
        await conn.query(
            'UPDATE client  \
            SET password=?, name=?, phone_num=? \
            WHERE id=?',
            [pw, name, phone_num, id]
        );
        res.redirect('/');
    }
    catch (err) {
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
        res.redirect('/');
    }
    catch (err) {
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
        console.error(err);
        next(err);
    }
});


router.get('/request/:rqid', async (req, res, next) => {
    const conn = await pool.getConnection(async conn => conn);
    try {
        const [request] = await conn.query(
            'SELECT * FROM request WHERE rqid=?',
            req.params.rqid
        );
        conn.release()
        if(!request.length) {
            console.log('해당 의뢰가 없습니다');
            res.redirect('/');
        }
        else {
            res.render('request_detail', {
                title: '나의 의뢰',
                user: req.user,
                target: req.user,
                request: request[0]
            });
        }
    }
    catch (err) {
        conn.release();
        console.error('Query Error');
    }
})

router.get('/register', isClient, (req, res) => {
    res.render('register', {
        title: '의뢰 등록',
        user: req.user,
        regError: req.flash('regError')
    });
});

router.post('/register', isClient, async (req, res) => {
    const { 
        rname, reward, start_date, end_date,
        min_people, max_people, min_career
    } = req.body;
    const conn = await pool.getConnection(async conn => conn);
    try {
        await conn.query(
            'INSERT INTO request(   \
                cid, rname, reward, start_date, end_date,   \
                min_people, max_people, min_career  \
            ) VALUES(?, ?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, rname, reward, start_date, end_date,
            min_people, max_people, min_career]
        );
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