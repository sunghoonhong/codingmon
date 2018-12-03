const local = require('./localStrategy');
const mysql = require('mysql2/promise');
const dbconfig = require('../config/database');
const pool = mysql.createPool(dbconfig);

module.exports = (passport) => {
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

    passport.deserializeUser(async (user, done) => {
        try {
            const conn = await pool.getConnection(async conn => conn);
            try {
                const type = user.type;
                const [exUser] = await conn.query(
                    'SELECT * FROM '+type+' WHERE id=?', user.id
                );
                user = exUser[0];
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