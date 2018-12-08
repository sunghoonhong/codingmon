const express = require('express');
const mysql = require('mysql2/promise');
const { 
    isLoggedIn, isNotLoggedIn, isAdmin, isFreelancer, isClient, isMgr
} = require('./middlewares');
const dbconfig = require('../config/database');
const router = express.Router();

const pool = mysql.createPool(dbconfig);

// 특정 팀의 정보 조회
router.get('/profile/:tname', isLoggedIn, async(req, res, next) => {
    const tname = req.params.tname;
    const conn = await pool.getConnection(async conn => conn);
    try {
        const [[team]] = await conn.query(
            'SELECT * FROM team WHERE tname=?',
            tname
        );
        const [members] = await conn.query(
            'SELECT fid FROM participates WHERE tname=?',
            tname
        );
        conn.release();
        res.render('team_profile', {
            title: '팀 정보',
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

// 팀장이 팀원 추방
router.post('/ban', isLoggedIn, async(req, res, next) => {
    const {
        tname, banId
    } = req.body;
    const conn = await pool.getConnection(async conn => conn);
    try {
        await conn.query(
            'DELETE FROM participates WHERE tname=? AND fid=?',
            [tname, banId]
        );
        // 인원수, 경력, 능숙도 업데이트 필요
        
        conn.release();
        if(req.user.type=='admin')
            res.redirect('/admin/team');
        else
            res.redirect(`/team/${tname}`);
    }
    catch (err) {
        conn.release();
        console.error(err);
        next(err);
    }
});


// 팀 삭제
router.post('/delete', isLoggedIn, async(req, res, next) => {
    const conn = await pool.getConnection(async conn => conn);
    try {
        // 의뢰 진행중인지 체크할 필요가 있다!! --- 보류...
        await conn.query(
            'DELETE FROM team WHERE tname=?',
            req.body.tname
        );
        conn.release();
        if(req.user.type=='admin')
            res.redirect('/admin/team');
        else
            res.redirect('/');
    }
    catch (err) {
        conn.release();
        console.error(err);
        next(err);
    }
});

// 프리랜서가 자신이 팀장인 팀 목록을 조회
router.get('/list', isLoggedIn, async(req, res, next) => {
    const conn = await pool.getConnection(async conn => conn);
    try {
        const [teams] = await conn.query(
            'SELECT * FROM team WHERE mgr_id=?',
            req.user.id
        );
        conn.release();
        res.render('team_list', {
            title: '나의 팀 목록',
            user: req.user,
            teams: teams
        });
    }
    catch (err) {
        conn.release();
        console.error(err);
        next(err);
    }
});

// 프리랜서가 팀 생성하는 양식
router.get('/create', isLoggedIn, async (req, res, next) => {
    res.render('create_team', {
        title: '팀 생성',
        user: req.user,
        createError: req.flash('createError')
    });
});

// 프리랜서가 팀 생성
router.post('/create', isLoggedIn, async (req, res, next) => {
    const {
        tname, memberId
    } = req.body;
    const conn = await pool.getConnection(async conn => conn);
    try {
        // 예외 처리
        if(memberId == req.user.id) {
            conn.release();
            req.flash('createError', '팀장은 팀원이 될 수 없습니다');
            return res.redirect('/team/create');
        }
        const [exTeam] = await conn.query(
            'SELECT * FROM team WHERE tname=?', tname
        );
        if(exTeam.length) {
            conn.release();
            req.flash('createError', '이미 존재하는 이름입니다');
            return res.redirect('/team/create');
        }
        const [[exMem]] = await conn.query(
            'SELECT career, job_seeker_id FROM freelancer \
            WHERE id=?', memberId
        );
        if(!exMem) {
            conn.release();
            req.flash('createError', '없는 팀원 ID입니다');
            return res.redirect('/team/create');
        }

        const [[exMgr]] = await conn.query(
            'SELECT career FROM freelancer WHERE id=?', req.user.id
        );
        if(!exMgr) {
            // 로그인한 계정이 프리랜서에 존재하지 않는 경우
            conn.release();
            req.flash('createError', '잘못된 접근입니다');
            return res.redirect('/team/create');
        }
        // 먼저 job seeker 생성
        const [jobSeeker] = await conn.query(
            'INSERT INTO job_seeker(job_seeker_id) VALUES(NULL)'
        );
        
        // 팀 생성
        await conn.query(
            `INSERT INTO team(tname, career, mgr_id, people_num, job_seeker_id)
            VALUES(?, ?, ?, 2, ?)`,
            [tname, Math.min(exMgr.career, exMem.career), req.user.id, jobSeeker.insertId]
        );
        
        // participates 추가
        await conn.query(
            'INSERT INTO participates(fid, tname) VALUES(?, ?)',
            [req.user.id, tname]
        );
        await conn.query(
            'INSERT INTO participates(fid, tname) VALUES(?, ?)',
            [memberId, tname]
        );

        // 팀의 언어별 능숙도 계산
        var [langs] = await conn.query('SELECT lang_name FROM program_lang');
        const [mgr_knows] = await conn.query(
            'SELECT lang_name, level FROM knows WHERE job_seeker_id=?',
            req.user.job_seeker_id
        );
        const [mem_knows] = await conn.query(
            'SELECT lang_name, level FROM knows WHERE job_seeker_id=?',
            exMem.job_seeker_id
        );
        for(var i=0; i<langs.length; ++i) {
            langs[i].level = 0;
            for(var j=0; j<mgr_knows.length; ++j) {
                if(mgr_knows[j].lang_name == langs[i].lang_name) {
                    langs[i].level = mgr_knows[j].level;
                    break;
                }
            }
            for(var j=0; j<mem_knows.length; ++j) {
                if(mem_knows[j].lang_name == langs[i].lang_name) {
                    langs[i].level = Math.max(langs[i].level, mem_knows[j].level);
                    break;
                }
            }
        }
        // 계산한 최대 언어 능숙도 등록
        for(var i=0; i<langs.length; ++i) {
            if(langs[i].level) {
                await conn.query(
                    'INSERT INTO knows(job_seeker_id, lang_name, level) \
                    VALUES(?, ?, ?)',
                    [jobSeeker.insertId, langs[i].lang_name, langs[i].level]
                );
            }
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

// 팀장이 특정 팀을 선택했을 때 그 팀과 관련된 행동을 할 수 있는 팀페이지 초기화면
router.get('/:tname', isMgr, (req, res, next) => {
    const tname = req.params.tname;
    try {
        res.render('team', {
            title: `${tname} 팀 페이지`,
            user: req.user,
            tname: tname
        });
    }
    catch (err) {
        console.log(err);
        next(err);
    }
});

module.exports = router;