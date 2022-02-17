import queryString from 'query-string';

const {
    mode,
    examId,
    problemId,
    problemSetId,
    problemSetProblemId
} = queryString.parse(location.search);

const config = {
    PTA_URL: window.PTA_URL || (process.env.NODE_ENV === 'production' ? 'https://pintia.cn' : 'https://dev.pintia.cn'),
    mode: mode || 'view',
    examId,
    problemId,
    problemSetId,
    problemSetProblemId
};

export default config;
