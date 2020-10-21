/* eslint-disable no-undef */
/**
 *
 * Created Date: 2019-07-31, 14:39:46 (zhenliang.sun)
 * Last Modified: 2019-09-25, 21:20:26 (zhenliang.sun)
 * Email: zhenliang.sun@gmail.com
 *
 * Distributed under the MIT license. See LICENSE file for details.
 * Copyright (c) 2019 vhall
 */
window.onload = function () {
  eruda.init()
  player = null
  docSDK = null
  $('.main').hide()
  buildSelection()
  $('.btn-start').on('click', function (e) {
    $('.login').hide()
    $('.main').show()

    if (!VhallPlayer) {
      console.error('播放器未加载成功')
      return
    }

    if (!VHDocSDK) {
      console.error('文档SDK未加载成功')
      return
    }

    var appId = $('#appId').val()
    var accountId = $('#accountId').val()
    var token = $('#token').val()
    var recordId = $('#recordId').val()
    save2Local('appId', appId)
    save2Local('accountId', accountId)
    save2Local('recordId', recordId)
    var opt = {
      appId: appId,
      accountId: accountId,
      token: token,
      type: 'vod',
      videoNode: 'video',
      vodOption: {
        recordId: recordId
      }
    }
    var optDoc = {
      appId: appId,
      role: VHDocSDK.RoleType.SPECTATOR,
      isVod: true,
      client: VHDocSDK.Client.H5_WEB,
      accountId: accountId,
      token: token
    }
    docSDK = VHDocSDK.createInstance(optDoc, function () {
      initDocSDKListener()
      VhallPlayer.createInstance(
        opt,
        function (event) {
          player = event.vhallplayer
          player.openUI(false)
          player.openControls(true)
          console.log('播放器初始化成功')
        },
        function (err) {
          console.error(err)
        }
      )
    })
  })
  var paramObj = Qs.parse(location.search, {
    ignoreQueryPrefix: true
  })

  if (paramObj['appId']) {
    $('input[id=appId]').val(paramObj['appId'])
  }

  if (paramObj['recordId']) {
    $('input[id=recordId]').val(paramObj['recordId'])
  }

  if (paramObj['accountId']) {
    $('input[id=accountId]').val(paramObj['accountId'])
  } else {
    $('input[id=accountId]').val('vod_'.concat(Math.floor(1000 + Math.random() * 9000)))
  }

  if (paramObj['token']) {
    $('input[id=token]').val(paramObj['token'])
  }
}

function initDocSDKListener() {
  if (!docSDK) {
    console.error('docSDK初始化失败')
    return
  }

  docSDK.on(VHDocSDK.Event.VOD_TIME_UPDATE, function (e) {
    var container = e.container,
      activeId = e.activeId
    $('.document-container .board-box').css('display', 'none')

    if (!e.watchOpen) {
      return
    }

    if (activeId) {
      docSDK.selectContainer({
        id: activeId
      })

      if ($('#'.concat(activeId)).css('display') === 'block') {
        return
      }

      $('#'.concat(activeId)).css('display', 'block')
    }
  })
  docSDK.on(VHDocSDK.Event.VOD_CUEPOINT_LOAD_COMPLETE, function (e) {
    // 初始化UI
    var cids = docSDK.getVodAllCids()

    for (var i in cids) {
      var _cids$i = cids[i],
        cid = _cids$i.cid,
        type = _cids$i.type,
        backgroundColor = _cids$i.backgroundColor

      var _calcSize = calcSize($('.document-container').width(), RATIO_4_3),
        width = _calcSize.width,
        height = _calcSize.height

      var obj = {
        elId: cid,
        id: cid,
        width: width,
        height: height,
        backgroundColor: backgroundColor
      }
      $('.document-container').append('<div id="'.concat(cid, '" class="board-box"></div>'))

      switch (type) {
        case 'Document':
          docSDK.createDocument(obj)
          break

        case 'Board':
          docSDK.createBoard(obj)
          break

        default:
          break
      }
    }
  })
  docSDK.on(VHDocSDK.Event.VOD_CUEPOINT_USEABLE, function (e) {})
} // 以下方法仅在PC好使。移动端不好使。。。作罢

function buildSelection() {
  var buildInline = function buildInline(arr) {
    var template = '<option value="{{value}}"> </option>'
    var result = ''
    arr.forEach(function (item) {
      result += template.replace(/{{value}}/g, item)
    })
    return result
  }

  $('#appIdSearchList').append(buildInline(getLocal('appId')))
  $('#recordIdSearchList').append(buildInline(getLocal('recordId')))
  $('#accountIdSearchList').append(buildInline(getLocal('accountId')))
}
