import queryString from 'query-string';

const {
    mode,
    problemId,
    problemSetProblemId
} = queryString.parse(location.search);

const config = {
    PTA_URL: process.env.NODE_ENV === 'production' ? 'https://pintia.cn' : 'https://dev.pintia.cn',
    mode: mode || 'view',
    problemId,
    problemSetProblemId
};

export default config;
