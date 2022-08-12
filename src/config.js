var APP_CONFIG = {
    /* ****** WEBSOCKET ******** */
    BASE_URL: 'https://democamera.hcdt.vn:3443',
    // BASE_URL: '/api',
    // BASE_URL: 'http://localhost:8008',
    BASIC_AUTH: {
        USERNAME: 'admin',
        PASSWORD: 'admin123'
    },
    STUN_SERVER: ['stun:stun.l.google.com:19302'],
    API_ENPOINT: {
        STREAMS: '/streams',
        ADD_STREAM: '/stream'
    }
};

export default APP_CONFIG;