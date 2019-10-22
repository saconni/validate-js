
function _validate(obj, acc, def, ctx = null) {
  ctx = ctx || new Context()
  // if it is not optional, assume it's required
  if(!def['optional']) def.required = true
  // get the value
  let val = obj
  // run all the validators in def
  Object.keys(validators).forEach(key => {
    if(acc != null) val = obj[acc]
    if(!_isNull(def[key])) {
      validators[key](val, def[key], ctx)
    }
  })
  return ctx
}

function Context() {
  this.errors = []
  this.path = ['value']
  this.stack = []
}

Context.prototype.getCurrentPath = function() {
  return this.path.join('')
} 

function _isNull(val) {
  return typeof val === 'undefined' || val == null
}

let validators = {
  // optional
  optional: (val, opt, ctx) => {},
  // default
  default: (val, opt, ctx) => {
    if(_isNull(val)) {
      if(ctx.stack.length < 1) {
        throw new Error('invalid definition: default is only valid for composed values')
      }
      let obj = ctx.stack.slice(-1)[0]
      let acc = ctx.path.slice(-1)[0]
      if(acc.startsWith('.')) {
        acc = acc.slice(1)
      }
      else {
        acc = parseInt(acc.slice(1,-1))
      }
      // if opt is a function, resolve it
      if(typeof opt === 'function') opt = opt()
      obj[acc] = opt
    }
  },
  // required
  required: (val, opt, ctx) => {
    if(opt && _isNull(val)) {
      ctx.errors.push(`${ctx.getCurrentPath()} is required`)
    }
  },
  // type
  type: (val, opt, ctx) => {
    if(_isNull(val)) return
    if(typeof val !== opt) {
      ctx.errors.push(`${ctx.getCurrentPath()} is not ${opt}`)
    }
  },
  // schema
  schema: (val, opt, ctx) => {
    if(_isNull(val)) return
    ctx.stack.push(val)
    // if opt is a function, resolve it
    if(typeof opt === 'function') opt = opt()
    Object.keys(opt).forEach(o => {
      ctx.path.push(`.${o}`)
      _validate(val, o, opt[o], ctx)
      ctx.path.pop()
    })
    ctx.stack.pop()
  },
  // items
  items: (val, opt, ctx) => {
    if(_isNull(val)) return
    if(typeof val.forEach !== 'function') {
      ctx.errors.push(`${ctx.getCurrentPath()} is not iterable`)
      return
    }
    ctx.stack.push(val)
    // if opt is a function, resolve it
    if(typeof opt === 'function') opt = opt()
    val.forEach((item, ix) => {
      ctx.path.push(`[${ix}]`)
      _validate(val, ix, opt, ctx)
      ctx.path.pop()
    })
    ctx.stack.pop()
  }
}

module.exports.validate = (value, definition, options) => { 
  let errors = _validate(value, null, definition).errors
  if(errors.length == 0) errors = null
  return errors
}