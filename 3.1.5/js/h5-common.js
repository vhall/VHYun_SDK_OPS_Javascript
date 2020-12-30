$('input').blur(function () {
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
});
var RATIO_16_9 = 'ratio_16_9';
var RATIO_4_3 = 'ratio_4_3';
/** 根据宽度和比例 计算宽高 */

function calcSize(w) {
  var ratio = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : RATIO_16_9;
  var width = w;
  var height = 0;

  switch (ratio) {
    case RATIO_16_9:
      height = (w * 9) / 16;
      break;

    case RATIO_4_3:
      height = (w * 3) / 4;
      break;

    default:
      break;
  }

  return {
    width: width,
    height: height
  };
}

function save2Local(key, val) {
  /*
    {
      'appId_1':count1,
      'appId_2':count2
    }
  */
  var str = localStorage.getItem(key) || '{}';
  var obj = JSON.parse(str);

  if (!obj[val]) {
    obj[val] = 0;
  }

  obj[val] += 1;
  localStorage.setItem(key, JSON.stringify(obj));
}

function getLocal(key) {
  var str = localStorage.getItem(key) || '{}';
  var obj = JSON.parse(str);
  var arr = [];
  Object.entries(obj)
    .sort(function (a, b) {
      return a[1] - b[1];
    })
    .forEach(function (item) {
      return arr.push(item[0]);
    });
  return arr;
}

function clearLocal() {
  var name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

  if (name === '') {
    localStorage.clear();
  } else {
    localStorage.removeItem(name);
  }
} // 禁止双击放大

var lastTouchEnd = 0;
document.documentElement.addEventListener(
  'touchend',
  function (event) {
    var now = Date.now();

    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }

    lastTouchEnd = now;
  },
  false
);
document.addEventListener('gesturestart', function (event) {
  event.preventDefault();
});
