Function.prototype.polyfillApply = function (context, args) {
  console.log('--- 模拟 apply ---')
  context = context ? Object(context) : Window
 	context.fn = this

  const r = args ? eval('context.fn('+ args +')') : context.fn()

  delete context.fn

  return r
}

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