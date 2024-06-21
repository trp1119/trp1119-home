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