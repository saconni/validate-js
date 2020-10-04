let assert = require('assert');
const { Validator, createMetaDefinition, validate } = require('../index.js');

suite('validate-js', () => {
  test('can not validate with null definition', () => {
    assert.throws(() => new Validator(null))
  })

  test('can validate itself', () => {
    let aValidator = new Validator(createMetaDefinition(), {dontSelfValidate: true})
    aValidator.validate(createMetaDefinition())
  })

  test('can validate strings', () => {
    let aString = 'aValidString'
    let anArray = []
    let aStringValidator = new Validator('string')
    assert.strictEqual(aString, aStringValidator.validate(aString))
    assert.throws(() => aStringValidator.validate(anArray))
  })
  
  test('can validate arrays', () => {
    let aString = 'aValidString'
    let anArray = []
    let anArrayValidator = new Validator('array')
    assert.strictEqual(anArray, anArrayValidator.validate(anArray))
    assert.throws(() => anArrayValidator.validate(aString))
  })

  test('can validate array elements', () => {
    let aValidator = new Validator({
      type: 'array',
      items: 'number'
    })
    let aValidArray = [1, 2, 3, 4]
    let anInvalidArray = [1, 'a', 3, 4]
    assert.strictEqual(aValidArray, aValidator.validate(aValidArray))
    assert.throws(() => aValidator.validate(anInvalidArray))
  })
  
  test('can validate array elements using a function', () => {
    let aValidator = new Validator({
      type: 'array',
      items: () => 'number'
    })
    let aValidArray = [1, 2, 3, 4]
    let anInvalidArray = [1, 'a', 3, 4]
    assert.strictEqual(aValidArray, aValidator.validate(aValidArray))
    assert.throws(() => aValidator.validate(anInvalidArray))
  })

  test('can validate all object members using a common definition', () => {
    let aValidator = new Validator({
      type: 'object',
      items: 'number'
    })
    let aValidObject = {
      aField: 1,
      anotherField: 2
    }
    let anInvalidObject = {
      aField: 1,
      anotherField: 'a'
    }
    assert.strictEqual(aValidObject, aValidator.validate(aValidObject))
    assert.throws(() => aValidator.validate(anInvalidObject))
  })

  test('can validate object complex members', () => {
    let aValidator = new Validator({
      type: 'object',
      properties: {
        aField: 'string'
      }
    })
    let aValidObject = {
      aField: 'aString'
    }
    let anInvalidObject = {
      aField: []
    }
    assert.strictEqual(aValidObject, aValidator.validate(aValidObject))
    assert.throws(() => aValidator.validate(anInvalidObject))
  })

  test('does not validate unspecified object members', () => {
    let aValidator = new Validator({
      type: 'object',
      properties: {
        aField: 'string'
      }
    })
    let aValidObject = {
      aField: 'aString',
      anotherField: 'anotherString'
    }
    assert.strictEqual(aValidObject, aValidator.validate(aValidObject))
  })

  test('can validate objects with optional members', () => {
    let aValidator = new Validator({
      type: 'object',
      properties: {
        aField: 'string'
      }
    })
    let aValidObject = {
      anotherField: 'anotherString'
    }
    assert.strictEqual(aValidObject, aValidator.validate(aValidObject))
  })

  test('can validate object required members', () => {
    let aValidator = new Validator({
      type: 'object',
      require: ['aField'],
      properties: {
        aField: 'string'
      }
    })
    let anInvalidObject = {
      anotherField: 'anotherString'
    }
    assert.throws(() => aValidator.validate(anInvalidObject))
  })

  test('can validate objects as array elements', () => {
    let aValidator = new Validator({
      type: 'array',
      items: {
        type: 'object',
        require: ['aField'],
        properties: {
          aField: 'string'
        }
      }
    })
    let aValidArray = [{aField: '1'}, {aField: '2'}]
    let anInvalidArray = [{aField: '1'}, {anotherField: '2'}]
    assert.strictEqual(aValidArray, aValidator.validate(aValidArray))
    assert.throws(() => aValidator.validate(anInvalidArray))
  })

  test('can validate enum values', () => {
    let aValidator = new Validator({
      type: 'string',
      enum: [
        'aValidValue',
        'anotherValidValue'
      ]
    })
    let aValidString = 'aValidValue'
    let anotherValidString = 'anotherValidValue'
    let anInvalidString = 'anInvalidValid'
    assert.strictEqual(aValidString, aValidator.validate(aValidString))
    assert.strictEqual(anotherValidString, aValidator.validate(anotherValidString))
    assert.throws(() => aValidator.validate(anInvalidString))
  })

  test('can validate either definitions', () => {
    let aValidator = new Validator({
      either: ['string', 'array'],
    })

    let aValidValue = 'aString'
    let anotherValidValue = []
    let anInvalidValue = {}
    assert.strictEqual(aValidValue, aValidator.validate(aValidValue))
    assert.strictEqual(anotherValidValue, aValidator.validate(anotherValidValue))
    assert.throws(() => aValidator.validate(anInvalidValue))
  })

  test('does not allow undeclared members on strict objects', () => {
    let aValidator = new Validator({
      type: 'object',
      strict: true,
      properties: {
        aField: 'string'
      }
    })
    let aValidObject = {
      aField: 'aString'
    }
    let anInvalidObject = {
      aField: 'aString',
      anotherField: 'anotherString'
    }
    assert.strictEqual(aValidObject, aValidator.validate(aValidObject))
    assert.throws(() => aValidator.validate(anInvalidObject))
  })

  test('null or undefined values are replaced by default value', () => {
    let aValidator = new Validator({
      type: 'string',
      default: 'defaultValue'
    })
    assert.strictEqual('defaultValue', aValidator.validate(null))
  })

  test('can validate using custom function', () => {
    let aValidator = new Validator({
      type: 'string',
      custom: value => { throw new Error('You shall not pass') }
    })
    assert.throws(() => aValidator.validate('aValidString'))
  })

  test('can access the Validator through the exported validate function', () => {
    assert.strictEqual('aString', validate('aString', {type: 'string'}))
  })

  test('can validate objects restricted members', () => {
    let aValidator = new Validator({
      type: 'object',
      restrict: ['aField']
    })
    let anInvalidObject = {
      aField: 'aValue'
    }
    assert.throws(() => aValidator.validate(anInvalidObject))
  })

  test('does not accept invalid definitions', () => {
    assert.throws(() => {
      let aValidtor = new Validator({
        anNonValidator: 'something'
      })
    })
  })
})