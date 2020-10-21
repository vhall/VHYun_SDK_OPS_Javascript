/* eslint-disable camelcase */
/* eslint-disable no-undef */
var publishNum = 0;
// $('body').css('cursor', 'url(./css/zoomIn.png) 64 64 ,pointer');
var selectColor = '#000000';
var selectStrokeWidth = 4;
var roleText = 'HOST';
var canOperating = false;
var iscontinue;
window.onload = function () {
  var form = layui.form;
  var sdk;
  var publish;
  var sumPage = 0; // 初始化选择器

  layui.use('colorpicker', function () {
    var colorpicker = layui.colorpicker; // 常规使用

    colorpicker.render({
      elem: '#color',
      // 绑定元素
      color: '#000000',
      size: 'xs',
      change: function change(color) {
        // 颜色改变的回调
        sdk.setStroke({
          color: color
        });
        selectColor = color;
        layer.tips('选择了：' + color, this.elem, {
          tips: 1
        });
      }
    });
  }); // 初始化表单

  layui.use('form', function () {
    // 监听提交
    form.on('switch(switch)', function (data) {
      this.checked ? sdk.switchOnContainer() : sdk.switchOffContainer();
    });
    form.on('submit(formDemo)', function (data) {
      var _data$field = data.field;
      var appId = _data$field.appId;
      var roomId = _data$field.roomId;
      var channelId = _data$field.channelId;
      var accountId = _data$field.accountId;
      var token = _data$field.token;
      iscontinue = _data$field.iscontinue;
      var loading = layer.load(0, {
        shade: [0.1, '#fff']
      });
      var DocFail = {
        status: false,
        msg: {}
      };
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
        function () {
          if (iscontinue != 'yes') {
            sdk.resetContainer();
          }

          sdk.getContainerInfo().then(function (res) {
            layer.close(loading);
            $('.login').css('display', 'none');
            $('.main').show('fast');
            var _res$list = res.list;
            var list = _res$list === void 0 ? [] : _res$list;
            if (res.switch_status === 1) {
              $('input[name=switch]').attr('checked', true);
              sdk.switchOnContainer();
            } else {
              $('input[name=switch]').removeAttr('checked');
              sdk.switchOffContainer();
            }
            form.render();

            if (iscontinue == 'yes') {
              loadRemoteBoard(list);
            } else {
              $('input[name=switch]').removeAttr('checked');
              form.render();
            }
          });
        },
        function (err) {
          DocFail.status = true;
          DocFail.msg = err;
        }
      );
      window.sdk = sdk;

      if (DocFail.status) {
        layer.msg(DocFail.msg.msg);
        layer.close(loading);
        return;
      }
      sdk.on(VHDocSDK.Event.DOCUMENT_NOT_EXIT, function (res) {
        console.log(res);
        var docId = res.docId;
        layer.msg('文档' + docId + '不存在或已删除');
        $('.control-box span[data-doc=' + res.docId + '] icon-close').click();
      });
      sdk.on(VHDocSDK.Event.ALL_COMPLETE, function () {
        console.log('所有文档加载完成');
        layer.msg('所有文档加载完成');
        canOperating = true;
      });
      sdk.on(VHDocSDK.Event.ERROR, function (e) {
        console.error(e);
      });
      sdk.on(VHDocSDK.Event.DOCUMENT_LOAD_COMPLETE, function (e) {
        var docId = e.docId;
        var info = e.info;
        var elId = e.elId;
        $('#'.concat(elId, ' .page-text .page-input')).val(info.slideIndex + 1);
        $('#'.concat(elId, ' .page-text span')).text(info.slidesTotal);
        sumPage = info.slidesTotal;
      });
      sdk.on(VHDocSDK.Event.PAGE_CHANGE, function (e) {
        console.log('收到翻页消息', e);
        var id = e.id;
        var data = e.info;
        $('#'.concat(id, ' .page-text .page-input')).val(data.slideIndex + 1);
        $('#'.concat(id, ' .page-text span')).text(data.slidesTotal);
      }); // Vhall.ready(function () {

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
          videoNode: 'live' // 视频容器，必填
        },
        function (res) {
          layer.close(loading);
          $('.login').css('display', 'none');
          $('.main').show('fast');
          publish = res.interface;
        },
        function (e) {
          console.error(e);
        }
      );
      return false;
    });
  });
  $(document).on('click', '.localRole .layui-nav-child span', function () {
    var value = $(this).attr('data-value');
    var text = $(this).text();
    $(this).parent().siblings().removeClass('layui-this');
    $(this).parent().addClass('layui-this');
    sdk
      .setRole(VHDocSDK.RoleType[value])
      .then(function () {
        layer.msg('本地权限已切换为' + text);
        roleText = value;
      })
      .catch(function (err) {
        layer.msg(err.msg);
      });
  });
  $(document).on('click', '.pushStream', function () {
    if (publishNum) {
      return;
    }

    var videoArr = publish.getDevices('video');
    var audioArr = publish.getDevices('audio');
    publish.startPush(
      {
        video: videoArr ? videoArr[0] : undefined,
        audio: audioArr ? audioArr[0] : undefined
      },
      function () {
        layer.msg('推流成功');
        sdk.start();
        sdk.republish();

        publishNum++;
      },
      function (e) {
        console.error(e);
      }
    );
  });
  $(document).on('click', '.stopStream', function () {
    var list = $('.control-box .icon-close');
    for (index = 0; index < list.length; index++) {
      var element = list[index];
      element.click();
    }
    setTimeout(function() {
      publish.stopPush(
        {}, // 停止推流完成事件，非必填
        function () {
          layer.msg('停止推流成功');
          publishNum = 0;
        }
      );
    }, 500);
  }); // 设置画笔

  $(document).on('click', '.toolBox .icon-pen', function () {
    $('.tool dd').removeClass('layui-this');
    $(this).parent().addClass('layui-this');
    sdk.cancelZoom();
    sdk.setPen();
    sdk.setStroke({ color: selectColor });
    sdk.setStrokeWidth({
      width: selectStrokeWidth
    });
  }); // 设置文字

  $(document).on('click', '.toolBox .icon-text', function () {
    $('.tool dd').removeClass('layui-this');
    $(this).parent().addClass('layui-this');
    sdk.cancelZoom();
    sdk.setText();
    sdk.setStroke({ color: selectColor });
  }); // 设置荧光笔

  $(document).on('click', '.toolBox .icon-highlighters', function () {
    $('.tool dd').removeClass('layui-this');
    $(this).parent().addClass('layui-this');
    sdk.cancelZoom();
    sdk.setHighlighters();
    sdk.setStroke({ color: selectColor });
    sdk.setStrokeWidth({
      width: selectStrokeWidth
    });
  }); // 设置方块

  $(document).on('click', '.toolBox .icon-square', function () {
    $('.tool dd').removeClass('layui-this');
    $(this).parent().addClass('layui-this');
    sdk.cancelZoom();
    sdk.setSquare();
    sdk.setStroke({ color: selectColor });
    sdk.setStrokeWidth({
      width: selectStrokeWidth
    });
  }); // // 设置圆形

  $(document).on('click', '.toolBox .icon-circle', function () {
    $('.tool dd').removeClass('layui-this');
    $(this).parent().addClass('layui-this');
    sdk.cancelZoom();
    sdk.setCircle();
    sdk.setStroke({ color: selectColor });
    sdk.setStrokeWidth({
      width: selectStrokeWidth
    });
  }); // 设置等腰三角形

  $(document).on('click', '.toolBox .icon-isoscelesTriangle', function () {
    $('.tool dd').removeClass('layui-this');
    $(this).parent().addClass('layui-this');
    sdk.cancelZoom();
    sdk.setIsoscelesTriangle();
    sdk.setStroke({ color: selectColor });
    sdk.setStrokeWidth({
      width: selectStrokeWidth
    });
  }); // 设置直角三角形

  $(document).on('click', '.toolBox .icon-rightTriangle', function () {
    $('.tool dd').removeClass('layui-this');
    $(this).parent().addClass('layui-this');
    sdk.cancelZoom();
    sdk.setRightTriangle();
    sdk.setStroke({ color: selectColor });
    sdk.setStrokeWidth({
      width: selectStrokeWidth
    });
  }); // 设置单箭头

  $(document).on('click', '.toolBox .icon-singleArrow', function () {
    $('.tool dd').removeClass('layui-this');
    $(this).parent().addClass('layui-this');
    sdk.cancelZoom();
    sdk.setSingleArrow();
    sdk.setStroke({ color: selectColor });
    sdk.setStrokeWidth({
      width: selectStrokeWidth
    });
  }); // 设置双箭头

  $(document).on('click', '.toolBox .icon-doubleArrow', function () {
    $('.tool dd').removeClass('layui-this');
    $(this).parent().addClass('layui-this');
    sdk.cancelZoom();
    sdk.setDoubleArrow();
    sdk.setStroke({ color: selectColor });
    sdk.setStrokeWidth({
      width: selectStrokeWidth
    });
  }); // 设置橡皮擦

  $(document).on('click', '.toolBox .icon-eraser', function () {
    $('.tool dd').removeClass('layui-this');
    $(this).parent().addClass('layui-this');
    sdk.cancelZoom();
    sdk.setEraser();
  }); // 清空画布

  $(document).on('click', '.toolBox .icon-clear', function () {
    sdk.clear();
  }); // 取消画笔

  $(document).on('click', '.toolBox .icon-ban', function () {
    $('.tool dd').removeClass('layui-this');
    $(this).parent().addClass('layui-this');
    sdk.cancelDrawable();
  }); // 设置画笔大小

  $(document).on('click', '.toolBox .size dd span', function () {
    var value = $(this).attr('data-value');
    $('.size dd').removeClass('layui-this');
    $(this).parent().addClass('layui-this');
    sdk.setStrokeWidth({
      width: Number(value)
    });
    selectStrokeWidth = Number(value);
  }); // 缩放操作

  $(document).on('click', '.toolBox .zoom dd span', function () {
    var value = $(this).attr('data-value');
    $('.zoom dd').removeClass('layui-this');
    $(this).parent().addClass('layui-this');

    switch (value) {
      case 'zoomIn':
        sdk.zoomIn();
        break;

      case 'zoomOut':
        sdk.zoomOut();
        break;

      case 'move':
        sdk.move();
        break;

      case 'reset':
        sdk.zoomReset();
        break;

      case 'cancel':
        sdk.cancelZoom();
        break;

      default:
        break;
    }
  }); // 上一页

  $(document).on('click', '.page-box .prevPage', function () {
    if (roleText != 'HOST' && roleText != 'ASSISTANT') {
      layer.msg('只有主持人或助理才能翻页');
      return;
    }
    if (!canOperating) {
      layer.msg('文档未全部加载完成');
      return;
    }
    sdk.prevPage();
  }); // 下一页

  $(document).on('click', '.page-box .nextPage', function () {
    if (roleText != 'HOST' && roleText != 'ASSISTANT') {
      layer.msg('只有主持人或助理才能翻页');
      return;
    }
    if (!canOperating) {
      layer.msg('文档未全部加载完成');
      return;
    }
    sdk.nextPage();
  }); // 上一步

  $(document).on('click', '.page-box .prevStep', function () {
    if (roleText != 'HOST' && roleText != 'ASSISTANT') {
      layer.msg('只有主持人或助理才能翻页');
      return;
    }
    if (!canOperating) {
      layer.msg('文档未全部加载完成');
      return;
    }
    sdk.prevStep();
  }); // 下一步

  $(document).on('click', '.page-box .nextStep', function () {
    if (roleText != 'HOST' && roleText != 'ASSISTANT') {
      layer.msg('只有主持人或助理才能翻页');
      return;
    }
    if (!canOperating) {
      layer.msg('文档未全部加载完成');
      return;
    }
    sdk.nextStep();
  }); // 修改页数

  $(document).on('input', '.page-text .page-input', function (e) {
    if (roleText != 'HOST' && roleText != 'ASSISTANT') {
      layer.msg('只有主持人或助理才能翻页');
      return;
    }
    if (!canOperating) {
      layer.msg('文档未全部加载完成');
      return;
    }
    var value = parseInt(e.target.value);

    if (isNaN(value)) {
      return;
    }

    sdk.gotoPage({
      page: value - 1
    });
  }); // 删除白板

  $('.control-box').on('click', '.icon-close', function (event) {
    if (roleText != 'HOST') {
      layer.msg('只有主持人才能删除文档');
      return;
    }
    var docId = $(this).parent().attr('data-doc');
    $('.boardBox').css('visibility', 'hidden');
    $(this).parent().remove();
    $('.board-box #'.concat(docId)).remove();
    clearBtnActive();
    $('.control-box .itemBtn').eq(0).addClass('active');
    $('.board-box .boardBox').eq(0).css('visibility', 'visible');
    sdk.destroyContainer({
      id: docId
    });

    if ($('.control-box .itemBtn').length !== 0) {
      if (roleText != 'HOST') {
        layer.msg('只有主持人才能切换文档');
        return;
      }
      sdk.selectContainer({
        id: $('.control-box .itemBtn').eq(0).attr('data-doc')
      });
    }
    canOperating = true;
    return false;
  });
  form.on('select(type)', function (data) {
    switch (data.value) {
      case 'board':
        $('.docId').css('display', 'none');
        break;
      case 'document-static':
      case 'document-animation':
        $('.docId').css('display', 'block');
        break;
      default:
        break;
    }
  }); // 添加白板

  $('.addBtn').click(function () {
    if (roleText != 'HOST') {
      layer.msg('只有主持人才能添加实例');
      return;
    }
    var setAlert = layer.open({
      type: 1,
      title: '创建容器',
      closeBtn: false,
      shift: 2,
      area: ['500px', '300px'],
      btn: ['确定', '取消'],
      shadeClose: true,
      content: $('.createBox'),
      yes: function yes() {
        var conType = $('select[name=type]').val();
        var docId = $('input[name=docId]').val();

        if ((conType == 'document-static' || conType == 'document-animation') && !docId) {
          layer.msg('文档ID不能为空');
          return;
        }

        var color = '#' + Math.floor(Math.random() * 0xffffff).toString(16);
        loadBoard(conType, color, docId);
        layer.close(setAlert);
        $('.createBox').css('display', 'none');
      },
      end: function end() {
        $('.createBox').css('display', 'none');
      }
    });
  }); // 切换白板

  $('.control-box').on('click', '.itemBtn', function (event) {
    var docName = $(this).attr('data-doc'); // // 控制item选中状态

    $('.itemBtn').removeClass('active');
    $(this).addClass('active'); // 控制白板显隐

    $('.board-box .boardBox').css('visibility', 'hidden');
    $('#'.concat(docName)).css('visibility', 'visible');
    sdk.selectContainer({
      id: docName
    });
    $('.tool dd').removeClass('layui-this');
    $('.toolBox .icon-pen').parent().addClass('layui-this');
    sdk.setPen();
    var arr = sdk.getDocInfos({
      id: docName
    });

    if (arr.length === 0) {
      return;
    }

    var info = arr[0];
    var list = info.list;
    $('#'.concat(docName, ' .page-text .page-input')).val(list.slideIndex + 1);
    $('#'.concat(docName, ' .page-text span')).text(list.slidesTotal);
  }); // 清楚按钮选中状态

  function clearBtnActive() {
    $('.control-box span').removeClass('active');
  }

  function loadBoard(type, color) {
    var docId = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';
    var elId = sdk.createUUID(type == 'board' ? 'board' : 'document');
    $('.board-box .boardBox').css('visibility', 'hidden');
    $('#'.concat(elId)).css('visibility', 'visible');
    $('.board-box').append(
      '<div id="'
        .concat(elId, '" class="boardBox" style="display:block;">\n  ')
        .concat(
          type === 'board'
            ? ''
            : '<div class="page-box">\n  <span class="iconfont iconshangyiye1 prevPage" title="\u4E0A\u4E00\u9875"></span>\n  <span class="iconfont icon-shangyibu prevStep" title="\u4E0A\u4E00\u6B65"></span>\n  <div class="page-text">\n    <input type="text" value="0" class="page-input"/>\n    <i> / </i>\n    <span>0</span>\n  </div>\n  <span class="iconfont iconxiayibu nextStep" title="\u4E0B\u4E00\u6B65"></span>\n  <span class="iconfont iconxiayiye1 nextPage" title="\u4E0B\u4E00\u9875"></span>\n</div>',
          '\n  </div>'
        )
    ); // 追加item按钮

    clearBtnActive();
    $('.add').before(
      '<span class="active itemBtn" data-doc="'
        .concat(elId, '">')
        .concat(elId, '<i class="iconfont icon-close"></i></span>')
    );

    if (type === 'board') {
      sdk.createBoard({
        elId: elId,
        // div 容器 必须
        width: 800,
        // div 宽度，像素单位，数值型不带px 必须
        height: 600,
        // div 高度，像素单位，数值型不带px 必须
        backgroundColor: color,
        // 背景颜色， 支持RGB 与 RGBA， 如果全透明，舞台背景色与网页背景色相同，如 ‘#FF0000’或 ‘#FF000000’ 必须
        id: elId
      });
      sdk.selectContainer({
        id: elId
      });
    } else {
      sdk.createDocument({
        elId: elId,
        width: 800,
        height: 600,
        id: elId,
        docId: docId
      });
      sdk.selectContainer({
        id: elId
      });
      sdk
        .loadDoc({
          docId: docId,
          id: elId,
          docType: type == 'document-static' ? 2 : 1
        })
        .catch(function (res) {
          layer.msg(res.msg);

          $('.boardBox').css('visibility', 'hidden');
          $('span[data-doc=' + elId + ']').remove();
          $('.board-box #'.concat(elId)).remove();
          clearBtnActive();
          $('.control-box .itemBtn').eq(0).addClass('active');
          $('.board-box .boardBox').eq(0).css('visibility', 'visible');
          sdk.destroyContainer({
            id: elId
          });

          if ($('.control-box .itemBtn').length !== 0) {
            console.log($('.control-box .itemBtn'));
            sdk.selectContainer({
              id: $('.control-box .itemBtn').eq(0).attr('data-doc')
            });
            sdk.setPen();
          }
          canOperating = true;
        });
    }
  }

  function loadRemoteBoard(list) {
    var selectedCid = '';
    list.reverse();

    for (var i in list) {
      var _list$i = list[i];
      var cid = _list$i.cid;
      var active = _list$i.active;
      var is_board = _list$i.is_board;
      var pageData = _list$i.pageData;
      var docId = _list$i.docId;
      var cw = _list$i.cw;
      var ch = _list$i.ch;
      $('.board-box').append(
        '<div id="'
          .concat(cid, '" class="boardBox" style="')
          .concat(active === 0 ? 'visibility:hidden;' : 'visibility: visible;', '">\n        ')
          .concat(
            is_board === 2
              ? ''
              : '<div class="page-box">\n        <span class="iconfont iconshangyiye1 prevPage" title="\u4E0A\u4E00\u9875"></span>\n        <span class="iconfont icon-shangyibu prevStep" title="\u4E0A\u4E00\u6B65"></span>\n        <div class="page-text">\n          <input type="text" value="0" class="page-input"/>\n          <i> / </i>\n          <span>0</span>\n        </div>\n        <span class="iconfont iconxiayibu nextStep" title="\u4E0B\u4E00\u6B65"></span>\n        <span class="iconfont iconxiayiye1 nextPage" title="\u4E0B\u4E00\u9875"></span>\n      </div>',
            '\n        </div>'
          )
      );
      $('.add').before(
        '<span class="'
          .concat(active === 0 ? '' : 'active', ' itemBtn" data-doc="')
          .concat(cid, '">')
          .concat(cid, '<i class="iconfont icon-close"></i></span>')
      );

      if (active === 1) {
        selectedCid = cid;
      }

      switch (is_board) {
        case 1:
          sdk.createDocument({
            elId: cid,
            width: cw,
            height: ch,
            id: cid,
            docId: docId,
            noDispatch: true
          });
          break;

        case 2:
          sdk.createBoard({
            elId: cid,
            // div 容器 必须
            width: cw,
            // div 宽度，像素单位，数值型不带px 必须
            height: ch,
            // div 高度，像素单位，数值型不带px 必须
            backgroundColor: list[i].backgroundColor || '#CCCCCC',
            // 背景颜色， 支持RGB 与 RGBA， 如果全透明，舞台背景色与网页背景色相同，如 ‘#FF0000’或 ‘#FF000000’ 必须
            id: cid,
            noDispatch: true
          });
          break;

        default:
          break;
      }
    }

    sdk.setRemoteData2(list);
    sdk.setSize(800, 600); // for demo

    if (selectedCid !== '') {
      sdk.selectContainer({
        id: selectedCid
      });
      sdk.setPen();
      // $('#'.concat(selectedCid, ' .page-text .page-input')).val(list.slideIndex + 1);
      // $('#'.concat(selectedCid, ' .page-text span')).text(list.slidesTotal);
    }
  }

  var paramObj = Qs.parse(location.search, {
    ignoreQueryPrefix: true
  });

  if (paramObj['appId']) {
    $('input[name=appId]').val(paramObj['appId']);
  }

  if (paramObj['channelId']) {
    $('input[name=channelId]').val(paramObj['channelId']);
  }

  if (paramObj['roomId']) {
    $('input[name=roomId]').val(paramObj['roomId']);
  }

  if (paramObj['accountId']) {
    $('input[name=accountId]').val(paramObj['accountId']);
  } else {
    $('input[name=accountId]').val('master_'.concat(Math.floor(1000 + Math.random() * 9000)));
  }

  if (paramObj['token']) {
    $('input[name=token]').val(paramObj['token']);
  }

  if (paramObj['docId']) {
    $('input[name=docId]').val(paramObj['docId']);
  }
};
