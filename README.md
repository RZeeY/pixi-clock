先上效果图:
<br />
![](https://user-gold-cdn.xitu.io/2020/1/13/16f9f538d60721d2?w=964&h=810&f=gif&s=4331102)
<br />
预览地址: https://rzeey.github.io/pixi-clock/index.html
<br />
源码: https://github.com/RZeeY/pixi-clock


### 1. 定义一些常量以及需要使用到的工具方法

为了方便书写PIXI的方法等，我们先定义一些常量和工具方法

```javascript
const Application = PIXI.Application;
const Container = PIXI.Container;
const Container3d = PIXI.projection.Container3d;
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
```

### 2. 定义Clock类

定义一个“Clock”类，同时创建实例的时候我们给予一个配置参数“option”（用于配置表盘、指针等）。

```javascript
class Clock {
    constructor(option) {
    }
}
```

### 3. 为Clock类添加必要的方法

然后我们思考一下，创建一个表需要哪些方法

* 创建表盘的容器
* 创建刻度的容器
* 创建包含所有指针的容器
* 创建时针的容器
* 创建分针的容器
* 创建秒针的容器
    
如果要让时针、分针、秒针根据时间转动起来还要给予Clock下面三个方法

* 根据时间调整时针的角度
* 根据时间调整分针的角度
* 根据时间调整秒针的角度

```javascript
class Clock {
    constructor(option) {
    }
    // 创建表盘
    createClockDial() {}
    // 创建刻度
    createClockScale() {}
    // 创建指针
    createHand() {}
    // 创建时针
    createHourHand() {}
    // 创建分针
    createMinuteHand() {}
    // 创建秒针
    createSecondHand() {}
    // 根据时间戳设置时针角度
    setHourHandAngleByTime(timestamp) {}
    // 根据时间戳设置分针角度
    setMinuteHandAngleByTime(timestamp) {}
    // 根据时间戳设置秒针角度
    setSecondHandAngleByTime(timestamp) {} 
}
```

#### 3.1 构造函数 constructor

我们再看看构造函数里我们需要处理的事情。首先我们需要拿到配置项"option"，接着我们应该定义一些属性如表盘的对象、刻度的对象、指针的对象等。并且还要创建PIXI Application的实例。<br/>
以上步骤完成后我们再依次创建表盘、刻度、指针、时针、分针、秒针。

```javascript
class Clock {
    constructor(option) {
        const _this = this;
        _this.option = option;
        _this.clockDial = null; // 表盘
        _this.clockScale = null; // 刻度
        _this.secondHand = null; // 秒针
        _this.minuteHand = null; // 分针
        _this.hourHand = null; // 时针
        _this.hand = null; // 指针组
        _this.pixiApp = new Application(_this.option.pixi); // 根据option中pixi的配置来创建PIXI Application的实例
        document.body.appendChild(_this.pixiApp.view);
        // 创建表盘、刻度、指针、时针、分针、秒针
        _this.createClockDial();
        _this.createClockScale();
        _this.createHand();
        _this.createHourHand();
        _this.createMinuteHand();
        _this.createSecondHand();
    }
    // ...
}
```

#### 3.2 创建表盘 createClockDial

这一步用于创建表盘容器，表盘容器里面包括刻度、指针、时针、分针、秒针等5个组。

```javascript
class Clock {
    constructor(option) {
        const _this = this;
        // 创建表盘组
        _this.clockDial = new Container3d();
        // 将表盘组添加到舞台中
        _this.pixiApp.stage.addChild(_this.clockDial);
    }
}
```

#### 3.3 创建刻度 createClockScale

这一步用于创建刻度。我们将钟表的圆心创建在浏览器的中心即x = window.innerWidth / 2，y = window.innerHeight / 2。
<br />
随后在圆心的四周创建12个实心矩形，用于表示钟表的刻度。所以我们需要分别计算十二个矩形所在的x坐标和y坐标。
<br />
在已知半径r，圆心坐标x0、y0，角度angle的情况下，可采用 ```x1 = x0 + r * cos(ao * PI / 180)``` 和 ```y1 = y0 + r * sin(ao * PI /180)``` 计算出每个刻度所处的x和y坐标。

```javascript
class Clock {
    // ...
    // 创建刻度
    createClockScale() {
        const _this = this;
        let { option } = _this;
        // 创建刻度组
        _this.clockScale = new Container3d();
        // 设置刻度组的中心点，即表盘圆心坐标
        _this.clockScale.pivot.set(-option.clock.center.x, -option.clock.center.y);
        // 循环创建12个刻度矩形
        for (let i = 0; i < 12; i++) {
            // 创建图形
            let clockScaleItem = new Graphics();
            clockScaleItem.beginFill(option.clock.scale.color);
            clockScaleItem.drawRect(0, 0, option.clock.scale.width, option.clock.scale.height);
            clockScaleItem.endFill();
            // 设置每个刻度的中心点位置，以便于按刻度中心旋转
            clockScaleItem.pivot.set(option.clock.scale.width / 2, option.clock.scale.height / 2);
            // 计算刻度坐标
            // x1 = x0 + r * cos(ao * PI / 180)
            // y1 = y0 + r * sin(ao * PI /180)
            clockScaleItem.position.x = option.clock.radius * Math.cos((Math.PI * i * 30) / 180);
            clockScaleItem.position.y = option.clock.radius * Math.sin((Math.PI * i * 30) / 180);
            // 旋转刻度
            clockScaleItem.rotation = utils.angleToRadian(i * 30 + 90);
            // 将每个刻度图形添加进刻度组
            _this.clockScale.addChild(clockScaleItem);
        }
        // 将刻度组添加进表盘容器中
        _this.clockDial.addChild(_this.clockScale);
    }
    // ...
}
```

#### 3.4 创建指针 createHand

创建指针组，并添加到舞台中

```javascript
class Clock {
    // ...
    // 创建指针
    createHand() {
        const _this = this;
        let { option } = _this;
        _this.hand = new Container3d();
        _this.pixiApp.stage.addChild(_this.hand);
    }
    // ...
}
```

#### 3.5 创建时针 createHourHand

```javascript
class Clock {
    // ...
    // 创建时针
    createHourHand() {
        const _this = this;
        let { option } = _this;
        // 创建时针组
        _this.hourHand = new Container3d();
        _this.hand.addChild(_this.hourHand);
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
            color: option.clock.hourHand.shadow.color,
            alpha: 0.65,
            blur: 4,
            distance: 8,
        });
        hourHandItem.filters = [dropShadowFilter];
        _this.hourHand.addChild(hourHandItem);
    }
    // ...
}
```

#### 3.6 创建分针 createMinuteHand

```javascript
class Clock {
    // ...
    // 创建分针
    createMinuteHand() {
        const _this = this;
        let { option } = _this;
        // 创建分针组
        _this.minuteHand = new Container3d();
        // 将分针组添加进指针组中
        _this.hand.addChild(_this.minuteHand);
        _this.minuteHand.pivot.set(-option.clock.center.x, -option.clock.center.y);
        // 创建分针图形
        let minuteHandItem = new Graphics();
        minuteHandItem.beginFill(option.clock.minuteHand.color);
        minuteHandItem.drawRect(0, 0, option.clock.minuteHand.width, option.clock.minuteHand.height);
        minuteHandItem.endFill();
        minuteHandItem.pivot.set(option.clock.minuteHand.width / 2, option.clock.minuteHand.height / 1.2);
        // 旋转刻度
        minuteHandItem.rotation = utils.angleToRadian(0);
        // 阴影
        let dropShadowFilter = new PIXI.filters.DropShadowFilter({
            color: option.clock.minuteHand.shadow.color,
            alpha: 0.5,
            blur: 6,
            distance: 10,
        });
        minuteHandItem.filters = [dropShadowFilter];
        // 将分针图形添加进分针组中
        _this.minuteHand.addChild(minuteHandItem);
    }
    // ...
}
```

#### 3.7 创建秒针 createSecondHand

```javascript
class Clock {
    // ...
    // 创建秒针
    createSecondHand() {
        const _this = this;
        let { option } = _this;
        // 创建秒针组
        _this.secondHand = new Container3d();
        // 将秒针组添加到指针组中
        _this.hand.addChild(_this.secondHand);
        _this.secondHand.pivot.set(-option.clock.center.x, -option.clock.center.y);
        // 创建指针图形
        let secondHandItem = new Graphics();
        secondHandItem.beginFill(option.clock.secondHand.color);
        secondHandItem.drawRect(0, 0, option.clock.secondHand.width, option.clock.secondHand.height);
        secondHandItem.endFill();
        secondHandItem.pivot.set(option.clock.secondHand.width / 2, option.clock.secondHand.height / 1.2);
        // 旋转刻度
        secondHandItem.rotation = utils.angleToRadian(0);
        // 阴影
        let dropShadowFilter = new PIXI.filters.DropShadowFilter({
            color: option.clock.secondHand.shadow.color,
            alpha: 0.5,
            blur: 10,
            distance: 10,
        });
        secondHandItem.filters = [dropShadowFilter];
        // 将秒针图形添加进秒针组中
        _this.secondHand.addChild(secondHandItem);
    }
    // ...
}
```

#### 3.8 根据时间戳设置三个指针角度&nbsp;setHourHandAngleByTime、setMinuteHandAngleByTime、setSecondHandAngleByTime

我们以时针为例。首先时针不是一直都的对准某一刻度的，比如2:30，时针就指向了2点和1点的中间，所以我们要将整数“时”转换为小数“时”。比如2:30就是2.5时。我们采用 ```h = h + (5 * m) / 3 / 100``` 这样的公式转换小数。再通过Container对象的rotation属性设置当前时针所处的角度。

```javascript
class Clock {
    // ...
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
    // ...
}
```

### 4. 让指针动起来

再回到Clock的构造函数中，我们创建了钟表所需的各个元素，但并没有让指针动起来。
<br />
通过调用PIXI.Application对象的ticker.add方法可实现动画。
<br />
在ticker.add的每次一回调函数中都获取一次当前时间戳，并通过时间戳更改时分秒的指针角度。

```javascript
class Clock {
    constructor(option) {
        // ...
        _this.pixiApp.ticker.add(delta => {
            // 获取时间戳
            let timestamp = new Date().getTime();
            // 根据时间戳设置时分秒针的角度
            _this.setHourHandAngleByTime(timestamp);
            _this.setMinuteHandAngleByTime(timestamp);
            _this.setSecondHandAngleByTime(timestamp);
        });
    }
    // ...
}
```

### 5. 最后再添加一个视差效果！

```javascript
class Clock {
    constructor(option) {
        // ...
        // 给canvas绑定mousemove事件
        _this.pixiApp.view.addEventListener('mousemove', ev => {
            let offset = {
                x: ev.offsetX / option.pixi.resolution,
                y: ev.offsetY / option.pixi.resolution,
            };
            // 让刻度组根据鼠标和圆心的位置，向鼠标的反方向移动
            _this.clockScale.position3d.x = -(offset.x - option.clock.center.x) * 0.01;
            _this.clockScale.position3d.y = -(offset.y - option.clock.center.y) * 0.01;
            // 让指针组根据鼠标和圆心的位置，向鼠标的正方向移动
            _this.hand.position3d.x = (offset.x - option.clock.center.x) * 0.016;
            _this.hand.position3d.y = (offset.y - option.clock.center.y) * 0.016;
        });
    }
    // ...
}
```

最后new一个Clock实例就大功告成了！
