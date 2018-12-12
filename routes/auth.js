const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const dbconfig = require('../config/database');
const router = express.Router();

const pool = mysql.createPool(dbconfig);

// 프리랜서 가입
router.post('/join/freelancer', isNotLoggedIn, async (req, res, next) => {
  const keys = Object.keys(req.body);
  var langFlag = false;
  var langIndex = 7;  // career 까지만 body로 들어오고 7부터 언어시작
  // 언어 능숙도를 최소한 하나 선택했는지 검사
  for(var i=langIndex; i < keys.length; i++) {
    if(req.body[keys[i]] != 0) {
      langFlag = true;
      break;
    }
  }
  if(!langFlag) {
    req.flash('joinError', '적어도 언어 하나는 하세요');
    return res.redirect('/join');
  }
  const { 
    id, pw, name, phone_num, age, major, career
  } = req.body;
  try {
    const conn = await pool.getConnection(async conn => conn);
    try {
      const [exUser] = await conn.query(
        `SELECT id, password FROM admin WHERE id=?
            UNION
        SELECT id, password FROM freelancer WHERE id=?
            UNION
        SELECT id, password FROM client WHERE id=?`,
        [id, id, id]
      );
      if (exUser.length) {
        conn.release();
        req.flash('joinError', '이미 등록된 사용자입니다');
        return res.redirect('/join');
      }
      const [jobSeeker] = await conn.query(
        'INSERT INTO job_seeker(job_seeker_id) VALUES(NULL)'
      );
      const hash = await bcrypt.hash(pw, 13);
      await conn.query(
        `INSERT INTO freelancer(
        id, password, name, phone_num,
        age, major, career, job_seeker_id)
        VALUES(?, ?, ?, ?, ?, ?, ?, ?)`, 
        [ id, hash, name, phone_num,
        age, major, career, jobSeeker.insertId ]
      );

      for(var i=langIndex; i < keys.length; i++) {
        await conn.query(
          `INSERT INTO knows VALUES(?, ?, ?)`,
          [jobSeeker.insertId, keys[i], req.body[keys[i]]]
        );
      }
      conn.release();
      return res.redirect('/');
    }
    catch (err) {
      console.error('Query Error');
      conn.release();
      return next(err);
    }
  } catch (err) {
    console.error(err);
    conn.release();
    return next(err);
  }
});
  

// 의뢰자 가입
router.post('/join/client', isNotLoggedIn, async (req, res, next) => {
  const { 
    id, pw, name, phone_num
  } = req.body;
  try {
    const conn = await pool.getConnection(async conn => conn);
    try {
      const [exUser] = await conn.query(
        `SELECT id, password FROM admin WHERE id=?
            UNION
        SELECT id, password FROM freelancer WHERE id=?
            UNION
        SELECT id, password FROM client WHERE id=?`,
        [id, id, id]
      );
      if (exUser.length) {
        req.flash('joinError', '이미 등록된 사용자입니다');
        return res.redirect('/join');
      }
      const hash = await bcrypt.hash(pw, 13);
      await conn.query(
          `INSERT INTO client(id, password, name, phone_num)
          VALUES(?, ?, ?, ?)`, 
          [ id, hash, name, phone_num ]
      );
      conn.release();
      return res.redirect('/');
    }
    catch (err) {
      console.error('Query Error');
      conn.release();
      return next(err);
    }
  } 
  catch (err) {
    console.error(err);
    conn.release();
    return next(err);
  }
});

// 로그인
router.post('/login', isNotLoggedIn, (req, res, next) => {
  passport.authenticate('local', (authError, user, info) => {
    if (authError) {
      console.error(authError);
      return next(authError);
    }
    if (!user) {
      req.flash('loginError', info.message);
      return res.redirect('/');
    }
    return req.login(user, (loginError) => {
      if (loginError) {
        console.error(loginError);
        return next(loginError);
      }
      return res.redirect('/');
    });
  })
  (req, res, next);
});

// 로그아웃
router.get('/logout', isLoggedIn, (req, res) => {
  req.logout();
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;