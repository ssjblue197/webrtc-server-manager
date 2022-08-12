export const $ = (querry) => document.querySelector(querry);
export const $$ = (querry) => document.querySelectorAll(querry);
export const convertUrlWs = (value) => {
    if (value.includes('https')) return value.replace('https', 'wss');
    if (value.includes('http')) return value.replace('http', 'ws');
};
export const Utf8ArrayToStr = (array) => {
    var out, i, len, c;
    var char2, char3;
    out = "";
    len = array.length;
    i = 0;
    while (i < len) {
        c = array[i++];
        switch (c >> 4) {
        case 7:
            out += String.fromCharCode(c);
            break;
        case 13:
            char2 = array[i++];
            out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
            break;
        case 14:
            char2 = array[i++];
            char3 = array[i++];
            out += String.fromCharCode(((c & 0x0F) << 12) |
            ((char2 & 0x3F) << 6) |
            ((char3 & 0x3F) << 0));
            break;
        }
    }
    return out;
}
