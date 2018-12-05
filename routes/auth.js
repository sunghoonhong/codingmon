const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const dbconfig = require('../config/database');
const router = express.Router();

const pool = mysql.createPool(dbconfig);

router.post('/join/freelancer', isNotLoggedIn, async (req, res, next) => {
  const keys = Object.keys(req.body);
  var langFlag = false;
  var langIndex = 7;  // career 까지만 body로 들어오고 7부터 언어시작
  for(var i=langIndex; i < keys.length; i++) {
    if(req.body[keys[i]] != 0) {
      langFlag = true;
      break;
    }
  }
  if(!langFlag) {
    conn.release();
    req.flash('joinError', '적어도 언어 하나는 하세요');
    return res.redirect('/join');
  }
  const { 
    id, pw, name, phone_num, age, major, career
  } = req.body;
  // console.log(req.body);
  try {
    const conn = await pool.getConnection(async conn => conn);
    try {
      const [exUser] = await conn.query(
        'SELECT id, password FROM admin WHERE id=?  \
            UNION   \
        SELECT id, password FROM freelancer WHERE id=? \
            UNION   \
        SELECT id, password FROM client WHERE id=?',
        [id, id, id]
      );
      if (exUser.length) {
        conn.release();
        req.flash('joinError', 'Already registered');
        return res.redirect('/join');
      }
      const [jobSeeker] = await conn.query(
        'INSERT INTO job_seeker(job_seeker_id) VALUES(NULL)'
      );
      // console.log(jobSeeker);
      // const jobSeeker = await conn.query(
      //   'SELECT * FROM job_seeker ORDER BY job_seeker_id DESC LIMIT 1'
      // );
      const hash = await bcrypt.hash(pw, 13);
      await conn.query(
        'INSERT INTO freelancer( \
        id, password, name, phone_num, \
        age, major, career, \
        job_seeker_id) \
        VALUES(?, ?, ?, ?, ?, ?, ?, \
        ?)', 
        [ id, hash, name, phone_num,
        age, major, career, jobSeeker.insertId ]
      );
        
      const keys = Object.keys(req.body);
      for(var i=langIndex; i < keys.length; i++) {
        await conn.query(
          'INSERT INTO knows( \
            job_seeker_id, lang_name, level) \
          VALUES(?, ?, ?)',
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
  
router.post('/join/client', isNotLoggedIn, async (req, res, next) => {
  const { 
    id, pw, name, phone_num
  } = req.body;
  try {
    const conn = await pool.getConnection(async conn => conn);
    try {
      const [exUser] = await conn.query(
        'SELECT id, password FROM admin WHERE id=?  \
            UNION   \
        SELECT id, password FROM freelancer WHERE id=? \
            UNION   \
        SELECT id, password FROM client WHERE id=?',
        [id, id, id]
      );
      if (exUser.length) {
        req.flash('joinError', 'Already registered');
        return res.redirect('/join');
      }
      const hash = await bcrypt.hash(pw, 13);
      await conn.query(
          'INSERT INTO client( \
            id, password, name, phone_num \
          ) \
          VALUES( \
            ?, ?, ?, ? \
          )', 
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
    return next(err);
  }
});

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
  (req, res, next); // 미들웨어 내의 미들웨어에는 (req, res, next)를 붙입니다.
});

router.get('/logout', isLoggedIn, (req, res) => {
  req.logout();
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;