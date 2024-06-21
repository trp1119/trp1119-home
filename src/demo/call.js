Function.prototype.polyfillCall = function (context) {
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

// 测试
function fn1 () {
  console.log('fn1', this, arguments)
}

function fn2 () {
  console.log('fn2', this, arguments)
}

fn1.polyFillCall('hello', 1, 2) // 'fn1' String {'hello', fn: ƒ} [1, 2]
fn1.polyFillCall(fn2) // 'fn1' fn2 () { console.log('fn2', this, arguments) } [] // 注意，此时 context.fn = this 中的 this 是 fn1
fn1.polyFillCall.polyFillCall.polyFillCall(fn2) // 'fn2' Window [] // 多个 call，会将 call 方法执行，并将 call 中 this 改编为 fn2