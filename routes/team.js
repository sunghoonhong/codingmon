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
            tname: team.tname,
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

// 팀장이 팀원 초대
router.post('/invite', isLoggedIn, async(req, res, next) => {
    const {
        tname, inviteId
    } = req.body;
    const conn = await pool.getConnection(async conn => conn);
    try{
         // 진행중인 의뢰가 있으면 변경불가
         const [[exWork]] = await conn.query(
            `SELECT * FROM team t, request rq, applys ap 
            WHERE rq.rqid=ap.rqid AND ap.job_seeker_id=t.job_seeker_id
            AND ap.status='accepted' AND rq.dev_start IS NOT NULL AND rq.dev_end IS NULL
            AND tname=?`,
            tname
        );
        if(exWork) {
            console.error('진행중인의뢰가 있음');
            req.flash('teamError', '진행 중인 의뢰가 있습니다');
            if (req.user.type=='admin')
                return res.redirect(`/admin/team`);
            else
                return res.redirect(`/team/${tname}`);
        }
        // 해당 ID의 프리랜서가 존재하지않으면 예외처리
        const [[exMem]] = await conn.query(
            `SELECT * FROM freelancer WHERE id=?`,
            inviteId
        );
        if(!exMem) {
            req.flash('teamError', 'ID가 잘못됐습니다.');
            if (req.user.type=='admin') {
                return res.redirect('/admin/team');
            }
            return res.redirect(`/team/${tname}`);
        }
        // 팀원에 추가
        await conn.query(
            `INSERT INTO participates VALUES(?, ?)`,
            [inviteId, tname]
        );
        if(req.user.type=='admin') {
            return res.redirect('/admin/team');
        }
        res.redirect(`/team/${tname}`);

    }
    catch (err) {
        conn.release();
        console.error(err);
        next(err);
    }
})

// 팀장이 팀원 추방
router.post('/ban', isLoggedIn, async(req, res, next) => {
    const {
        tname, banId
    } = req.body;
    const conn = await pool.getConnection(async conn => conn);
    try {
        // 진행중인 의뢰가 있으면 변경불가
        const [[exWork]] = await conn.query(
            `SELECT * FROM team t, request rq, applys ap 
            WHERE rq.rqid=ap.rqid AND ap.job_seeker_id=t.job_seeker_id
            AND ap.status='accepted' AND rq.dev_start IS NOT NULL AND rq.dev_end IS NULL
            AND tname=?`,
            tname
        );
        if(exWork) {
            console.error('진행중인의뢰가 있음');
            req.flash('teamError', '진행 중인 의뢰가 있습니다');
            if (req.user.type=='admin')
                return res.redirect(`/admin/team`);
            else
                return res.redirect(`/team/${tname}`);
        }
        await conn.query(
            'DELETE FROM participates WHERE tname=? AND fid=?',
            [tname, banId]
        );
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
        // 진행중인의뢰가 있으면 삭제 불가
        const [[exWork]] = await conn.query(
            `SELECT * FROM team t, request rq, applys ap 
            WHERE rq.rqid=ap.rqid AND ap.job_seeker_id=t.job_seeker_id
            AND ap.status='accepted' AND rq.dev_start IS NOT NULL AND rq.dev_end IS NULL
            AND tname=?`,
            req.body.tname
        );
        if(exWork) {
            console.error('진행중인의뢰가 있음');
            req.flash('teamError', '진행 중인 의뢰가 있는 팀은 삭제할 수 없습니다');
            if (req.user.type=='admin')
                return res.redirect(`/admin/team`);
            else
                return res.redirect(`/team/${req.body.tname}`);
        }
        // 삭제
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

// 구인중인 의뢰 목록
router.get('/request/:tname', isMgr, async (req, res, next) => {
    if(!req.query.orderType) req.query.orderType = 'rqid';
    const conn = await pool.getConnection(async conn => conn);
    try {
        const [requests] = await conn.query(
            `SELECT rq.rqid, rq.rname, c.id as cid, rq.start_date, rq.end_date, 
            rq.min_people, rq.max_people, rq.reward, rq.min_career
            FROM request rq, client c
            WHERE rq.cid = c.id AND rq.dev_start IS NULL
            AND rq.start_date <= now() AND now() <= rq.end_date
            ORDER BY rq.${req.query.orderType};`
        );
        conn.release();
        res.render('team_request', {
            title: `구인 중인 의뢰 목록 - ${req.params.tname}`,
            user: req.user,
            requests: requests,
            tname: req.params.tname,
            orderType: req.query.orderType,
            applyError: req.flash('applyError')
        });
    }
    catch (err) {
        conn.release();
        console.error(err);
        next(err);
    }
});

// 구인 중인 의뢰목록에서 의뢰에 신청
router.post('/:tname/apply', isMgr, async (req, res, next) => {
    const conn = await pool.getConnection(async conn => conn);
    try {
        // 프리랜서의 최소 조건 충족 확인
        const [[pass]] = await conn.query(
            `SELECT * FROM request R, team T
            WHERE R.dev_start IS NULL AND R.min_people <= T.people_num
            AND R.max_people >= T.people_num AND T.career >= R.min_career
            AND R.rqid = ? AND T.tname = ?
            AND NOT EXISTS
            (SELECT * FROM knows K, requires req, program_lang pl
            WHERE T.job_seeker_id = K.job_seeker_id
            AND K.lang_name = pl.lang_name AND pl.lang_name = req.lang_name 
            AND req.rqid = R.rqid AND K.level < req.level AND T.tname = ?)`,
            [req.body.rqid, req.params.tname, req.params.tname]
        );
        if(!pass) {
            conn.release();
            req.flash('applyError', '최소 조건을 충족시키지 못합니다');
            return res.redirect(`/team/request/${req.params.tname}`);
        }
        await conn.query(
            `INSERT INTO applys(rqid, job_seeker_id) VALUES(?, ?)`,
            [req.body.rqid, pass.job_seeker_id]
        );
        conn.release();
        return res.redirect(`/team/${req.params.tname}`);
    }
    catch (err) {
        req.flash('applyError', '신청 중 오류 발생');
        conn.release();
        console.error(err);
        res.redirect(`/team/${req.params.tname}`);
    }
});

// 신청가능한 의뢰목록 조회
router.get('/possible/:tname', isMgr, async (req, res, next) => {
    if(!req.query.orderType) req.query.orderType = 'rqid';
    const conn = await pool.getConnection(async conn => conn);
    try {
        const [requests] = await conn.query(
            `SELECT R.rqid, R.rname, C.id as cid, R.start_date, R.end_date, 
            R.min_people, R.max_people, R.reward, R.min_career
            FROM request R, team T, client C
            WHERE R.dev_start IS NULL AND T.career >= R.min_career AND C.id = R.cid
            AND R.min_people <= T.people_num AND R.max_people >= T.people_num
            AND T.id = ? AND R.start_date <= now() AND now() <= R.end_date
            AND NOT EXISTS
            (SELECT * FROM knows K, requires req, program_lang pl
            WHERE T.job_seeker_id = K.job_seeker_id
            AND K.lang_name = pl.lang_name AND pl.lang_name = req.lang_name 
            AND req.rqid = R.rqid AND K.level < req.level AND T.id = ?)`,
            [req.params.tname, req.params.tname]
        );
        conn.release();
        res.render('team_request', {
            title: '신청 가능한 의뢰 목록',
            user: req.user,
            tname: req.params.tname,
            requests: requests,
            orderType: req.query.orderType,
            applyError: req.flash('applyError')
        });
    }
    catch (err) {
        conn.release();
        console.error(err);
        next(err);
    }
});

// 신청한 의뢰목록 조회
router.get('/waiting/:tname', isMgr, async (req, res, next) => {
    const conn = await pool.getConnection(async conn => conn);
    try {
        const [requests] = await conn.query(
            `SELECT R.rqid, R.rname, R.cid, R.start_date, R.reward, A.status
            FROM request R, client C, team T, applys A
            WHERE R.cid = C.id AND T.job_seeker_id = A.job_seeker_id AND A.rqid = R.rqid AND T.id=?
            ORDER BY A.status DESC`, req.params.tname
        );
        conn.release();
        res.render('team_waiting', {
            title: '팀이 신청한 의뢰',
            user: req.user,
            requests: requests,
            tname: req.params.tname
        });
    }
    catch (err) {
        conn.release();
        console.error(err);
        next(err);
    }
});

// 진행중인 의뢰목록 조회
router.get('/working/:tname', isMgr, async (req, res, next) => {
    const conn = await pool.getConnection(async conn => conn);
    try {
        const [devs] = await conn.query(
            `SELECT R.rqid, R.rname, C.id as cid, R.dev_start, R.reward
            FROM request R, client C, team T, applys A
            WHERE R.cid = C.id AND T.job_seeker_id = A.job_seeker_id AND T.tname=?
            AND NOT EXISTS(SELECT * FROM report rep WHERE R.rqid=rep.rqid)
            AND A.rqid = R.rqid AND A.status = 'accepted' AND R.dev_end IS NULL`,
            req.params.tname
        );
        const [waitings] = await conn.query(
            `SELECT R.rqid, R.rname, C.id as cid, R.dev_start, R.reward
            FROM request R,client C, team T, applys A
            WHERE R.cid = C.id AND T.job_seeker_id = A.job_seeker_id AND A.rqid = R.rqid AND A.status = 'accepted' 
            AND (SELECT rep.status FROM report rep WHERE R.rqid=rep.rqid ORDER BY rep.rid DESC LIMIT 1)='waiting'
            AND R.dev_end IS NULL AND T.tname=?`,
            req.params.tname
        );
        const [declineds] = await conn.query(
            `SELECT R.rqid, R.rname, C.id as cid, R.dev_start, R.reward
            FROM request R,client C, team T, applys A
            WHERE R.cid = C.id AND AND T.job_seeker_id = A.job_seeker_id AND A.rqid = R.rqid AND A.status = 'accepted' 
            AND (SELECT rep.status FROM report rep WHERE R.rqid=rep.rqid ORDER BY rep.rid DESC LIMIT 1)='declined'
            AND R.dev_end IS NULL AND T.tname=?`,
            req.params.tname
        );
        conn.release();
        res.render('team_working', {
            title: '팀이 진행 중인 의뢰',
            user: req.user,
            devs: devs,
            waitings: waitings,
            declineds: declineds,
            tname: req.params.tname,
            submitError: req.flash('submitError')
        });
    }
    catch (err) {
        conn.release();
        console.error(err);
        next(err);
    }
});

// 의뢰완료 신청 전송
router.post('/:tname/report/submit', isMgr, async (req, res, next) => {
    const { rfile, rqid } = req.body;
    const conn = await pool.getConnection(async conn => conn);
    try {
        const [[exTeam]] = await conn.query(
            `SELECT * FROM team WHERE tname=?`, req.params.tname
        );
        const [exWaiting] = await conn.query(
            `SELECT * FROM report WHERE rqid=? AND job_seeker_id=? AND status='waiting'`,
            [rqid, exTeam.job_seeker_id]
        );
        if(exWaiting.length) {
            conn.release();
            req.flash('submitError', '완료신청 수락 대기중입니다');
            return res.redirect(`/team/${req.params.tname}/working`);
        }
        await conn.query(
            `INSERT INTO report(rfile, rqid, job_seeker_id)
            VALUES(?, ?, ?)`,
            [rfile, rqid, exTeam.job_seeker_id]
        );
        conn.release();
        res.redirect(`/team/${req.params.tname}`);
    }
    catch(err) {
        req.flash('submitError', '완료 신청 중 에러발생')
        conn.release();
        console.error(err);
        next(err);
    }
});

// 특정 의뢰에 대한 거절메시지 이력 조회
router.get('/:tname/request/:rqid/declined', isMgr, async (req, res, next) => {
    const rqid = req.params.rqid;
    const conn = await pool.getConnection(async conn => conn);
    try {
        const [messages] = await conn.query(
            `SELECT rep.rfile, d.message
            FROM declined d, request req, report rep
            WHERE req.rqid = ? AND req.rqid = rep.rqid AND
            rep.status = 'declined' AND rep.rid = d.drid
            ORDER BY rep.rid DESC`,
            rqid
        );
        conn.release();
        res.render('team_message', {
            title: '거절 메시지',
            user: req.user,
            messages: messages,
            tname: req.params.tname,
            rqid:req.params.rqid,
        });
    }
    catch (err) {
        conn.release();
        console.error(err);
        next(err);
    }
});

// 수락된 의뢰 목록 조회
router.get('/:tname/accepted', isMgr, async (req, res, next) => {
    const conn = await pool.getConnection(async conn => conn);
    try {
        const [acceptances] = await conn.query(
            `SELECT ac.*, req.rqid, req.cid, req.rname, rep.rfile
            FROM team t, report rep, accepted ac, request req
            WHERE t.tname = ? AND t.job_seeker_id = rep.job_seeker_id
            AND rep.rid = ac.arid AND rep.rqid = req.rqid AND ac.c_rating is NULL`,
            req.params.tname
        );
        conn.release();
        res.render('team_accepted', {
            title: '요청수락된 의뢰',
            user: req.user,
            tname: req.params.tname,
            acceptances: acceptances
        });
    }
    catch (err) {
        conn.release();
        console.error(err);
        next(err);
    }
});


// 의뢰자 평점 지정
router.post('/:tname/accepted', isMgr, async (req, res, next) => {
    const conn = await pool.getConnection(async conn => conn);
    try {
        await conn.query(
            `UPDATE accepted
            SET c_rating = ?
            WHERE arid=?`,
            [req.body.rating, req.body.rid]
        );
        conn.release();
        res.redirect(`/team/${req.params.tname}`);
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
        conn.release();
        res.redirect(`/team/${tname}`);
    }
    catch (err) {
        conn.release();
        console.error(err);
        next(err);
    }
});

// 팀장이 특정 팀을 선택했을 때 그 팀과 관련된 행동을 할 수 있는 팀페이지 초기화면
router.get('/:tname', isMgr, async (req, res, next) => {
    const tname = req.params.tname;
    const conn = await pool.getConnection(async conn => conn);
    try {
        const [alarms] = await conn.query(
            `SELECT rq.rqid, c.id
            FROM team t, request rq, report rp, accepted ac, client c
            WHERE t.tname = ? AND t.job_seeker_id = rp.job_seeker_id AND rp.rid = ac.arid
            AND rp.rqid = rq.rqid AND rq.cid = c.id AND ac.c_rating is NULL`,
            tname
        );
        conn.release();
        res.render('team', {
            title: `${tname} 팀 페이지`,
            user: req.user,
            tname: tname,
            alarms: alarms
        });
    }
    catch (err) {
        console.log(err);
        next(err);
    }
});

module.exports = router;