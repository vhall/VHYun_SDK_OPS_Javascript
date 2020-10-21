/* eslint-disable no-undef */
window.onload = function () {
  var form = layui.form;
  var sdk;
  var player;
  var loading;
  layui.use('form', function () {
    form.on('submit(formDemo)', function (data) {
      loading = layer.load(0, {
        shade: [0.1, '#fff']
      });
      installDocSDK(data.field);
    });
  });

  function loadVideo(params) {
    var appId = params.appId;
    var accountId = params.accountId;
    var token = params.token;
    var recordId = params.recordId; // 创建实例参数

    var opt = {
      appId: appId,
      // 应用ID   必填
      accountId: accountId,
      // 第三方用户ID     必填
      token: token,
      // access_token  必填
      type: 'vod',
      // live 直播  vod 点播  必填
      videoNode: 'video',
      // 播放器的容器
      vodOption: {
        recordId: recordId
      },
      autoplay: false
    }; // 创建实例

    VhallPlayer.createInstance(
      opt,
      function (event) {
        $('.login').hide();
        $('.main').show('fast');
        player = event.vhallplayer;
        player.openUI(false);
        player.openControls(true);
        window.player = player;
      },
      function (err) {
        layer.close(loading);
        console.error(err);
      }
    );
  }

  function installDocSDK(params) {
    var appId = params.appId;
    var accountId = params.accountId;
    var token = params.token;
    sdk = VHDocSDK.createInstance(
      {
        appId: appId,
        role: VHDocSDK.RoleType.SPECTATOR,
        isVod: true,
        client: VHDocSDK.Client.PC_WEB,
        accountId: accountId,
        token: token
      },
      function () {
        loadVideo(params);
      }
    );
    window.sdk = sdk;
    addEventListener();
  }

  function addEventListener() {
    sdk.on(VHDocSDK.Event.VOD_CUEPOINT_LOAD_COMPLETE, function (e) {
      $('#chapters').text(JSON.stringify(e.chapters));
      // 初始化UI
      var data = sdk.getVodAllCids();

      for (var i in data) {
        var _data$i = data[i];
        var cid = _data$i.cid;
        var type = _data$i.type;
        var backgroundColor = _data$i.backgroundColor;
        $('.board-box').append('<div id="'.concat(cid, '" class="boardBox hidden"></div>'));
        $('.control-box').append(
          '<span class="itemBtn" style="cursor: default;display:none;" data-doc="'
            .concat(cid, '">')
            .concat(cid, '</span>')
        );

        switch (type) {
          case 'Document':
            sdk.createDocument({
              elId: cid,
              width: 800,
              height: 600,
              id: cid,
              color: '#cccccc'
            });
            break;

          case 'Board':
            sdk.createBoard({
              elId: cid,
              // div 容器 必须
              width: 800,
              // div 宽度，像素单位，数值型不带px 必须
              height: 600,
              // div 高度，像素单位，数值型不带px 必须
              backgroundColor: backgroundColor || '#cccccc',
              // 背景颜色， 支持RGB 与 RGBA， 如果全透明，舞台背景色与网页背景色相同，如 ‘#FF0000’或 ‘#FF000000’ 必须
              id: cid
            });
            break;

          default:
            break;
        }
      }
      sdk.loadVodIframe();
    });

    sdk.on(VHDocSDK.Event.ALL_COMPLETE, function () {
      console.warn('所有文档加载完成');
      layer.close(loading);
    });

    sdk.on(VHDocSDK.Event.VOD_TIME_UPDATE, function (e) {
      if (!e.watchOpen || !e.activeId) {
        // switch off
        $('.control-box .itemBtn').css('display', 'none');
        $('.control-box .itemBtn').removeClass('active');
        $('.board-box .boardBox').removeClass('visable').addClass('hidden');
        return;
      }

      if (e.activeId) {
        sdk.selectContainer({
          id: e.activeId
        });

        if ($('.control-box .itemBtn[data-doc='.concat(e.activeId, ']')).hasClass('active')) return;
        if ($('.board-box #'.concat(e.activeId)).hasClass('visable')) return;
        $('.control-box .itemBtn').removeClass('active').css('display', 'block');
        $('.board-box .boardBox').removeClass('visable').addClass('hidden');
        $('.control-box .itemBtn[data-doc='.concat(e.activeId, ']')).addClass('active');
        $('.board-box #'.concat(e.activeId)).addClass('visable');
      }
    });
  }

  var paramObj = Qs.parse(location.search, {
    ignoreQueryPrefix: true
  });

  if (paramObj['appId']) {
    $('input[name=appId]').val(paramObj['appId']);
  }

  if (paramObj['recordId']) {
    $('input[name=recordId]').val(paramObj['recordId']);
  }

  if (paramObj['accountId']) {
    $('input[name=accountId]').val(paramObj['accountId']);
  } else {
    $('input[name=accountId]').val('vod_'.concat(Math.floor(1000 + Math.random() * 9000)));
  }

  if (paramObj['token']) {
    $('input[name=token]').val(paramObj['token']);
  }
};
