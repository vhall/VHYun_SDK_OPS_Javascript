/** 判断系统平台， 是PC 还是移动端 */
function judgePlatform() {
  var match = navigator.userAgent.match(
    /(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i
  );

  if (match) {
    return 'mobile';
  } else {
    return 'pc';
  }
}
function isIE() {
  if (window.navigator.userAgent.indexOf('MSIE') >= 1) {
    return true;
  } else {
    return false;
  }
}
