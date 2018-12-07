const fs = require('fs-extra');

// 프리랜서의 외부 포트폴리오 디렉토리가 없으면 만들어준다.
exports.external_dir = (req, res, next) => {
    const dirname = `/public/external/${req.params.fid}`;
    try {
        fs.ensureDirSync('./' + dirname);
        next();
    }
    catch(err) {
        next(err);
    }
};

exports.document_dir = (req, res, next) => {
    const dirname =`/public/document/${req.params.rqid}`;
    try {
        false.ensuerDirSync('./' + dirname);
        next();
    }
    catch (err) {
        next(err);
    }
}