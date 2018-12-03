const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const { isLoggedIn, isNotLoggedIn, isAdmin } = require('./middlewares');
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
        res.redirect('/');
    }
    catch (err) {
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

// router.get('/waiting')

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