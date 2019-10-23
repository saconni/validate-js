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
    a: { either: ['object', 'function'] }
  }
}

let id = module.exports.id = {
  type: 'string'
}

let constraints = {
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
    a: () => 1
  }
}

console.log(validate(obj, constraints))
console.log(obj)