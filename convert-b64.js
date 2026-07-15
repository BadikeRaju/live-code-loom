const arr = new Uint8Array([1, 2, 3]);
const toBase64 = (arr) => btoa(Array.from(arr).map(b => String.fromCharCode(b)).join(""));
const fromBase64 = (str) => new Uint8Array(atob(str).split("").map(c => c.charCodeAt(0)));
console.log(toBase64(arr));
console.log(fromBase64(toBase64(arr)));
