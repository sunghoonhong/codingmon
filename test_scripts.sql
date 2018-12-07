* -------------------------------------------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------------------------------------------- */
/* 회원 가입 */
/* 프리랜서 */
INSERT INTO freelancer(id, password,name,phone_num,age,major,career)
VALUES ('free1','123','프리원','01099999991',21,'cs',11);

INSERT INTO freelancer(id, password,name,phone_num,age,major,career)
VALUES ('free2','123','프리투','01099999992',22,'cs',12);

INSERT INTO freelancer(id, password,name,phone_num,age,major,career)
VALUES ('free3','123','프리쓰리','01099999993',23,'cs',13);

INSERT INTO freelancer(id, password,name,phone_num,age,major,career)
VALUES ('free4','123','프리포','01099999994',24,'cs',14);

INSERT INTO freelancer(id, password,name,phone_num,age,major,career)
VALUES ('free5','123','프리파이브','01099999995',25,'cs',15);

INSERT INTO freelancer(id, password,name,phone_num,age,major,career)
VALUES ('free6','123','프리식스','01099999996',26,'cs',16);


/* 의뢰자 */
INSERT INTO client(id, password,name,phone_num)
VALUES ('client1','456','의뢰자원','01011111111');

INSERT INTO client(id, password,name,phone_num)
VALUES ('client2','456','의뢰자투','01011111112');

INSERT INTO client(id, password,name,phone_num)
VALUES ('client3','456','의뢰자쓰리','01011111113');

INSERT INTO client(id, password,name,phone_num)
VALUES ('client4','456','의뢰자포','01011111114');

INSERT INTO client(id, password,name,phone_num)
VALUES ('client5','456','의뢰자파이브','01011111115');

INSERT INTO client(id, password,name,phone_num)
VALUES ('client6','456','의뢰자식스','01011111116');


/* -------------------------------------------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------------------------------------------- */
/* 이 파트는 f_rating_stat, c_rating_stat, accepted를 보면서 하면 도움 됨! */ 


/* (의뢰 완료신청한 것) 수락 및 상호간 평점 */ 
/* client 1이 doitplz1라는 의뢰(rqid=1)를 줌. job_seeker_id=1인 'free1'이 맡아서 완료신청한 뒤, client1이 free1의 평점을 메김.까지의 상태. 아직 free1는 client1의 평점을 메기지 않음 */
INSERT INTO request(cid, rname,reward, start_date, end_date, dev_start, dev_end, min_people, max_people, min_career)
VALUES ('client1','doitplz1',300,'2018-01-01 00:00:00','2018-02-01 23:59:59','2018-03-01 00:00:00','2018-04-01 23:59:59',1,3,1);

INSERT INTO report(status,rfile,rqid,job_seeker_id)
VALUES (1,'rfile1',1,1);

INSERT INTO accepted(arid,j_rating)
VALUES (1,0.1);

INSERT INTO owns_internal(fid, arid)
VALUES ('free1', 1);
/* free1이 client1의 평점을 3.1로 매김  */
UPDATE accepted SET c_rating =3.1 WHERE arid = 1;


/* client 1이 doitplz2라는 의뢰(rqid=2)를 줌. job_seeker_id=1인 'free1'이 맡아서 완료 신청한 뒤, client1이 free1의 평점을 메김.까지의 상태. 아직 free1는 client1의 평점을 메기지 않음 */
INSERT INTO request(cid, rname,reward, start_date, end_date, dev_start, dev_end, min_people, max_people, min_career)
VALUES ('client1','doitplz2',302,'2018-01-01 00:00:00','2018-02-01 23:59:59','2018-03-01 00:00:00','2018-04-01 23:59:59',1,3,1);

INSERT INTO report(status,rfile,rqid,job_seeker_id)
VALUES (1,'rfile2',2,1);

INSERT INTO accepted(arid,j_rating)
VALUES (2,0.2);

INSERT INTO owns_internal(fid, arid)
VALUES ('free1', 2);
/* free1이 client1의 평점을 3.2로 매김  */
UPDATE accepted SET c_rating =3.2 WHERE arid = 2;

/* client2 가 doitplz3 라는 의뢰(rqid = 3)를 줌. job_seeker_id=2인 'free2'가 맡아서 완료 신청한 뒤, client2가 free2의 평점을 메김.까지의 상태. 아직 free2는 client2의 평점을 메기지 않음 */
INSERT INTO request(cid, rname,reward, start_date, end_date, dev_start, dev_end, min_people, max_people, min_career)
VALUES ('client2','doitplz3',303,'2018-01-01 00:00:00','2018-02-01 23:59:59','2018-03-01 00:00:00','2018-04-01 23:59:59',1,3,1);

INSERT INTO report(status,rfile,rqid,job_seeker_id)
VALUES (1,'rfile3',3,2);
		
INSERT INTO accepted(arid,j_rating)
VALUES (3,0.3);

INSERT INTO owns_internal(fid, arid)
VALUES ('free2', 3);
/* free2가 client2의 평점을 3.3로 매김  */
UPDATE accepted SET c_rating =3.3 WHERE arid = 3;


/* client3 가 doitplz4 라는 의뢰(rqid = 4)를 줌. job_seeker_id=3인 'free3'가 맡아서 완료 신청한 뒤, client3가 free3의 평점을 메김.까지의 상태. 아직 free3는 client3의 평점을 메기지 않음 */
INSERT INTO request(cid, rname,reward, start_date, end_date, dev_start, dev_end, min_people, max_people, min_career)
VALUES ('client3','doitplz4',304,'2018-01-01 00:00:00','2018-02-01 23:59:59','2018-03-01 00:00:00','2018-04-01 23:59:59',1,3,1);

INSERT INTO report(status,rfile,rqid,job_seeker_id)
VALUES (1,'rfile4',4,3);
		
INSERT INTO accepted(arid,j_rating)
VALUES (4,0.4);

INSERT INTO owns_internal(fid, arid)
VALUES ('free3', 4);
/* free3가 client3의 평점을 3.4로 매김  */
UPDATE accepted SET c_rating =3.4 WHERE arid = 4;



/* client3 가 doitplz5 라는 의뢰(rqid = 5)를 줌. job_seeker_id=3인 'free3'가 맡아서 완료 신청한 뒤, client3가 free3의 평점을 메김.까지의 상태. 아직 free3는 client3의 평점을 메기지 않음 */
INSERT INTO request(cid, rname,reward, start_date, end_date, dev_start, dev_end, min_people, max_people, min_career)
VALUES ('client3','doitplz5',305,'2018-01-01 00:00:00','2018-02-01 23:59:59','2018-03-01 00:00:00','2018-04-01 23:59:59',1,3,1);

INSERT INTO report(status,rfile,rqid,job_seeker_id)
VALUES (1,'rfile5',5,3);
		
INSERT INTO accepted(arid,j_rating)
VALUES (5,0.5);

INSERT INTO owns_internal(fid, arid)
VALUES ('free3', 5);

/* free3가 client3의 평점을 3.5로 매김  */
UPDATE accepted SET c_rating =3.5 WHERE arid = 5;




/* client4 가 doitplz6 라는 의뢰(rqid = 6)를 줌. job_seeker_id=3인 'free3'가 맡아서 완료 신청한 뒤, client4가 free3의 평점을 메김(1.5).까지의 상태. 아직 free3는 client4의 평점을 메기지 않음 */
INSERT INTO request(cid, rname,reward, start_date, end_date, dev_start, dev_end, min_people, max_people, min_career)
VALUES ('client4','doitplz6',306,'2018-01-01 00:00:00','2018-02-01 23:59:59','2018-03-01 00:00:00','2018-04-01 23:59:59',1,3,1);

INSERT INTO report(status,rfile,rqid,job_seeker_id)
VALUES (1,'rfile6',6,3);
		
INSERT INTO accepted(arid,j_rating)
VALUES (6,0.6);

INSERT INTO owns_internal(fid, arid)
VALUES ('free3', 6);

/* free3가 client4의 평점을 3.6로 매김  */
UPDATE accepted SET c_rating =3.6 WHERE arid = 6;




/* client5 가 doitplz7 라는 의뢰(rqid = 7)를 줌. job_seeker_id=6인 'free6'가 맡아서 완료 신청한 뒤, client5가 free6의 평점을 메김.까지의 상태. 아직 free6는 client5의 평점을 메기지 않음 */
INSERT INTO request(cid, rname,reward, start_date, end_date, dev_start, dev_end, min_people, max_people, min_career)
VALUES ('client5','doitplz7',307,'2018-01-01 00:00:00','2018-02-01 23:59:59','2018-03-01 00:00:00','2018-04-01 23:59:59',1,3,1);

INSERT INTO report(status,rfile,rqid,job_seeker_id)
VALUES (1,'rfile7',7,6);
		
INSERT INTO accepted(arid,j_rating)
VALUES (7,0.7);

INSERT INTO owns_internal(fid, arid)
VALUES ('free6', 7);

/* free6가 client5의 평점을 3.7로 매김  */
UPDATE accepted SET c_rating =3.7 WHERE arid = 7;




















/* client6 가 doitplz8 라는 의뢰(rqid = 8)를 줌. job_seeker_id=6인 'free6'가 맡아서 완료 신청한 뒤, client6가 free6의 평점을 메김.까지의 상태. 아직 free6는 client5의 평점을 메기지 않음 */
INSERT INTO request(cid, rname,reward, start_date, end_date, dev_start, dev_end, min_people, max_people, min_career)
VALUES ('client6','doitplz8',308,'2018-01-01 00:00:00','2018-02-01 23:59:59','2018-03-01 00:00:00','2018-04-01 23:59:59',1,3,1);

INSERT INTO report(status,rfile,rqid,job_seeker_id)
VALUES (1,'rfile8',8,6);
		
INSERT INTO accepted(arid,j_rating)
VALUES (8,0.8);

INSERT INTO owns_internal(fid, arid)
VALUES ('free6', 8);

/* free6가 client6의 평점을 3.8로 매김  */
UPDATE accepted SET c_rating =3.8 WHERE arid = 8;

/* ******** 여기까지는 FREELANCER와 CLIENT만 관여********* */




/* ************* 관리자가 UPDATE 나 DELETE를 할 경우*************** */
/* ACCEPTED에서 ARID = 8인 값의 c_rating과 j_rating을 수정 */
UPDATE accepted SET c_rating =1.0, j_rating=1.0  WHERE arid = 8;

/* ACCEPTED에서 ARID = 8인 값을 삭제 */
DELETE FROM accepted WHERE arid = 8;

/* 이거는 f_rating_stat랑 owns_internal를 보면서 하면 도움 됨! */ 
/* owns_internal 에서 pid = 7인 값을 삭제 */
DELETE FROM owns_internal WHERE pid = 7;