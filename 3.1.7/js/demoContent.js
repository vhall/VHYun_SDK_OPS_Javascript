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
var publish;
var sdk;
var publishing = false;
var timerInterval = null;
var timing = 0;
var canOperating = false;
var docList = {};
if (docId) $('input[name=docId]').val(paramObj['docId']);
layui.use('colorpicker', function () {
  var colorpicker = layui.colorpicker; // 常规使用
  colorpicker.render({
    elem: '#defaultColor',
    // 绑定元素
    color: '#000000',
    size: 'sm',
    change: function change(color) {
      $('#stroke').val(color);
    }
  });
});
form.on('switch(switch)', function (data) {
  this.checked ? sdk.switchOnContainer() : sdk.switchOffContainer();
});

form.verify({
  strokeWidth: function (value, item) {
    if (Number(value) <= 0) {
      return '必须为正数';
    }
  }
});

sdk = VHDocSDK.createInstance(
  {
    appId: appId,
    channelId: channelId,
    role: VHDocSDK.RoleType.HOST,
    // 主持人
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
  if (iscontinue != 1) sdk.resetContainer();
  setTimeout(function () {
    sdk.getContainerInfo().then(function (res) {
      var list = res.list;
      if (res.switch_status === 1) {
        $('input[name=switch]').attr('checked', true);
        sdk.switchOnContainer();
      } else {
        $('input[name=switch]').removeAttr('checked');
        sdk.switchOffContainer();
      }
      form.render();
      if (iscontinue == 1) loadRemoteBoard(list);
    });
  }, 200);

  bindDocEvent();
  initPusher();
  layer.close(loading);
}
/**
 * 绑定文档监听
 */
function bindDocEvent() {
  /** 添加文档 */
  $('#addDoc').click(function () {
    if (!canOperating && $('#docs>div').length > 0) {
      layer.msg('上一文档尚未加载完成，请稍后点击');
      return;
    }
    $('#dialog').css({ display: 'flex' });
  });
  $('#closeDialog').click(function () {
    $('#dialog').hide();
  });
  form.on('select(docType)', function (data) {
    switch (data.value) {
      case 'board':
        $('#docId').hide();
        break;
      case 'document-static':
      case 'document-animation':
        $('#docId').show();
        break;
      default:
        break;
    }
  });
  /** 调用sdk创建方法 */
  form.on('submit(dialog)', function (data) {
    var conType = $('#selectContainer').val();
    var docId = $('#docIdInput').val();
    if ((conType == 'document-static' || conType == 'document-animation') && !docId) {
      layer.msg('文档ID不能为空');
      return;
    }
    canOperating = false;
    var color = '#' + Math.floor(Math.random() * 0xffffff).toString(16);
    loadContainer(conType, color, docId);
    $('#dialog').hide();
    $('#defaultDoc').hide();
    /** 隐藏目录 */
    if (conType == 'board') {
      $('#catalog').children('.list').hide();
      $('#pageBox').hide();
    } else {
      $('#pageBox').show();
    }
    if ($('#docs>div').length > 3) {
      $('#addDoc').hide();
    }
  });
  /** 隐藏dialog */
  $('#cancelCreate').click(function () {
    $('#dialog').hide();
  });

  /**
   * 控制 tool 显示隐藏
   */
  $('#template')
    .mouseenter(function () {
      if ($('#docs>div').length == 0) return;
      $('#brushBox').show();
      $('#toolBox').show();
    })
    .mouseleave(function () {
      if ($('#docs>div').length == 0) return;
      $('#brushBox').show();
      $('#toolBox').show();
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
        sdk[detail]({ width: Number(_this.find('span').text()) });
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

    /** 切换目录 */
    $('#catalog').children('.list').hide();
    $('#' + elId + '-chapters').show();
    sdk.selectContainer({ id: elId });
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
      var elId = $('#docs>div').eq(0).removeClass('hidden').attr('id');
      $('#doc-title>li[doc-container="' + elId + '"]').addClass('active');
      sdk.selectContainer({ id: elId });
      if (elId.indexOf('document') != -1) {
        $('#currentPage').text(docList[elId].info.slideIndex + 1);
        $('#totalPage').text(docList[elId].info.slidesTotal);
        /** 切换目录 */
        $('#catalog').children('.list').hide();
        $('#' + elId + '-chapters').show();
        $('#pageBox').show();
      } else {
        $('#pageBox').hide();
      }
    } else {
      $('#defaultDoc').show();
      $('#brushBox').hide();
      $('#toolBox').hide();
    }
    if ($('#docs>div').length > 3) {
      $('#addDoc').hide();
    } else {
      $('#addDoc').show();
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
  /** 回放文档加载完成事件 */
  sdk.on(VHDocSDK.Event.DOCUMENT_LOAD_COMPLETE, function (e) {
    // var docId = e.docId;
    // var info = e.info;
    // var elId = e.elId;
    // $('#'.concat(elId, ' .page-text .page-input')).val(info.slideIndex + 1);
    // $('#'.concat(elId, ' .page-text span')).text(info.slidesTotal);
    // sumPage = info.slidesTotal;
  });
  /** 翻页事件 */
  sdk.on(VHDocSDK.Event.PAGE_CHANGE, function (e) {
    console.warn('收到翻页消息', e);
    $('#currentPage').text(e.info.slideIndex + 1);
    $('#totalPage').text(e.info.slidesTotal);
    if (docList[e.id]) {
      docList[e.id].info = JSON.parse(JSON.stringify(e.info));
    } else {
      docList[e.id] = { info: JSON.parse(JSON.stringify(e.info)), chapters: null };
    }
  });
  /** 文档播放完毕事件 */
  sdk.on(VHDocSDK.Event.PLAYBACKCOMPLETE, function (e) {
    console.warn('播放完毕');
    layer.msg('播放完毕');
    playComplete = true;
  });
}

/**
 * 初始化推流sdk
 */
function initPusher() {
  VhallLivePusher.createInstance(
    {
      appId: appId,
      // 应用ID
      accountId: accountId,
      // 第三方用户ID
      token: token,
      // access_token，必填
      roomId: roomId,
      // 直播房间ID，必填
      videoNode: 'pusher' // 视频容器，必填
    },
    function (res) {
      console.log('推流初始化成功');
      publish = res.interface;
      bindPusherEvent();
    },
    function (e) {
      console.error(e);
    }
  );
}
/**
 * 绑定 推流事件
 * */
function bindPusherEvent() {
  $('#pusherStart').click(function () {
    if (publishing) return;
    publishing = true;
    var videoArr = publish.getDevices('video');
    var audioArr = publish.getDevices('audio');
    publish.startPush(
      {
        video: videoArr ? videoArr[0] : undefined,
        audio: audioArr ? audioArr[0] : undefined
      },
      function () {
        layer.msg('推流成功');
        calculagraph();
        sdk.start();
        // sdk.republish();
        $('#pusherStart').hide();
        $('#pusherStop').show();
        $('#pusher').addClass('pushering');
      },
      function (e) {
        console.error(e);
      }
    );
  });
  $('#pusherStop').click(function () {
    if (!publishing) return;
    publishing = false;
    publish.stopPush({}, function () {
      layer.msg('停止推流成功');
      sdk.start(2, 1);
      calculagraph('stop');
      $('#pusherStop').hide();
      $('#pusherStart').show();
      $('#pusher').removeClass('pushering');
      $('#pusherTime').text('00 : 00 : 00');
    });
  });
}
/**
 * 计时器
 */
function calculagraph(type = 'start') {
  clearInterval(timerInterval);
  timerInterval = null;
  if (type != 'start') return;
  timerInterval = setInterval(function () {
    timing++;
    var hour = parseInt(timing / 3600);
    var minute = parseInt((timing % 3600) / 60);
    var second = parseInt((timing % 300) % 60);
    hour = hour >= 10 ? hours : '0' + hour;
    minute = minute >= 10 ? minute : '0' + minute;
    second = second >= 10 ? second : '0' + second;
    $('#pusherTime').text(hour + ' : ' + minute + ' : ' + second);
  }, 1000);
}
/**
 *  加载文档
 */
function loadContainer(conType, color, docId) {
  var elId = sdk.createUUID(conType == 'board' ? 'board' : 'document');
  $('#docs>div').addClass('hidden');
  $('#doc-title')
    .children('li')
    .removeClass('active')
    .parent()
    .prepend(
      '<li class="container active" doc-container="' +
        elId +
        '">' +
        elId +
        ' <img class="close-doc host-exclusive"  doc-container="' +
        elId +
        '" src="./images/close-doc.png" /></li>'
    );
  $('#docs').prepend('<div class="doc-single" id="' + elId + '"></div>');
  var param = {
    // div 容器 必须
    elId: elId,
    // div 宽度，像素单位，数值型不带px 必须
    width: $('#' + elId).width(),
    // div 高度，像素单位，数值型不带px 必须
    height: ($('#' + elId).width() * 9) / 16,
    // 背景颜色， 支持RGB 与 RGBA， 如果全透明，舞台背景色与网页背景色相同，如 ‘#FF0000’或 ‘#FF000000’ 必须
    backgroundColor: color,
    docId: docId, // 文档必传
    option: {
      graphicType: VHDocSDK.GRAPHIC[$('#graphic').val()],
      stroke: $('#stroke').val(),
      strokeWidth: Number($('#strokeWidth').val())
    }
  };
  if (conType == 'board') {
    sdk.createBoard(param);
    setTimeout(function () {
      sdk.selectContainer({
        id: elId
      });
    }, 1000);
  } else {
    sdk.createDocument(param);
    setTimeout(function () {
      sdk.selectContainer({
        id: elId
      });
      sdk
        .loadDoc({
          docId: docId,
          id: elId,
          docType: conType == 'document-static' ? 2 : 1
        })
        .then(function () {
          loadChapters(elId, docId);
        })
        .catch(function (res) {
          layer.msg(res.msg);
          sdk.destroyContainer({
            id: elId
          });
          $('#' + elId).remove();
          $('#doc-title li[doc-container=' + elId + ']').remove();
          $('#defaultDoc').show();
          canOperating = true;
        });
    }, 1000);
  }
}
/**
 * 加载远程文档
 */
function loadRemoteBoard(list) {
  console.log(list);
  var selectedCid = null;
  $.each(list, function (index, item) {
    var cid = item.cid;
    var active = item.active;
    var doc_type = item.doc_type;
    var is_board = item.is_board;
    var docId = item.docId || '';
    var backgroundColor = item.backgroundColor || '#ccc';
    if (active == 1) selectedCid = cid;
    $('#doc-title')
      .children('li')
      .removeClass('active')
      .parent()
      .prepend(
        '<li class="container active" doc-container="' +
          cid +
          '">' +
          cid +
          ' <img class="close-doc host-exclusive"  doc-container="' +
          cid +
          '" src="./images/close-doc.png" /></li>'
      );
    $('#docs')
      .prepend('<div class="doc-single" id="' + cid + '"></div>')
      .find('#' + cid)
      .siblings()
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
      noDispatch: true // 加载远程文档不往外广播创建消息
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
    loadOther(is_board, item);
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
    setTimeout(() => {
      /** 切换目录 */
      $('#catalog').children('.list').hide();
      $('#' + selectedCid + '-chapters').show();
    }, 1000);
  }
  if ($('#docs>div').length > 3) {
    $('#addDoc').hide();
  }
}
function loadOther(isboard, item) {
  if (isboard == 1) {
    var cid = item.cid;
    var docId = item.docId;
    docList[cid] = { info: item, chapters: null };
    loadChapters(cid, docId);
  }
}
function loadChapters(elId, docId) {
  sdk.getChapters({ elId: elId, docId: docId }).then(function (res) {
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
