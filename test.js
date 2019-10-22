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
    }
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
  }
}

console.log(validate(obj, constraints))
console.log(obj)