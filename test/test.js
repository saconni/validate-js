let assert = require('assert');
let validate = require('../')

describe('validate-js', () => {
  it('should correctly verify types', () => {
    let def = 'string'
    let val = 'some_string'
    assert(validate(val, def) === null)
  })
  it('should properly reject types', () => {
    let def = 'string'
    let val = 1
    assert(validate(val, def) !== null)
  })
  it('should properly reject non-array types', () => {
    let def = 'array'
    let val = 'i_am_not_an_array'
    assert(validate(val, def) !== null)
  })
  it('should properly validate internal schema', () => {
    let def = {
      schema: {
        fieldA: 'string',
        fieldB: 'number',
        fieldC: {
          type: 'object',
          schema: {
            fieldD: 'string'
          }
        }
      }
    }
    let obj = {
      fieldA: 'some_string',
      fieldB: 42,
      fieldC: {
        fieldD: 'another_string'
      }
    }
    assert(validate(obj, def) === null)
  })
  it('should properly reject non-macthing schemas', () => {
    let def = {
      strict: true,
      schema: {
        fieldA: 'string',
        fieldB: 'number',
        fieldC: {
          type: 'object',
          schema: {
            fieldD: 'string'
          }
        }
      }
    }
    let obj = {
      fieldA: 'some_string',
      fieldB: 42,
      fieldC: {
        fieldD: 'another_string'
      },
      aWeirdField: 'something_odd'
    }
    assert(validate(obj, def) !== null)
  })
  it('should properly parse datetime types', () => {
    let date = new Date()
    let def = { 
      schema: {
        field: 'datetime'
      }
    }
    let obj = {
      field: +date
    }
    assert(validate(obj, def) === null)
    assert(obj.field.getTime() === date.getTime())
  })
  it('should properly reject missing mandatory fields', () => {
    let def = {
      schema: {
        field: 'string'
      }
    }
    assert(validate({}, def) !== null)
  })
  it('should let pass missing optional fields', () => {
    let def = {
      schema: { 
        field: { optional: true }
      }
    }
    assert(validate({}, def) === null)
  })
  it('should properly fill missing fields using default', () => {
    let def = {
      schema: { 
        field: { default: 'a_default_value' }
      }
    }
    let obj = {}
    assert(validate(obj, def) === null)
    assert(obj.field === 'a_default_value')
  })
  it('should properly verify arrays internally', () => {
    let def = { type: 'array', items: 'number' }
    let arr = [0, 1, 2, 3, 4, 5]
    assert(validate(arr, def) === null)
  })
  it('should properly verify complex arrays', () => {
    let def = { 
      type: 'array', 
      items: { schema: { some_field: 'string' } } 
    }
    let arr = [{some_field: 'a_string'}, {some_field: 'another_string'}]
    assert(validate(arr, def) === null)
  })
  it('should properly reject invalid complex arrays', () => {
    let def = { 
      type: 'array', 
      items: { schema: { some_field: 'string' } } 
    }
    let arr = [{some_field: 'a_string'}, {some_field: 'another_string'}, 3]
    assert(validate(arr, def) !== null)
  })
  it('should properly iterate and validate object fields', () => {
    let def = { 
      type: 'object', 
      items: { schema: { some_field: 'string' } } 
    }
    let obj = {
      fieldA: {
        some_field: 'some_string'
      },
      fieldB: {
        some_field: 'some_other_string'
      },
    }
    assert(validate(obj, def) === null)
  })
  it('should properly reject invalid object fields', () => {
    let def = { 
      type: 'object', 
      items: { schema: { some_field: 'string' } } 
    }
    let obj = {
      fieldA: {
        some_field: 'some_string'
      },
      fieldB: {
        some_field: 1
      },
    }
    assert(validate(obj, def) !== null)
  })
  it('should validate content to be in', () => {
    let def = { in: ['left', 'right'] }
    let val = 'left'
    assert(validate(val, def) === null)
  })
  it('should reject content not in', () => {
    let def = { in: ['left', 'right'] }
    let val = 'center'
    assert(validate(val, def) !== null)
  })
  it('should properly reject gt bounds', () => {
    let def = { bounds: { gt: 10 } }
    let val = 10
    assert(validate(val, def) !== null)
  })
  it('should properly reject gte bounds', () => {
    let def = { bounds: { gte: 10 } }
    let val = 9
    assert(validate(val, def) !== null)
  })
  it('should properly reject lt bounds', () => {
    let def = { bounds: { lt: 10 } }
    let val = 10
    assert(validate(val, def) !== null)
  })
  it('should properly reject gte bounds', () => {
    let def = { bounds: { lte: 10 } }
    let val = 11
    assert(validate(val, def) !== null)
  })
  it('should properly validate either posibles definitions', () => {
    let def = {
      either: [
        {
          type: 'object',
          schema: { field: 'string' }
        },
        'function',
        {
          type: 'array',
          items: 'number'
        }
      ]
    }
    assert(validate(() => {}, def) === null)
    assert(validate({ field: 'some_string' }, def) === null)
    assert(validate([1,2,3,4,5], def) === null)
    assert(validate('an_invalid_string', def) !== null)
  })
})