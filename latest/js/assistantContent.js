var form = layui.form;
var loading = layer.load(0, {
  shade: [0.1, '#fff']
});
var isRefresh = window.performance.navigation.type === 1;
var param = Qs.parse(location.search, {
  ignoreQueryPrefix: true
});
var appId = param.appId;
var channelId = param.channelId;
var roomId = param.roomId;
var accountId = param.accountId;
var token = param.token;
var docId = param.docId;
var iscontinue = param.iscontinue;
var liveType = param.liveType;
var sdk;
var canOperating = false;
var switchStatus = 1;
var docList = {};
sdk = VHDocSDK.createInstance(
  {
    appId: appId,
    channelId: channelId,
    role: VHDocSDK.RoleType.ASSISTANT,
    isVod: false,
    roomId: roomId,
    client: VHDocSDK.Client.PC_WEB,
    accountId: accountId,
    token: token,
    hide: false
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
    // if (switchStatus == 1) {
    //   $('#docs').removeClass('hideen');
    //   $('#doc-title').removeClass('hidden');
    //   $('#catalog .list').show();
    // } else {
    //   $('#docs').addClass('hideen');
    //   $('#doc-title').addClass('hidden');
    //   $('#catalog .list').hide();
    // }
    $('#docs').removeClass('hideen');
    $('#doc-title').removeClass('hidden');
    $('#catalog .list').show();
    loadRemoteBoard(list);
  });

  bindDocEvent();
  initPlayer();
  layer.close(loading);
}
/**
 * 绑定文档监听
 */
function bindDocEvent() {
  /**
   * 控制 tool 显示隐藏
   */
  $('#template')
    .mouseenter(function () {
      if ($('#docs>div').length == 0) return;
      $('#toolBox').show();
    })
    .mouseleave(function () {
      $('#toolBox').hide();
    });

  $('.tool').click(function () {
    var _this = $(this);
    var type = _this.attr('type');
    var detail = _this.attr('detail');
    if (!canOperating) {
      layer.msg('实例尚未全部加载完毕，请稍后再试');
      return;
    }
    switch (type) {
      case 'brush':
      case 'action':
        /** 画笔操作类或者翻页类 */
        sdk.cancelZoom();
        sdk[detail]();
        break;
      case 'strokeWidth':
        sdk[detail]({ width: Number(_this.text()) });
        break;
      case 'stroke':
        sdk[detail]({ color: _this.children('div').css('backgroundColor') });
        break;
      default:
        break;
    }
  });
  /**
   * 切换文档容器
   */
  $('.doc-container').on('click', '.container', function (event) {
    event.stopPropagation();
    var elId = $(this).attr('doc-container');
    /** 切换页签tab */
    $(this).addClass('active').siblings().removeClass('active');
    /** 切换容器tab */
    $('#' + elId)
      .removeClass('hidden')
      .siblings()
      .addClass('hidden');

    /** 切换目录 */
    $('#catalog').children('.list').hide();
    $('#' + elId + '-chapters').show();
    /** 切换页码 */
    if (elId.indexOf('document') != -1) {
      $('#currentPage').text(docList[elId].info.slideIndex + 1);
      $('#totalPage').text(docList[elId].info.slidesTotal);
      $('#pageBox').show();
    } else {
      $('#currentPage').text(0);
      $('#totalPage').text(0);
      $('#pageBox').hide();
    }
  });
  /**
   * 销毁文档容器
   */
  $('.doc-container').on('click', '.container img', function (event) {
    event.stopPropagation();
    var elId = $(this).attr('doc-container');
    sdk.destroyContainer({ id: elId });
    $(this).parent().remove();
    $('#' + elId).remove();
    if (elId.indexOf('document') != -1) {
      $('#' + elId + '-chapters').remove();
    }
    if ($('#docs>div').length > 0) {
      var elId = $('#docs>div').eq(0).css('visibility', 'visible').attr('id');
      $('#doc-title>li[doc-container="' + elId + '"]').addClass('active');
      sdk.selectContainer({ id: elId });
      if (elId.indexOf('document') != -1) {
        /** 切换目录 */
        $('#catalog').children('.list').hide();
        $('#' + elId + '-chapters').show();
      }
    } else {
      $('#defaultDoc').show();
    }
  });
  /** 文档不存在事件 */
  sdk.on(VHDocSDK.Event.DOCUMENT_NOT_EXIT, function (res) {
    var docId = res.docId;
    layer.msg('文档' + docId + '不存在或已删除');
    $('#doc-title')
      .find('img[doc-container=' + res.cid + ']')
      .click();
  });
  /** 所有文档加载完成事件 */
  sdk.on(VHDocSDK.Event.ALL_COMPLETE, function () {
    console.log('所有文档加载完成');
    layer.msg('所有文档加载完成');
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
        var txt = '<div class="list" id="' + res.elId + '-chapters">';
        $.each(res.chapters, function (index, item) {
          txt += '<ul class="title-list"><li class="title">' + item.slideIndex + '<span>' + item.title + '</span></li>';
          $.each(item.sub, function (key, value) {
            txt += '<li>' + item.slideIndex + '-' + value.stepIndex + '<img src="./images/icon-charles.png" alt="" srcset="" />' + value.title + '</li>';
          });
          txt += '</ul>';
        });
        txt += '</div>';
        $('#catalog').append(txt);
      });
    }
    $('#currentPage').text(e.info.slideIndex + 1);
    $('#totalPage').text(e.info.slidesTotal);
  });
  /** 文档播放完毕事件 */
  sdk.on(VHDocSDK.Event.PLAYBACKCOMPLETE, function (e) {
    console.warn('播放完毕');
    layer.msg('播放完毕');
    playComplete = true;
  });
  // sdk.on(VHDocSDK.Event.SWITCH_CHANGE, function (e) {
  //   switch (e) {
  //     case 'on':
  //       $('#doc-title').removeClass('hidden');
  //       $('#docs').removeClass('hidden');
  //       $('#catalog .list').show();
  //       switchStatus = 1;
  //       break;
  //     case 'off':
  //       $('#doc-title').addClass('hidden');
  //       $('#docs').addClass('hidden');
  //       $('#catalog .list').hide();
  //       switchStatus = 0;
  //       break;

  //     default:
  //       break;
  //   }
  // });
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
    if (!$('#doc-title>li').length) {
      $('#defaultDoc').show();
    }
  });
  sdk.on(VHDocSDK.Event.CREATE_CONTAINER, function (e) {
    $('#defaultDoc').hide();
    console.warn('收到创建容器事件', e);
    var elId = e.id;
    $('#doc-title')
      .prepend('<li class="container" doc-container="' + elId + '">' + elId + '</li>')
      .find('li')
      .removeClass('active')
      .eq(0)
      .addClass('active');
    $('#docs')
      .prepend('<div class="doc-single" id="' + elId + '"></div>')
      .children('.doc-single')
      .addClass('hidden')
      .eq(0)
      .removeClass('hidden');

    if (e.type === 'board') {
      sdk.createBoard({
        elId: elId,
        // div 容器 必须
        width: e.width,
        // div 宽度，像素单位，数值型不带px 必须
        height: e.height,
        // div 高度，像素单位，数值型不带px 必须
        backgroundColor: e.backgroundColor,
        // 背景颜色， 支持RGB 与 RGBA， 如果全透明，舞台背景色与网页背景色相同，如 ‘#FF0000’或 ‘#FF000000’ 必须
        id: e.id,
        noDispatch: true
      });
    } else {
      sdk.createDocument({
        elId: elId,
        width: e.width,
        height: e.height,
        id: elId,
        noDispatch: true
      });
    }
  });
  sdk.on(VHDocSDK.Event.SELECT_CONTAINER, function (e) {
    console.warn('收到选择容器事件');
    // setTimeout(function () {
    $('#doc-title')
      .find('li[doc-container="' + e.id + '"]')
      .addClass('active')
      .siblings()
      .removeClass('active');
    $('#docs')
      .find('#' + e.id)
      .removeClass('hidden')
      .siblings()
      .addClass('hidden');
    /** 切换目录 */
    $('#catalog').children('.list').hide();
    $('#' + e.id + '-chapters').show();
    if (e.id.indexOf('document') != -1) {
      if (docList[e.id]) {
        $('#currentPage').text(docList[e.id].info.slideIndex + 1);
        $('#totalPage').text(docList[e.id].info.slidesTotal);
      }
    } else {
      $('#currentPage').text(0);
      $('#totalPage').text(0);
    }
    sdk.selectContainer({
      id: e.id
    });
    // }, 1000);
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
        type: liveType,
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
  $('#defaultDoc').hide();
  var selectedCid = null;
  $.each(list, function (index, item) {
    var cid = item.cid;
    var active = item.active;
    var doc_type = item.doc_type;
    var is_board = item.is_board;
    var docId = item.docId || '';
    var backgroundColor = item.backgroundColor || '#ccc';
    if (active == 1) selectedCid = cid;
    $('#doc-title').prepend('<li class="container" doc-container="' + cid + '">' + cid + '</li>');
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
    $('#doc-title')
      .find('li[doc-container="' + selectedCid + '"]')
      .addClass('active')
      .siblings()
      .removeClass('active');
    $('#' + selectedCid)
      .removeClass('hidden')
      .siblings()
      .addClass('hidden');
    console.warn('调用选择容器方法');
    sdk.selectContainer({
      id: selectedCid
    });
  }
}
