const local = require('./localStrategy');
const mysql = require('mysql2/promise');
const dbconfig = require('../config/database');
const pool = mysql.createPool(dbconfig);

module.exports = (passport) => {
    // 로그인에 성공하면 세션에 ID와 사용자 종류를 저장
    passport.serializeUser(async (user, done) => {
        const id = user.id;
        try {
            const conn = await pool.getConnection(async conn => conn);
            try {
                const [exAdmin] = await conn.query(
                    'SELECT id FROM admin WHERE id=?', id
                );
                const [exFree] = await conn.query(
                    'SELECT id, job_seeker_id FROM freelancer WHERE id=?', id
                );
                const [exClient] = await conn.query(
                    'SELECT id FROM client WHERE id=?', id
                );
                var user;
                if(exAdmin.length) {
                    user.type = 'admin';
                }
                else if(exFree.length) {
                    user.type = 'freelancer';
                }
                else if(exClient.length) {
                    user.type = 'client';
                }                
                conn.release();
                done(null, user);
            }
            catch (err) {
                conn.release();
                console.error('Query Error');
                done(err);
            }
        }
        catch (err) {
            conn.release();
            done(err);
        }
    });
    
    // 이후 세션에 저장된 정보를 통해 해당 유저의 모든 정보를 가져온다
    passport.deserializeUser(async (user, done) => {
        try {
            const conn = await pool.getConnection(async conn => conn);
            try {
                const type = user.type;
                const [[exUser]] = await conn.query(
                    `SELECT * FROM ${type} WHERE id=?`, user.id
                );
                user = exUser;
                user.type = type;
                done(null, user);
                conn.release();
            }
            catch (err) {
                conn.release();
                console.error('Query Error');
                done(err);
            }
        }
        catch (err) {
            conn.release();
            done(err);
        }
    });

    local(passport);
};