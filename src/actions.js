import config from './config';

const ajax = method => (url, body = null) => fetch(
    url,
    {
        credentials: 'include',
        method,
        body: method === 'GET' ? null : (
            body instanceof FormData ? body : JSON.stringify(body)
        ),
        headers: body instanceof FormData ? {
            accept: 'application/json;charset=UTF-8'
        } : {
            'content-type': 'application/json',
            'accept': 'application/json;charset=UTF-8'
        }
    }
).then(res => {
    if (res.status >= 400) {
        return res.json()
            .then(({message}) => new Error(message))
            .catch(() => null)
            .then(error => {
                if (error) {
                    throw error;
                }
                throw new Error(`错误${res.status}`);
            });
    }
    return res.json();
});

const http = {
    get: ajax('GET'),
    put: ajax('PUT'),
    post: ajax('POST')
};

export const uploadFile = ({blob}) => {
    const form = new FormData();
    form.append('file', blob, 'project.zip');
    return http.post(`${config.PTA_URL}/api/files`, form);
};

export const getProblem = ({problemId}) => http.get(`${config.PTA_URL}/api/problems/${problemId}`);

export const updateProblem = ({problemId, problem}) => http.put(
    `${config.PTA_URL}/api/problems/${problemId}`,
    {problem},
);

export const getProblemScratchFileDownloadLink = ({problemId}) => http.get(
    `${config.PTA_URL}/api/problems/${problemId}/sb3`,
);
