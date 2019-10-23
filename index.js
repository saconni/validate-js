
function _validate(obj, acc, def, ctx) {
  if(typeof def == 'string') def = { type: def }
  // if it is not optional, assume it's required
  if(!def['optional']) def.required = true
  // run all the validators in def
  Object.keys(validators).forEach(key => {
    if(!_isNull(def[key])) {
      validators[key](obj, acc, def[key], ctx)
    }
  })
  return ctx
}

function Context() {
  this.errors = []
  this.path = []
  this.stack = []
}

Context.prototype.getCurrentPath = function() {
  return this.path.join('')
} 

function _isNull(val) {
  return typeof val === 'undefined' || val == null
}

function _getVal(obj, acc) {
  if(_isNull(acc)) {
    return obj
  }
  else {
    return obj[acc]
  }
}

let validators = {
  // optional
  optional: (obj, acc, opt, ctx) => {},
  // default
  default: (obj, acc, opt, ctx) => {
    if(_isNull(acc)) {
      throw new Error('invalid definition: default is only valid for composed values')
    }
    let val = _getVal(obj, acc)
    if(_isNull(val)) {
      // if opt is a function, resolve it
      if(typeof opt === 'function') opt = opt()
      obj[acc] = opt
    }
  },
  // required
  required: (obj, acc, opt, ctx) => {
    let val = _getVal(obj, acc)
    if(opt && _isNull(val)) {
      ctx.errors.push(`${ctx.getCurrentPath()} is required`)
    }
  },
  // type
  type: (obj, acc, opt, ctx) => {
    let val = _getVal(obj, acc)
    if(_isNull(val)) return
    if(opt == 'array') {
      if(!Array.isArray(val)) {
        ctx.errors.push(`${ctx.getCurrentPath()}: "${val}" is not array`)
      }
    }
    else if(opt == 'datetime') {
      obj[acc] = new Date(val)
    }
    else if(typeof val !== opt) {
      ctx.errors.push(`${ctx.getCurrentPath()}: "${val}" is not ${opt}`)
    }
  },
  // schema
  schema: (obj, acc, opt, ctx) => {
    let val = _getVal(obj, acc)
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
  items: (obj, acc, opt, ctx) => {
    let val = _getVal(obj, acc)
    if(_isNull(val)) return
    // if opt is a function, resolve it
    if(typeof opt === 'function') opt = opt()
    ctx.stack.push(val)
    if(typeof val.forEach === 'function') {
      val.forEach((item, ix) => {
        ctx.path.push(`[${ix}]`)
        _validate(val, ix, opt, ctx)
        ctx.path.pop()
      })
    }
    else if(typeof val == 'object') {
      Object.keys(val).forEach(key => {
        ctx.path.push(`.${key}`)
        _validate(val, key, opt, ctx)
        ctx.path.pop()
      })
    }
    else {
      ctx.errors.push(`${ctx.getCurrentPath()}: "${val}" is not iterable`)
    }
    ctx.stack.pop()
  },
  // in
  in: (obj, acc, opt, ctx) => {
    let val = _getVal(obj, acc)
    if(_isNull(val)) return
    if(opt.indexOf(val) == -1) {
      ctx.errors.push(`${ctx.getCurrentPath()}: "${val}" is not in ${JSON.stringify(opt)}`)
    }
  },
  bounds: (obj, acc, opt, ctx) => {
    let val = _getVal(obj, acc)
    if(_isNull(val)) return
    Object.keys(opt).forEach(cond => {
      switch(cond) {
        case 'gt':
          if(!(val > opt.gt))
            ctx.errors.push(`${ctx.getCurrentPath()}: "${val}" is not in greater than ${opt.gt}`)
          break;
        case 'gte':
          if(!(val >= opt.gte))
            ctx.errors.push(`${ctx.getCurrentPath()}: "${val}" is not in greater or equal than ${opt.gte}`)
          break;
          case 'lt':
            if(!(val < opt.lt))
              ctx.errors.push(`${ctx.getCurrentPath()}: "${val}" is not in lesser than ${opt.lt}`)
          break;
        case 'lte':
          if(!(val <= opt.lte))
            ctx.errors.push(`${ctx.getCurrentPath()}: "${val}" is not in lesser or equal than ${opt.lte}`)
          break;
        default:
          throw new Error(`invalid definition: unknown bounds condition "${cond}"`)
      }
    })
  },
  // either
  either: (obj, acc, opt, ctx) => {
    let val = _getVal(obj, acc)
    let tempCtx = new Context()
    tempCtx.stack = [...ctx.stack]
    tempCtx.path = [...ctx.path]
    for(let i = 0; i < opt.length; i++) {
      tempCtx.errors = []
      _validate(obj, acc, opt[i], tempCtx)
      if(tempCtx.errors.length == 0) return
    }
    ctx.errors.push(`${ctx.getCurrentPath()}: "${val}" does not match any valid criteria`)
  }
}

module.exports.validate = (value, definition, options = {}) => { 
  let ctx = new Context()
  ctx.path.push(options.prefix || 'value')
  let errors = _validate(value, null, definition, ctx).errors
  if(errors.length == 0) errors = null
  return errors
}