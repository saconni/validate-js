let { validate } = require('./index')


let checkpoint = module.exports.checkpoint = {
  type: 'object',
  schema: {
    id: { type: 'string' },
    name: { type: 'string' },
    description: { type: 'string' }    
  }
}

let path = module.exports.path = {
  schema: {
    test: { default: 'rodo', type: 'string'},
    id: { type: 'string' },
    name: { type: 'string' },
    checkpoints: { items: () => checkpoint },
    test1: {
      default: [null, 2, 3],
      items: {
        default: 'a'
      }
    },
    dev: { in: ['rodo', 'maxi'] },
    length: { bounds: { gt: 1, lt: 10 } },
    a: { either: 'something' }
  }
}

let id = module.exports.id = {
  type: 'string'
}

let constraints = {
  strict: false,
  schema: {
    body: path
  }
}

let obj = {
  body: {
    id: '1', 
    name: 'rodo', 
    checkpoints: [1, 2],
    dev: 'pablo',
    length: 10,
    a: 'a',
    b: 1,
  }
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
    defaul: { optional: true },
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

console.log(validate(constraints, meta))

/*
console.log(validate(obj, constraints))
console.log(obj)
*/