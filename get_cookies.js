var cookie = start();
var ask = confirm('Cookie: ' + cookie + '\n\nClick confirm to copy Cookie.'); if (ask == true) { copy(cookie); msg = cookie } else { msg = 'Cancel' }
function start() {
    return "ltoken=" + getCookie("ltoken") + ";ltuid=" + getCookie("ltuid") + ";";
    function getCookie(name) {
        const value = ";" + document.cookie;
        const parts = value.split("; " + name + "=");
        if (parts.length === 2) return parts.pop().split(';').shift();
    }
}