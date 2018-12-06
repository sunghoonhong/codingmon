const express = require('express');
const mysql = require('mysql2/promise');
const multer = require('multer');
const fs = require('fs');
const { isLoggedIn, isNotLoggedIn, isAdmin } = require('./middlewares');
const { external_dir } = require('./preprocess');
const dbconfig = require('../config/database');
const router = express.Router();

const pool = mysql.createPool(dbconfig);

router.get('/join', isNotLoggedIn, async (req, res) => {
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

router.post('/join', isNotLoggedIn, async (req, res) => {
    const conn = await pool.getConnection(async conn => conn);
    try {
        const [langs]= await conn.query(
            'SELECT lang_name FROM program_lang'
        );
        conn.release();
        res.render('join', {
            title: ' 회원가입 ' + req.body.joinType,
            user: req.user,
            langs: langs,
            joinType: req.body.joinType,
            joinError: req.flash('joinError'),
        });
    }
    catch (err) {
        conn.release();
        console.error(err);
    }
});

router.get('/profile/:id', async (req, res, next) => {
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
            var [knows] = await conn.query(
                'SELECT lang_name, level FROM knows \
                WHERE job_seeker_id=?',
                target.job_seeker_id
            );
        }
        else if(exClient.length) {
            target = exClient[0];
            target.type = 'client';
        }
        conn.release();
        // else{}
        res.render('profile', {
            title: req.params.id +'의 프로필',
            user: req.user,
            target: target,
            langs: knows,
            updateError: req.flash('updateError')
        });
    }
    catch (err) {
        conn.release();
        console.error(err);
        next(err);
    }
})

router.get('/request/:rqid', async (req, res, next) => {
    const conn = await pool.getConnection(async conn => conn);
    try {
        const [request] = await conn.query(
            'SELECT * FROM request WHERE rqid=?',
            req.params.rqid
        );
        if(!request.length) {
            conn.release()
            console.log('해당 의뢰가 없습니다');
            res.redirect('/');
        }
        const [requires] = await conn.query(
            'SELECT lang_name, level FROM requires WHERE rqid=?',
            req.params.rqid
        );
        conn.release();
        console.log(requires);
        res.render('request_detail', {
            title: '나의 의뢰',
            user: req.user,
            target: req.user,
            request: request[0],
            requires: requires
        });        
    }
    catch (err) {
        conn.release();
        console.error('Query Error');
        next(err);
    }
});

router.post('/request/update', isAdmin, async (req, res, next) => {
    const { 
        rqid, cid, rname,
        reward, min_people, max_people, min_career,
        start_date, end_date, dev_start, dev_end
    } = req.body;   // 기본 정보 11개
    try {
        if(start_date > end_date || min_people > max_people) {
            return res.render('alert', {
                title: '에러',
                message: '입력이 이상합니다'
            });
        }
    }
    catch (err) {
        next(err);
    }
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
        var keys = Object.keys(req.body);
        for(var i=11; i<keys.length; ++i) {
            await conn.query(
                'INSERT INTO requires (rqid, lang_name, level) \
                VALUES(?, ?, ?) ON DUPLICATE KEY UPDATE level=?',
                [rqid, keys[i], req.body[keys[i]], req.body[keys[i]]]
            );
        }
        conn.release();
        res.redirect('/');
    }
    catch (err) {
        conn.release();
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
        conn.release();
        res.redirect('/');
    }
    catch (err) {
        conn.release();
        console.error(err);
        next(err);
    }
});

router.post('/create/external/:fid', isLoggedIn, external_dir, multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, `public/external/${req.params.fid}`)
        },
        filename: (req, file, cb) => {
            cb(null, file.originalname)
        }
    })}).single('efile'), async (req, res, next) => {
    const conn = await pool.getConnection(async conn => conn);
    try {
        await conn.query(
            `INSERT INTO owns_external(efile, fid)
            VALUES(?, ?)`,
            [req.file.originalname, req.params.fid]
        );
        conn.release();
        return res.redirect('/');
    }
    catch(err) {
        conn.release();
        console.error(err);
        next(err);
    }
})

router.post('/delete/external', isLoggedIn, external_dir, async (req, res, next) => {
    const conn = await pool.getConnection(async conn => conn);
    try {
        const [[external]] = await conn.query(
            `SELECT efile, fid FROM owns_external WHERE pid=?`,
            req.body.pid
        );
        if(!external) {
            conn.release();
            return res.status(403).send('해당 외부 포트폴리오가 없습니다');
        }
        const { efile, fid } = external;
        const path = `./public/external/${fid}/${efile}`;
        fs.unlinkSync(path, (err) => console.error('외부 포트폴리오 삭제 실패', err));
        await conn.query(
            `DELETE FROM owns_external WHERE pid=?`,
            req.body.pid
        );
        conn.release();
        return res.redirect('/');
    }
    catch(err) {
        conn.release();
        console.error(err);
        next(err);
    }
})

router.get('/', async (req, res, next) => {
    // console.log(req.user);
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
                res.status(403).send('잘못된 접근입니다');
            }
        }
    }
    catch (err) {
        console.log(err);
        next(err);
    }
});

module.exports = router;
