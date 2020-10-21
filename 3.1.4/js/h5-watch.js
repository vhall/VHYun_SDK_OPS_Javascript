/* eslint-disable camelcase */
/* eslint-disable no-undef */

/**
 *
 * Created Date: 2019-07-30, 10:10:20 (zhenliang.sun)
 * Last Modified: 2019-10-21, 02:44:19 (zhenliang.sun)
 * Email: zhenliang.sun@gmail.com
 *
 * Distributed under the MIT license. See LICENSE file for details.
 * Copyright (c) 2019 vhall
 */
window.onload = function () {
  playerSDK = null;
  docSDK = null;
  eruda.init();
  $('.main').css('display', 'none');
  $('.btn-start').on('click', function (e) {
    $('.login').css('display', 'none');
    $('.main').css('display', 'block');

    if (!VhallPlayer) {
      console.error('播放器未加载成功');
      return;
    }

    if (!VHDocSDK) {
      console.error('文档SDK未加载成功');
      return;
    }

    var appId = $('#appId').val();
    var accountId = $('#accountId').val();
    var token = $('#token').val();
    var roomId = $('#roomId').val();
    var channelId = $('#channelId').val();
    var opt = {
      appId: appId,
      accountId: accountId,
      token: token,
      type: 'live',
      videoNode: 'video',
      liveOption: {
        type: 'hls',
        roomId: roomId
      }
    };
    var optDoc = {
      appId: appId,
      channelId: channelId,
      role: VHDocSDK.RoleType.GUEST,
      // 嘉宾
      isVod: false,
      roomId: roomId,
      client: VHDocSDK.Client.H5_WEB,
      accountId: accountId,
      token: token,
      // delay: 1,
      mode: 'hls'
    };
    VhallPlayer.createInstance(opt, function (event) {
      playerSDK = event.vhallplayer;
      playerSDK.openControls(true);
      docSDK = VHDocSDK.createInstance(
        optDoc,
        function () {
          initDocSDKListener();
          loadRemoteBoard();
        },
        function (err) {
          return console.error(err);
        }
      );
    });
  });

  function loadRemoteBoard() {
    docSDK.getContainerInfo().then(function (res) {
      var _res$list = res.list;
      var list = _res$list === void 0 ? [] : _res$list;
      var switch_status = res.switch_status; // 根据开关状态，设置文档容器开关

      if (switch_status === 1) {
        $('.document-container').css('visibility', 'visible');
      } else {
        $('.document-container').css('visibility', 'hidden');
      }

      var selectedCid = ''; // 根据显示列表渲染元素

      for (var i in list) {
        var _list$i = list[i];
        var cid = _list$i.cid;
        var active = _list$i.active;
        var is_board = _list$i.is_board;
        var pageData = _list$i.pageData;
        $('.document-container').append(
          '<div id='
            .concat(cid, " class='board-box' style=\"")
            .concat(active === 0 ? 'display:none;' : 'display:block;', '"></div>')
        );

        if (active === 1) {
          selectedCid = cid;
        }

        var w = $('.document-container').width();
        var h = (w * 3) / 4;

        switch (is_board) {
          case 1:
            docSDK.createDocument({
              elId: cid,
              width: w,
              height: h,
              id: cid
            }); // docSDK.setRemoteData(list[i])

            break;

          case 2:
            docSDK.createBoard({
              elId: cid,
              // div 容器 必须
              width: w,
              // div 宽度，像素单位，数值型不带px 必须
              height: h,
              // div 高度，像素单位，数值型不带px 必须
              backgroundColor: list[i].backgroundColor || '#CCCCCC',
              // 背景颜色， 支持RGB 与 RGBA， 如果全透明，舞台背景色与网页背景色相同，如 ‘#FF0000’或 ‘#FF000000’ 必须
              id: cid
            }); // docSDK.setRemoteData(list[i])

            break;

          default:
            break;
        }
      }
      console.warn('容器创建完毕');

      docSDK.setRemoteData2(list);

      if (selectedCid !== '') {
        console.warn('调用选择容器方法');
        docSDK.selectContainer({
          id: selectedCid
        });
      }
    });
  }

  function initDocSDKListener() {
    if (!docSDK) {
      console.error('docSDK初始化失败');
      return;
    }

    docSDK.on(VHDocSDK.Event.SWITCH_CHANGE, function (e) {
      switch (e) {
        case 'on':
          $('.document-container').css('visibility', '');
          $('.document-container').show();
          break;

        case 'off':
          $('.document-container').css('visibility', '');
          $('.document-container').hide();
          break;

        default:
          break;
      }
    });
    docSDK.on(VHDocSDK.Event.RESET_CONTAINER, function (e) {
      $('.document-container').remove();
    });
    docSDK.on(VHDocSDK.Event.DELETE_CONTAINER, function (e) {
      var id = e.id;
      docSDK.destroyContainer({
        id: id
      });
      $('.document-container #'.concat(id)).remove();
    });
    docSDK.on(VHDocSDK.Event.CREATE_CONTAINER, function (e) {
      var id = e.id;
      var type = e.type;
      var width = e.width;
      var height = e.height; // 创建UI

      $('.document-container').append('<div id="'.concat(id, '" class="board-box" style="display:block;"></div>'));
      var w = $('.document-container').width();
      var h = (w * 3) / 4; // 创建各种面板

      var obj = {
        elId: id,
        width: width,
        height: height,
        id: id
      };

      switch (type) {
        case 'board':
          obj.backgroundColor = e['backgroundColor'];
          obj.width = w;
          obj.height = h;
          docSDK.createBoard(obj);
          break;

        case 'document':
          obj.width = w;
          obj.height = h;
          docSDK.createDocument(obj);
          break;

        default:
          break;
      }
    });
    docSDK.on(VHDocSDK.Event.SELECT_CONTAINER, function (e) {
      var id = e.id;
      $('.document-container>div').css('visibility', '');
      $('.document-container>div').hide();
      setTimeout(function () {
        $('#'.concat(id)).css('visibility', '');
        $('#'.concat(id)).show();
      }, 100);
      docSDK.selectContainer({
        id: id
      });
    });
  }

  var paramObj = Qs.parse(location.search, {
    ignoreQueryPrefix: true
  });

  if (paramObj['appId']) {
    $('input[id=appId]').val(paramObj['appId']);
  }

  if (paramObj['channelId']) {
    $('input[id=channelId]').val(paramObj['channelId']);
  }

  if (paramObj['roomId']) {
    $('input[id=roomId]').val(paramObj['roomId']);
  }

  if (paramObj['accountId']) {
    $('input[id=accountId]').val(paramObj['accountId']);
  } else {
    $('input[id=accountId]').val('guest_'.concat(Math.floor(1000 + Math.random() * 9000)));
  }

  if (paramObj['token']) {
    $('input[id=token]').val(paramObj['token']);
  }
};
