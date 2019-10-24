function _validate(obj, acc, def, ctx) {
  if(typeof def == 'string') def = { type: def }
  // default strict to true
  if(_isNull(def.strict)) def.strict = true
  // if it is not optional, assume it's required
  if(!def['optional']) def.required = true
  // keep a stack of validating values
  ctx.stack.push([obj, acc, def])
  // run all the validators in def
  Object.keys(validators).forEach(key => {
    if(!_isNull(def[key])) {
      validators[key](obj, acc, def[key], ctx)
    }
  })
  ctx.stack.pop()
  return ctx
}

function Context() {
  this.errors = []
  this.path = []
  this.stack = []
  this.assert = false
}

Context.prototype.getCurrentPath = function() {
  return this.path.join('')
}

Context.prototype.error = function(msg, inner) {
  let err = null
  if(inner) {
    err = [this.getCurrentPath(), msg, inner]
  }
  else {
    err = [this.getCurrentPath(), msg]
  }
  this.errors.push(err)
  if(this.assert) {
    throw new Error(JSON.stringify(err, null, 2))
  }
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

let metadef = {
  schema: {
    optional: { optional: true, type: 'boolean' },
    default: { optional: true },
    required: { optional: true, type: 'boolean' },
    type: { optional: true, type: 'string', in: ['boolean', 'string', 'array', 'datetime', 'object', 'function'] },
    schema: { optional: true, either: ['function', { type: 'object', items: () => metadef.schema }] },
    items: { optional: true, type: 'object', schema: () => metadef.schema },
    in: { optional: true, type: 'array' },
    bounds: { optional: true, type: 'object', schema: {
      gt: { optional: true },
      gte: { optional: true },
      lt: { optional: true },
      lte: { optional: true }
    } },
    either: { type: 'array', items: () => metadef.schema }
  }
}

let validators = {
  // optional
  optional: (obj, acc, opt, ctx) => {},
  // strict
  strict: (obj, acc, opt, ctx) => {},
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
      ctx.error(`is required`)
    }
  },
  // type
  type: (obj, acc, opt, ctx) => {
    let val = _getVal(obj, acc)
    if(_isNull(val)) return
    if(opt == 'array') {
      if(!Array.isArray(val)) {
        ctx.error(`is not array`)
      }
    }
    else if(opt == 'datetime') {
      obj[acc] = new Date(val)
    }
    else if(typeof val !== opt) {
      ctx.error(`is not ${opt}`)
    }
  },
  // schema
  schema: (obj, acc, opt, ctx) => {
    let val = _getVal(obj, acc)
    if(_isNull(val)) return
    // if opt is a function, resolve it
    if(typeof opt === 'function') opt = opt()
    Object.keys(opt).forEach(o => {
      ctx.path.push(`.${o}`)
      _validate(val, o, opt[o], ctx)
      ctx.path.pop()
    })
    if(ctx.stack.slice(-1)[0][2].strict) {
      Object.keys(val).forEach(key => {
        if(_isNull(opt[key])) {
          ctx.error(`unknown property "${key}"`)
        }
      })
    }
   },
  // items
  items: (obj, acc, opt, ctx) => {
    let val = _getVal(obj, acc)
    if(_isNull(val)) return
    // if opt is a function, resolve it
    if(typeof opt === 'function') opt = opt()
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
      ctx.error(`is not iterable`)
    }
  },
  // in
  in: (obj, acc, opt, ctx) => {
    let val = _getVal(obj, acc)
    if(_isNull(val)) return
    if(opt.indexOf(val) == -1) {
      ctx.error(`is not in ${JSON.stringify(opt)}`)
    }
  },
  // bounds
  bounds: (obj, acc, opt, ctx) => {
    let val = _getVal(obj, acc)
    if(_isNull(val)) return
    Object.keys(opt).forEach(cond => {
      switch(cond) {
        case 'gt':
          if(!(val > opt.gt))
            ctx.error(`is not greater than ${opt.gt}`)
          break;
        case 'gte':
          if(!(val >= opt.gte))
            ctx.error(`is not greater or equal than ${opt.gte}`)
          break;
          case 'lt':
            if(!(val < opt.lt))
              ctx.error(`is not lesser than ${opt.lt}`)
          break;
        case 'lte':
          if(!(val <= opt.lte))
            ctx.error(`is not lesser or equal than ${opt.lte}`)
          break;
        default:
          throw new Error(`invalid definition: unknown bounds condition "${cond}"`)
      }
    })
  },
  // either
  either: (obj, acc, opt, ctx) => {
    let val = _getVal(obj, acc)
    if(_isNull(val)) return
    let tempCtx = new Context()
    tempCtx.path = [...ctx.path]
    let errors = []
    for(let i = 0; i < opt.length; i++) {
      tempCtx.errors = []
      _validate(obj, acc, opt[i], tempCtx)
      if(tempCtx.errors.length == 0) return
      //errors.push(tempCtx.errors)
      errors = [...errors, ...tempCtx.errors]
    }
    ctx.error(`does not match any valid criteria`, errors)
  }
}

function _trustValidate(value, definition, options = {}) {
  let ctx = new Context()
  ctx.path.push(options.prefix || 'value')
  if(options.assert) {
    ctx.assert = true
  }
  let errors = _validate(value, null, definition, ctx).errors
  if(errors.length == 0) errors = null
  return errors
}

module.exports.validate = (value, definition, options = {}) => { 
  //_trustValidate(definition, meta, { assert: true, prefix: 'definition' })
  return _trustValidate(value, definition, options);
}

function orFunction(def) {
  return {
    optional: true,
    either: ['function', def]
  }
}

let meta_items = { type: 'object', schema: () => meta.schema }

let meta_schema = { type: 'object', items: { schema: () => meta.schema } }

let meta = { 
  schema: {
    optional: { optional: true, type: 'boolean' },
    strict: { optional: true, type: 'boolean' },
    default: { optional: true },
    required: { optional: true, type: 'boolean' },
    type: { optional: true, type: 'string', in: ['boolean', 'string', 'array', 'datetime', 'object', 'function'] },
    schema: orFunction(meta_schema),
    items: orFunction(meta_items),
    in: { optional: true, type: 'array' },
    bounds: { 
      optional: true, 
      type: 'object', 
      schema: {
        gt: { optional: true },
        gte: { optional: true },
        lt: { optional: true },
        lte: { optional: true }
      } 
    },
    either: { 
      optional: true, 
      type: 'array', 
      items: {
        schema: () => meta.schema
      }
    }
  }
}