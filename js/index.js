const Application = PIXI.Application;
const Container = PIXI.Container;
const Loader = PIXI.loader;
const Resources = PIXI.loader.resources;
const Graphics = PIXI.Graphics;
const TextureCache = PIXI.utils.TextureCache;
const Sprite = PIXI.Sprite;
const Text = PIXI.Text;
const TextStyle = PIXI.TextStyle;
let utils = {
  /**
   * 角度转弧度
   * @param angle 角度
   * @return 弧度
   */
  angleToRadian: function(angle) {
    return (Math.PI * angle) / 180;
  },
  /**
   * 格式化时间戳
   * @param timestamp 时间戳
   * @return 格式化后的对象（包括是时分秒等）
   */
  formatTimestamp: function(timestamp) {
    var date = new Date(timestamp);
    return {
      Y: date.getFullYear(),
      M: date.getMonth() + 1,
      D: date.getDate(),
      h: date.getHours(),
      m: date.getMinutes(),
      s: date.getSeconds(),
    };
  },
  getTanDeg: function(tan) {
    var result = Math.atan(tan) / (Math.PI / 180);
    result = Math.round(result);
    return result;
  },
};
let client = {
  width: window.innerWidth,
  height: window.innerHeight,
};
let clockConfig = {
  // 表盘
  clockDial: {
    color: 0x127749,
  },
  // 刻度
  scale: {
    width: 16,
    height: 42,
    color: 0xc4a468,
  },
  // 表盘半径
  radius: 300,
  // 中心点
  center: {
    x: client.width / 2,
    y: client.height / 2,
  },
  // 时针
  hourHand: {
    width: 18,
    height: 160,
    color: 0xffffff,
  },
  // 分针
  minuteHand: {
    width: 18,
    height: 240,
    color: 0xffffff,
  },
  // 分针
  secondHand: {
    width: 8,
    height: 320,
    color: 0xffffff,
  },
};
let pixiConfig = {
  width: client.width,
  height: client.height,
  antialiasing: true,
  transparent: false,
  resolution: 2,
  forceFXAA: true,
  backgroundColor: clockConfig.clockDial.color,
};
let config = {
  client,
  clock: clockConfig,
  pixi: pixiConfig,
};

class Clock {
  constructor(option) {
    const _this = this;
    _this.option = option;
    _this.clockDial = null; // 表盘
    _this.clockScale = null; // 刻度
    _this.secondHand = null; // 秒针
    _this.minuteHand = null; // 分针
    _this.hourHand = null; // 时针
    _this.pixiApp = new Application(_this.option.pixi);
    document.body.appendChild(_this.pixiApp.view);
    _this.createClockDial();
    _this.createClockScale();
    _this.createHourHand();
    _this.createMinuteHand();
    _this.createSecondHand();
    // Start the game loop
    _this.pixiApp.ticker.add(delta => {
      let timestamp = new Date().getTime();
      _this.setHourHandAngleByTime(timestamp);
      _this.setMinuteHandAngleByTime(timestamp);
      _this.setSecondHandAngleByTime(timestamp);
    });
    // 给canvas绑定事件
    _this.pixiApp.view.addEventListener('click', ev => {
      let offset = {
        x: ev.offsetX / option.pixi.resolution,
        y: ev.offsetY / option.pixi.resolution,
      };
      let angle = utils.getTanDeg((offset.y - option.clock.center.y) / (offset.x - option.clock.center.x));
      // 根据圆心和鼠标位置计算角度
      if (offset.y > option.clock.center.y && offset.x > option.clock.center.x) {
        angle += 0;
      } else if (offset.y > option.clock.center.y && offset.x < option.clock.center.x) {
        angle += 180;
      } else if (offset.y < option.clock.center.y && offset.x < option.clock.center.x) {
        angle += 180;
      } else if (offset.y < option.clock.center.y && offset.x > option.clock.center.x) {
        angle += 360;
      } else if (offset.y === option.clock.center.y && offset.x < option.clock.center.x) {
        angle += 180;
      } else if (offset.y === option.clock.center.y && offset.x > option.clock.center.x) {
        angle += 0;
      } else if (offset.y < option.clock.center.y && offset.x === option.clock.center.x) {
        angle += 360;
      }
      // _this.clockScale.transform = new PIXI.Transform({
      //   scale: new PIXI.ObservablePoint({
      //     x: 10,
      //     y: 45
      //   })
      // })
      PIXI.IPoint = {
        x: 2,
        y: 2,
      };
      console.log(
        _this.clockScale.rotation = 1
      );
      // console.log(new PIXI.Transform());
    });
  }
  // 创建表盘
  createClockDial() {
    const _this = this;
    // 创建表盘组
    _this.clockDial = new Container();
    _this.pixiApp.stage.addChild(_this.clockDial);
  }
  // 创建刻度
  createClockScale() {
    const _this = this;
    let { option } = _this;
    // 创建刻度组
    _this.clockScale = new Container();
    // 设置刻度组的中心点，即表盘圆心坐标
    _this.clockScale.pivot.set(-option.clock.center.x, -option.clock.center.y);
    for (let i = 0; i < 12; i++) {
      let clockScaleItem = new Graphics();
      clockScaleItem.beginFill(option.clock.scale.color);
      clockScaleItem.drawRect(0, 0, option.clock.scale.width, option.clock.scale.height);
      clockScaleItem.endFill();
      // 设置每个刻度的中心点位置，以便于按刻度中心旋转
      clockScaleItem.pivot.set(option.clock.scale.width / 2, option.clock.scale.height / 2);
      // 计算刻度坐标
      // x1   =   x0   +   r   *   cos(ao   *   3.14   /180   )
      // y1   =   y0   +   r   *   sin(ao   *   3.14   /180   )
      clockScaleItem.position.x = option.clock.radius * Math.cos((Math.PI * i * 30) / 180);
      clockScaleItem.position.y = option.clock.radius * Math.sin((Math.PI * i * 30) / 180);
      // 旋转刻度
      clockScaleItem.rotation = utils.angleToRadian(i * 30 + 90);
      _this.clockScale.addChild(clockScaleItem);
      _this.clockDial.addChild(_this.clockScale);
    }
  }
  // 创建时针
  createHourHand() {
    const _this = this;
    let { option } = _this;
    // 创建时针组
    _this.hourHand = new Container();
    _this.clockDial.addChild(_this.hourHand);
    _this.hourHand.pivot.set(-option.clock.center.x, -option.clock.center.y);
    let hourHandItem = new Graphics();
    hourHandItem.beginFill(option.clock.hourHand.color);
    hourHandItem.drawRect(0, 0, option.clock.hourHand.width, option.clock.hourHand.height);
    hourHandItem.endFill();
    hourHandItem.pivot.set(option.clock.hourHand.width / 2, option.clock.hourHand.height / 1.2);
    // 旋转刻度
    hourHandItem.rotation = utils.angleToRadian(0);
    // 阴影
    let dropShadowFilter = new PIXI.filters.DropShadowFilter({
      color: 0x074e2e,
      alpha: 0.65,
      blur: 4,
      distance: 8,
    });
    hourHandItem.filters = [dropShadowFilter];
    _this.hourHand.addChild(hourHandItem);
  }
  // 创建分针
  createMinuteHand() {
    const _this = this;
    let { option } = _this;
    // 创建分针组
    _this.minuteHand = new Container();
    _this.clockDial.addChild(_this.minuteHand);
    _this.minuteHand.pivot.set(-option.clock.center.x, -option.clock.center.y);
    let minuteHandItem = new Graphics();
    minuteHandItem.beginFill(option.clock.minuteHand.color);
    minuteHandItem.drawRect(0, 0, option.clock.minuteHand.width, option.clock.minuteHand.height);
    minuteHandItem.endFill();
    minuteHandItem.pivot.set(option.clock.minuteHand.width / 2, option.clock.minuteHand.height / 1.2);
    // 旋转刻度
    minuteHandItem.rotation = utils.angleToRadian(0);
    // 阴影
    let dropShadowFilter = new PIXI.filters.DropShadowFilter({
      color: 0x074e2e,
      alpha: 0.5,
      blur: 6,
      distance: 10,
    });
    minuteHandItem.filters = [dropShadowFilter];
    _this.minuteHand.addChild(minuteHandItem);
  }
  // 创建秒针
  createSecondHand() {
    const _this = this;
    let { option } = _this;
    // 创建秒针组
    _this.secondHand = new Container();
    _this.clockDial.addChild(_this.secondHand);
    _this.secondHand.pivot.set(-option.clock.center.x, -option.clock.center.y);
    let secondHandItem = new Graphics();
    secondHandItem.beginFill(option.clock.secondHand.color);
    secondHandItem.drawRect(0, 0, option.clock.secondHand.width, option.clock.secondHand.height);
    secondHandItem.endFill();
    secondHandItem.pivot.set(option.clock.secondHand.width / 2, option.clock.secondHand.height / 1.2);
    // 旋转刻度
    secondHandItem.rotation = utils.angleToRadian(0);
    // 阴影
    let dropShadowFilter = new PIXI.filters.DropShadowFilter({
      color: 0x074e2e,
      alpha: 0.5,
      blur: 10,
      distance: 10,
    });
    secondHandItem.filters = [dropShadowFilter];
    _this.secondHand.addChild(secondHandItem);
  }
  // 根据时间戳设置时针角度
  setHourHandAngleByTime(timestamp) {
    const _this = this;
    let { option } = _this;
    let _formatTimestamp = utils.formatTimestamp(timestamp);
    let h = _formatTimestamp.h;
    let m = _formatTimestamp.m;
    h = h + (5 * m) / 3 / 100;
    _this.hourHand.getChildAt(0).rotation = utils.angleToRadian((360 / 12) * h);
  }
  // 根据时间戳设置分针角度
  setMinuteHandAngleByTime(timestamp) {
    const _this = this;
    let { option } = _this;
    let _formatTimestamp = utils.formatTimestamp(timestamp);
    let h = _formatTimestamp.h;
    let m = _formatTimestamp.m;
    let s = _formatTimestamp.s;
    m = m + (5 * s) / 3 / 100;
    _this.minuteHand.getChildAt(0).rotation = utils.angleToRadian((360 / 60) * m);
  }
  // 根据时间戳设置秒针角度
  setSecondHandAngleByTime(timestamp) {
    const _this = this;
    let { option } = _this;
    let _formatTimestamp = utils.formatTimestamp(timestamp);
    let h = _formatTimestamp.h;
    let m = _formatTimestamp.m;
    let s = _formatTimestamp.s;
    _this.secondHand.getChildAt(0).rotation = utils.angleToRadian((360 / 60) * s);
  }
}

new Clock(config);
