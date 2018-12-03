const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const dbconfig = require('../config/database');
const router = express.Router();

const pool = mysql.createPool(dbconfig);

router.post('/join/freelancer', isNotLoggedIn, async (req, res, next) => {
  const { 
    id, pw, name, phone_num, age, major, career, lang_name, level
  } = req.body;
  try {
    const conn = await pool.getConnection(async conn => conn);
    try {
      const [exUser] = await conn.query(
        'SELECT id, password FROM administrator WHERE id=?  \
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
      const [jobSeeker] = await conn.query(
        'INSERT INTO job_seeker(job_seeker_id) VALUES(NULL)'
      );
      console.log(jobSeeker);
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

      await conn.query(
        'INSERT INTO knows( \
          job_seeker_id, lang_name, level) \
        VALUES(?, ?, ?)',
        [jobSeeker.insertId, lang_name, level]
      );

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
        'SELECT id, password FROM administrator WHERE id=?  \
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