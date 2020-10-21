/* eslint-disable camelcase */
/* eslint-disable no-undef */
window.onload = function () {
  var sdk = null;
  var player = null;
  layui.use('form', function () {
    var form = layui.form;
    form.on('submit(formDemo)', function (data) {
      var _data$field = data.field;
      var appId = _data$field.appId;
      var roomId = _data$field.roomId;
      var channelId = _data$field.channelId;
      var accountId = _data$field.accountId;
      var token = _data$field.token;
      var liveType = _data$field.liveType;
      $('.login').css('display', 'none');
      $('.main').css('display', 'block'); // 创建实例参数

      var opt = {
        appId: appId,
        // 应用ID，必填
        accountId: accountId,
        // 第三方用户ID，必填
        token: token,
        // access_token，必填
        type: 'live',
        // live 直播  vod 点播  必填
        videoNode: 'video',
        // 播放器的容器， div的id 必填
        liveOption: {
          type: liveType,
          // 直播播放类型  hls | flv
          roomId: roomId // 直播房间ID
        }
      }; // 创建实例

      VhallPlayer.createInstance(
        opt,
        function (event) {
          player = event.vhallplayer;
          player.play();
          player.openUI(false);
          player.openControls(true);
          var optDoc = {
            appId: appId,
            channelId: channelId,
            role: VHDocSDK.RoleType.GUEST,
            // 嘉宾
            isVod: false,
            roomId: roomId,
            client: VHDocSDK.Client.PC_WEB,
            accountId: accountId,
            token: token,
            // delay: 1,
            mode: liveType
          };
          sdk = VHDocSDK.createInstance(
            optDoc,
            function () {
              loadRemoteBoard();
            },
            function (err) {
              console.error(err);
            }
          );
          sdk.on(VHDocSDK.Event.SWITCH_CHANGE, function (e) {
            switch (e) {
              case 'on':
                $('.control-box').css('display', 'flex');
                $('.board-box').css('visibility', '');
                $('.board-box').css('display', 'block');
                break;

              case 'off':
                $('.control-box').css('display', 'none');
                $('.board-box').css('display', 'none');
                break;

              default:
                break;
            }
          });
          // 翻页事件
          sdk.on(VHDocSDK.Event.PAGE_CHANGE, function (e) {
            console.warn('收到翻页事件：', e);
          });
          sdk.on(VHDocSDK.Event.RESET_CONTAINER, function (e) {
            $('.itemBtn').remove();
            $('.boardBox').remove();
          });
          sdk.on(VHDocSDK.Event.DELETE_CONTAINER, function (e) {
            console.warn('收到删除容器事件');
            var elId = e.id;
            $('.boardBox').css('visibility', 'hidden');
            sdk.destroyContainer({
              id: elId
            });
            $('.board-box #'.concat(elId)).remove();
            $('.itemBtn[data-doc='.concat(elId, ']')).remove();
          });
          sdk.on(VHDocSDK.Event.CREATE_CONTAINER, function (e) {
            console.warn('收到创建容器事件');
            var elId = e.id;
            $('.board-box .boardBox').css('visibility', 'hidden');
            $('.control-box span').removeClass('active');
            $('.board-box').append('<div id="'.concat(elId, '" class="boardBox" style="display:block;"></div>'));
            $('.control-box').append(
              '<span class="itemBtn active" style="cursor: default;" data-doc="'
                .concat(elId, '">')
                .concat(elId, '</span>')
            );

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
                id: e.id
              });
            } else {
              sdk.createDocument({
                elId: elId,
                width: 800,
                height: 600,
                id: elId
              });
            }
          });
          sdk.on(VHDocSDK.Event.DOCUMENT_LOAD_COMPLETE, function (e) {
            // console.error('文档加载完成');
          });
          sdk.on(VHDocSDK.Event.SELECT_CONTAINER, function (e) {
            console.warn('收到选择容器事件');
            // // 控制item选中状态
            $('.itemBtn').removeClass('active');
            $('.itemBtn[data-doc='.concat(e.id, ']')).addClass('active'); // 控制白板显隐

            $('.board-box>div').css('visibility', '');
            $('.board-box>div').hide();
            setTimeout(function () {
              $('#'.concat(e.id)).css('visibility', '');
              $('#'.concat(e.id)).show();
            }, 100);
            sdk.selectContainer({
              id: e.id
            });
          });
        },
        function (err) {
          console.error(err);
        }
      ); // Vhall.ready(function() {
      // })
      // Vhall.config({
      //   appId: 'dab27ad1', // 应用 ID ,必填
      //   accountId: '10000126', // 第三方用户唯一标识,必填
      //   token: 'vhall' // token必填Z
      // })
    });
    form.render();
  });

  function loadRemoteBoard() {
    sdk.getContainerInfo().then(function (res) {
      console.error(res);
      var _res$list = res.list;
      var list = _res$list === void 0 ? [] : _res$list;

      switch (res.switch_status) {
        case 1:
          $('.control-box').css('display', 'flex');
          $('.board-box').css('visibility', 'visible');
          break;

        case 0:
          $('.control-box').css('display', 'none');
          $('.board-box').css('visibility', 'hidden');
          break;

        default:
          break;
      }

      list.reverse();
      var selectedCid = '';

      for (var i in list) {
        // eslint-disable-next-line camelcase
        var _list$i = list[i];
        var cid = _list$i.cid;
        var active = _list$i.active;
        var is_board = _list$i.is_board;
        // var pageData = _list$i.pageData;
        $('.board-box').append(
          '<div id="'
            .concat(cid, '" class="boardBox" style="')
            .concat(active === 0 ? 'visibility:hidden;' : 'visibility: visible;', '"></div>')
        );

        if (active === 1) {
          $('#'.concat(cid)).css('visibility', '');
          $('#'.concat(cid)).show();
          selectedCid = cid;
        }

        $('.control-box').append(
          '<span class="'
            .concat(active === 0 ? '' : 'active', ' itemBtn" style="cursor: default;" data-doc="')
            .concat(cid, '">')
            .concat(cid, '</span>')
        ); // sdk.setData({ data: JSON.stringify(list[i]) })

        switch (is_board) {
          case 1: {
            sdk.createDocument({
              elId: cid,
              width: 800,
              height: 600,
              id: cid,
              docId: list[i].docId
            }); // sdk.setRemoteData(list[i])

            break;
          }

          case 2: {
            sdk.createBoard({
              elId: cid,
              // div 容器 必须
              width: 800,
              // div 宽度，像素单位，数值型不带px 必须
              height: 600,
              // div 高度，像素单位，数值型不带px 必须
              backgroundColor: list[i].backgroundColor || '#CCCCCC',
              // 背景颜色， 支持RGB 与 RGBA， 如果全透明，舞台背景色与网页背景色相同，如 ‘#FF0000’或 ‘#FF000000’ 必须
              id: cid
            }); // sdk.setRemoteData(list[i])

            break;
          }

          default:
            break;
        }
      }
      sdk.setRemoteData2(list);

      if (selectedCid !== '') {
        console.warn('调用选择容器方法');
        sdk.selectContainer({
          id: selectedCid
        });
      }
    });
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
    $('input[name=accountId]').val('guest_'.concat(Math.floor(1000 + Math.random() * 9000)));
  }

  if (paramObj['token']) {
    $('input[name=token]').val(paramObj['token']);
  }
};
