var isRefresh = window.performance.navigation.type === 1;
var param = Qs.parse(location.search, {
  ignoreQueryPrefix: true
});
var appId = param.appId;
var channelId = param.channelId;
var roomId = param.roomId;
var accountId = param.accountId;
var token = param.token;
var sdk;
var canOperating = false;
var docList = {};
var switchStatus = 0;
sdk = VHDocSDK.createInstance(
  {
    appId: appId,
    channelId: channelId,
    role: VHDocSDK.RoleType.SPECTATOR,
    isVod: false,
    roomId: roomId,
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
  sdk.getContainerInfo().then(function (res) {
    var list = res.list;
    switchStatus = res.switch_status;
    if (switchStatus == 1) {
      $('#tabs').find('li').removeClass('active').eq(0).addClass('active');
      $('#docs').removeClass('hidden');
      $('#catalog').addClass('hidden');
      $('#defaultDoc').hide();
    } else {
      $('#defaultDoc').show();
      $('#docs').addClass('hidden');
      $('#catalog').addClass('hidden');
    }
    loadRemoteBoard(list);
  });

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
  $('#reset').click(function () {
    sdk.zoomReset();
  });
  $('#showDocList').click(function () {
    $(this).addClass('active').siblings().removeClass('active');
    console.log('switchStatus', switchStatus);
    if (!switchStatus) return;
    $('#docs').removeClass('hidden');
    $('#catalog').addClass('hidden');
  });
  $('#showCatalog').click(function () {
    $(this).addClass('active').siblings().removeClass('active');
    console.log('switchStatus', switchStatus);
    if (!switchStatus) return;
    $('#catalog').removeClass('hidden');
    $('#docs').addClass('hidden');
  });
  /** 所有文档加载完成事件 */
  sdk.on(VHDocSDK.Event.ALL_COMPLETE, function () {
    console.log('所有文档加载完成');
    showToast('所有文档加载完成');
    canOperating = true;
  });
  sdk.on(VHDocSDK.Event.ERROR, function (e) {
    console.error(e);
  });
  /** 翻页事件 */
  sdk.on(VHDocSDK.Event.PAGE_CHANGE, function (e) {
    console.warn('收到翻页消息', e);
    if (docList[e.id]) {
      docList[e.id].info = JSON.parse(JSON.stringify(e.info));
    } else {
      docList[e.id] = { info: JSON.parse(JSON.stringify(e.info)), chapters: null };
    }
    /** 判断有无章节，并请求章节信息 */
    if (!docList[e.id].chapters) {
      sdk.getChapters({ elId: e.id, docId: e.info.docId }).then(function (res) {
        console.log('收到章节信息', res);
        docList[e.id].chapters = res.chapters;
        $('#catalog').children('.list').hide();
        var txt = '<ul class="list" id="' + res.elId + '-chapters">';
        $.each(res.chapters, function (index, item) {
          txt += '<li class="title"><div>' + item.title + '</div></li>';
          $.each(item.sub, function (key, value) {
            txt += '<li class="sub"><div><img src="./images/icon-charles.png" alt="" srcset="" />' + value.stepIndex + value.title + '</div></li>';
          });
        });
        txt += '</ul>';
        $('#catalog').append(txt);
      });
    }
  });
  /** 文档播放完毕事件 */
  sdk.on(VHDocSDK.Event.PLAYBACKCOMPLETE, function (e) {
    console.warn('播放完毕');

    playComplete = true;
  });
  sdk.on(VHDocSDK.Event.SWITCH_CHANGE, function (e) {
    console.warn('收到开关消息', e);
    switch (e) {
      case 'on':
        switchStatus = 1;
        var id = $('#tabs').children('.active').attr('id');
        if (id == 'showDocList') {
          $('#docs').removeClass('hidden');
          $('#catalog').addClass('hidden');
        } else if (id == 'showCatalog') {
          $('#catalog').removeClass('hidden');
          $('#docs').addClass('hidden');
        }
        $('#defaultDoc').hide();
        break;
      case 'off':
        switchStatus = 0;
        var id = $('#tabs > li').find('.active').attr('id');
        $('#docs').addClass('hidden');
        $('#catalog').addClass('hidden');
        $('#defaultDoc').show();
        break;
      default:
        break;
    }
  });
  sdk.on(VHDocSDK.Event.RESET_CONTAINER, function (e) {
    $('#doc-title>li').remove();
    $('#docs>div').remove();
  });
  sdk.on(VHDocSDK.Event.DELETE_CONTAINER, function (e) {
    console.warn('收到删除容器事件');
    var elId = e.id;
    sdk.destroyContainer({
      id: elId
    });
    $('#doc-title')
      .find('li[doc-container="' + elId + '"]')
      .remove();
    $('#' + e.id).remove();
    if (!$('#docs>div').length) {
      $('#defaultDoc').show();
    }
  });
  sdk.on(VHDocSDK.Event.CREATE_CONTAINER, function (e) {
    console.warn('收到创建容器事件', e);
    var elId = e.id;
    $('#docs')
      .prepend('<div class="doc-single" id="' + elId + '"></div>')
      .children('.doc-single')
      .addClass('hidden')
      .eq(0)
      .removeClass('hidden');
    var width = $('#' + elId).width();
    var height = (width * 9) / 16; // 创建各种面板

    if (e.type === 'board') {
      sdk.createBoard({
        elId: elId,
        // div 容器 必须
        width: width,
        // div 宽度，像素单位，数值型不带px 必须
        height: height,
        // div 高度，像素单位，数值型不带px 必须
        backgroundColor: e.backgroundColor,
        // 背景颜色， 支持RGB 与 RGBA， 如果全透明，舞台背景色与网页背景色相同，如 ‘#FF0000’或 ‘#FF000000’ 必须
        id: elId,
        noDispatch: true
      });
    } else {
      sdk.createDocument({
        elId: elId,
        width: width,
        height: height,
        id: elId,
        noDispatch: true
      });
    }
    $('#defaultDoc').hide();
  });
  sdk.on(VHDocSDK.Event.SELECT_CONTAINER, function (e) {
    console.warn('收到选择容器事件', e);
    setTimeout(function () {
      $('#docs')
        .find('#' + e.id)
        .removeClass('hidden')
        .siblings('.doc-single')
        .addClass('hidden');
      /** 切换目录 */
      $('#catalog').children('.list').hide();
      $('#' + e.id + '-chapters').show();
      sdk.selectContainer({
        id: e.id
      });
      sdk.zoomIn();
    }, 100);
  });
}

/**
 * 初始化播放器sdk
 */
function initPlayer() {
  VhallPlayer.createInstance(
    {
      appId: appId,
      // 应用ID，必填
      accountId: accountId,
      // 第三方用户ID，必填
      token: token,
      // access_token，必填
      type: 'live',
      // live 直播  vod 点播  必填
      videoNode: 'player',
      // 播放器的容器， div的id 必填
      autoplay: false,
      liveOption: {
        type: 'flv',
        // 直播播放类型  hls | flv
        roomId: roomId // 直播房间ID
      }
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
  var selectedCid = null;
  $.each(list, function (index, item) {
    var cid = item.cid;
    var active = item.active;
    var doc_type = item.doc_type;
    var is_board = item.is_board;
    var docId = item.docId || '';
    var backgroundColor = item.backgroundColor || '#ccc';
    var txt = is_board == 2 ? '白板' : doc_type == 2 ? '静态文档' : '动态文档';
    if (active == 1) selectedCid = cid;
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
      docId: docId,
      noDispatch: true
    };
    switch (is_board) {
      case 1:
        sdk.createDocument(param);
        break;
      case 2:
        sdk.createBoard(param);
        break;
      default:
        break;
    }
  });

  sdk.setRemoteData2(list);
  if (selectedCid) {
    $('#' + selectedCid)
      .removeClass('hidden')
      .siblings('.doc-single')
      .addClass('hidden');
    console.warn('调用选择容器方法');
    sdk.selectContainer({
      id: selectedCid
    });
    sdk.zoomIn();
  }
}
function showToast(txt) {
  $('#toast').show();
  $('#toastTxt').text(txt);
  var temp = setTimeout(function () {
    $('#toast').hide();
    temp = null;
  }, 2000);
}
