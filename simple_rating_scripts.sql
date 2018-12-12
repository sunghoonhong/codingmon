/* simple_rating_scripts for checking rating trigger works well */
/* 프리랜서 2명, client 2명, request 3개 - 각 1개의 report, accepted, owns_internal */
/* free1 request 1 client1 , free1 request2 client 1, free2 request3 client2  */
/* freelancer 둘*/
insert into job_seeker values();
INSERT INTO freelancer(id, password,name,phone_num,age,major,career, job_seeker_id)
VALUES ('free1','123','프리원','01099999991',21,'cs',11, (select * from job_seeker order by job_seeker_id desc limit 1) );

insert into job_seeker values();
INSERT INTO freelancer(id, password,name,phone_num,age,major,career, job_seeker_id)
VALUES ('free2','123','프리투','01099999992',22,'cs',12, (select * from job_seeker order by job_seeker_id desc limit 1));

/* client 둘 */
INSERT INTO client(id, password,name,phone_num)
VALUES ('client1','456','의뢰자원','01011111111');

INSERT INTO client(id, password,name,phone_num)
VALUES ('client2','456','의뢰자투','01011111112');

/* 의뢰 3가지 넣기 */
INSERT INTO request(cid, rname,reward, start_date, end_date, min_people, max_people, min_career)
VALUES ('client1','doitplz1',301,'2018-01-01 00:00:00','2018-02-01 23:59:59',1,3,11);

INSERT INTO request(cid, rname,reward, start_date, end_date, min_people, max_people, min_career)
VALUES ('client1','doitplz2',302,'2018-01-01 00:00:00','2018-02-01 23:59:59', 1,3,11);

INSERT INTO request(cid, rname,reward, start_date, end_date, min_people, max_people, min_career)
VALUES ('client2','doitplz3',303,'2018-01-01 00:00:00','2018-02-01 23:59:59', 1,4,13);


/* rqid = 1 에 해당하는 리퀘스트...리포트...accepted...owns_internal */
INSERT INTO report(status,rfile,rqid,job_seeker_id)
VALUES (1,'rfile1',1,1);

INSERT INTO accepted(arid,j_rating) VALUES (1,0.1);

INSERT INTO owns_internal(fid, arid) VALUES ('free1', 1);


/* rqid = 2 에 해당하는 리퀘스트...리포트...accepted...owns_internal */
INSERT INTO report(status,rfile,rqid,job_seeker_id)
VALUES (1,'rfile2',2,1);

INSERT INTO accepted(arid,j_rating) VALUES (2,0.2);

INSERT INTO owns_internal(fid, arid) VALUES ('free1', 2);


/* rqid = 3 에 해당하는 리퀘스트...리포트...accepted...owns_internal */
INSERT INTO report(status,rfile,rqid,job_seeker_id)
VALUES (1,'rfile3',3,2);
		
INSERT INTO accepted(arid,j_rating)
VALUES (3,0.3);

INSERT INTO owns_internal(fid, arid)
VALUES ('free2', 3);


/*useful after deleting rqid = 3 and remake that.*/
/*
INSERT INTO request(cid, rname,reward, start_date, end_date, min_people, max_people, min_career)
VALUES ('client2','doitplz3',303,'2018-01-01 00:00:00','2018-02-01 23:59:59', 1,4,13);

INSERT INTO report(status,rfile,rqid,job_seeker_id)
VALUES (1,'rfile4',4,2);
		
INSERT INTO accepted(arid,j_rating)
VALUES (4,0.4);

INSERT INTO owns_internal(fid, arid)
VALUES ('free2', 4);
*/

/* 프리랜서가 의뢰자의 평점을 지정 */
UPDATE accepted SET c_rating =3.1 WHERE arid = 1;
UPDATE accepted SET c_rating =3.2 WHERE arid = 2;
UPDATE accepted SET c_rating =3.3 WHERE arid = 3;



