# call、bind、apply 原理

## 1 call

### 1.1 使用

- 改变当前函数 this 指向
- 让当前函数立即执行
- 支持一个一个传参

```js
function fn () {
  console.log(this, arguments)
}

fn() // Window
fn.call() // Window // 不传相当相当于直接执行 fn
fn.call('hello') // String {'hello'} // object
fn.call('helllo', 1, 2) // String {'helllo'} [1, 2]

function fn1 () {
  console.log('fn1')
  this()
}

function fn2 () {
  console.log('fn2')
}

fn1.call(fn2) // 'fn1' 'fn2' // 让 fn1 的 this 指向 fn2，并让 fn1 执行
/**
*  相当于
Function.prototype.call = function (context) {
  this()
}
*/

fn1.call.call.call(fn2) // 'fn2'
/**
如上，无论写多少个 call，都是指的
function (context) {
  this()
}

方法
*/
```

### 1.2 原理

```js
Function.prototype.polyFillCall = function (context) {
  console.log('--- 模拟 call ---')
  context = context ? Object(context) : Window
  /**
   * 不能直接改变 this 指向。
   * this = 'hello' 是错误语法 SyntaxError: Invalid left-hand side in assignment。
   * 
   * 形如 .fn1() 形式，当 fn1 执行时，.前面是什么，this 就指向什么。
   * 
   * 但不能为字符串 'hello' 直接赋值 fn1，即 'hello'.fn1() 这种错误语法，可以将其包装为对象，Object('hello')。
   * Object('hello') => String {'hello'}
   * 
   * 为对象挂载函数 fn，此函数指向 fn1，此时的 this 便是 {}
   * {}.fn = fn1
   */
 	context.fn = this
  const args = []
  for (let i = 1; i < arguments.length; i++) { // 第 0 个为 context，所以从 1 开始 
    args.push('arguments['+ i +']')
  }
  /**
   * 利用数组 toString 方法
   * 字符串与数组拼接，字符串会调用其 toString 方法
   * 以此将参数一个一个传入 context.fn
   */
  const r = eval('context.fn('+ args +')') // eval 可以将字符串执行
  
  delete context.fn // 删除自己挂载的 fn，以免影响 context

  return r // 返回执行结果
}
```

### 1.3 测试

```js
function fn1 () {
  console.log('fn1', this, arguments)
}

function fn2 () {
  console.log('fn2', this, arguments)
}

fn1.polyFillCall('hello', 1, 2) // 'fn1' String {'hello', fn: ƒ} [1, 2]
fn1.polyFillCall(fn2) // 'fn1' fn2 () { console.log('fn2', this, arguments) } [] // 注意，此时 context.fn = this 中的 this 是 fn1
fn1.polyFillCall.polyFillCall.polyFillCall(fn2) // 'fn2' Window [] // 多个 call，会将 call 方法执行，并将 call 中 this 改编为 fn2
```

#### 1.3.1 fn1.polyFillCall(fn2) 解析

在这个调用中：

1. `polyFillCall` 被 `fn1` 调用。
2. `this` 指向 `fn1`。
3. `context` 为 `fn2`，所以 `fn1` 将作为 `fn` 方法添加到 `fn2` 上。
4. 当执行 `context.fn()`（即 `fn2.fn()`），`fn1` 的 `this` 指向 `fn2`，参数为 `[]`（空数组）。

#### 1.3.2 fn1.polyFillCall.polyFillCall.polyFillCall(fn2) 解析

在这个调用中：

1. 第一层调用 `polyFillCall`

   ```js
   fn1.polyFillCall
   ```

   此时，我们只获取了 `fn1.polyFillCall`，但并未调用它。这个获取操作返回的是 `Function.prototype.polyFillCall` 函数。

2. 第二层调用 `polyFillCall`

   ```js
   fn1.polyFillCall.polyFillCall
   ```

   这个调用可以分解为：

   ```js
   (fn1.polyFillCall).polyFillCall
   ```

   `fn1.polyFillCall` 返回的是 `Function.prototype.polyFillCall`，因此这段代码等价于：

   ```js
   Function.prototype.polyFillCall.polyFillCall
   ```

   这里 `Function.prototype.polyFillCall` 再次返回 `Function.prototype.polyFillCall`。

3. 第三层调用 `polyFillCall`

   ```js
   fn1.polyFillCall.polyFillCall.polyFillCall
   ```

   这个调用可以分解为：

   ```js
   (Function.prototype.polyFillCall.polyFillCall).polyFillCall
   ```

   这里 `Function.prototype.polyFillCall` 再次返回 `Function.prototype.polyFillCall`，因此等价于：

   ```js
   Function.prototype.polyFillCall.polyFillCall
   ```

   再次返回 `Function.prototype.polyFillCall`。

4. 最终调用

   ```js
   fn1.polyFillCall.polyFillCall.polyFillCall(fn2)
   ```

   这个调用可以分解为：

   ```js
   (Function.prototype.polyFillCall)(fn2)
   ```

   在这个调用中，`this` 是全局对象 `Window`，因为没有明确的调用对象。

5. `context` 为 `fn2`，所以 `Function.prototype.polyFillCall` 作为 `fn` 方法添加到 `fn2` 上。
6. 当执行 `context.fn()`（即 `fn2.fn()`），`Function.prototype.polyFillCall` 的 `this` 指向全局对象 `Window`，参数为 `[]`（空数组）。

> **关键点**
>
> `fn1.polyFillCall.polyFillCall.polyFillCall(fn2);` 实际上只是不断地返回 `Function.prototype.polyFillCall`，而在最终调用时，相当于直接调用了 `Function.prototype.polyFillCall(fn2)`。

## 2 apply

### 2.1 使用

- 改变当前函数 this 指向
- 让当前函数立即执行
- 支持数组形式传参

```js
function fn () {
  console.log(this, arguments)
}

fn() // Window
fn.call() // Window // 不传相当相当于直接执行 fn
fn.call('hello') // String {'hello'} // object
fn.call('helllo', [1, 2]) // String {'helllo'} [1, 2]

function fn1 () {
  console.log('fn1')
  this()
}

function fn2 () {
  console.log('fn2')
}

fn1.apply(fn2) // 'fn1' 'fn2' // 让 fn1 的 this 指向 fn2，并让 fn1 执行
/**
*  相当于
Function.prototype.call = function (context) {
  this()
}
*/

fn1.apply.apply.apply(fn2) // 'fn2'
/**
如上，无论写多少个 call，都是指的
function (context) {
  this()
}

方法
*/
```

### 2.2 原理

与 `call` 原理类似，只是传参方式由一个一个传变为传数组

```js
Function.prototype.polyfillApply = function (context, args) {
  console.log('--- 模拟 apply ---')
  context = context ? Object(context) : Window
 	context.fn = this

  const r = args ? eval('context.fn('+ args +')') : context.fn()

  delete context.fn

  return r
}
```

### 2.3 测试

```js
// 测试
function fn1 () {
  console.log('fn1', this, arguments)
}

function fn2 () {
  console.log('fn2', this, arguments)
}

fn1.polyfillApply('hello', [1, 2]) // 'fn1' String {'hello', fn: ƒ} [1, 2]
fn1.polyfillApply(fn2) // 'fn1' fn2 () { console.log('fn2', this, arguments) } []
fn1.polyfillApply.polyfillApply.polyfillApply(fn2) // 'fn2' Window []
```

## 3 bind

### 3.1 使用

- 返回新函数，绑定新函数 this 指向（高阶函数）
- 不会立即执行，需手动执行绑定后的新函数
- 支持一个一个传参
- 支持绑定时传参，亦支持新函数调用时传参
- 如果绑定的函数被 new 了，需要当前实例作为当前函数的 this，而不是绑定的内容
- 当前new 的实例需要能找到原类（原函数）的原型

```js
const obj = {
  name: 'zhangsan'
}

function fn () {
  console.log(this.name)
}

const bindFn = fn.bind(obj)
bindFn() // zhangsan
```

### 3.2 原理

```js
Function.prototype.polyfillBind = function (context) {
  const that = this
  // 此时为绑定阶段，参数 arguments 为 [{ name: 'zhangsan' }, '李四', '男']
  // arguments 对象是一个类数组对象，但它并不是一个真正的数组，因此它没有数组的方法，不能直接使用 arguments.slice(1)
  const bindArgs = Array.prototype.slice.call(arguments, 1) // 支持绑定时传参
  const fnBound = function () { // 返回新函数，当新函数被 new 时，需要使用实例作为 this
    // 此时为调用阶段，参数 arguments 为 [18]
    const args = Array.prototype.slice.call(arguments) // 支持调用时传参
    return that.apply(this instanceof fnBound ? this : context, bindArgs.concat(args)) // 使用 this instanceof fnBound 判断  this 是否是 new 的
  }
  // fnBound.prototype = this.prototype // 原型共用，两个方法指向同一个原型，但不推荐指向同一个

  // 使用原型链查找，而非共用原型
  function Fn () {} // 中间件函数 // Object.create 原理
  Fn.prototype = this.prototype
  fnBound.prototype = new Fn()
  return fnBound
}
```

> arguments 对象是一个类数组对象，但它并不是一个真正的数组，因此它没有数组的方法，不能直接使用 arguments.slice(1)

### 3.3 测试

```js
const obj = {
  name: 'zhangsan'
}

function fn (name, sex, age) { // 参数
  this.say = '说话'
  console.log(this)
  console.log(this.name, '参数 name 为' + name, '参数 sex 为' + sex, '参数 age 为' + age) // zhangsan 参数 name 为李四 参数 sex 为男 参数 age 为18
}

// ① 绑定时传参
const bindFn = fn.polyfillBind(obj, '李四', '男')
// ② 调用时传参
bindFn(18)

fn.prototype.flag = '信息'
const bindFn2 = fn.polyfillBind(obj, '王五', '男')
const instance = new bindFn2(20)
console.log(instance.flag) // '信息'

let a = {
  name: 'zhangsan'
}
```

## 4 扩展

### 4.1 JavaScript 中 `this` 的绑定规则

- **默认绑定**： 如果函数直接调用（没有显式指定上下文），`this` 默认绑定到全局对象（在浏览器中是 `window`，在 Node.js 中是 `global`）。

  > function foo() {
  >     console.log(this);
  > }
  > foo(); // 在浏览器中，this 指向 window

- **隐式绑定**：

  如果函数作为对象的方法调用，`this` 绑定到该对象。

  > const obj = {
  >     foo: function() {
  >         console.log(this);
  >     }
  > };
  > obj.foo(); // this 指向 obj

- **显式绑定**：

  使用 `call`、`apply` 或 `bind` 方法显式指定 `this`。

  > function foo() {
  >     console.log(this);
  > }
  > const obj = { value: 42 };
  > foo.call(obj); // this 指向 obj

- new 绑定：

  使用 `new` 操作符调用构造函数时，`this` 绑定到新创建的对象。

  > function Foo() {
  >     this.value = 42;
  > }
  > const obj = new Foo(); // this 指向新创建的对象

### 4.2 call 原理中 (Function.prototype.polyFillCall)(fn2) 中 this 指向 Window

1. 获取函数引用

   ```js
   const polyFillCall = Function.prototype.polyFillCall;
   ```

   这里 `polyFillCall` 是一个函数引用，没有绑定到任何对象。它等价于直接调用 `Function.prototype.polyFillCall`。

2. 调用函数：

   ```js
   polyFillCall(fn2);
   ```

   由于函数调用时没有显式指定上下文（没有通过对象调用），根据默认绑定规则，`this` 将绑定到全局对象（在浏览器中是 `window`）。

### 4.3 bind 原理中的原型链继承

> fnBound.prototype = this.prototype 和 function Fn () {} Fn.prototype = this.prototype fnBound.prototype = new Fn() 有什么不同？

1. 直接设置原型

   ```js
   fnBound.prototype = this.prototype
   ```

   这种方法将 `fnBound.prototype` 直接指向原函数的原型对象。这意味着 `fnBound` 和原函数共享同一个原型对象。任何对 `fnBound.prototype` 的修改都会污染影响到原函数的原型，进而影响所有其他共享该原型对象的实例。

   ```js
   function Original() {}
   Original.prototype.sayHi = function() { console.log('Hi'); };
   
   const boundFunction = function () {}
   boundFunction.prototype = Original.prototype // 直接设置
   
   // 修改 boundFunction 的原型
   boundFunction.prototype.sayHi = function() { console.log('Hello'); };
   
   // 创建 Original 的实例
   const originalInstance = new Original();
   originalInstance.sayHi(); // 输出 'Hello'，而不是预期的 'Hi'
   ```

2. 使用中间件函数 `Fn`

   ```js
   function Fn() {}
   Fn.prototype = this.prototype;
   fnBound.prototype = new Fn();
   ```

   这种方法通过一个中间件函数 `Fn` 创建了一个全新的对象，并将这个新对象作为 `fnBound` 的原型。这种方式可以避免上述问题。

   **`new Fn()` 创建一个新对象**：当我们调用 `new Fn()` 时，会创建一个新的对象 `obj`，这个对象的 `__proto__` 属性（即内部的 `[[Prototype]]` 属性）会指向 `Fn.prototype`。由于 `Fn.prototype` 被设置为 `this.prototype`，所以 `obj.__proto__` 最终指向了原始函数的原型 `this.prototype`。

   **原型链独立性**：`fnBound.prototype = new Fn()` 创建了一个新的对象 `obj`，并将这个对象作为 `fnBound` 的原型。因此，`fnBound.prototype` 是一个独立的对象，不会与 `this.prototype` 共享同一个原型对象。这样，即使修改 `fnBound.prototype`，也不会影响到 `this.prototype`。

   ```js
   function Original() {}
   Original.prototype.sayHi = function() { console.log('Hi'); };
   
   const boundFunction = function () {}
   
   // 间接设置
   const Fn = function () {}
   Fn.prototype = Original.prototype
   boundFunction.prototype = new Fn()
   
   // 修改 boundFunction 的原型
   boundFunction.prototype.sayHi = function() { console.log('Hello'); };
   
   // 创建 Original 的实例
   const originalInstance = new Original();
   originalInstance.sayHi(); // 输出 'Hi'
   ```

   

   