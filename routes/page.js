const express = require('express');
const mysql = require('mysql2/promise');
const { isLoggedIn, isNotLoggedIn, isAdmin } = require('./middlewares');
const dbconfig = require('../config/database');
const router = express.Router();

const pool = mysql.createPool(dbconfig);

router.get('/join', isNotLoggedIn, (req, res) => {
    var title = '회원가입';
    if(req.body.joinType) {
        title += ' ' + req.body.joinType;
    }
    res.render('join', {
        title: title,
        user: req.user,
        joinType: req.body.joinType,
        joinError: req.flash('joinError'),
    });
});

router.post('/join', isNotLoggedIn, (req, res) => {
    res.render('join', {
        title: ' 회원가입 ' + req.body.joinType,
        user: req.user,
        joinType: req.body.joinType,
        joinError: req.flash('joinError'),
    });
});

router.get('/profile/:id', async (req, res) => {
    const conn = await pool.getConnection(async conn => conn);
    try {
        const [exFree] = await conn.query(
            'SELECT * FROM freelancer WHERE id=?',
            req.params.id
        );
        const [exClient] = await conn.query(
            'SELECT * FROM client WHERE id=?',
            req.params.id
        );
        var target;
        if(exFree.length) {
            target = exFree[0];
            target.type = 'freelancer';
        }
        else if(exClient.length) {
            target = exClient[0];
            target.type = 'client';
        }
        // else{}
        res.render('profile', {
            title: req.params.id +'의 프로필',
            user: req.user,
            target: target
        });
    }
    catch (err) {
        console.error(err);
    }
})

router.get('/request/:id', async (req, res, next) => {
    try {
        const conn = await pool.getConnection(async conn => conn);
        try {
            const [request] = await conn.query(
                'SELECT * FROM request WHERE rqid=?',
                req.params.id
            );
            conn.release();
            res.render('request_detail', {
                title: '의뢰 정보',
                user: req.user,
                request: request[0],
                tableName: req.params.id + '번 의뢰'
            });
        }
        catch (err) {
            conn.release();
            next(err);
        }
    }
    catch (err) {
        next(err);
    }
});

router.post('/request/update', isAdmin, async (req, res, next) => {
    const { 
        rqid, cid, rname,
        reward, min_people, max_people, min_career,
        start_date, end_date, dev_start, dev_end
    } = req.body;
    var sql = 'UPDATE request  \
                SET rname=?, reward=?, min_people=?, \
                max_people=?, min_career=?, \
                start_date=?, end_date=?';
    var params = [
        rname, reward, min_people, max_people,
        min_career, start_date, end_date
    ];
    if(dev_start) {
        sql += ', dev_start=?';
        params.push(dev_start);
    }
    if(dev_end) {
        sql += ', dev_end=?';
        params.push(dev_end);
    }
    params.push(rqid);
    const conn = await pool.getConnection(async conn => conn);
    try {
        await conn.query(sql + ' WHERE rqid=?', params);
        res.redirect('/');
    }
    catch (err) {
        console.error(err);
        next(err);
    }
});

router.post('/request/delete', isAdmin, async (req, res, next) => {
    const conn = await pool.getConnection(async conn => conn);
    try {
        await conn.query(
            'DELETE FROM request WHERE rqid=?',
            req.body.targetId
        );
        res.redirect('/');
    }
    catch (err) {
        next(err);
    }
});

router.get('/', async (req, res, next) => {
    console.log(req.user);
    try {
        if (!req.user) {
            res.render('main', {
                title: 'CodingMon - DBDBDIP',
                user: req.user,
                loginError: req.flash('loginError'),
            });
        }
        else {
            if (req.user.type) {
                console.log('redirect to /', req.user.type);
                res.redirect('/'+req.user.type);
            }
            else {
                console.error('No user type');
            }
        }
    }
    catch (err) {
        console.log(err);
    }
});

module.exports = router;
