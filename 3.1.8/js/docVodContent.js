// var form = layui.form;
var loading = layer.load(0, {
  shade: [0.1, '#fff']
});
// var isRefresh = window.performance.navigation.type === 1;
var param = Qs.parse(location.search, {
  ignoreQueryPrefix: true
});
var appId = param.appId;
var channelId = param.channelId;
// var roomId = param.roomId;
var accountId = param.accountId;
var token = param.token;
// var docId = param.docId;
// var iscontinue = param.iscontinue;
// var liveType = param.liveType;
var recordId = param.recordId;
var sdk;
// var canOperating = false;
var player = null;
// var docList = {};
sdk = VHDocSDK.createInstance(
  {
    appId: appId,
    channelId: channelId,
    role: VHDocSDK.RoleType.SPECTATOR,
    isVod: true,
    client: VHDocSDK.Client.PC_WEB,
    accountId: accountId,
    token: token
  },
  docSuccess,
  function (err) {
    console.error(err);
  }
);
/**
 * 初始化文档成功函数
 */
function docSuccess() {
  bindDocEvent();
  initPlayer();
}
/**
 * 绑定文档监听
 */
function bindDocEvent() {
  /** 文档数据加载完成 */
  sdk.on(VHDocSDK.Event.VOD_CUEPOINT_LOAD_COMPLETE, function (e) {
    /** 拿到所有容器消息 */
    var list = sdk.getVodAllCids();
    // if (list.length) {
    //   $('#defaultDoc').hide();
    // } else {
    //   $('#defaultDoc').show();
    // }
    loadRemoteBoard(list);
    /** 填充目录 */
    var txt = '<div class="list">';
    $.each(e.chapters, function (index, item) {
      txt +=
        '<ul class="title-list"><li class="title changeTime" time="' +
        item.createTime +
        '"><span>' +
        item.slideIndex +
        '<i>' +
        item.title +
        '</i></span><span>' +
        calculagraph(item.createTime) +
        '</span></li>';
      $.each(item.sub, function (key, value) {
        txt +=
          '<li class="changeTime" time="' +
          value.createTime +
          '"><span>' +
          item.slideIndex +
          '-' +
          value.stepIndex +
          '<img src="./images/icon-charles.png" alt="" srcset="" />' +
          value.title +
          '</span><span>' +
          calculagraph(value.createTime) +
          '</span></li>';
      });
      txt += '</ul>';
    });
    txt += '</div>';
    $('#catalog').append(txt);
    changePlayTime();
    console.log(e.chapters);
  });

  /** 所有文档加载完成事件 */
  sdk.on(VHDocSDK.Event.ALL_COMPLETE, function () {
    console.log('所有文档加载完成');
    layer.msg('所有文档加载完成');
    // canOperating = true;
    layer.close(loading);
  });
  sdk.on(VHDocSDK.Event.ERROR, function (e) {
    console.error(e);
  });
  sdk.on(VHDocSDK.Event.VOD_TIME_UPDATE, function (e) {
    console.log(new Date());
    if (!e.watchOpen) {
      $('#doc-title').find('li').removeClass('active');
      // switch off
      $('#docs>div').addClass('hidden');
      $('#defaultDoc').show();
      return;
    }
    if (e.activeId) {
      sdk.selectContainer({
        id: e.activeId
      });
      $('#doc-title')
        .find('li[doc-container="' + e.activeId + '"]')
        .addClass('active')
        .siblings()
        .removeClass('active');
      $('#' + e.activeId)
        .removeClass('hidden')
        .siblings()
        .addClass('hidden');
    }
  });

  // sdk.on(VHDocSDK.Event.DELETE_CONTAINER, function (e) {
  //   console.warn('收到删除容器事件');
  //   var elId = e.id;
  //   sdk.destroyContainer({
  //     id: elId
  //   });
  //   $('#doc-title')
  //     .find('li[doc-container="' + elId + '"]')
  //     .remove();
  //   $('#' + e.id).remove();
  //   if (!$('#doc-title>li').length) {
  //     $('#defaultDoc').show();
  //   }
  // });
  // sdk.on(VHDocSDK.Event.CREATE_CONTAINER, function (e) {
  //   console.warn('收到创建容器事件', e);
  //   var elId = e.id;
  //   var txt = null;
  //   e.type == 'board' ? (txt = '白板') : '文档';
  //   $('#doc-title')
  //     .prepend('<li class="container" doc-container="' + elId + '">' + txt + '</li>')
  //     .find('li')
  //     .removeClass('active')
  //     .eq(0)
  //     .addClass('active');
  //   $('#docs')
  //     .prepend('<div class="doc-single" id="' + elId + '"></div>')
  //     .children('.doc-single')
  //     .css('visiblity', 'hidden')
  //     .eq(0)
  //     .css('visibility', 'visible');

  //   if (e.type === 'board') {
  //     sdk.createBoard({
  //       elId: elId,
  //       // div 容器 必须
  //       width: e.width,
  //       // div 宽度，像素单位，数值型不带px 必须
  //       height: e.height,
  //       // div 高度，像素单位，数值型不带px 必须
  //       backgroundColor: e.backgroundColor,
  //       // 背景颜色， 支持RGB 与 RGBA， 如果全透明，舞台背景色与网页背景色相同，如 ‘#FF0000’或 ‘#FF000000’ 必须
  //       id: e.id
  //     });
  //   } else {
  //     sdk.createDocument({
  //       elId: elId,
  //       width: e.width,
  //       height: e.height,
  //       id: elId
  //     });
  //   }
  //   $('#defaultDoc').hide();
  // });
  // sdk.on(VHDocSDK.Event.SELECT_CONTAINER, function (e) {
  //   console.warn('收到选择容器事件');
  //   // setTimeout(function () {
  //   $('#doc-title')
  //     .find('li[doc-container="' + e.id + '"]')
  //     .addClass('active')
  //     .siblings()
  //     .removeClass('active');
  //   $('#docs')
  //     .find('#' + e.id)
  //     .css('visibility', 'visible')
  //     .siblings()
  //     .css('visibility', 'hidden');
  //   /** 切换目录 */
  //   $('#catalog').children('.list').hide();
  //   $('#' + e.id + '-chapters').show();
  //   sdk.selectContainer({
  //     id: e.id
  //   });
  //   // }, 1000);
  // });
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
  $.each(list, function (index, item) {
    var cid = item.cid;
    var type = item.type;
    var backgroundColor = item.backgroundColor || '#ccc';
    $('#doc-title').prepend('<li class="container" doc-container="' + cid + '">' + cid + '</li>');
    $('#docs').prepend('<div class="doc-single hidden" id="' + cid + '"></div>');
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
function calculagraph(timing) {
  var hour = parseInt(timing / 3600);
  var minute = parseInt((timing % 3600) / 60);
  var second = parseInt((timing % 300) % 60);
  hour = hour >= 10 ? hour : '0' + hour;
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
