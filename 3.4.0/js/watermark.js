let sdk = null;
let option = {
  text: '版权所有，盗版必究',
  opacity: 0.5,
  fontSize: 12,
  angle: 15,
  color: '#000000'
};
let checked = false;
function initLayui() {
  layui.use('colorpicker', function () {
    layui.colorpicker.render({
      elem: '#defaultColor',
      // 绑定元素
      color: '#000000',
      size: 'sm',
      change: function change(color) {
        option.color = color;
        if (checked) {
          sdk.setWatermark(option);
        }
      }
    });
  });

  // 不透明度
  layui.use('slider', function () {
    // 渲染
    layui.slider.render({
      elem: '#slideOpacity',
      min: 0,
      max: 100,
      step: 1,
      value: 50,
      change: function (value) {
        option.opacity = value / 100;
        if (checked) {
          sdk.setWatermark(option);
        }
      }
    });
  });

  // 旋转角度
  layui.use('slider', function () {
    // 渲染
    layui.slider.render({
      elem: '#slideRotate',
      min: 0,
      max: 360,
      step: 1,
      value: 15,
      change: function (value) {
        option.angle = value;
        if (checked) {
          sdk.setWatermark(option);
        }
      }
    });
  });
  layui.form.on('switch(switch)', function () {
    checked = this.checked;
    if (checked) {
      sdk.setWatermark(option);
    } else {
      window.canvas.forEach(item => {
        item.overlayImage = null;
        item.renderAll();
      });
    }
  });
}

function initSDK() {
  sdk = VHDocSDK.createInstance({
    appId: $('#appId').text(),
    role: VHDocSDK.RoleType.SPECTATOR,
    isVod: true,
    client: VHDocSDK.Client.PC_WEB,
    accountId: $('#accountId').text(),
    token: $('#token').text()
  });
}

function textChange() {
  option.text = $('#text').val();
  option.text = option.text.slice(0, 20);
  $('#text').val(option.text);
  if (!option.text) {
    layer.msg('水印内容为必填项');
  }
  if (checked) {
    sdk.setWatermark(option);
  }
}
function fontSizeChange() {
  let fontSize = $('#fontSize').val();
  if (fontSize > 48) {
    fontSize = 48;
    layer.msg('字体大小取值范围为12-48');
  }
  if (fontSize < 12) {
    fontSize = 12;
    layer.msg('字体大小取值范围为12-48');
  }
  $('#fontSize').val(fontSize);
  option.fontSize = fontSize;
  if (checked) {
    sdk.setWatermark(option);
  }
}
initLayui();
initSDK();

setTimeout(() => {
  sdk.createBoard({
    elId: 'board',
    width: 400,
    height: 300
  });
}, 1000);
