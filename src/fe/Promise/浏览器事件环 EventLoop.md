---
category:
  - 前端
  - Promise
tag:
  - 珠峰架构
---

# 浏览器事件环 EventLoop

> - 浏览器使用事件环实现了异步概念。
>
> - js 的单线程，实际上指的是主线程是单线程，使用 setTimeout、ajax、webwork 等时仍会创建其他线程。

## 1. 浏览器的进程

进程是计算机分配任务的最小单位，进程中包含多个线程，浏览器是多进程的，例如：

- 每一个页卡都是进程 (互不影响)
- 浏览器也有一个主进程 (用户界面)
- 渲染进程 每个页卡里 都有一个渲染进程 (浏览器内核)
- 网络进程 （处理请求）
- `GPU`进程 `3d`绘制
- 第三方插件的进程

## 2. 渲染进程

进程包含多个线程：

- GUI渲染线程 （渲染页面的）
- `js`引擎线程 他和页面渲染时互斥，因为共用了一个线程，即单线程
- 事件触发线程 独立的线程 `EventLoop`
- 事件 `click`、`setTimeout`、`ajax`也是一个独立线程

> 微任务队列每次都会创建一个全新的队列、事件队列仅有一个

<img src="/Users/haohaiyou/Library/Application Support/typora-user-images/image-20240530001334966.png" alt="image-20240530001334966" style="zoom: 50%;" />

- 事件队列、消息队列：存放定时器到达时间的回调函数、`ajax`回调成功的函数等
- 事件循环：不断检测调用栈是否为空，如果为空则从事件对列中取出一个来执行



① JS执行的时候，会从上到下执行，遇到函数会创建执行上下文放入到**执行栈**中，执行完毕后会出栈，执行时可能会遇到如 ajax、setTimeout、event 的异步事件，此时内部会调用**浏览器 Api**。

② 当执行上下文栈都执行完毕后，异步事件执行完成，会被维护到一个事件队列（消息队列、宏任务对接）中，队列先进先出。（异步事件执行完毕才被放到宏任务队列中）

③ 事件循环线程检测当前执行栈是否为空，如果为空，则从事件队列中取出**一个**任务放到执行栈中执行（执行宏任务）。（事件循环线程是单独线程，不会阻塞 js 执行）

④ 当代码执行时，还会有一些任务。每次执行宏任务的时候，都会单独创建一个微任务队列，队列先进先出。(每执行一个宏任务，会执行全部微任务，然后清空微任务)

⑤ 微任务执行完毕后，会清空微信无队列，浏览器会检测是否重新GUI渲染（浏览器刷新频率 16.6ms，如果没到这个时间，可能会不渲染），后继续执行剩余宏任务。

⑥ 每次循环一次都会执行一个宏任务，并清空对应的微任务队列，每次循环完毕后，都要看是否需要渲染，如果需要渲染才渲染。

## 3. 宏任务与微任务

- 宏任务：`script`脚本执行、 `ui` 渲染、`setTimeout`、`setInterval`、`postMessage`、`MessageChannel`、`setImmediate`、事件、`ajax`
- 微任务：`promise.then`、 `mutationObserver`、`process.nextTick`

> 每循环一次会执行一个宏任务，并清空对应的微任务队列，每次事件循环完毕后会判断页面是否需要重新渲染 （大约`16.6ms`会渲染一次）
>
> 微任务执行中再生成微任务，会在本轮直接清空。微任务产生宏任务，会放到宏任务栈中，等待执行。

## 4. 宏任务、微任务与 GUI 渲染

### 4.1 宏任务与 GUI 渲染

```js
<script>
  document.body.style.background = 'red';
	console.log(1)
	setTimeout(() => {
    console.log(2)
    document.body.style.background = 'yellow';
  }, 0)
	console.log(3);
</script>

// 执行结果
// 1 3 2
// 颜色不一定，有时从红变黄，有时一直是黄色，看执行时是否达到渲染时机
```

### 4.2 微任务与 GUI 渲染

```js
<script>
  document.body.style.background = 'red';
	console.log(1)
	Promise.resolve().then(()=>{
    console.log(2)
    document.body.style.background = 'yellow';
  })
	console.log(3);
</script>

// 执行结果
// 1 3 2
// 颜色一直是黄色，因为 GUI 渲染在微任务之后执行
```

## 5 事件任务

```js
<script>
  button.addEventListener('click',()=>{
    console.log('listener1');
    Promise.resolve().then(()=>console.log('micro task1')) // 微任务
  })
  button.addEventListener('click',()=>{
    console.log('listener2');
    Promise.resolve().then(()=>console.log('micro task2'))
  })
  button.click(); // 相当于执行栈中自上而下执行 click1() click2()，打印结果为 listener1 listener2 micro task1 micro task2
</script>
```

```js
<button id='button'>点击</button>
<script>
  button.addEventListener('click',()=>{
    console.log('listener1');
    Promise.resolve().then(()=>console.log('micro task1')) // 微任务
  })
  button.addEventListener('click',()=>{
    console.log('listener2');
    Promise.resolve().then(()=>console.log('micro task2'))
  })
  // js 脚本执行完毕，点击页面按钮，相当于两个宏任务（点击事件为宏任务），一个一个执行，打印结果为 listener1 micro task1 listener2 micro task2
</script>
```

## 6 定时器任务

```js
<script>
  Promise.resolve().then(() => { // Promise1
    console.log('Promise1')
    setTimeout(() => { // setTimeout2
      console.log('setTimeout2')
    }, 0);
  });
  setTimeout(() => { // setTimeout1
    console.log('setTimeout1');
    Promise.resolve().then(() => { // Promise2
      console.log('Promise2')
    })
  }, 0);
</script>
// js脚本是宏任务，脚本执行完毕后先清空微任务。
// js脚本执行时，存储微任务 [Promise1]，宏任务 [setTimeout1]。
// js脚本执行完毕，执行并清空微任务 Promise1，打印 Promise1，并执行宏任务，此时微任务队列变为 []，宏任务队列变为 [setTimeout1, setTimeout2]。
// 执行宏任务 setTimeout1，打印 setTimeout1，并向微任务队列添加 Promise2，且执行并清空微任务，打印 Promise2，此时微任务队列变为 []，宏任务队列变为 [setTimeout2]。
// 执行宏任务 setTimeout2，打印 setTimeout2，此时微任务队列变为 []，宏任务队列变为 []，结束。
// 打印结果：Promise1 setTimeout1 Promise2 setTimeout2
```

## 7 任务执行

```js
console.log(1);
async function async () {
    console.log(2);
    await console.log(3);
    console.log(4)
}
setTimeout(() => {
	console.log(5);
}, 0);
const promise = new Promise((resolve, reject) => {
    console.log(6);
    resolve(7)
})
promise.then(res => {
	console.log(res)
})
async (); 
console.log(8);

// 1 6 2 3 8 7 4 5
```

> 扩展：掌握Vue中 `nextTick` 原理
