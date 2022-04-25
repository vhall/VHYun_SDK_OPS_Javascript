var form = layui.form;
form.on('submit(formDemo)', function (data) {
  var field = data.field;
  var htmlType = $('#htmlType').text();
  var href = null;
  switch (htmlType) {
    case 'HOST':
      href =
        './demoContent.html?appId=' +
        field.appId +
        '&roomId=' +
        field.roomId +
        '&channelId=' +
        field.channelId +
        '&accountId=' +
        field.accountId +
        '&token=' +
        field.token +
        '&user=' +
        htmlType +
        '&iscontinue=' +
        field.iscontinue;
      break;
    case 'VOD':
      href =
        './docVodContent.html?appId=' +
        field.appId +
        '&channelId=' +
        field.channelId +
        '&recordId=' +
        field.recordId +
        '&accountId=' +
        field.accountId +
        '&token=' +
        field.token +
        '&user=' +
        htmlType +
        '&liveType=' +
        field.liveType;
      break;
    case 'MIN-VOD':
      href =
        './h5DocVodContent.html?appId=' + field.appId + '&channelId=' + field.channelId + '&recordId=' + field.recordId + '&accountId=' + field.accountId + '&token=' + field.token;
      break;
    case 'WATCH':
      href =
        './watchContent.html?appId=' +
        field.appId +
        '&roomId=' +
        field.roomId +
        '&channelId=' +
        field.channelId +
        '&accountId=' +
        field.accountId +
        '&token=' +
        field.token +
        '&user=' +
        htmlType +
        '&liveType=' +
        field.liveType;
      break;
    case 'MIN-WATCH':
      href = './h5WatchContent.html?appId=' + field.appId + '&roomId=' + field.roomId + '&channelId=' + field.channelId + '&accountId=' + field.accountId + '&token=' + field.token;
      break;
    case 'ASSISTANT':
      href =
        './assistantContent.html?appId=' +
        field.appId +
        '&roomId=' +
        field.roomId +
        '&channelId=' +
        field.channelId +
        '&accountId=' +
        field.accountId +
        '&token=' +
        field.token +
        '&user=' +
        htmlType +
        '&liveType=' +
        field.liveType;
      break;
    default:
      break;
  }
  location.href = href;
});
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
