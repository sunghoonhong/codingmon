const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const dbconfig = require('../config/database');

const pool = mysql.createPool(dbconfig);

// 실제 로그인 처리 부분
module.exports = (passport) => {
    passport.use(new LocalStrategy({
        usernameField: 'id',
        passwordField: 'pw',
    }, async (id, pw, done) => {
        try {
            const conn = await pool.getConnection(async conn => conn);
            try {
                const [exAdmin] = await conn.query(
                    'SELECT id, password FROM admin WHERE id=?', id
                );
                // 관리자는 비밀번호가 따로 암호화 되어있지 않다
                if(exAdmin.length) {
                    conn.release();
                    const result = pw == exAdmin[0].password;
                    if (result) {
                        done(null, exAdmin[0]);
                    }
                    else {
                        done(null, false, {
                            message: '비밀번호가 틀렸습니다'
                        });
                    }
                }
                // 일반 사용자들은 비밀번호가 암호화 되어있다
                else {
                    const [exUser] = await conn.query(
                        `SELECT id, password FROM freelancer WHERE id=?
                            UNION
                        SELECT id, password FROM client WHERE id=?`
                        [id, id]
                    );
                    conn.release();
                    if (exUser.length) {
                        const result = await bcrypt.compare(pw, exUser[0].password);
                        if (result) {
                            done(null, exUser[0]);
                        }
                        else {
                            done(null, false, {
                                message: '비밀번호가 틀렸습니다'
                            });
                        }
                    }
                    else {
                        done(null, false, {
                            message: '등록되지 않은 사용자입니다'
                        });
                    }
                }
            }
            catch (err) {
                console.error('Query Error');
                conn.release();
                done(err);
            }
        }
        catch (err) {
            console.error(err);
            conn.release();
            done(err);
        }
    }));
};