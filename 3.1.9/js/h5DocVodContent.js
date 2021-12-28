var isRefresh = window.performance.navigation.type === 1;
var param = Qs.parse(location.search, {
  ignoreQueryPrefix: true
});
var appId = param.appId;
var channelId = param.channelId;
var roomId = param.roomId;
var accountId = param.accountId;
var token = param.token;
var recordId = param.recordId;
var sdk;
var canOperating = false;
var docList = {};
var switchStatus = 1;
var player = null;
sdk = VHDocSDK.createInstance(
  {
    appId: appId,
    channelId: channelId,
    role: VHDocSDK.RoleType.SPECTATOR,
    isVod: true,
    client: VHDocSDK.Client.H5_WEB,
    accountId: accountId,
    token: token
  },
  docSuccess,
  function (err) {}
);
/**
 * 初始化文档成功函数
 */
function docSuccess() {
  $('#tabs').find('li').removeClass('active').eq(0).addClass('active');
  $('#docs').removeClass('hidden');
  $('#catalog').addClass('hidden');
  bindDocEvent();
  initPlayer();
  $('#loading').hide();
}
/**
 * 绑定文档监听
 */
function bindDocEvent() {
  /**
   * 控制 tab 显示隐藏
   */
  $('#showDocList').click(function () {
    $(this).addClass('active').siblings().removeClass('active');
    if (!switchStatus) return;
    $('#docs').removeClass('hidden');
    $('#catalog').addClass('hidden');
  });
  $('#showCatalog').click(function () {
    $(this).addClass('active').siblings().removeClass('active');
    if (!switchStatus) return;
    $('#catalog').removeClass('hidden');
    $('#docs').addClass('hidden');
  });

  /** 文档数据加载完成 */
  sdk.on(VHDocSDK.Event.VOD_CUEPOINT_LOAD_COMPLETE, function (e) {
    console.log(e.chapters);
    /** 拿到所有容器消息 */
    var list = sdk.getVodAllCids();
    loadRemoteBoard(list);

    var txt = '<ul class="list">';
    $.each(e.chapters, function (index, item) {
      txt += '<li class="title changeTime" time="' + item.createTime + '"><div>' + item.title + '</div><div>' + calculagraph(item.createTime) + '</div></li>';
      $.each(item.sub, function (key, value) {
        txt +=
          '<li class="sub changeTime" time="' +
          value.createTime +
          '"><div><img src="./images/icon-charles.png" alt="" srcset="" />' +
          value.stepIndex +
          value.title +
          '</div><div>' +
          calculagraph(value.createTime) +
          '</div></li>';
      });
    });
    txt += '</ul>';
    $('#catalog').append(txt);
    changePlayTime();
    console.log(e.chapters);
  });

  /** 所有文档加载完成事件 */
  sdk.on(VHDocSDK.Event.ALL_COMPLETE, function () {
    console.log('所有文档加载完成');
    showToast('所有文档加载完成');
    canOperating = true;
  });
  sdk.on(VHDocSDK.Event.VOD_TIME_UPDATE, function (e) {
    if (!e.watchOpen) {
      // switch off
      $('#docs>div').addClass('hidden');
      $('#defaultDoc').show();
      return;
    }
    $('#defaultDoc').hide();
    if (e.activeId) {
      sdk.selectContainer({
        id: e.activeId
      });
      $('#' + e.activeId)
        .removeClass('hidden')
        .siblings()
        .addClass('hidden');
    }
  });
}

/**
 * 初始化播放器sdk
 */
function initPlayer() {
  VhallPlayer.createInstance(
    {
      appId: appId,
      // 应用ID   必填
      accountId: accountId,
      // 第三方用户ID     必填
      token: token,
      // access_token  必填
      type: 'vod',
      // live 直播  vod 点播  必填
      videoNode: 'player',
      // 播放器的容器
      vodOption: {
        recordId: recordId
      },
      autoplay: false
    },
    function (event) {
      console.log('播放器初始化成功');
      player = event.vhallplayer;
      player.openUI(true);
      player.openControls(false);
    },
    function (e) {
      console.error(e);
    }
  );
}
/** 加载远程文档 */
function loadRemoteBoard(list) {
  if (!list.length) return;
  $.each(list, function (index, item) {
    var cid = item.cid;
    var type = item.type;
    var backgroundColor = item.backgroundColor || '#ccc';
    $('#docs')
      .prepend('<div class="doc-single" id="' + cid + '"></div>')
      .children('.doc-single')
      .addClass('hidden');
    var param = {
      // div 容器 必须
      elId: cid,
      // div 宽度，像素单位，数值型不带px 必须
      width: $('#' + cid).width(),
      // div 高度，像素单位，数值型不带px 必须
      height: ($('#' + cid).width() * 9) / 16,
      // 背景颜色， 支持RGB 与 RGBA， 如果全透明，舞台背景色与网页背景色相同，如 ‘#FF0000’或 ‘#FF000000’ 必须
      backgroundColor: backgroundColor,
      id: cid,
      noDispatch: true
    };
    switch (type) {
      case 'Document':
        sdk.createDocument(param);
        break;
      case 'Board':
        sdk.createBoard(param);
        break;
      default:
        break;
    }
  });
  sdk.loadVodIframe();
}

function showToast(txt) {
  $('#toast').show();
  $('#toastTxt').text(txt);
  var temp = setTimeout(function () {
    $('#toast').hide();
    temp = null;
  }, 2000);
}
function calculagraph(timing) {
  var hour = parseInt(timing / 3600);
  var minute = parseInt((timing % 3600) / 60);
  var second = parseInt((timing % 300) % 60);
  hour = hour >= 10 ? hours : '0' + hour;
  minute = minute >= 10 ? minute : '0' + minute;
  second = second >= 10 ? second : '0' + second;
  return hour + ':' + minute + ':' + second;
}
function changePlayTime() {
  $('.changeTime').click(function () {
    var time = Number($(this).attr('time'));
    player.setCurrentTime(time);
  });
}
