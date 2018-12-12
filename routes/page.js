const express = require('express');
const mysql = require('mysql2/promise');
const multer = require('multer');
const fs = require('fs');
const { isLoggedIn, isNotLoggedIn, isAdmin } = require('./middlewares');
const { external_dir, document_dir } = require('./preprocess');
const dbconfig = require('../config/database');
const router = express.Router();

const pool = mysql.createPool(dbconfig);

// 회원가입 양식
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

// 회원가입 처리
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

// 특정 사용자(프리랜서, 의뢰자 모두)의 정보 조회
router.get('/profile/:id', isLoggedIn, async (req, res, next) => {
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
            var [internals] = await conn.query(
                `SELECT rq.rqid, rq.rname, rq.dev_start, rq.dev_end, ar.j_rating, rp.rfile
                FROM owns_internal oi, accepted ar, report rp, request rq
                WHERE oi.fid = ? AND oi.arid = ar.arid AND ar.arid = rp.rid AND rp.rqid = rq.rqid`,
                target.id
            );
            conn.release();
            res.render('profile', {
                title: req.params.id +'의 프로필',
                user: req.user,
                target: target,
                internals: internals,
                langs: knows,
                updateError: req.flash('updateError')
            });
        }
        else if(exClient.length) {
            target = exClient[0];
            target.type = 'client';
            conn.release();
            res.render('profile', {
                title: req.params.id +'의 프로필',
                user: req.user,
                target: target,
                updateError: req.flash('updateError')
            });
        }        
        else {
            conn.release();
            next();
        }
    }
    catch (err) {
        conn.release();
        console.error(err);
        next(err);
    }
})

// 특정 의뢰 정보 조회
router.get('/request/:rqid', isLoggedIn, async (req, res, next) => {
    const conn = await pool.getConnection(async conn => conn);
    try {
        const [[request]] = await conn.query(
            'SELECT * FROM request WHERE rqid=?',
            req.params.rqid
        );
        if(!request) {
            conn.release()
            console.log('해당 의뢰가 없습니다');
            return res.redirect('/');
        }
        const [requires] = await conn.query(
            'SELECT lang_name, level FROM requires WHERE rqid=?',
            req.params.rqid
        );
        conn.release();
        res.render('request_detail', {
            title: '나의 의뢰',
            user: req.user,
            target: req.user,
            request: request,
            requires: requires,
            adminError: req.flash('adminError')
        });        
    }
    catch (err) {
        conn.release();
        console.error('Query Error');
        next(err);
    }
});

// 특정 의뢰 정보 수정
router.post('/request/update', isLoggedIn, async (req, res, next) => {
    const { 
        rqid, cid, rname,
        reward, min_people, max_people, min_career,
        start_date, end_date, dev_start, dev_end
    } = req.body;   // 기본 정보 11개
    try {
        if(start_date > end_date || min_people > max_people) {
            console.error('입력이 이상합니다');
            req.flash('adminError', '입력이 이상합니다');
            return res.redirect(`/request/${req.body.targetId}`);
        }
        // 진행중인의뢰면 수정 불가
        const [[exReq]] = await conn.query(
            `SELECT dev_start, dev_end FROM request WHERE rqid=?`,
            req.body.targetId
        );

        if(exReq.dev_start && !exReq.dev_end) {
            console.error('현재 진행 중인 의뢰입니다');
            req.flash('adminError', '현재 진행 중인 의뢰는 수정할 수 없습니다');
            return res.redirect(`/request/${req.body.targetId}}`);
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

// 특정 의뢰 삭제
router.post('/request/delete', isAdmin, document_dir, async (req, res, next) => {
    const conn = await pool.getConnection(async conn => conn);
    try {
        // 진행중인의뢰면 삭제 불가
        const [[exReq]] = await conn.query(
            `SELECT dev_start, dev_end FROM request WHERE rqid=?`,
            req.body.targetId
        );

        if(exReq.dev_start && !exReq.dev_end) {
            console.error('현재 진행 중인 의뢰입니다');
            req.flash('adminError', '현재 진행 중인 의뢰는 삭제할 수 없습니다');
            return res.redirect(`/request/${req.body.targetId}}`);
        }
        

        // 의뢰 문서 파일 삭제
        const [docs] = await conn.query(
            `SELECT dfile, did FROM document WHERE rqid=?`,
            req.body.targetId
        );
        // 실제 의뢰문서 파일들 삭제
        var path;
        for(i in docs) {
            path = `./public/document/${req.body.targetId}/${docs[i].dfile}`;
            if(fs.existsSync(path))
                fs.unlinkSync(path, (err) => console.error('의뢰 문서 삭제 실패', err));
        }
        // 의뢰의 디렉토리 삭제
        var rootPath = `./public/document/${req.body.targetId}`
        if(fs.existsSync(rootPath)) {
            fs.rmdirSync(rootPath, (err) => console.error(err));
        }
        // DB에서 의뢰 삭제 (의뢰문서는 CASCADE로 삭제)
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

/*
    외적 포트폴리오 관련
*/

// 특정 프리랜서의 외적 포트폴리오 추가
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
        if(!req.file) {
            conn.release();
            req.flash('externalError', '선택된 파일이 없습니다');
            return res.redirect(`/freelancer/${req.params.fid}/external`);
        }
        // 이미 있는 파일 이름이면 무시
        const [[exExt]] = await conn.query(
            `SELECT * FROM owns_external WHERE efile=? AND fid=?`,
            [req.file.originalname, req.params.fid]
        );

        if(exExt) {
            conn.release();
            req.flash('externalError', '이미 존재하는 파일입니다');
            return res.redirect(`/freelancer/${req.params.fid}/external`);
        }

        await conn.query(
            `INSERT INTO owns_external(efile, fid)
            VALUES(?, ?)`,
            [req.file.originalname, req.params.fid]
        );
        conn.release();
        return res.redirect(`/freelancer/${req.params.fid}/external`);
    }
    catch(err) {
        conn.release();
        console.error(err);
        next(err);
    }
})

// 특정 외적 포트폴리오 삭제
router.post('/delete/external', isLoggedIn, external_dir, async (req, res, next) => {
    const conn = await pool.getConnection(async conn => conn);
    try {
        const [[external]] = await conn.query(
            `SELECT efile, fid FROM owns_external WHERE pid=?`,
            req.body.pid
        );
        if(!external) {
            conn.release();
            return res.status(403).send('해당 외적 포트폴리오가 없습니다');
        }
        const { efile, fid } = external;
        const path = `./public/external/${fid}/${efile}`;
        if(fs.existsSync(path)) 
            fs.unlinkSync(path, (err) => console.error('외적 포트폴리오 삭제 실패', err));
        await conn.query(
            `DELETE FROM owns_external WHERE pid=?`,
            req.body.pid
        );
        conn.release();
        return res.redirect(`/freelancer/${fid}/external`);
    }
    catch(err) {
        conn.release();
        console.error(err);
        next(err);
    }
});

/*
    의뢰문서 관련
*/

// 특정 의뢰의 의뢰문서 조회
router.get('/request/:rqid/document', isLoggedIn, async (req, res, next) => {
    const conn = await pool.getConnection(async conn => conn);
    try {
        const [documents] = await conn.query(
            `SELECT did, dfile FROM document WHERE rqid=?`,
            req.params.rqid
        );
        conn.release();
        res.render('request_document', {
            title: `${req.params.rqid}번 의뢰 문서`,
            user: req.user,
            rqid: req.params.rqid,
            documents: documents,
            documentError: req.flash('documentError')
        });
    }
    catch (err) {
        conn.release();
        console.error(err);
        next(err);
    }
})

// 특정 의뢰문서 다운로드
router.get('/request/document/:rqid/:dfile', isLoggedIn, (req, res, next) => {
    return res.sendFile(`${req.params.dfile}`, {
        root: `public/document/${req.params.rqid}/`
    });
});

// 특정 의뢰의 의뢰문서 추가
router.post('/create/request/:rqid/document', isLoggedIn, document_dir, multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, `public/document/${req.params.rqid}`)
        },
        filename: (req, file, cb) => {
            cb(null, file.originalname)
        }
    })}).single('dfile'), async (req, res, next) => {
    const conn = await pool.getConnection(async conn => conn);
    try {
        if(!req.file) {
            conn.release();
            req.flash('documentError', '선택된 파일이 없습니다');
            return res.redirect(`/request/${req.params.rqid}/document`);
        }
        const [[exDoc]] = await conn.query(
            `SELECT * FROM document WHERE dfile=? AND rqid=?`,
            [req.file.originalname, req.params.rqid]
        );
        if(exDoc) {
            conn.release();
            req.flash('documentError', '이미 존재하는 파일입니다');
            return res.redirect(`/request/${req.params.rqid}/document`);
        }
        await conn.query(
            `INSERT INTO document(dfile, rqid) VALUES(?, ?)`,
            [req.file.originalname, req.params.rqid]
        );
        conn.release();
        return res.redirect(`/request/${req.params.rqid}/document`);
    }
    catch (err) {
        conn.release();
        next(err);
    }
});

// 특정 의뢰문서 삭제
router.post('/delete/document', isLoggedIn, document_dir, async (req, res, next) => {
    const conn = await pool.getConnection(async conn => conn);
    try {
        const [[document]] = await conn.query(
            `SELECT dfile, did FROM document WHERE did=?`,
            req.body.did
        );
        if(!document) {
            conn.release();
            return res.status(403).send('해당 의뢰 문서가 없습니다');
        }
        const { dfile, did } = document;
        const path = `./public/document/${did}/${dfile}`;
        if(fs.existsSync(path))
            fs.unlinkSync(path, (err) => console.error('의뢰 문서 삭제 실패', err));
        await conn.query(
            `DELETE FROM document WHERE did=?`,
            req.body.did
        );
        conn.release();
        return res.redirect('/');
    }
    catch(err) {
        conn.release();
        console.error(err);
        next(err);
    }
});

// 홈페이지
router.get('/', (req, res, next) => {
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
